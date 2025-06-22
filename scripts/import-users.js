const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 统计信息
const stats = {
  total: 0,           // 总记录数
  processed: 0,       // 处理的记录数
  skipped: 0,         // 跳过的记录数
  imported: 0,        // 成功导入数
  errors: 0,          // 错误数
  duplicates: 0,      // 学号重复数
  invalidData: 0      // 数据不全数
};

// 错误日志
const errorLog = [];
const skippedLog = [];

/**
 * 验证用户数据是否完整
 * @param {object} user 用户数据
 * @param {number} index 数据索引
 * @returns {object} 验证结果
 */
function validateUserData(user, index) {
  const errors = [];
  
  // 检查必需字段
  if (!user.name || user.name.trim() === '') {
    errors.push('姓名为空');
  }
  
  if (!user.xgh || user.xgh.trim() === '') {
    errors.push('学号为空');
  }
  
  if (!user.puid) {
    errors.push('puid为空');
  }

  // 检查学号格式（如果不为空）
  if (user.xgh && user.xgh.trim() !== '') {
    // 如果学号看起来像手机号（11位数字且以1开头），标记为无效
    if (/^1\d{10}$/.test(user.xgh.trim())) {
      errors.push('学号格式无效（疑似手机号）');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    data: {
      name: user.name ? user.name.trim() : '',
      studentId: user.xgh ? user.xgh.trim() : '',
      activationCode: user.puid ? user.puid.toString() : '',
      contact: user.mobile && user.mobile !== '' ? user.mobile : null,
      dept: user.dept || null
    }
  };
}

/**
 * 导入单个用户
 * @param {object} userData 验证后的用户数据
 * @returns {Promise<boolean>} 导入是否成功
 */
async function importUser(userData) {
  try {
    // 检查学号是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { studentId: userData.studentId }
    });

    if (existingUser) {
      stats.duplicates++;
      skippedLog.push({
        studentId: userData.studentId,
        name: userData.name,
        reason: '学号已存在'
      });
      return false;
    }

    // 创建用户
    await prisma.user.create({
      data: {
        studentId: userData.studentId,
        name: userData.name,
        nickname: userData.name, // 默认昵称为姓名
        role: '未认证用户',      // 默认状态为未认证
        status: '正常',
        activationCode: userData.activationCode,
        contact: userData.contact,
        // 不设置密码，需要用户激活时设置
      }
    });

    stats.imported++;
    return true;
  } catch (error) {
    stats.errors++;
    errorLog.push({
      studentId: userData.studentId,
      name: userData.name,
      error: error.message
    });
    return false;
  }
}

/**
 * 主导入函数
 */
async function importUsers() {
  try {
    console.log('🚀 开始导入用户数据...');
    console.log('================================');

    // 读取JSON文件
    const filePath = path.join(process.cwd(), 'all_users.json');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    console.log('📖 正在读取用户数据文件...');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    let users;
    try {
      users = JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`JSON解析失败: ${error.message}`);
    }

    if (!Array.isArray(users)) {
      throw new Error('数据格式错误：期望数组格式');
    }

    stats.total = users.length;
    console.log(`📊 找到 ${stats.total} 条用户记录`);
    console.log('');

    // 用于跟踪学号去重
    const processedStudentIds = new Set();

    // 逐条处理用户数据
    for (let i = 0; i < users.length; i++) {
      stats.processed++;
      const user = users[i];
      
      // 显示进度（每100条显示一次）
      if (stats.processed % 100 === 0 || stats.processed === stats.total) {
        const progress = ((stats.processed / stats.total) * 100).toFixed(1);
        console.log(`⏳ 处理进度: ${stats.processed}/${stats.total} (${progress}%)`);
      }

      // 验证数据
      const validation = validateUserData(user, i);
      
      if (!validation.isValid) {
        stats.invalidData++;
        stats.skipped++;
        skippedLog.push({
          index: i + 1,
          name: user.name || '未知',
          studentId: user.xgh || '未知',
          reason: `数据不全: ${validation.errors.join(', ')}`
        });
        continue;
      }

      // 检查本次导入中的学号重复
      if (processedStudentIds.has(validation.data.studentId)) {
        stats.duplicates++;
        stats.skipped++;
        skippedLog.push({
          index: i + 1,
          name: validation.data.name,
          studentId: validation.data.studentId,
          reason: '本次导入中学号重复'
        });
        continue;
      }

      processedStudentIds.add(validation.data.studentId);

      // 导入用户
      const success = await importUser(validation.data);
      if (!success) {
        stats.skipped++;
      }
    }

    console.log('');
    console.log('✅ 用户导入完成！');
    console.log('================================');
    console.log('📊 导入统计:');
    console.log(`   总记录数: ${stats.total}`);
    console.log(`   成功导入: ${stats.imported}`);
    console.log(`   跳过记录: ${stats.skipped}`);
    console.log(`     - 数据不全: ${stats.invalidData}`);
    console.log(`     - 学号重复: ${stats.duplicates}`);
    console.log(`     - 导入错误: ${stats.errors}`);
    console.log('');

    // 输出详细日志
    if (skippedLog.length > 0) {
      console.log('⚠️  跳过的记录详情:');
      skippedLog.slice(0, 10).forEach(item => {
        console.log(`   - ${item.name} (${item.studentId}): ${item.reason}`);
      });
      if (skippedLog.length > 10) {
        console.log(`   ... 还有 ${skippedLog.length - 10} 条跳过记录`);
      }
      console.log('');
    }

    if (errorLog.length > 0) {
      console.log('❌ 错误记录详情:');
      errorLog.forEach(item => {
        console.log(`   - ${item.name} (${item.studentId}): ${item.error}`);
      });
      console.log('');
    }

    // 保存详细日志到文件
    const logData = {
      timestamp: new Date().toISOString(),
      stats: stats,
      skippedRecords: skippedLog,
      errorRecords: errorLog
    };

    const logFileName = `import-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    fs.writeFileSync(logFileName, JSON.stringify(logData, null, 2), 'utf8');
    console.log(`📄 详细日志已保存到: ${logFileName}`);

  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行导入
if (require.main === module) {
  importUsers().catch(error => {
    console.error('❌ 未捕获的错误:', error);
    process.exit(1);
  });
}

module.exports = { importUsers }; 