import request from '@/utils/request';
import { config } from '@/utils/config';

/**
 * 获取通知列表
 * @param {object} params 查询参数
 */
export function getNotifications(params = {}) {
  if (config.useMockData) {
    // 返回模拟数据作为后备
    const mockNotifications = [
      {
        id: 'notif_1',
        type: 'SYSTEM',
        title: '系统通知',
        content: '欢迎使用校园二手交易平台！',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'notif_2', 
        type: 'PRODUCT_SOLD',
        title: '商品交易成功',
        content: '您的商品 "二手教材" 已成功售出！',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    return Promise.resolve({
      data: {
        status: 'success',
        data: {
          items: mockNotifications,
          total: mockNotifications.length,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      }
    });
  }

  return request({
    url: '/notifications',
    method: 'get',
    params,
  });
}

/**
 * 获取未读通知数
 */
export function getUnreadCount() {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        data: {
          count: 3
        }
      }
    });
  }

  return request({
    url: '/notifications/unread-count',
    method: 'get',
  });
}

/**
 * 标记通知为已读
 * @param {object} data 请求数据
 */
export function markNotificationRead(data) {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        message: '通知已标记为已读'
      }
    });
  }

  return request({
    url: '/notifications/read',
    method: 'post',
    data,
  });
}

/**
 * 标记单个通知为已读
 * @param {string} notificationId 通知ID
 */
export function markAsRead(notificationId) {
  return markNotificationRead({ notificationId });
}

/**
 * 标记所有通知为已读
 */
export function markAllAsRead() {
  return markNotificationRead({ readAll: true });
}

/**
 * 删除通知
 * @param {string} notificationId 通知ID
 */
export function deleteNotification(notificationId) {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        message: '通知删除成功'
      }
    });
  }

  return request({
    url: `/notifications/${notificationId}`,
    method: 'delete',
  });
} 