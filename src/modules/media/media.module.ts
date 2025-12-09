import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { S3Service } from './s3.service';
import s3Config from '../../config/s3.config';
import { SchoolEntity } from '../schools/entities/school.entity';
import { LeadEntity } from '../leads/entities/lead.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, SchoolEntity, LeadEntity]),
    ConfigModule.forFeature(s3Config),
  ],
  controllers: [MediaController],
  providers: [MediaService, S3Service],
  exports: [MediaService, S3Service],
})
export class MediaModule { }
