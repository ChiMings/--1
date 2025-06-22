import request from '@/utils/request';

/**
 * 获取通知列表
 * @param {object} params 查询参数
 */
export function getNotifications(params = {}) {
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
  return request({
    url: `/notifications/${notificationId}`,
    method: 'delete',
  });
}

/**
 * 清空所有通知
 */
export function clearAllNotifications() {
  return request({
    url: '/notifications',
    method: 'delete',
  });
} 