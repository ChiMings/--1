import { prisma } from './database';

// 通知类型枚举
export enum NotificationType {
  // 系统通知
  SYSTEM = 'SYSTEM',
  // 交易相关
  PRODUCT_REMOVED = 'PRODUCT_REMOVED',
  // 评论相关
  NEW_COMMENT = 'NEW_COMMENT',
  // 私信相关
  NEW_MESSAGE = 'NEW_MESSAGE',
  // 举报相关
  REPORT_SUBMITTED = 'REPORT_SUBMITTED',
  // 用户相关
  ROLE_CHANGED = 'ROLE_CHANGED',
  ACCOUNT_STATUS = 'ACCOUNT_STATUS'
}

// 创建通知的参数接口
interface CreateNotificationParams {
  type: NotificationType | string;
  title: string;
  content: string;
  userId?: string;
  recipientType?: 'user' | 'admin' | 'all';
}

/**
 * 创建单个用户通知
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const { type, title, content, userId, recipientType = 'user' } = params;

    if (recipientType === 'user' && userId) {
      // 为指定用户创建通知
      await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          content
        }
      });
    } else if (recipientType === 'admin') {
      // 为所有管理员创建通知
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['管理员', '超级管理员'] },
          status: '正常',
          deleted: false
        },
        select: { id: true }
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type,
            title,
            content
          }))
        });
      }
    } else if (recipientType === 'all') {
      // 为所有活跃用户创建通知
      const users = await prisma.user.findMany({
        where: {
          status: '正常',
          deleted: false
        },
        select: { id: true }
      });

      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map(user => ({
            userId: user.id,
            type,
            title,
            content
          }))
        });
      }
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    // 不抛出错误，避免影响主业务逻辑
  }
}

/**
 * 批量创建通知
 */
export async function createNotifications(userIds: string[], params: Omit<CreateNotificationParams, 'userId' | 'recipientType'>): Promise<void> {
  try {
    const { type, title, content } = params;

    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type,
        title,
        content
      }))
    });
  } catch (error) {
    console.error('Failed to create notifications:', error);
  }
}

/**
 * 发送系统通知给用户
 */
export async function sendSystemNotification(userId: string, title: string, content: string): Promise<void> {
  await createNotification({
    type: NotificationType.SYSTEM,
    title,
    content,
    userId,
    recipientType: 'user'
  });
}

/**
 * 发送交易相关通知
 */
export async function sendTradeNotification(userId: string, type: NotificationType, productName: string, additionalInfo?: string): Promise<void> {
  let title = '';
  let content = '';

  switch (type) {
    case NotificationType.PRODUCT_REMOVED:
      title = '商品被下架';
      content = `您的商品 "${productName}" 因违规被管理员下架。${additionalInfo || ''}`;
      break;
    default:
      return;
  }

  await createNotification({
    type,
    title,
    content,
    userId,
    recipientType: 'user'
  });
}



/**
 * 发送角色变更通知
 */
export async function sendRoleChangeNotification(userId: string, newRole: string): Promise<void> {
  await createNotification({
    type: NotificationType.ROLE_CHANGED,
    title: '账户角色变更',
    content: `您的账户角色已更新为：${newRole}`,
    userId,
    recipientType: 'user'
  });
}

/**
 * 发送账户状态变更通知
 */
export async function sendAccountStatusNotification(userId: string, status: string, reason?: string): Promise<void> {
  let title = '';
  let content = '';

  switch (status) {
    case '禁用':
      title = '账户被禁用';
      content = `您的账户已被管理员禁用。${reason ? `原因：${reason}` : ''}`;
      break;
    case '冻结':
      title = '账户被冻结';
      content = `您的账户已被管理员冻结。${reason ? `原因：${reason}` : ''}`;
      break;
    case '正常':
      title = '账户状态恢复';
      content = '您的账户状态已恢复正常，现在可以正常使用平台功能。';
      break;
    default:
      return;
  }

  await createNotification({
    type: NotificationType.ACCOUNT_STATUS,
    title,
    content,
    userId,
    recipientType: 'user'
  });
}

/**
 * 发送新用户欢迎通知
 */
export async function sendWelcomeNotification(userId: string, userName: string): Promise<void> {
  await createNotification({
    type: NotificationType.SYSTEM,
    title: '欢迎使用校园二手交易平台！',
    content: `${userName}，欢迎加入我们的校园二手交易平台！在这里您可以发布闲置物品、寻找需要的商品，享受安全便捷的校园交易体验。如有任何问题，请随时联系我们。`,
    userId,
    recipientType: 'user'
  });
}

/**
 * 发送系统公告通知给所有用户
 */
export async function sendSystemAnnouncementNotification(title: string, content: string): Promise<void> {
  await createNotification({
    type: NotificationType.SYSTEM,
    title: `系统公告：${title}`,
    content,
    recipientType: 'all'
  });
}

/**
 * 发送商品评论通知
 */
export async function sendCommentNotification(sellerId: string, productName: string, commenterName: string, commentContent: string): Promise<void> {
  await createNotification({
    type: NotificationType.NEW_COMMENT,
    title: '收到新评论',
    content: `${commenterName} 评论了您的商品 "${productName}"：${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}`,
    userId: sellerId,
    recipientType: 'user'
  });
} 