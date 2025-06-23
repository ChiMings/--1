import request from '@/utils/request';
import { config } from '@/utils/config';

/**
 * 获取管理员商品列表
 * @param {object} params 查询参数
 */
export function getAdminProducts(params = {}) {
  if (config.useMockData) {
    // 保留模拟数据逻辑作为后备
    return Promise.resolve({
      data: {
        status: 'success',
        data: {
          products: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
        }
      }
    });
  }

  return request({
    url: '/admin/products',
    method: 'get',
    params,
  });
}

/**
 * 获取商品统计信息
 */
export function getAdminProductsStats() {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        data: {
          total: 150,
          active: 120,
          sold: 25,
          removed: 5
        }
      }
    });
  }

  return request({
    url: '/admin/products/stats',
    method: 'get',
  });
}

/**
 * 管理员下架商品
 * @param {string} productId 商品ID
 * @param {string} reason 下架原因
 */
export function removeAdminProduct(productId, reason) {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        message: '商品已下架'
      }
    });
  }

  return request({
    url: `/admin/products/${productId}/remove`,
    method: 'post',
    data: { reason },
  });
}

/**
 * 管理员恢复商品（如果后端支持）
 * @param {string} productId 商品ID
 */
export function restoreAdminProduct(productId) {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        message: '商品已恢复'
      }
    });
  }

  return request({
    url: `/admin/products/${productId}/restore`,
    method: 'post',
  });
}

/**
 * 管理员彻底删除商品
 * @param {string} productId 商品ID
 * @param {string} reason 删除原因
 */
export function deleteAdminProduct(productId, reason) {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        message: '商品已删除'
      }
    });
  }

  return request({
    url: `/admin/products/${productId}/delete`,
    method: 'post',
    data: { reason },
  });
}

/**
 * 获取举报列表
 * @param {object} params 查询参数
 */
export function getAdminReports(params = {}) {
  // 不设置默认status，让后端返回所有状态的举报
  // 前端可以通过传递 status 参数来筛选特定状态

  if (config.useMockData) {
    const mockReports = [
      {
        id: 'report_1',
        reason: '虚假信息',
        content: '该商品描述与实际不符',
        status: '待处理',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        reporter: {
          id: 'user_1',
          nickname: '举报用户',
          studentId: '20230001'
        },
        product: {
          id: 'product_1',
          name: '被举报商品',
          images: [],
          price: 100,
          status: '在售',
          seller: {
            id: 'seller_1',
            nickname: '卖家用户',
            studentId: '20230002'
          }
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
    url: '/admin/reports',
    method: 'get',
    params,
  });
}

/**
 * 处理举报
 * @param {string} reportId 举报ID
 * @param {string} action 处理动作 (approved/rejected)
 * @param {string} adminNote 管理员备注
 */
export function processReport(reportId, action, adminNote) {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        message: `举报已${action === 'approved' ? '通过' : '驳回'}处理`
      }
    });
  }

  return request({
    url: `/admin/reports/${reportId}/process`,
    method: 'post',
    data: { action, adminNote },
  });
}

/**
 * 获取举报统计信息
 */
export function getAdminReportsStats() {
  if (config.useMockData) {
    return Promise.resolve({
      data: {
        status: 'success',
        data: {
          total: 15,
          pending: 5,
          approved: 8,
          rejected: 2,
          recent: 3
        }
      }
    });
  }

  return request({
    url: '/admin/reports/stats',
    method: 'get',
  });
}

/**
 * 获取数据看板统计信息
 * @param {object} params 查询参数，例如 { period: 'week' }
 */
export function getDashboardStats(params) {
  return request({
    url: '/admin/dashboard/stats',
    method: 'get',
    params,
  });
}