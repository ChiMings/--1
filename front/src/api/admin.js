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