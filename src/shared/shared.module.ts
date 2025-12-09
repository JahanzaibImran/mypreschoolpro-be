import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CardConnectService } from './cardconnect.service';

@Module({
  imports: [ConfigModule],
  providers: [CardConnectService],
  exports: [CardConnectService],
})
export class SharedModule {}







