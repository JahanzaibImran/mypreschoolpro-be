import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { LeadsModule } from './modules/leads/leads.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { EmailModule } from './modules/email/email.module';
import { AiModule } from './modules/ai/ai.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UsersModule } from './modules/users/users.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { ClassesModule } from './modules/classes/classes.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import emailConfig from './config/email.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { MailerModule } from './modules/mailer/mailer.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { StudentsModule } from './modules/students/students.module';
import { FormsModule } from './modules/forms/forms.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ParentDashboardModule } from './modules/parent-dashboard/parent-dashboard.module';
import { ParentRegistrationModule } from './modules/parent-registration/parent-registration.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CheckInOutModule } from './modules/checkinout/checkinout.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { HealthModule } from './modules/health/health.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';





@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [databaseConfig, jwtConfig, appConfig, emailConfig],
    envFilePath: ['.env.local', '.env'],
  }), TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      configService.getOrThrow('database'),
  }), CacheModule.registerAsync({
    isGlobal: true,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      store: redisStore,
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      password: configService.get('REDIS_PASSWORD'),
      ttl: 60 * 60,
    }),
  }), BullModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      redis: {
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),
      },
    }),
  }), ThrottlerModule.forRoot([
    {
      ttl: 60000, // 60 seconds
      limit: 10, // 10 requests per minute
    },
  ]), AuthModule, LeadsModule, PaymentsModule, EnrollmentModule, EmailModule, AiModule, CampaignsModule, AnalyticsModule, UsersModule, SchoolsModule, ClassesModule, MediaModule, NotificationsModule, MailerModule, InvoicesModule, StudentsModule, FormsModule, TeachersModule, CommunicationsModule, TasksModule, ReportsModule, BlogsModule, WaitlistModule, DashboardModule, ParentDashboardModule, ParentRegistrationModule, SettingsModule, CheckInOutModule, IncidentsModule, HealthModule, CalendarModule],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },],
})
export class AppModule { }
