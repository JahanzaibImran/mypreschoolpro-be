import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsArray, IsString, IsOptional, ArrayMinSize } from 'class-validator';

export class CreateDailyReportDto {
  @ApiProperty({ description: 'Date of the report', example: '2025-11-23', format: 'date' })
  @IsDateString()
  reportDate: string;

  @ApiProperty({ 
    description: 'Array of student names included in the report', 
    example: ['John Doe', 'Jane Smith'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  studentNames: string[];

  @ApiProperty({ description: 'Activities and learning description', nullable: true, required: false })
  @IsOptional()
  @IsString()
  activities?: string;

  @ApiProperty({ description: 'Meals and snacks description', nullable: true, required: false })
  @IsOptional()
  @IsString()
  meals?: string;

  @ApiProperty({ description: 'Nap time information', nullable: true, required: false })
  @IsOptional()
  @IsString()
  napTime?: string;

  @ApiProperty({ description: 'Mood and behavior notes', nullable: true, required: false })
  @IsOptional()
  @IsString()
  moodBehavior?: string;

  @ApiProperty({ description: 'Milestones and achievements', nullable: true, required: false })
  @IsOptional()
  @IsString()
  milestones?: string;

  @ApiProperty({ description: 'Additional notes', nullable: true, required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}









