import { Router } from 'express';
import { success, error, notFound } from '../utils/response';

const router = Router();

// 获取用户资料
router.get('/profile', async (req, res) => {
  try {
    // TODO: 从JWT中获取用户ID
    const mockUser = {
      id: '1',
      studentId: '20240001',
      name: '张三',
      nickname: '小张',
      contact: '13888888888',
      role: '认证用户',
      avatar: null,
      createdAt: new Date().toISOString()
    };

    return res.json(success('获取用户资料成功', mockUser));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 更新用户资料
router.put('/profile', async (req, res) => {
  try {
    const { nickname, contact, avatar } = req.body;

    // TODO: 实现更新逻辑
    const updatedUser = {
      id: '1',
      studentId: '20240001',
      name: '张三',
      nickname: nickname || '小张',
      contact: contact || '13888888888',
      role: '认证用户',
      avatar: avatar || null,
      updatedAt: new Date().toISOString()
    };

    return res.json(success('更新成功', updatedUser));
  } catch (err) {
    return res.status(500).json(error('更新失败'));
  }
});

// 获取用户公开信息
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: 根据ID查询用户
    const mockUser = {
      id,
      studentId: '20240001',
      name: '张三',
      nickname: '小张',
      role: '认证用户',
      avatar: null,
      createdAt: new Date().toISOString()
    };

    return res.json(success('获取用户信息成功', mockUser));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 获取用户商品
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // TODO: 查询用户商品
    const mockProducts = [
      {
        id: '1',
        name: '二手笔记本电脑',
        price: 2500.00,
        status: '在售',
        images: ['image1.jpg'],
        createdAt: new Date().toISOString()
      }
    ];

    return res.json(success('获取用户商品成功', {
      products: mockProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 1,
        totalPages: 1
      }
    }));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

export default router; 