import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Create a new invoice
   */
  async create(createInvoiceDto: CreateInvoiceDto, createdBy: string): Promise<Invoice> {
    this.logger.log(`Creating invoice: ${createInvoiceDto.invoiceNumber}`);

    // Check if invoice number already exists
    const existing = await this.invoiceRepository.findOne({
      where: { invoiceNumber: createInvoiceDto.invoiceNumber },
    });

    if (existing) {
      throw new BadRequestException(
        `Invoice with number "${createInvoiceDto.invoiceNumber}" already exists`,
      );
    }

    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      dueDate: new Date(createInvoiceDto.dueDate),
      createdBy,
      status: createInvoiceDto.status || PaymentStatus.PENDING,
      currency: createInvoiceDto.currency || 'usd',
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);
    this.emitInvoiceStatsChange(savedInvoice.schoolId);
    return savedInvoice;
  }

  /**
   * Find all invoices with optional filtering
   */
  async findAll(options?: {
    schoolId?: string;
    parentId?: string;
    studentId?: string;
    status?: PaymentStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ invoices: Invoice[]; total: number }> {
    const query = this.invoiceRepository.createQueryBuilder('invoice');

    if (options?.schoolId) {
      query.andWhere('invoice.schoolId = :schoolId', { schoolId: options.schoolId });
    }

    if (options?.parentId) {
      query.andWhere('invoice.parentId = :parentId', { parentId: options.parentId });
    }

    if (options?.studentId) {
      query.andWhere('invoice.studentId = :studentId', { studentId: options.studentId });
    }

    if (options?.status) {
      query.andWhere('invoice.status = :status', { status: options.status });
    }

    const total = await query.getCount();

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    query.orderBy('invoice.createdAt', 'DESC');

    const invoices = await query.getMany();

    return { invoices, total };
  }

  /**
   * Find one invoice by ID
   */
  async findOne(id: string, relations?: string[]): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: relations || ['items', 'school'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${id}" not found`);
    }

    return invoice;
  }

  /**
   * Find invoice by invoice number
   */
  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceNumber },
      relations: ['items', 'school'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with number "${invoiceNumber}" not found`);
    }

    return invoice;
  }

  /**
   * Update an invoice
   */
  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    const updateData: any = { ...updateInvoiceDto };

    if (updateInvoiceDto.dueDate) {
      updateData.dueDate = new Date(updateInvoiceDto.dueDate);
    }

    Object.assign(invoice, updateData);

    const savedInvoice = await this.invoiceRepository.save(invoice);
    this.emitInvoiceStatsChange(savedInvoice.schoolId);
    return savedInvoice;
  }

  /**
   * Delete an invoice (soft delete by setting status)
   */
  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    await this.invoiceRepository.remove(invoice);
    this.emitInvoiceStatsChange(invoice.schoolId);
  }

  /**
   * Add an item to an invoice
   */
  async addItem(invoiceId: string, createItemDto: CreateInvoiceItemDto): Promise<InvoiceItem> {
    const invoice = await this.findOne(invoiceId);

    const item = this.invoiceItemRepository.create({
      ...createItemDto,
      invoiceId,
      total: createItemDto.quantity * createItemDto.unitPrice,
    });

    const savedItem = await this.invoiceItemRepository.save(item);

    // Recalculate invoice total
    await this.recalculateTotal(invoiceId);
    this.emitInvoiceStatsChange(invoice.schoolId);

    return savedItem;
  }

  /**
   * Remove an item from an invoice
   */
  async removeItem(invoiceId: string, itemId: string): Promise<void> {
    const invoice = await this.findOne(invoiceId);
    const item = await this.invoiceItemRepository.findOne({
      where: { id: itemId, invoiceId },
    });

    if (!item) {
      throw new NotFoundException(`Invoice item with ID "${itemId}" not found`);
    }

    await this.invoiceItemRepository.remove(item);

    // Recalculate invoice total
    await this.recalculateTotal(invoiceId);
    this.emitInvoiceStatsChange(invoice.schoolId);
  }

  /**
   * Recalculate invoice total from items
   */
  async recalculateTotal(invoiceId: string): Promise<void> {
    const items = await this.invoiceItemRepository.find({
      where: { invoiceId },
    });

    const total = items.reduce((sum, item) => sum + item.total, 0);

    await this.invoiceRepository.update(invoiceId, { amount: total });
  }

  /**
   * Update invoice payment status
   */
  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    paymentDate?: Date,
    paymentMethod?: string,
    transactionId?: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);

    invoice.status = status;

    if (paymentDate) {
      invoice.paymentDate = paymentDate;
    }

    if (paymentMethod) {
      invoice.paymentMethod = paymentMethod;
    }

    if (transactionId) {
      invoice.transactionId = transactionId;
    }

    const savedInvoice = await this.invoiceRepository.save(invoice);
    this.emitInvoiceStatsChange(savedInvoice.schoolId);
    return savedInvoice;
  }

  /**
   * Get invoices by school
   */
  async findBySchool(schoolId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { schoolId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get invoices by parent
   */
  async findByParent(parentId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { parentId },
      relations: ['items', 'school'],
      order: { createdAt: 'DESC' },
    });
  }

  private emitInvoiceStatsChange(schoolId: string): void {
    try {
      this.realtimeGateway.emitInvoiceStatsChange(schoolId);
    } catch (error) {
      this.logger.warn(`Failed to emit invoice stats event for school ${schoolId}: ${(error as Error).message}`);
    }
  }
}

