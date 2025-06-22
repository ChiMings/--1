import { PrismaClient } from '@prisma/client';

// 创建全局Prisma客户端实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 数据库连接测试
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

// 优雅关闭数据库连接
export async function closeDatabaseConnection() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('数据库断开连接失败:', error);
  }
} 