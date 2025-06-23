const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('🌱 开始初始化数据库...');

    // 检查是否已有数据
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('ℹ️  数据库已有数据，跳过初始化');
      return;
    }

    // 创建分类
    console.log('📁 创建分类数据...');
    const categories = [
      { name: '数码电子', description: '手机、电脑、耳机等数码产品', icon: '📱' },
      { name: '图书教材', description: '教科书、参考书、小说等', icon: '📚' },
      { name: '生活用品', description: '日用品、护肤品、小家电等', icon: '🏠' },
      { name: '服装配饰', description: '衣服、鞋子、包包、饰品等', icon: '👕' },
      { name: '运动健身', description: '运动器材、健身用品等', icon: '⚽' },
      { name: '其他', description: '其他类别商品', icon: '📦' }
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category
      });
    }

    // 创建管理员用户
    console.log('👥 创建管理员用户...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.upsert({
      where: { studentId: '20230001' },
      update: {},
      create: {
        studentId: '20230001',
        name: '系统管理员',
        nickname: '管理员',
        password: hashedPassword,
        role: '超级管理员',
        status: '正常'
      }
    });

    // 创建系统公告
    console.log('📢 创建系统公告...');
    const existingNotice = await prisma.notice.findFirst({
      where: { 
        title: '欢迎使用校园闲置交易平台',
        deleted: false
      }
    });

    if (!existingNotice) {
      await prisma.notice.create({
        data: {
          title: '欢迎使用校园闲置交易平台',
          content: '欢迎大家使用校园闲置交易平台！请遵守平台规则，诚信交易。',
          type: 'ANNOUNCEMENT',
          isActive: true
        }
      });
    }

    console.log('✅ 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('🎉 初始化脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 初始化脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase }; 