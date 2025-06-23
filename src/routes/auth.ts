import { Router } from 'express';
import bcrypt from 'bcryptjs'; // 引入 bcrypt
import { success, error, badRequest } from '../utils/response';
import { prisma } from '../utils/database';
import { generateToken } from '../middleware/auth';

const router = Router();

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { studentId, password, name } = req.body;

    if (!studentId) {
      return res.status(400).json(badRequest('学号不能为空'));
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { studentId },
      select: {
        id: true,
        studentId: true,
        name: true,
        nickname: true,
        role: true,
        avatar: true,
        contact: true,
        password: true,
        status: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json(error('用户不存在'));
    }

    if (user.status !== '正常') {
      return res.status(403).json(error('账号已被禁用'));
    }

    // 如果是认证登录，检查密码
    if (password) {
      // 检查用户是否有密码
      if (!user.password) {
        return res.status(401).json(error('该账号尚未设置密码，请联系管理员或通过激活流程设置'));
      }
      // 使用 bcrypt.compare 验证密码
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json(error('密码错误'));
      }
    } else if (name) {
      // 游客登录，检查姓名
      if (user.name !== name) {
        return res.status(401).json(error('姓名不匹配'));
      }
    } else {
      return res.status(400).json(badRequest('请提供密码或姓名'));
    }

    // 生成JWT token
    const token = generateToken(user);

    // 返回用户信息（不包含密码）
    const userInfo = {
      id: user.id,
      studentId: user.studentId,
      name: user.name,
      nickname: user.nickname,
      role: user.role,
      avatar: user.avatar,
      contact: user.contact,
      isActive: user.status === '正常',
      createdAt: user.createdAt.toISOString()
    };

    return res.json(success('登录成功', {
      token,
      user: userInfo
    }));
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json(error('登录失败'));
  }
});

// 账号激活
router.post('/activate', async (req, res) => {
  try {
    const { studentId, name, activationCode, password, nickname } = req.body;

    if (!studentId || !name || !activationCode || !password || !nickname) {
      return res.status(400).json(badRequest('所有字段都不能为空'));
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { studentId },
      select: {
        id: true,
        studentId: true,
        name: true,
        nickname: true,
        role: true,
        avatar: true,
        contact: true,
        password: true,
        status: true,
        activationCode: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json(error('学号不存在，请检查学号是否正确'));
    }

    // 验证姓名
    if (user.name !== name) {
      return res.status(404).json(error('姓名不匹配，请检查姓名是否正确'));
    }

    // 检查账号是否已激活
    if (user.password && user.role !== '未认证用户') {
      return res.status(409).json(error('该账号已激活，请直接使用认证登录'));
    }

    // 验证激活码
    if (!user.activationCode || user.activationCode !== activationCode) {
      return res.status(400).json(error('激活码无效或已过期，请检查激活码是否正确'));
    }

    // 哈希密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 更新用户信息（激活账号）
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword, // 存入哈希后的密码
        nickname: nickname,
        role: '认证用户',
        activationCode: null // 清除激活码
      },
      select: {
        id: true,
        studentId: true,
        name: true,
        nickname: true,
        role: true,
        avatar: true,
        contact: true,
        status: true,
        createdAt: true
      }
    });

    // 生成JWT token
    const token = generateToken(updatedUser);

    // 返回用户信息
    const userInfo = {
      id: updatedUser.id,
      studentId: updatedUser.studentId,
      name: updatedUser.name,
      nickname: updatedUser.nickname,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      contact: updatedUser.contact,
      isActive: updatedUser.status === '正常',
      createdAt: updatedUser.createdAt.toISOString()
    };

    return res.json(success('账号激活成功', {
      token,
      user: userInfo
    }));
  } catch (err) {
    console.error('Activation error:', err);
    return res.status(500).json(error('激活失败'));
  }
});

// 请求密码重置
router.post('/forgot-password', async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json(badRequest('学号不能为空'));
    }

    // TODO: 实现密码重置逻辑
    return res.json(success('密码重置码已发送'));
  } catch (err) {
    return res.status(500).json(error('请求失败'));
  }
});

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { studentId, resetCode, newPassword } = req.body;

    if (!studentId || !resetCode || !newPassword) {
      return res.status(400).json(badRequest('所有字段都不能为空'));
    }

    // TODO: 实现密码重置逻辑
    return res.json(success('密码重置成功'));
  } catch (err) {
    return res.status(500).json(error('重置失败'));
  }
});

export default router; 