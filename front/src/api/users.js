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

/**
 * 管理员获取用户统计信息
 */
export function getAdminUsersStats() {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 简单的模拟统计
        resolve({ 
          data: { 
            total: 8, 
            verified: 3, 
            unverified: 3, 
            admins: 2 
          } 
        });
      }, 200);
    });
  }
  
  return request({
    url: '/admin/users/stats',
    method: 'get',
  });
}

/**
 * 管理员获取用户列表
 * @param {object} params 查询参数
 */
export function getAdminUsersList(params = {}) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { page = 1, limit = 20, search, role, status } = params;
        
        // 扩展模拟数据
        const extendedUsers = [
          ...mockUsers,
          {
            id: 6,
            studentId: '20210004',
            name: '赵六',
            nickname: '数码控',
            contact: '13800138004',
            role: '未认证用户',
            credit: 0,
            status: '正常',
            createdAt: '2023-11-01T08:00:00Z',
            updatedAt: '2023-11-01T08:00:00Z'
          },
          {
            id: 7,
            studentId: '20210005',
            name: '钱七',
            nickname: '待认证用户',
            contact: '13800138005',
            role: '未认证用户',
            credit: 0,
            status: '正常',
            createdAt: '2023-10-30T20:15:00Z',
            updatedAt: '2023-10-30T20:15:00Z'
          },
          {
            id: 8,
            studentId: '20210006',
            name: '孙八',
            nickname: '学习委员',
            contact: '13800138006',
            role: '认证用户',
            credit: 75,
            status: '正常',
            createdAt: '2023-08-01T00:00:00Z',
            updatedAt: '2023-08-01T00:00:00Z'
          }
        ];
        
        let filteredUsers = [...extendedUsers];
        
        // 搜索筛选
        if (search) {
          const keyword = search.toLowerCase();
          filteredUsers = filteredUsers.filter(user => 
            user.nickname?.toLowerCase().includes(keyword) ||
            user.name?.toLowerCase().includes(keyword) ||
            user.studentId?.includes(keyword)
          );
        }
        
        // 角色筛选
        if (role) {
          filteredUsers = filteredUsers.filter(user => user.role === role);
        }
        
        // 状态筛选
        if (status) {
          filteredUsers = filteredUsers.filter(user => user.status === status);
        }
        
        // 分页
        const paginatedData = paginateArray(filteredUsers, page, limit);
        resolve({ data: paginatedData });
      }, 500);
    });
  }
  
  return request({
    url: '/admin/users',
    method: 'get',
    params,
  });
}

/**
 * 管理员更新用户角色
 * @param {string} userId 用户ID
 * @param {string} role 新角色
 */
export function updateUserRole(userId, role) {
  if (config.useMockData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟角色更新
        const userIndex = mockUsers.findIndex(u => u.id === parseInt(userId));
        if (userIndex !== -1) {
          mockUsers[userIndex].role = role;
          resolve({ 
            data: { 
              success: true, 
              message: '用户角色更新成功',
              user: mockUsers[userIndex]
            } 
          });
        } else {
          reject(new Error('用户不存在'));
        }
      }, 400);
    });
  }
  
  return request({
    url: `/admin/users/${userId}/role/update`,
    method: 'post',
    data: { role },
  });
}

/**
 * 管理员更新用户状态
 * @param {string} userId 用户ID
 * @param {string} status 新状态
 */
export function updateUserStatus(userId, status) {
  if (config.useMockData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟状态更新
        const userIndex = mockUsers.findIndex(u => u.id === parseInt(userId));
        if (userIndex !== -1) {
          mockUsers[userIndex].status = status;
          resolve({ 
            data: { 
              success: true, 
              message: '用户状态更新成功',
              user: mockUsers[userIndex]
            } 
          });
        } else {
          reject(new Error('用户不存在'));
        }
      }, 400);
    });
  }
  
  return request({
    url: `/admin/users/${userId}/status/update`,
    method: 'post',
    data: { status },
  });
}

/**
 * 获取用户详细信息
 * @param {string} userId 用户ID
 */
export function getUserProfile(userId) {
  if (config.useMockData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = getUserById(parseInt(userId));
        if (user) {
          const products = getProductsByUserId(parseInt(userId));
          resolve({ 
            data: {
              status: 'success',
              message: '获取用户信息成功',
              data: user  // 统一数据结构，返回用户信息在data字段中
            }
          });
        } else {
          reject(new Error('用户不存在'));
        }
      }, 300);
    });
  }
  
  return request({
    url: `/users/${userId}`,
    method: 'get',
  });
} 