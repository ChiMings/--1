// 开发配置
export const config = {
  // 是否使用模拟数据 (设为true在没有后端时使用模拟数据)
  useMockData: false,
  
  // API基础地址
  apiBaseURL: '/api',
  
  // 其他配置
  pageSize: 20,
  maxImageSize: 5 * 1024 * 1024, // 5MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
}; 