import { prisma } from './database';

// 初始化分类数据
const categories = [
  { name: '电子产品', description: '手机、电脑、数码设备等' },
  { name: '教材书籍', description: '教科书、参考书、小说等' },
  { name: '生活用品', description: '日用品、家居用品等' },
  { name: '服装配饰', description: '衣服、鞋子、包包等' },
  { name: '运动器材', description: '健身器材、运动用品等' },
  { name: '其他', description: '其他未分类商品' }
];

// 初始化用户数据
const users = [
  {
    studentId: '20210001',
    name: '张三',
    nickname: '技术宅',
    role: '认证用户',
    password: 'password123' // 实际应用中应该加密
  },
  {
    studentId: '20210002',
    name: '李四',
    nickname: '书虫',
    role: '管理员',
    password: 'password123'
  },
  {
    studentId: '20210003',
    name: '王五',
    nickname: '运动达人',
    role: '认证用户',
    password: 'password123'
  },
  {
    studentId: '20210004',
    name: '管理员',
    nickname: '超级管理员',
    role: '超级管理员',
    password: 'admin123'
  },
  {
    studentId: '20210005',
    name: '赵六',
    nickname: '待激活用户',
    role: '未认证用户',
    activationCode: 'ABC123'
  },
  {
    studentId: '20210006',
    name: '孙七',
    nickname: '数码控',
    role: '未认证用户',
    password: 'password123'
  }
];

// 初始化商品数据
const products = [
  {
    name: '九成新MacBook Pro',
    description: '2021款MacBook Pro，M1芯片，16GB内存，512GB存储，9成新，配件齐全',
    price: 8500.00,
    contact: '微信：tech_zhang',
    images: JSON.stringify(['macbook1.jpg', 'macbook2.jpg']),
    categoryName: '电子产品',
    sellerStudentId: '20210001'
  },
  {
    name: '大学教材《高等数学》',
    description: '同济版第七版，无笔记，九成新，适合大一学生',
    price: 25.00,
    contact: 'QQ：123456789',
    images: JSON.stringify(['math_book.jpg']),
    categoryName: '教材书籍',
    sellerStudentId: '20210002'
  },
  {
    name: '全新运动鞋',
    description: '耐克Air Max，42码，全新未穿，原价699',
    price: 450.00,
    contact: '电话：13812345678',
    images: JSON.stringify(['shoes1.jpg', 'shoes2.jpg']),
    categoryName: '服装配饰',
    sellerStudentId: '20210003'
  }
];

// 初始化公告数据
const notices = [
  {
    title: '平台使用规范',
    content: `为了维护良好的交易环境，请所有用户遵守以下规范：

1. 诚信交易，如实描述商品信息
2. 文明用语，禁止恶意辱骂
3. 保护个人隐私，谨慎透露个人信息
4. 遇到问题及时联系客服

违反规范的用户将面临警告、限制功能或封号处理。`,
    type: '重要公告',
    isActive: true
  },
  {
    title: '新功能上线：商品收藏',
    content: `好消息！平台新增商品收藏功能：

✨ 可以收藏感兴趣的商品
✨ 在个人中心查看收藏列表
✨ 收藏商品有更新时会收到通知

快去试试吧！点击商品页面的心形图标即可收藏。`,
    type: '功能更新',
    isActive: true
  }
];

export async function seedDatabase() {
  try {
    console.log('🌱 开始初始化数据库...');

    // 1. 创建分类
    console.log('📁 创建分类数据...');
    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category
      });
    }

    // 2. 创建用户
    console.log('👥 创建用户数据...');
    for (const user of users) {
      await prisma.user.upsert({
        where: { studentId: user.studentId },
        update: {},
        create: user
      });
    }

    // 3. 创建商品
    console.log('📦 创建商品数据...');
    for (const product of products) {
      const category = await prisma.category.findUnique({
        where: { name: product.categoryName }
      });
      const seller = await prisma.user.findUnique({
        where: { studentId: product.sellerStudentId }
      });

      if (category && seller) {
        // 检查商品是否已存在
        const existingProduct = await prisma.product.findFirst({
          where: {
            name: product.name,
            sellerId: seller.id,
            deleted: false
          }
        });

        if (!existingProduct) {
          await prisma.product.create({
            data: {
              name: product.name,
              description: product.description,
              price: product.price,
              contact: product.contact,
              images: product.images,
              categoryId: category.id,
              sellerId: seller.id
            }
          });
        }
      }
    }

    // 4. 创建公告
    console.log('📢 创建公告数据...');
    for (const notice of notices) {
      // 检查公告是否已存在
      const existingNotice = await prisma.notice.findFirst({
        where: {
          title: notice.title,
          deleted: false
        }
      });

      if (!existingNotice) {
        await prisma.notice.create({
          data: notice
        });
      }
    }

    // 5. 创建测试通知
    console.log('🔔 创建通知数据...');
    const firstUser = await prisma.user.findFirst({ where: { studentId: '20210001' } });
    if (firstUser) {
      const notifications = [
        {
          userId: firstUser.id,
          type: 'SYSTEM_NOTICE',
          title: '欢迎使用校园闲置交易平台',
          content: '感谢您注册使用校园闲置交易平台！请遵守平台规则，诚信交易。'
        },
        {
          userId: firstUser.id,
          type: 'PRODUCT_FAVORITE',
          title: '商品收藏提醒',
          content: '您收藏的商品有新的更新，快去看看吧！'
        },
        {
          userId: firstUser.id,
          type: 'NEW_COMMENT',
          title: '新评论通知',
          content: '有用户对您的商品进行了评论，快去查看吧！'
        }
      ];

      for (const notification of notifications) {
        // 检查通知是否已存在
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: notification.userId,
            title: notification.title,
            deleted: false
          }
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: notification
          });
        }
      }
    }

    console.log('✅ 数据库初始化完成！');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
} 