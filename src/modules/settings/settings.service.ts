import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SystemSettingsEntity } from './entities/system-settings.entity';
import { UpdateSystemSettingsDto, SystemSettingsResponseDto } from './dto/system-settings.dto';
import { UpdateEmailSettingsDto, EmailSettingsResponseDto } from './dto/email-settings.dto';
import { UpdateSecuritySettingsDto, SecuritySettingsResponseDto } from './dto/security-settings.dto';
import { UpdateNotificationSettingsDto, NotificationSettingsResponseDto } from './dto/notification-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SystemSettingsEntity)
    private readonly settingsRepository: Repository<SystemSettingsEntity>,
  ) {}

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<SystemSettingsResponseDto> {
    const settings = await this.settingsRepository.find({
      where: { key: In(['maintenance_mode', 'max_schools_per_owner', 'default_trial_days', 'allow_registrations', 'require_email_verification', 'session_timeout_hours']) },
    });

    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    return {
      maintenance_mode: settingsMap.get('maintenance_mode') === 'true',
      max_schools_per_owner: parseInt(settingsMap.get('max_schools_per_owner') || '5'),
      default_trial_days: parseInt(settingsMap.get('default_trial_days') || '30'),
      allow_registrations: settingsMap.get('allow_registrations') !== 'false',
      require_email_verification: settingsMap.get('require_email_verification') !== 'false',
      session_timeout_hours: parseInt(settingsMap.get('session_timeout_hours') || '24'),
    };
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(dto: UpdateSystemSettingsDto): Promise<SystemSettingsResponseDto> {
    const updates: Array<{ key: string; value: string }> = [];

    if (dto.maintenance_mode !== undefined) {
      updates.push({ key: 'maintenance_mode', value: String(dto.maintenance_mode) });
    }
    if (dto.max_schools_per_owner !== undefined) {
      updates.push({ key: 'max_schools_per_owner', value: String(dto.max_schools_per_owner) });
    }
    if (dto.default_trial_days !== undefined) {
      updates.push({ key: 'default_trial_days', value: String(dto.default_trial_days) });
    }
    if (dto.allow_registrations !== undefined) {
      updates.push({ key: 'allow_registrations', value: String(dto.allow_registrations) });
    }
    if (dto.require_email_verification !== undefined) {
      updates.push({ key: 'require_email_verification', value: String(dto.require_email_verification) });
    }
    if (dto.session_timeout_hours !== undefined) {
      updates.push({ key: 'session_timeout_hours', value: String(dto.session_timeout_hours) });
    }

    for (const update of updates) {
      await this.settingsRepository.upsert(
        { key: update.key, value: update.value },
        ['key'],
      );
    }

    return this.getSystemSettings();
  }

  /**
   * Get email settings
   */
  async getEmailSettings(): Promise<EmailSettingsResponseDto> {
    const settings = await this.settingsRepository.find({
      where: { key: In(['smtp_host', 'smtp_port', 'smtp_username', 'from_email', 'from_name']) },
    });

    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    return {
      smtp_host: settingsMap.get('smtp_host') || '',
      smtp_port: parseInt(settingsMap.get('smtp_port') || '587'),
      smtp_username: settingsMap.get('smtp_username') || '',
      from_email: settingsMap.get('from_email') || '',
      from_name: settingsMap.get('from_name') || 'My Preschool Pro',
    };
  }

  /**
   * Update email settings
   */
  async updateEmailSettings(dto: UpdateEmailSettingsDto): Promise<EmailSettingsResponseDto> {
    const updates: Array<{ key: string; value: string }> = [];

    if (dto.smtp_host !== undefined) {
      updates.push({ key: 'smtp_host', value: dto.smtp_host });
    }
    if (dto.smtp_port !== undefined) {
      updates.push({ key: 'smtp_port', value: String(dto.smtp_port) });
    }
    if (dto.smtp_username !== undefined) {
      updates.push({ key: 'smtp_username', value: dto.smtp_username });
    }
    if (dto.smtp_password !== undefined) {
      updates.push({ key: 'smtp_password', value: dto.smtp_password });
    }
    if (dto.from_email !== undefined) {
      updates.push({ key: 'from_email', value: dto.from_email });
    }
    if (dto.from_name !== undefined) {
      updates.push({ key: 'from_name', value: dto.from_name });
    }

    for (const update of updates) {
      await this.settingsRepository.upsert(
        { key: update.key, value: update.value },
        ['key'],
      );
    }

    return this.getEmailSettings();
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<SecuritySettingsResponseDto> {
    const settings = await this.settingsRepository.find({
      where: { key: In(['password_min_length', 'require_2fa', 'max_login_attempts', 'lockout_duration_minutes', 'allowed_domains']) },
    });

    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    return {
      password_min_length: parseInt(settingsMap.get('password_min_length') || '8'),
      require_2fa: settingsMap.get('require_2fa') === 'true',
      max_login_attempts: parseInt(settingsMap.get('max_login_attempts') || '5'),
      lockout_duration_minutes: parseInt(settingsMap.get('lockout_duration_minutes') || '30'),
      allowed_domains: settingsMap.get('allowed_domains') ? JSON.parse(settingsMap.get('allowed_domains')!) : [],
    };
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(dto: UpdateSecuritySettingsDto): Promise<SecuritySettingsResponseDto> {
    const updates: Array<{ key: string; value: string }> = [];

    if (dto.password_min_length !== undefined) {
      updates.push({ key: 'password_min_length', value: String(dto.password_min_length) });
    }
    if (dto.require_2fa !== undefined) {
      updates.push({ key: 'require_2fa', value: String(dto.require_2fa) });
    }
    if (dto.max_login_attempts !== undefined) {
      updates.push({ key: 'max_login_attempts', value: String(dto.max_login_attempts) });
    }
    if (dto.lockout_duration_minutes !== undefined) {
      updates.push({ key: 'lockout_duration_minutes', value: String(dto.lockout_duration_minutes) });
    }
    if (dto.allowed_domains !== undefined) {
      updates.push({ key: 'allowed_domains', value: JSON.stringify(dto.allowed_domains) });
    }

    for (const update of updates) {
      await this.settingsRepository.upsert(
        { key: update.key, value: update.value },
        ['key'],
      );
    }

    return this.getSecuritySettings();
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettingsResponseDto> {
    const settings = await this.settingsRepository.find({
      where: { key: In(['welcome_email', 'payment_notifications', 'system_alerts', 'marketing_emails']) },
    });

    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    return {
      welcome_email: settingsMap.get('welcome_email') !== 'false',
      payment_notifications: settingsMap.get('payment_notifications') !== 'false',
      system_alerts: settingsMap.get('system_alerts') !== 'false',
      marketing_emails: settingsMap.get('marketing_emails') === 'true',
    };
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(dto: UpdateNotificationSettingsDto): Promise<NotificationSettingsResponseDto> {
    const updates: Array<{ key: string; value: string }> = [];

    if (dto.welcome_email !== undefined) {
      updates.push({ key: 'welcome_email', value: String(dto.welcome_email) });
    }
    if (dto.payment_notifications !== undefined) {
      updates.push({ key: 'payment_notifications', value: String(dto.payment_notifications) });
    }
    if (dto.system_alerts !== undefined) {
      updates.push({ key: 'system_alerts', value: String(dto.system_alerts) });
    }
    if (dto.marketing_emails !== undefined) {
      updates.push({ key: 'marketing_emails', value: String(dto.marketing_emails) });
    }

    for (const update of updates) {
      await this.settingsRepository.upsert(
        { key: update.key, value: update.value },
        ['key'],
      );
    }

    return this.getNotificationSettings();
  }
}

