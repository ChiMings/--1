import { Router } from 'express';
import { success, error, notFound } from '../utils/response';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../utils/database';

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

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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

    if (!user) {
      return res.status(404).json(notFound('用户不存在'));
    }

    // 处理返回数据
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

    return res.json(success('获取用户信息成功', userInfo));
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 获取当前用户的商品
router.get('/me/products', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {
      sellerId: req.user!.id,
      deleted: false,
    };

    if (status) {
      where.status = status;
    }

    // 构建排序条件
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.price = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = order === 'asc' ? 'asc' : 'desc';
    }

    // 查询商品
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          category: true,
          _count: {
            select: {
              favorites: true,
              comments: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // 处理图片数据
    const processedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      seller: {
        id: req.user!.id,
        nickname: req.user!.studentId, // 临时使用studentId作为nickname
      }
    }));

    return res.json(success('获取商品列表成功', {
      items: processedProducts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }));
  } catch (err) {
    console.error('获取用户商品失败:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 获取我收藏的商品
router.get('/me/favorites', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // TODO: 从JWT获取当前用户ID
    const currentUserId = 'current-user-id';

    // TODO: 查询用户收藏的商品
    const mockFavorites = [
      {
        id: '1',
        name: '九成新MacBook Pro',
        description: '9成新，配置高，适合学习工作',
        price: 8500.00,
        categoryId: 'cat1',
        category: {
          id: 'cat1',
          name: '电子产品'
        },
        sellerId: 'user1',
        seller: {
          id: 'user1',
          nickname: '小李',
          avatar: null
        },
        status: '在售',
        images: ['macbook1.jpg', 'macbook2.jpg'],
        viewCount: 125,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1天前
        favoriteAt: new Date(Date.now() - 43200000).toISOString() // 12小时前收藏
      },
      {
        id: '2',
        name: '大学教材《高等数学》',
        description: '同济版第七版，无笔记，九成新',
        price: 25.00,
        categoryId: 'cat2',
        category: {
          id: 'cat2',
          name: '教材书籍'
        },
        sellerId: 'user2',
        seller: {
          id: 'user2',
          nickname: '小王',
          avatar: null
        },
        status: '在售',
        images: ['book1.jpg'],
        viewCount: 45,
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2天前
        favoriteAt: new Date(Date.now() - 21600000).toISOString() // 6小时前收藏
      }
    ];

    return res.json(success('获取收藏商品成功', {
      items: mockFavorites,
      total: mockFavorites.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(mockFavorites.length / Number(limit))
    }));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

export default router; 