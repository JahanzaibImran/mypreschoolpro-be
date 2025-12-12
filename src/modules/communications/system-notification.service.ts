import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateSystemNotificationDto } from './dto/create-system-notification.dto';

@Injectable()
export class SystemNotificationService {
  private readonly logger = new Logger(SystemNotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Get all system notifications (for super admin)
   */
  async findAll(limit: number = 50): Promise<Notification[]> {
    return this.notificationRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Create a new system notification
   */
  async create(
    createDto: CreateSystemNotificationDto,
    userId: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      title: createDto.title,
      message: createDto.message,
      type: createDto.type as NotificationType,
      userId,
    });

    return this.notificationRepository.save(notification);
  }

  /**
   * Delete a system notification
   */
  async remove(id: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }

    await this.notificationRepository.remove(notification);
  }
}














