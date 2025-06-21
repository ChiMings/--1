import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { testDatabaseConnection, closeDatabaseConnection } from './utils/database';
import { seedDatabase } from './utils/seedData';

// 导入路由
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import uploadRoutes from './routes/upload';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import noticeRoutes from './routes/notices';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '校园二手交易平台 API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/health'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      // 初始化数据库数据（仅在开发环境）
      if (process.env.NODE_ENV !== 'production') {
        try {
          await seedDatabase();
        } catch (seedError) {
          console.log('ℹ️  数据已存在，跳过初始化');
        }
      }
    } else {
      console.log('⚠️  数据库连接失败，使用模拟数据模式');
    }

    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📁 上传目录: ${path.join(process.cwd(), 'uploads')}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 数据库: ${dbConnected ? '已连接' : '模拟数据模式'}`);
    });

    // 优雅关闭
    process.on('SIGINT', async () => {
      console.log('\n🔄 正在关闭服务器...');
      await closeDatabaseConnection();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

export default app; 