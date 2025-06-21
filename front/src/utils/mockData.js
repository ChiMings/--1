// 模拟用户数据
export const mockUsers = [
  {
    id: 1,
    studentId: '20210001',
    name: '张三',
    nickname: '技术宅',
    contact: '13800138001',
    role: '认证用户',
    credit: 100,
    createdAt: '2023-10-01T12:00:00Z'
  },
  {
    id: 2,
    studentId: '20210002',
    name: '李四',
    nickname: '书虫',
    contact: '13800138002',
    role: '管理员',
    credit: 95,
    createdAt: '2023-09-15T10:30:00Z'
  },
  {
    id: 3,
    studentId: '20210003',
    name: '王五',
    nickname: '运动达人',
    contact: '13800138003',
    role: '认证用户',
    credit: 88,
    createdAt: '2023-09-20T14:20:00Z'
  }
];

// 模拟商品分类
export const mockCategories = [
  { id: 1, name: '电子产品' },
  { id: 2, name: '书籍教材' },
  { id: 3, name: '生活用品' },
  { id: 4, name: '服装饰品' },
  { id: 5, name: '体育用品' },
  { id: 6, name: '其他' }
];

// 模拟商品数据
export const mockProducts = [
  {
    id: 1,
    name: '九成新罗技鼠标 MX Master 3',
    description: '用了一年，手感很好，换新的了故出。原价499，现在只要200。功能完好，无损坏。适合办公和设计使用，人体工学设计，长时间使用不累手。',
    price: 200,
    categoryId: 1,
    category: { id: 1, name: '电子产品' },
    contact: 'QQ: 123456789',
    status: '在售',
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
      'https://images.unsplash.com/photo-1615750185084-c7b0b6fd7269?w=400'
    ],
    seller: {
      id: 1,
      nickname: '技术宅',
      credit: 100
    },
    isFavorite: false,
    createdAt: '2023-11-01T10:00:00Z'
  },
  {
    id: 2,
    name: '高等数学教材（第七版）',
    description: '同济大学版高等数学教材，几乎全新，只在期末复习时翻过几页。原价68元，现价30元。适合理工科学生使用。',
    price: 30,
    categoryId: 2,
    category: { id: 2, name: '书籍教材' },
    contact: '微信: book_lover',
    status: '在售',
    images: [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'
    ],
    seller: {
      id: 2,
      nickname: '书虫',
      credit: 95
    },
    isFavorite: true,
    createdAt: '2023-10-30T15:30:00Z'
  },
  {
    id: 3,
    name: 'Nike Air Max 270 运动鞋',
    description: '42码男款运动鞋，八成新，平时很少穿。原价899元，现价300元。适合跑步和日常穿搭。鞋底弹性很好，穿着舒适。',
    price: 300,
    categoryId: 4,
    category: { id: 4, name: '服装饰品' },
    contact: '手机: 13800138003',
    status: '在售',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'
    ],
    seller: {
      id: 3,
      nickname: '运动达人',
      credit: 88
    },
    isFavorite: false,
    createdAt: '2023-10-28T09:15:00Z'
  },
  {
    id: 4,
    name: 'MacBook Pro 13寸 2020款',
    description: 'M1芯片，8G内存，256G存储。使用一年半，成色很好，无磕碰。原价9999元，现价6500元。配原装充电器和包装盒。',
    price: 6500,
    categoryId: 1,
    category: { id: 1, name: '电子产品' },
    contact: 'QQ: 987654321',
    status: '已售出',
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400'
    ],
    seller: {
      id: 1,
      nickname: '技术宅',
      credit: 100
    },
    isFavorite: false,
    createdAt: '2023-10-25T14:20:00Z'
  },
  {
    id: 5,
    name: '宜家台灯 FORSÅ工作灯',
    description: '白色台灯，可调节角度，适合宿舍学习使用。九成新，原价39元，现价20元。灯泡正常，线路无问题。',
    price: 20,
    categoryId: 3,
    category: { id: 3, name: '生活用品' },
    contact: '微信: study_lamp',
    status: '在售',
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    ],
    seller: {
      id: 2,
      nickname: '书虫',
      credit: 95
    },
    isFavorite: false,
    createdAt: '2023-10-20T11:45:00Z'
  },
  {
    id: 6,
    name: '篮球 Spalding斯伯丁',
    description: '标准7号篮球，使用半年，弹性很好。原价120元，现价60元。适合室内外使用，无漏气。',
    price: 60,
    categoryId: 5,
    category: { id: 5, name: '体育用品' },
    contact: '手机: 13800138003',
    status: '在售',
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400'
    ],
    seller: {
      id: 3,
      nickname: '运动达人',
      credit: 88
    },
    isFavorite: true,
    createdAt: '2023-10-18T16:00:00Z'
  }
];

