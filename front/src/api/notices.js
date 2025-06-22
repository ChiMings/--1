import request from '@/utils/request';

/**
 * 获取公告列表
 * @param {object} params 查询参数
 */
export function getNotices(params = {}) {
  return request({
    url: '/notices',
    method: 'get',
    params,
  });
}

/**
 * 获取公告详情
 * @param {string} noticeId 公告ID
 */
export function getNoticeDetail(noticeId) {
  return request({
    url: `/notices/${noticeId}`,
    method: 'get',
  });
}

/**
 * 创建公告 (管理员权限)
 * @param {object} data 公告数据
 */
export function createNotice(data) {
  return request({
    url: '/admin/notices/create',
    method: 'post',
    data,
  });
}

/**
 * 更新公告 (管理员权限)
 * @param {string} noticeId 公告ID
 * @param {object} data 更新数据
 */
export function updateNotice(noticeId, data) {
  return request({
    url: `/admin/notices/${noticeId}/update`,
    method: 'post',
    data,
  });
}

/**
 * 删除公告 (管理员权限)
 * @param {string} noticeId 公告ID
 */
export function deleteNotice(noticeId) {
  return request({
    url: `/admin/notices/${noticeId}/delete`,
    method: 'post',
  });
} 