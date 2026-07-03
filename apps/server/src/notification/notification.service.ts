import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

export interface CreateNotificationDto {
  type: string;
  title: string;
  message: string;
  link?: string;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  recipientId: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    // Don't notify yourself
    if (dto.actorId === dto.recipientId) return null;

    // Check if recipient has notification preferences
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId: dto.recipientId },
    });

    // If preferences exist and the specific type is disabled, skip
    if (prefs) {
      const typeEnabled = this.isTypeEnabled(prefs, dto.type);
      if (!typeEnabled) return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        message: dto.message,
        link: dto.link,
        actorId: dto.actorId,
        targetId: dto.targetId,
        targetType: dto.targetType,
        recipientId: dto.recipientId,
      },
      include: {
        actor: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Send realtime notification
    this.gateway.sendNotificationToUser(dto.recipientId, notification);

    // Send updated unread count
    const unreadCount = await this.getUnreadCount(dto.recipientId);
    this.gateway.sendUnreadCount(dto.recipientId, unreadCount);

    return notification;
  }

  private isTypeEnabled(prefs: any, type: string): boolean {
    switch (type) {
      case 'post_comment': return prefs.postComment;
      case 'comment_reply': return prefs.commentReply;
      case 'post_like': return prefs.postLike;
      case 'review_completed': return prefs.reviewCompleted;
      case 'review_comment': return prefs.reviewComment;
      default: return true;
    }
  }

  async getForUser(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId: userId },
        include: {
          actor: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { recipientId: userId },
      }),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.recipientId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        actor: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Send updated count
    const unreadCount = await this.getUnreadCount(userId);
    this.gateway.sendUnreadCount(userId, unreadCount);

    return updated;
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    this.gateway.sendUnreadCount(userId, 0);

    return { success: true };
  }

  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.recipientId !== userId) throw new ForbiddenException();

    await this.prisma.notification.delete({ where: { id } });

    // Send updated count
    const unreadCount = await this.getUnreadCount(userId);
    this.gateway.sendUnreadCount(userId, unreadCount);

    return { success: true };
  }

  // Get or create notification preferences
  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  async updatePreferences(userId: string, data: Partial<{
    browserPush: boolean;
    email: boolean;
    sound: boolean;
    postComment: boolean;
    commentReply: boolean;
    postLike: boolean;
    reviewCompleted: boolean;
    reviewComment: boolean;
  }>) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async savePushSubscription(userId: string, subscription: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushSubscription: subscription },
    });
  }
}