// 模拟评论数据
export const mockComments = [
  {
    id: 1,
    productId: 1,
    content: '这个鼠标还在吗？什么时候可以看货？',
    author: { id: 2, nickname: '书虫' },
    createdAt: '2023-11-02T10:30:00Z'
  },
  {
    id: 2,
    productId: 1,
    content: '可以优惠吗？180包邮如何？',
    author: { id: 3, nickname: '运动达人' },
    createdAt: '2023-11-01T15:20:00Z'
  },
  {
    id: 3,
    productId: 2,
    content: '书的版本是最新的吗？有课后答案吗？',
    author: { id: 1, nickname: '技术宅' },
    createdAt: '2023-10-31T09:15:00Z'
  }
];

// 模拟私信数据
export const mockMessages = [
  {
    id: 1,
    fromUser: { id: 2, nickname: '书虫' },
    toUser: { id: 1, nickname: '技术宅' },
    content: '你好，请问鼠标什么时候可以交易？',
    createdAt: '2023-11-02T11:00:00Z',
    isRead: false
  },
  {
    id: 2,
    fromUser: { id: 1, nickname: '技术宅' },
    toUser: { id: 2, nickname: '书虫' },
    content: '明天下午2点在图书馆门口可以吗？',
    createdAt: '2023-11-02T11:30:00Z',
    isRead: true
  },
  {
    id: 3,
    fromUser: { id: 3, nickname: '运动达人' },
    toUser: { id: 1, nickname: '技术宅' },
    content: '鼠标还有包装盒吗？',
    createdAt: '2023-11-01T16:45:00Z',
    isRead: false
  }
];

// 模拟通知数据
export const mockNotifications = [
  {
    id: 1,
    type: 'NEW_COMMENT',
    content: '用户 书虫 评论了您的商品 "九成新罗技鼠标 MX Master 3"',
    isRead: false,
    createdAt: '2023-11-02T10:30:00Z'
  },
  {
    id: 2,
    type: 'NEW_MESSAGE',
    content: '您有新的私信来自 运动达人',
    isRead: false,
    createdAt: '2023-11-01T16:45:00Z'
  },
  {
    id: 3,
    type: 'PRODUCT_SOLD',
    content: '恭喜！您的商品 "MacBook Pro 13寸 2020款" 已售出',
    isRead: true,
    createdAt: '2023-10-26T09:00:00Z'
  }
];

// 模拟统计数据
export const mockStats = {
  totalUsers: 1250,
  totalProducts: 456,
  totalTransactions: 328,
  activeUsers: 89,
  todayRegistrations: 12,
  todayProducts: 8,
  todayTransactions: 5,
  userGrowth: [
    { date: '2023-10-01', count: 1180 },
    { date: '2023-10-08', count: 1195 },
    { date: '2023-10-15', count: 1210 },
    { date: '2023-10-22', count: 1225 },
    { date: '2023-10-29', count: 1240 },
    { date: '2023-11-05', count: 1250 }
  ],
  productsByCategory: [
    { category: '电子产品', count: 156 },
    { category: '书籍教材', count: 124 },
    { category: '生活用品', count: 89 },
    { category: '服装饰品', count: 67 },
    { category: '体育用品', count: 20 }
  ]
};

// 工具函数：根据ID获取用户信息
export function getUserById(id) {
  return mockUsers.find(user => user.id === id);
}

// 工具函数：根据ID获取商品信息
export function getProductById(id) {
  return mockProducts.find(product => product.id === parseInt(id));
}

// 工具函数：获取用户的商品
export function getProductsByUserId(userId) {
  return mockProducts.filter(product => product.seller.id === userId);
}

// 工具函数：获取用户收藏的商品
export function getFavoriteProducts(userId) {
  return mockProducts.filter(product => product.isFavorite);
}

// 工具函数：搜索商品
export function searchProducts(keyword = '', categoryId = '', status = '') {
  let results = [...mockProducts];
  
  if (keyword) {
    results = results.filter(product => 
      product.name.toLowerCase().includes(keyword.toLowerCase()) ||
      product.description.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  if (categoryId) {
    results = results.filter(product => product.categoryId === parseInt(categoryId));
  }
  
  if (status) {
    results = results.filter(product => product.status === status);
  }
  
  return results;
}

// 工具函数：分页
export function paginateArray(array, page = 1, limit = 20) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = array.slice(startIndex, endIndex);
  
  return {
    items,
    total: array.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(array.length / limit)
  };
} 