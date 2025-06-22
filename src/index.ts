import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { testDatabaseConnection, closeDatabaseConnection } from './utils/database';

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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
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
app.get('/api/health', (req, res) => {
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
    environment: process.env.NODE_ENV || 'development',
    health: '/api/health'
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
    
    if (!dbConnected) {
      console.log('⚠️  数据库连接失败');
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ 生产环境必须连接数据库');
        process.exit(1);
      }
    }

    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      console.log(`🚀 服务器启动成功`);
      console.log(`📍 地址: http://localhost:${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 数据库: ${dbConnected ? '已连接' : '未连接'}`);
      console.log(`📁 上传目录: ${path.join(process.cwd(), 'uploads')}`);
    });

    // 优雅关闭
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🔄 收到${signal}信号，正在关闭服务器...`);
      
      server.close(async () => {
        console.log('📴 HTTP服务器已关闭');
        await closeDatabaseConnection();
        console.log('💾 数据库连接已关闭');
        console.log('✅ 服务器已安全关闭');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

export default app; 