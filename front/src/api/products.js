import request from '@/utils/request';
import { config } from '@/utils/config';
import { 
  mockProducts, 
  mockCategories, 
  mockComments,
  searchProducts, 
  paginateArray, 
  getProductsByUserId
} from '@/utils/mockData';

// 模拟API响应
function createMockResponse(data) {
  return Promise.resolve({ data });
}

/**
 * 获取商品列表（带筛选和搜索）
 * @param {object} params { page, limit, categoryId, keyword, status, sortBy, order }
 */
export function getProducts(params = {}) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { page = 1, limit = 20, keyword = '', categoryId = '', status = '', sortBy = 'createdAt', order = 'desc' } = params;
        
        // 搜索和筛选
        let results = searchProducts(keyword, categoryId, status);
        
        // 排序
        results.sort((a, b) => {
          if (sortBy === 'price') {
            return order === 'asc' ? a.price - b.price : b.price - a.price;
          } else {
            // 按创建时间排序
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
          }
        });
        
        // 分页
        const paginatedData = paginateArray(results, page, limit);
        resolve({ data: paginatedData });
      }, 300);
    });
  }
  
  return request({
    url: '/products',
    method: 'get',
    params,
  });
}

/**
 * 获取商品详情
 * @param {number} productId 商品ID
 */
export function getProductDetail(productId) {
  if (config.useMockData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const product = mockProducts.find(p => p.id === parseInt(productId));
        if (product) {
          // 保持与真实API相同的响应结构
          resolve({ 
            data: { 
              status: 'success', 
              message: '获取商品详情成功', 
              data: product 
            } 
          });
        } else {
          reject(new Error('商品不存在'));
        }
      }, 200);
    });
  }
  
  return request({
    url: `/products/${productId}`,
    method: 'get',
  });
}

/**
 * 发布新商品
 * @param {object} data 商品信息
 */
export function createProduct(data) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newProduct = {
          id: mockProducts.length + 1,
          ...data,
          status: '在售',
          createdAt: new Date().toISOString(),
          seller: {
            id: 1, // 假设当前用户ID为1
            nickname: '技术宅',
            credit: 100
          },
          isFavorite: false
        };
        
        mockProducts.unshift(newProduct); // 添加到开头
        resolve({ data: newProduct });
      }, 500);
    });
  }
  
  return request({
    url: '/products/create',
    method: 'post',
    data,
  });
}

/**
 * 更新商品信息
 * @param {number} productId 商品ID
 * @param {object} data 要更新的商品信息
 */
export function updateProduct(productId, data) {
  if (config.useMockData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockProducts.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
          mockProducts[index] = { ...mockProducts[index], ...data };
          resolve({ data: mockProducts[index] });
        } else {
          reject(new Error('商品不存在'));
        }
      }, 400);
    });
  }
  
  return request({
    url: `/products/${productId}/update`,
    method: 'post',
    data,
  });
}

/**
 * 更新商品状态
 * @param {number} productId 商品ID
 * @param {string} status 新状态
 */
export function updateProductStatus(productId, status) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const product = mockProducts.find(p => p.id === productId);
        if (product) {
          product.status = status;
          if (status === '已售出') {
            product.soldAt = new Date().toISOString();
          }
        }
        resolve({ data: product });
      }, 300);
    });
  }
  
  return request({
    url: `/products/${productId}/status`,
    method: 'post',
    data: { status },
  });
}

/**
 * 删除商品
 * @param {number} productId 商品ID
 */
export function deleteProduct(productId) {
  if (config.useMockData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockProducts.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
          mockProducts.splice(index, 1);
          resolve({ data: { message: '删除成功' } });
        } else {
          reject(new Error('商品不存在'));
        }
      }, 300);
    });
  }
  
  return request({
    url: `/products/${productId}/delete`,
    method: 'post',
  });
}

/**
 * 收藏商品
 * @param {number} productId 商品ID
 */
export function favoriteProduct(productId) {
  if (config.useMockData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const product = mockProducts.find(p => p.id === parseInt(productId));
        if (product) {
          product.isFavorite = !product.isFavorite;
          resolve({ data: { isFavorite: product.isFavorite } });
        } else {
          reject(new Error('商品不存在'));
        }
      }, 200);
    });
  }
  
  return request({
    url: `/products/${productId}/favorite`,
    method: 'post',
  });
}

/**
 * 取消收藏商品
 * @param {number} productId 商品ID
 */
export function unfavoriteProduct(productId) {
  if (config.useMockData) {
    return favoriteProduct(productId); // 模拟数据中用同一个函数切换状态
  }
  
  return request({
    url: `/products/${productId}/unfavorite`,
    method: 'post',
  });
}

/**
 * 获取商品分类
 */
export function getCategories() {
  if (config.useMockData) {
    return createMockResponse(mockCategories);
  }
  
  return request({
    url: '/categories',
    method: 'get',
  });
}



/**
 * 获取商品评论
 * @param {number} productId 商品ID
 * @param {object} params 查询参数
 */
export function getProductComments(productId, params = {}) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { page = 1, limit = 20 } = params;
        
        // 筛选指定商品的评论
        const productComments = mockComments.filter(c => c.productId === parseInt(productId));
        
        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedComments = productComments.slice(startIndex, endIndex);
        
        resolve({
          data: {
            status: 'success',
            message: '获取评论成功',
            data: {
              items: paginatedComments,
              total: productComments.length,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: Math.ceil(productComments.length / limit)
            }
          }
        });
      }, 200);
    });
  }
  
  return request({
    url: `/products/${productId}/comments`,
    method: 'get',
    params,
  });
}

/**
 * 添加评论
 * @param {number} productId 商品ID
 * @param {object} data 评论数据
 */
export function createComment(productId, data) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newComment = {
          id: Date.now(),
          productId: parseInt(productId),
          content: data.content,
          author: {
            id: 1, // 假设当前用户ID为1
            nickname: '技术宅'
          },
          createdAt: new Date().toISOString()
        };
        
        // 添加到模拟数据
        mockComments.unshift(newComment);
        
        resolve({
          data: {
            status: 'success',
            message: '评论发表成功',
            data: newComment
          }
        });
      }, 300);
    });
  }
  
  return request({
    url: `/products/${productId}/comments/create`,
    method: 'post',
    data,
  });
}

/**
 * 删除评论
 * @param {number} productId 商品ID
 * @param {number} commentId 评论ID
 */
export function deleteComment(productId, commentId) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 从全局评论数组中删除
        if (window.mockCommentsGlobal) {
          const index = window.mockCommentsGlobal.findIndex(c => c.id === commentId);
          if (index !== -1) {
            window.mockCommentsGlobal.splice(index, 1);
          }
        }
        
        // 从mockData中删除
        const commentIndex = mockComments.findIndex(c => c.id === commentId);
        if (commentIndex !== -1) {
          mockComments.splice(commentIndex, 1);
        }
        
        resolve({ 
          data: { 
            status: 'success',
            message: '评论删除成功' 
          } 
        });
      }, 300);
    });
  }
  
  return request({
    url: `/products/${productId}/comments/${commentId}/delete`,
    method: 'post',
  });
}

 