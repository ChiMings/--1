import { Router } from 'express';
import { success, error, badRequest } from '../utils/response';

const router = Router();

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { studentId, password, name } = req.body;

    if (!studentId) {
      return res.status(400).json(badRequest('学号不能为空'));
    }

    // TODO: 实现登录逻辑
    // 这里先返回模拟数据
    const mockUser = {
      id: '1',
      studentId,
      name: name || '测试用户',
      role: '认证用户',
      token: 'mock-jwt-token'
    };

    return res.json(success('登录成功', mockUser));
  } catch (err) {
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

    // TODO: 实现激活逻辑
    const mockUser = {
      id: '1',
      studentId,
      name,
      nickname,
      role: '认证用户',
      token: 'mock-jwt-token'
    };

    return res.json(success('账号激活成功', mockUser));
  } catch (err) {
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