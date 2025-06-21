import { testDatabaseConnection } from '../src/utils/database';
import { seedDatabase } from '../src/utils/seedData';

async function setupDatabase() {
  console.log('🔧 开始设置数据库...');
  
  try {
    // 测试连接
    const connected = await testDatabaseConnection();
    
    if (!connected) {
      console.log('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }
    
    // 初始化数据
    await seedDatabase();
    
    console.log('✅ 数据库设置完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库设置失败:', error);
    process.exit(1);
  }
}

setupDatabase(); 