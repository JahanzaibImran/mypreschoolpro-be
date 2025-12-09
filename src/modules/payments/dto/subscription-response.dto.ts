import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  userId: string | null;

  @ApiProperty({ nullable: true })
  schoolId: string | null;

  @ApiProperty()
  stripeSubscriptionId: string;

  @ApiProperty()
  stripeCustomerId: string;

  @ApiProperty({ enum: ['active', 'cancelled', 'past_due', 'unpaid', 'trialing'] })
  status: string;

  @ApiProperty()
  planType: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ nullable: true })
  currentPeriodStart: string | null;

  @ApiProperty({ nullable: true })
  currentPeriodEnd: string | null;

  @ApiProperty()
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ nullable: true })
  schoolName?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}











