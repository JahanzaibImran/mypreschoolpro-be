import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response data (structure varies by operation)',
    required: false,
    example: {
      id: 'pi_123456789',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
    },
  })
  data?: any;

  @ApiProperty({
    description: 'Error message if operation failed',
    required: false,
    example: 'Payment processing failed',
  })
  error?: string;
}

export class PaymentIntentResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Payment intent details',
    examples: {
      stripe: {
        summary: 'Stripe Payment Response',
        value: {
          id: 'pi_123456789',
          provider: 'stripe',
          amount: 5000,
          currency: 'usd',
          status: 'requires_payment_method',
          clientSecret: 'pi_123_secret_456',
          metadata: { enrollmentId: 'enr_123' },
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
      cardconnect: {
        summary: 'CardConnect Payment Response (Verified)',
        value: {
          id: '123456789012',
          provider: 'cardconnect',
          amount: 5000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            authCode: '123456',
            respproc: 'PPS',
            retref: '123456789012',
            orderId: 'ORDER-001',
          },
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  data?: {
    id: string;
    provider: string;
    amount: number;
    currency: string;
    status: string;
    clientSecret?: string;
    metadata?: Record<string, any>;
    createdAt: string;
  };

  @ApiProperty({
    description: 'Persisted transaction record',
    required: false,
  })
  transaction?: Record<string, any>;
}

export class CustomerResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Customer details',
    example: {
      id: 'cus_123456789',
      provider: 'stripe',
      email: 'john.doe@example.com',
      name: 'John Doe',
      metadata: { parentId: 'par_123' },
    },
  })
  data?: {
    id: string;
    provider: string;
    email: string;
    name: string;
    metadata?: Record<string, any>;
  };
}

export class RefundResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Refund details',
    example: {
      id: 'ref_123456789',
      amount: 2500,
      status: 'succeeded',
      reason: 'Customer requested cancellation',
    },
  })
  data?: {
    id: string;
    amount: number;
    status: string;
    reason?: string;
  };
}