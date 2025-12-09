import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsInt, IsDateString, IsEnum, IsOptional, Min } from 'class-validator';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Invoice number (must be unique)', example: 'INV-2024-001' })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ description: 'School ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  schoolId: string;

  @ApiPropertyOptional({ description: 'Parent/Guardian ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Student ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Lead ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  leadId?: string;

  @ApiProperty({ description: 'Total amount in cents', example: 50000 })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'usd', default: 'usd' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Payment status', enum: PaymentStatus, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ description: 'Due date', example: '2024-12-31' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}



