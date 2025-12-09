import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class InvoiceItemResponseDto {
  @ApiProperty({ description: 'Invoice item ID' })
  id: string;

  @ApiProperty({ description: 'Item description' })
  description: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Unit price in cents' })
  unitPrice: number;

  @ApiProperty({ description: 'Total amount in cents' })
  total: number;

  @ApiPropertyOptional({ description: 'Item category' })
  category?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class InvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'School ID' })
  schoolId: string;

  @ApiPropertyOptional({ description: 'Parent ID' })
  parentId?: string;

  @ApiPropertyOptional({ description: 'Student ID' })
  studentId?: string;

  @ApiPropertyOptional({ description: 'Lead ID' })
  leadId?: string;

  @ApiProperty({ description: 'Total amount in cents' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiPropertyOptional({ description: 'Payment date' })
  paymentDate?: Date;

  @ApiPropertyOptional({ description: 'Payment method' })
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Stripe session ID' })
  stripeSessionId?: string;

  @ApiPropertyOptional({ description: 'Stripe payment intent ID' })
  stripePaymentIntentId?: string;

  @ApiPropertyOptional({ description: 'Transaction ID' })
  transactionId?: string;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Invoice items', type: [InvoiceItemResponseDto] })
  items?: InvoiceItemResponseDto[];

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}



