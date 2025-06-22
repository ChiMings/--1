import { Router } from 'express';
import { success, error, badRequest } from '../utils/response';
import { prisma } from '../utils/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 获取通知列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // 从认证中间件获取当前用户ID
    const currentUserId = req.user!.id;

    // 查询用户的通知列表
    const notifications = await prisma.notification.findMany({
      where: { 
        userId: currentUserId,
        deleted: false 
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    // 获取总数
    const total = await prisma.notification.count({
      where: { 
        userId: currentUserId,
        deleted: false 
      }
    });

    // 格式化通知数据
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString()
    }));

    return res.json(success('获取通知列表成功', {
      items: formattedNotifications,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }));
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 获取未读通知数
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    // 从认证中间件获取当前用户ID
    const currentUserId = req.user!.id;

    // 查询用户的未读通知数量
    const unreadCount = await prisma.notification.count({
      where: { 
        userId: currentUserId,
        isRead: false,
        deleted: false 
      }
    });

    return res.json(success('获取未读通知数成功', {
      count: unreadCount
    }));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 标记通知为已读
router.post('/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId, readAll } = req.body;

    // 从认证中间件获取当前用户ID
    const currentUserId = req.user!.id;

    if (readAll) {
      // 标记所有通知为已读
      await prisma.notification.updateMany({
        where: { 
          userId: currentUserId,
          isRead: false,
          deleted: false 
        },
        data: { isRead: true }
      });
      return res.json(success('所有通知已标记为已读'));
    } else if (notificationId) {
      // 标记单条通知为已读
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification || notification.deleted) {
        return res.status(404).json(error('通知不存在'));
      }

      if (notification.userId !== currentUserId) {
        return res.status(403).json(error('无权限操作此通知'));
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
      return res.json(success('通知已标记为已读'));
    } else {
      return res.status(400).json(badRequest('请提供通知ID或设置readAll为true'));
    }
  } catch (err) {
    return res.status(500).json(error('操作失败'));
  }
});

// 删除通知
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // 从认证中间件获取当前用户ID
    const currentUserId = req.user!.id;

    // 验证通知是否存在且属于当前用户
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification || notification.deleted) {
      return res.status(404).json(error('通知不存在'));
    }

    if (notification.userId !== currentUserId) {
      return res.status(403).json(error('无权限删除此通知'));
    }

    // 软删除通知
    await prisma.notification.update({
      where: { id: notificationId },
      data: { deleted: true }
    });

    return res.json(success('通知删除成功'));
  } catch (err) {
    console.error('Delete notification error:', err);
    return res.status(500).json(error('删除失败'));
  }
});

// 清空所有通知
router.delete('/', authenticateToken, async (req, res) => {
  try {
    // 从认证中间件获取当前用户ID
    const currentUserId = req.user!.id;

    // 软删除当前用户的所有通知
    await prisma.notification.updateMany({
      where: { 
        userId: currentUserId,
        deleted: false 
      },
      data: { deleted: true }
    });

    return res.json(success('所有通知已清空'));
  } catch (err) {
    console.error('Clear all notifications error:', err);
    return res.status(500).json(error('清空通知失败'));
  }
});

export default router; 