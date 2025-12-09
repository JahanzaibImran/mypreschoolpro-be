import { ApiProperty } from '@nestjs/swagger';

export class PublicSchoolDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  programsOffered: string[];

  @ApiProperty({ example: 0 })
  capacity: number;

  @ApiProperty({ required: false })
  address?: string | null;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty({ required: false })
  email?: string | null;
}






