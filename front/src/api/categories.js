import request from '@/utils/request';

// 获取所有分类
export function getCategories() {
  return request({
    url: '/categories',
    method: 'get'
  });
}

// 获取分类详情
export function getCategoryById(id) {
  return request({
    url: `/categories/${id}`,
    method: 'get'
  });
}

// 创建分类
export function createCategory(data) {
  return request({
    url: '/categories',
    method: 'post',
    data
  });
}

// 更新分类
export function updateCategory(id, data) {
  return request({
    url: `/categories/${id}`,
    method: 'put',
    data
  });
}

// 删除分类
export function deleteCategory(id) {
  return request({
    url: `/categories/${id}`,
    method: 'delete'
  });
}

// 获取分类下的商品
export function getCategoryProducts(id, params = {}) {
  return request({
    url: `/categories/${id}/products`,
    method: 'get',
    params
  });
} 