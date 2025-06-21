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
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
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
    const userStore = useUserStore();
    
    // 处理 401 未认证错误
    if (error.response?.status === 401) {
      userStore.logout();
      return Promise.reject(error);
    }
    
    // 处理其他错误
    const message = error.response?.data?.message || error.message || '请求失败';
    
    // 这里可以集成消息提示组件
    console.error('API Error:', message);
    
    return Promise.reject(error);
  }
);

export default service; 