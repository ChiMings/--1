import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // API 的 base_url
  timeout: 5000, // 请求超时时间
});

// TODO: 添加请求拦截器 (例如：携带token)

// TODO: 添加响应拦截器 (例如：处理错误)

export default service; 