import { ApiProperty } from '@nestjs/swagger';

export class SchoolPaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  schoolId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: ['monthly', 'quarterly', 'yearly', 'manual'] })
  paymentType: string;

  @ApiProperty({ enum: ['stripe', 'manual', 'bank_transfer'] })
  paymentMethod: string;

  @ApiProperty({ nullable: true })
  stripePaymentIntentId: string | null;

  @ApiProperty({ nullable: true })
  stripeInvoiceId: string | null;

  @ApiProperty({ nullable: true })
  stripeSessionId: string | null;

  @ApiProperty({ nullable: true })
  transactionReference: string | null;

  @ApiProperty({ enum: ['pending', 'completed', 'failed', 'refunded'] })
  paymentStatus: string;

  @ApiProperty({ nullable: true })
  paymentDate: string | null;

  @ApiProperty({ nullable: true })
  periodStart: string | null;

  @ApiProperty({ nullable: true })
  periodEnd: string | null;

  @ApiProperty()
  discountApplied: number;

  @ApiProperty({ nullable: true })
  notes: string | null;

  @ApiProperty({ nullable: true })
  schoolName?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}















