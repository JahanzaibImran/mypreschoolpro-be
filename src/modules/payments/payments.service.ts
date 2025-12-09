import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeProvider } from './providers/stripe.provider';
import { CardConnectProvider } from './providers/cardconnect.provider';
import {
  PaymentProvider,
  PaymentStatus as ProviderPaymentStatus,
  PaymentIntent,
} from './interfaces/payment.interface';
import {
  CreatePaymentOptions,
  CreateCustomerOptions,
} from './interfaces/payment-provider.interface';
import { Transaction } from './entities/transaction.entity';
import { Subscription } from './entities/subscription.entity';
import { PaymentStatus as DbPaymentStatus } from '../../common/enums/payment-status.enum';
import { DatabaseService } from '../../database/database.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private stripeProvider: StripeProvider,
    private cardConnectProvider: CardConnectProvider,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly databaseService: DatabaseService,
  ) {
    this.logger.log('Payments service initialized with multiple providers');
  }

  /**
   * Get the appropriate payment provider
   */
  private getProvider(provider: PaymentProvider) {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return this.stripeProvider;
      case PaymentProvider.CARDCONNECT:
        return this.cardConnectProvider;
      default:
        throw new BadRequestException(`Unsupported payment provider: ${provider}`);
    }
  }

  /**
   * Create a payment with specified provider
   */
  async createPayment(
    provider: PaymentProvider,
    options: CreatePaymentOptions,
  ): Promise<{ payment: PaymentIntent; transaction: Transaction }> {
    this.logger.log(`Creating payment with ${provider}`);
    const paymentProvider = this.getProvider(provider);
    const payment = await paymentProvider.createPayment(options);
    const transaction = await this.recordTransaction(provider, payment, options);
    await this.handlePostPaymentActions(provider, payment, options, transaction);
    return { payment, transaction };
  }

  /**
   * Get payment details
   */
  async getPayment(provider: PaymentProvider, paymentId: string) {
    this.logger.log(`Retrieving payment ${paymentId} from ${provider}`);
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.getPayment(paymentId);
  }

  /**
   * Create a customer
   */
  async createCustomer(provider: PaymentProvider, options: CreateCustomerOptions) {
    this.logger.log(`Creating customer with ${provider}`);
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.createCustomer(options);
  }

  /**
   * Get customer details
   */
  async getCustomer(provider: PaymentProvider, customerId: string) {
    this.logger.log(`Retrieving customer ${customerId} from ${provider}`);
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.getCustomer(customerId);
  }

  /**
   * Refund a payment
   */
  async refundPayment(provider: PaymentProvider, paymentId: string, amount?: number) {
    this.logger.log(`Refunding payment ${paymentId} with ${provider}`);
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.refundPayment(paymentId, amount);
  }

  /**
   * Verify webhook from provider
   */
  async verifyWebhook(provider: PaymentProvider, payload: any, signature: string) {
    this.logger.log(`Verifying webhook from ${provider}`);
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.verifyWebhook(payload, signature);
  }

  private sanitizeMetadata(metadata: Record<string, any> = {}) {
    const { cardNumber, cvv, expiry, ...rest } = metadata;
    return rest;
  }

  private mapIntentStatusToDb(status: ProviderPaymentStatus): DbPaymentStatus {
    switch (status) {
      case ProviderPaymentStatus.SUCCEEDED:
        return DbPaymentStatus.PAID;
      case ProviderPaymentStatus.PENDING:
      case ProviderPaymentStatus.PROCESSING:
        return DbPaymentStatus.PENDING;
      case ProviderPaymentStatus.REFUNDED:
        return DbPaymentStatus.REFUNDED;
      default:
        return DbPaymentStatus.FAILED;
    }
  }

  private async recordTransaction(
    provider: PaymentProvider,
    payment: PaymentIntent,
    options: CreatePaymentOptions,
  ) {
    const metadata = options.metadata || {};
    const sanitizedMetadata = this.sanitizeMetadata(metadata);

    const transaction = this.transactionRepository.create({
      userId: sanitizedMetadata.userId || null,
      schoolId: sanitizedMetadata.schoolId || null,
      amount: payment.amount,
      currency: payment.currency || options.currency || 'usd',
      status: this.mapIntentStatusToDb(payment.status),
      paymentType: sanitizedMetadata.paymentType || provider,
      description: options.description || sanitizedMetadata.description || null,
      stripePaymentIntentId:
        provider === PaymentProvider.STRIPE ? payment.id : null,
      cardconnectTransactionId:
        provider === PaymentProvider.CARDCONNECT ? payment.id : null,
      metadata: {
        ...sanitizedMetadata,
        providerMetadata: payment.metadata,
      },
    });

    return this.transactionRepository.save(transaction);
  }

  private async handlePostPaymentActions(
    provider: PaymentProvider,
    payment: PaymentIntent,
    options: CreatePaymentOptions,
    transaction: Transaction,
  ) {
    if (provider !== PaymentProvider.CARDCONNECT) {
      return;
    }

    if (payment.status !== ProviderPaymentStatus.SUCCEEDED) {
      return;
    }

    const metadata = options.metadata || {};
    const nowIso = new Date().toISOString();

    if (metadata.paymentType === 'immediate_enrollment' && metadata.leadId) {
      await this.databaseService.query(
        `UPDATE leads 
         SET lead_status = $1, payment_status = $2, lead_score = $3, 
             last_activity_at = $4, updated_at = $4
         WHERE id = $5`,
        ['registered', 'paid', 300, nowIso, metadata.leadId],
      );

      const leadData = await this.databaseService.query(
        `SELECT school_id, program FROM leads WHERE id = $1`,
        [metadata.leadId],
      );

      if (leadData && leadData.length > 0) {
        await this.databaseService.query(
          `INSERT INTO enrollment (lead_id, school_id, program, status, start_date)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            metadata.leadId,
            leadData[0].school_id,
            leadData[0].program,
            'active',
            nowIso.split('T')[0],
          ],
        );
      }
    }

    // Note: invoice_id column doesn't exist in transactions table
    // Invoice updates should be handled separately via invoice endpoints

    this.logger.log(
      `CardConnect transaction persisted: ${transaction.cardconnectTransactionId}`,
    );
  }

  /**
   * Cancel a subscription (CardConnect-compatible - database only)
   */
  async cancelSubscription(subscriptionId: string, userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check access: user must own the subscription or be associated with the school
    if (subscription.userId !== userId && subscription.schoolId) {
      // For school subscriptions, check if user is school owner
      const schoolCheck = await this.databaseService.query(
        `SELECT owner_id FROM schools WHERE id = $1`,
        [subscription.schoolId],
      );
      if (schoolCheck && schoolCheck.length > 0 && schoolCheck[0].owner_id !== userId) {
        throw new ForbiddenException('You do not have permission to cancel this subscription');
      }
    } else if (subscription.userId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this subscription');
    }

    subscription.cancelAtPeriodEnd = true;
    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Update subscription plan (CardConnect-compatible - database only)
   */
  async updateSubscription(
    subscriptionId: string,
    userId: string,
    updateDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check access
    if (subscription.userId !== userId && subscription.schoolId) {
      const schoolCheck = await this.databaseService.query(
        `SELECT owner_id FROM schools WHERE id = $1`,
        [subscription.schoolId],
      );
      if (schoolCheck && schoolCheck.length > 0 && schoolCheck[0].owner_id !== userId) {
        throw new ForbiddenException('You do not have permission to update this subscription');
      }
    } else if (subscription.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this subscription');
    }

    if (updateDto.planType) {
      subscription.planType = updateDto.planType;
    }
    if (updateDto.amount !== undefined) {
      subscription.amount = updateDto.amount;
    }

    return this.subscriptionRepository.save(subscription);
  }
}