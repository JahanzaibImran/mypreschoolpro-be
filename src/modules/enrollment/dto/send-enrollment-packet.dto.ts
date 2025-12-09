import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class SendEnrollmentPacketDto {
  @ApiProperty({
    description: 'Student/Lead ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'School ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({
    description: 'Parent email address',
    example: 'parent@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  parentEmail: string;

  @ApiProperty({
    description: 'Student name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  studentName: string;

  @ApiProperty({
    description: 'Email subject',
    example: 'Enrollment Packet for John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  emailSubject?: string;

  @ApiProperty({
    description: 'Email message body',
    example: 'Dear Parent,\n\nPlease find attached the enrollment packet...',
    required: false,
  })
  @IsString()
  @IsOptional()
  emailMessage?: string;
}

