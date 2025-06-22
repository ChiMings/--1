import request from '@/utils/request';
import { config } from '@/utils/config';

/**
 * 创建举报
 * @param {object} reportData 举报数据
 */
export function createReport(reportData) {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        message: '举报提交成功，我们会尽快处理',
        data: {
          id: `report_${Date.now()}`,
          reason: reportData.reason,
          content: reportData.content,
          status: '待处理',
          createdAt: new Date().toISOString()
        }
      }
    });
  }

  return request({
    url: '/reports/create',
    method: 'post',
    data: reportData,
  });
}

/**
 * 获取我的举报记录
 * @param {object} params 查询参数
 */
export function getMyReports(params = {}) {
  if (config.useMockData) {
    const mockReports = [
      {
        id: 'report_1',
        reason: '虚假信息',
        content: '该商品描述与实际不符',
        status: '已处理',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString(),
        product: {
          id: 'product_1',
          name: '被举报商品',
          images: [],
          price: 100,
          status: '已下架'
        }
      },
      {
        id: 'report_2',
        reason: '商品质量问题',
        content: '商品存在质量缺陷',
        status: '待处理',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        product: {
          id: 'product_2',
          name: '另一个商品',
          images: [],
          price: 200,
          status: '在售'
        }
      }
    ];

    return Promise.resolve({
      data: {
        status: 'success',
        data: {
          items: mockReports,
          total: mockReports.length,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      }
    });
  }

  return request({
    url: '/reports/my-reports',
    method: 'get',
    params,
  });
}

/**
 * 撤销举报
 * @param {string} reportId 举报ID
 */
export function cancelReport(reportId) {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        message: '举报已撤销'
      }
    });
  }

  return request({
    url: `/reports/${reportId}/cancel`,
    method: 'post',
  });
} 