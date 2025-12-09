import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { IPaymentProvider, CreatePaymentOptions, CreateCustomerOptions } from '../interfaces/payment-provider.interface';
import { PaymentIntent, PaymentCustomer, PaymentProvider, PaymentStatus, RefundResult } from '../interfaces/payment.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2025-10-29.clover',
      });
      this.logger.log('Stripe provider initialized');
    } else {
      this.logger.warn('Stripe not configured');
    }
  }

  async createPayment(options: CreatePaymentOptions): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: options.amount,
        currency: options.currency || 'usd',
        customer: options.customerId,
        metadata: options.metadata || {},
        description: options.description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        provider: PaymentProvider.STRIPE,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: this.mapStripeStatus(paymentIntent.status),
        clientSecret: paymentIntent.client_secret ?? undefined,
        metadata: paymentIntent.metadata,
        createdAt: new Date(paymentIntent.created * 1000),
      };
    } catch (error) {
      this.logger.error(`Stripe payment creation failed: ${error.message}`);
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      return {
        id: paymentIntent.id,
        provider: PaymentProvider.STRIPE,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: this.mapStripeStatus(paymentIntent.status),
        clientSecret: paymentIntent.client_secret ?? undefined,
        metadata: paymentIntent.metadata,
        createdAt: new Date(paymentIntent.created * 1000),
      };
    } catch (error) {
      this.logger.error(`Stripe payment retrieval failed: ${error.message}`);
      throw error;
    }
  }

  async createCustomer(options: CreateCustomerOptions): Promise<PaymentCustomer> {
    try {
      const customer = await this.stripe.customers.create({
        email: options.email,
        name: options.name,
        phone: options.phone,
        metadata: options.metadata || {},
      });

      return {
        id: customer.id,
        provider: PaymentProvider.STRIPE,
        email: customer.email ?? '',
        name: customer.name ?? '',
        metadata: customer.metadata,
      };
    } catch (error) {
      this.logger.error(`Stripe customer creation failed: ${error.message}`);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<PaymentCustomer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }

      return {
        id: customer.id,
        provider: PaymentProvider.STRIPE,
        email: customer.email ?? '',
        name: customer.name ?? '',
        metadata: customer.metadata,
      };
    } catch (error) {
      this.logger.error(`Stripe customer retrieval failed: ${error.message}`);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentId,
        amount: amount,
      });

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status ?? '',
      };
    } catch (error) {
      this.logger.error(`Stripe refund failed: ${error.message}`);
      throw error;
    }
  }

  async verifyWebhook(payload: Buffer, signature: string): Promise<Stripe.Event> {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
      }
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Stripe webhook verification failed: ${error.message}`);
      throw error;
    }
  }

  private mapStripeStatus(status: string): PaymentStatus {
    const statusMap = {
      'requires_payment_method': PaymentStatus.PENDING,
      'requires_confirmation': PaymentStatus.PENDING,
      'requires_action': PaymentStatus.PENDING,
      'processing': PaymentStatus.PROCESSING,
      'succeeded': PaymentStatus.SUCCEEDED,
      'canceled': PaymentStatus.CANCELED,
      'requires_capture': PaymentStatus.PROCESSING,
    };

    return statusMap[status] || PaymentStatus.FAILED;
  }
}