export enum PaymentProvider {
    STRIPE = 'stripe',
    CARDCONNECT = 'cardconnect',
  }
  
  export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
    CANCELED = 'canceled',
    REFUNDED = 'refunded',
  }
  
  export interface PaymentIntent {
    id: string;
    provider: PaymentProvider;
    amount: number; // in cents
    currency: string;
    status: PaymentStatus;
    clientSecret?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
  }
  
  export interface PaymentCustomer {
    id: string;
    provider: PaymentProvider;
    email: string;
    name: string;
    metadata?: Record<string, any>;
  }
  
  export interface RefundResult {
    id: string;
    amount: number;
    status: string;
    reason?: string;
  }
  
  export interface WebhookEvent {
    provider: PaymentProvider;
    type: string;
    data: any;
    rawEvent: any;
  }