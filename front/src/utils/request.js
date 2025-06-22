import axios from 'axios';
import { useUserStore } from '@/store/user';

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // API 的 base_url
  timeout: 5000, // 请求超时时间
});

// 请求拦截器 - 添加 token
service.interceptors.request.use(
  (config) => {
    // 优先从 localStorage 获取 token，然后尝试从 store 获取
    let token = localStorage.getItem('token')
    
    if (!token) {
      try {
        const userStore = useUserStore();
        token = userStore.token;
      } catch (e) {
        // store 不可用时忽略
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
service.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    try {
      const userStore = useUserStore();
      
      // 处理 401 未认证错误
      if (error.response?.status === 401) {
        console.log('收到401错误，清除用户认证状态');
        userStore.logout();
        
        // 只有在非登录页面时才跳转到登录页
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          // 延迟跳转，避免与其他导航冲突
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    } catch (e) {
      // store 不可用时忽略
      console.error('处理401错误时出现问题:', e);
    }
    
    // 处理其他错误
    const message = error.response?.data?.message || error.message || '请求失败';
    
    // 这里可以集成消息提示组件
    console.error('API Error:', message);
    
    return Promise.reject(error);
  }
);

export default service; 