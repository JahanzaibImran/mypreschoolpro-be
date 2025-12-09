import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateInvoiceItemDto {
  @ApiProperty({ description: 'Item description', example: 'Monthly Tuition - September 2024' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price in cents', example: 50000 })
  @IsInt()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Item category', example: 'tuition' })
  @IsString()
  @IsOptional()
  category?: string;
}



