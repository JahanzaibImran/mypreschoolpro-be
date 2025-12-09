import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  userId: string | null;

  @ApiProperty({ nullable: true })
  schoolId: string | null;

  @ApiProperty({ nullable: true })
  subscriptionId: string | null;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: ['pending', 'succeeded', 'failed', 'refunded'] })
  status: string;

  @ApiProperty()
  paymentType: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  stripePaymentIntentId: string | null;

  @ApiProperty({ nullable: true })
  stripeSessionId: string | null;

  @ApiProperty({ nullable: true })
  cardconnectTransactionId: string | null;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty({ nullable: true })
  schoolName?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

