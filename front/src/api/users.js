import request from '@/utils/request';
import { config } from '@/utils/config';
import { 
  mockUsers, 
  mockProducts, 
  getUserById, 
  getProductsByUserId, 
  getFavoriteProducts, 
  paginateArray 
} from '@/utils/mockData';

/**
 * 获取当前用户信息
 */
export function getCurrentUser() {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 从localStorage获取当前用户信息
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        resolve({ data: userInfo });
      }, 200);
    });
  }
  
  return request({
    url: '/users/me',
    method: 'get',
  });
}

/**
 * 更新个人信息
 * @param {object} data 要更新的用户信息
 */
export function updateUserInfo(data) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const updatedUser = { ...currentUser, ...data };
        
        // 更新localStorage
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        
        // 也更新mockUsers中的数据
        const userIndex = mockUsers.findIndex(u => u.id === updatedUser.id);
        if (userIndex !== -1) {
          mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
        }
        
        resolve({ data: updatedUser });
      }, 400);
    });
  }
  
  return request({
    url: '/users/me/update',
    method: 'post',
    data,
  });
}

/**
 * 获取指定用户发布的商品
 * @param {number|string} userId 用户ID，可以是具体ID或'me'
 * @param {object} params 查询参数
 */
export function getUserProducts(userId, params = {}) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { page = 1, limit = 20, status = '', sortBy = 'createdAt', order = 'desc' } = params;
        
        let targetUserId = userId;
        if (userId === 'me') {
          const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
          targetUserId = currentUser.id;
        }
        
        // 获取用户的商品
        let products = getProductsByUserId(parseInt(targetUserId));
        
        // 状态筛选
        if (status) {
          products = products.filter(p => p.status === status);
        }
        
        // 排序
        products.sort((a, b) => {
          if (sortBy === 'price') {
            return order === 'asc' ? a.price - b.price : b.price - a.price;
          } else {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
          }
        });
        
        // 分页
        const paginatedData = paginateArray(products, page, limit);
        resolve({ data: paginatedData });
      }, 300);
    });
  }
  
  return request({
    url: `/users/${userId}/products`,
    method: 'get',
    params,
  });
}

/**
 * 获取指定用户的信用评价
 * @param {number|string} userId 用户ID，可以是具体ID或'me'
 * @param {object} params 查询参数
 */
export function getUserRatings(userId, params = {}) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟评价数据
        const mockRatings = [
          {
            id: 1,
            rating: 'good',
            comment: '卖家很棒，商品质量好！',
            rater: { id: 2, nickname: '书虫' },
            createdAt: '2023-10-10T14:00:00Z'
          },
          {
            id: 2,
            rating: 'good',
            comment: '交易很顺利，推荐！',
            rater: { id: 3, nickname: '运动达人' },
            createdAt: '2023-10-05T16:30:00Z'
          }
        ];
        
        const paginatedData = paginateArray(mockRatings, params.page || 1, params.limit || 10);
        resolve({ data: paginatedData });
      }, 200);
    });
  }
  
  return request({
    url: `/users/${userId}/ratings`,
    method: 'get',
    params,
  });
}

/**
 * 获取我收藏的商品列表
 * @param {object} params 查询参数
 */
export function getMyFavorites(params = {}) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { page = 1, limit = 20 } = params;
        
        // 获取收藏的商品
        const favoriteProducts = getFavoriteProducts();
        
        // 排序（按收藏时间，这里用创建时间模拟）
        favoriteProducts.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA; // 降序
        });
        
        // 分页
        const paginatedData = paginateArray(favoriteProducts, page, limit);
        resolve({ data: paginatedData });
      }, 300);
    });
  }
  
  return request({
    url: '/users/me/favorites',
    method: 'get',
    params,
  });
} 