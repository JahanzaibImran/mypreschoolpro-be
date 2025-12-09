import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationPreferencesService } from './notification-preferences.service';
import { LeadNotification } from '../leads/entities/lead-notification.entity';
import { LeadWorkflowNotification } from '../leads/entities/lead-workflow-notification.entity';
import { NotificationPreference } from '../communications/entities/notification-preference.entity';
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeadNotification,
      LeadWorkflowNotification,
      NotificationPreference,
    ]),
    CommunicationsModule,
  ],
  controllers: [NotificationsController, NotificationPreferencesController],
  providers: [NotificationsService, NotificationPreferencesService],
  exports: [NotificationsService, NotificationPreferencesService],
})
export class NotificationsModule {}
