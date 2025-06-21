import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, activate as apiActivate, guestLogin as apiGuestLogin } from '@/api/auth';
import { mockUsers, getUserById } from '@/utils/mockData';
import { config } from '@/utils/config';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const userInfo = ref(null);

  // 模拟登录函数
  function mockLogin(credentials) {
    return new Promise((resolve, reject) => {
      // 模拟网络延迟
      setTimeout(() => {
        let user = null;
        
        if (credentials.password) {
          // 认证登录
          user = mockUsers.find(u => u.studentId === credentials.studentId);
          if (!user) {
            reject(new Error('用户不存在'));
            return;
          }
          // 这里可以加入密码验证，暂时跳过
        } else if (credentials.name) {
          // 游客登录
          user = mockUsers.find(u => u.studentId === credentials.studentId && u.name === credentials.name);
          if (!user) {
            reject(new Error('用户信息不匹配'));
            return;
          }
          // 创建游客用户副本
          user = { ...user, role: '未认证用户' };
        }
        
        if (user) {
          const mockToken = `mock_token_${user.id}_${Date.now()}`;
          resolve({
            data: {
              token: mockToken,
              user: user
            }
          });
        } else {
          reject(new Error('登录失败'));
        }
      }, 500); // 模拟500ms延迟
    });
  }

  // 模拟激活函数
  function mockActivate(credentials) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = mockUsers.find(u => 
          u.studentId === credentials.studentId && 
          u.name === credentials.name
        );
        
        if (!user) {
          reject(new Error('用户信息不正确'));
          return;
        }
        
        // 创建激活后的用户
        const activatedUser = {
          ...user,
          nickname: credentials.nickname,
          role: '认证用户'
        };
        
        const mockToken = `mock_token_${user.id}_${Date.now()}`;
        resolve({
          data: {
            token: mockToken,
            user: activatedUser
          }
        });
      }, 800);
    });
  }

  async function handleLogin(loginFn, credentials) {
    const response = await loginFn(credentials);
    
    // 处理真实API响应格式: { success: true, message: "", data: { token, user } }
    let data;
    if (response.data && response.data.data) {
      // 真实API响应
      data = response.data.data;
    } else {
      // 模拟数据响应
      data = response.data;
    }
    
    token.value = data.token;
    userInfo.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('userInfo', JSON.stringify(data.user));
    return data;
  }

  // 认证登录
  async function login(credentials) {
    if (config.useMockData) {
      return await handleLogin(mockLogin, credentials);
    } else {
      return await handleLogin(apiLogin, credentials);
    }
  }

  // 游客登录
  async function guestLogin(credentials) {
    if (config.useMockData) {
      return await handleLogin(mockLogin, credentials);
    } else {
      return await handleLogin(apiGuestLogin, credentials);
    }
  }

  // 账号激活
  async function activate(credentials) {
    if (config.useMockData) {
      return await handleLogin(mockActivate, credentials);
    } else {
      return await handleLogin(apiActivate, credentials);
    }
  }

  // 退出登录
  function logout() {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  }

  // 初始化时检查token有效性
  function initializeFromStorage() {
    const storedToken = localStorage.getItem('token');
    const storedUserInfo = localStorage.getItem('userInfo');
    
    if (storedToken && storedUserInfo) {
      token.value = storedToken;
      try {
        userInfo.value = JSON.parse(storedUserInfo);
      } catch (error) {
        console.error('Failed to parse stored user info:', error);
        logout();
      }
    }
  }

  // 快速登录函数 (仅开发模式使用)
  function quickLogin(userId = 1) {
    if (!config.useMockData) return;
    
    const user = getUserById(userId);
    if (user) {
      const mockToken = `mock_token_${user.id}_${Date.now()}`;
      token.value = mockToken;
      userInfo.value = user;
      localStorage.setItem('token', mockToken);
      localStorage.setItem('userInfo', JSON.stringify(user));
    }
  }

  // 计算属性
  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => {
    return userInfo.value && (
      userInfo.value.role === '管理员' || 
      userInfo.value.role === '超级管理员'
    );
  });

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    login,
    guestLogin,
    activate,
    logout,
    initializeFromStorage,
    quickLogin,
  };
}); 