import { Router } from 'express';
import jwt from 'jsonwebtoken';
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

// 更新当前用户信息
router.post('/me/update', authenticateToken, async (req, res) => {
  try {
    const { nickname, contact, avatar } = req.body;
    const userId = req.user!.id;

    // 验证输入
    if (nickname && nickname.length > 20) {
      return res.status(400).json(error('昵称长度不能超过20个字符'));
    }

    if (contact && contact.length > 50) {
      return res.status(400).json(error('联系方式长度不能超过50个字符'));
    }

    // 构建更新数据
    const updateData: any = {};
    if (nickname !== undefined) updateData.nickname = nickname.trim();
    if (contact !== undefined) updateData.contact = contact.trim();
    if (avatar !== undefined) {
      // 支持头像URL或空字符串（删除头像）
      updateData.avatar = avatar || null;
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    // 处理返回数据
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

    return res.json(success('个人信息更新成功', userInfo));
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return res.status(500).json(error('更新失败'));
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
          seller: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          },
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
    const { 
      page = 1, 
      limit = 20, 
      categoryId, 
      status, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;

    const userId = req.user!.id;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建商品查询条件
    const productWhere: any = {
      deleted: false,
    };

    if (categoryId) {
      productWhere.categoryId = categoryId;
    }

    if (status) {
      productWhere.status = status;
    }

    // 构建排序条件
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.product = { price: order === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'favoriteAt') {
      orderBy.createdAt = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.product = { createdAt: order === 'asc' ? 'asc' : 'desc' };
    }

    // 查询用户收藏的商品
    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: {
          userId,
          product: productWhere
        },
        skip,
        take: limitNum,
        orderBy,
        include: {
          product: {
            include: {
              category: true,
              seller: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true
                }
              },
              _count: {
                select: {
                  favorites: true,
                  comments: true
                }
              }
            }
          }
        }
      }),
      prisma.favorite.count({
        where: {
          userId,
          product: productWhere
        }
      })
    ]);

    // 处理返回数据
    const processedFavorites = favorites.map(favorite => ({
      ...favorite.product,
      images: favorite.product.images ? JSON.parse(favorite.product.images) : [],
      isFavorite: true, // 收藏列表中的商品肯定是已收藏的
      favoriteAt: favorite.createdAt // 收藏时间
    }));

    return res.json(success('获取收藏商品成功', {
      items: processedFavorites,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }));
  } catch (err) {
    console.error('获取收藏商品失败:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 获取用户公开信息
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id, deleted: false },
      select: {
        id: true,
        studentId: true,
        name: true,
        nickname: true,
        role: true,
        avatar: true,
        contact: true, // 包含联系方式
        status: true,
        createdAt: true
      }
    });

    if (!user || user.status !== '正常') {
      return res.status(404).json(error('用户不存在或已被禁用'));
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
      createdAt: user.createdAt.toISOString()
    };

    return res.json(success('获取用户信息成功', userInfo));
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 获取指定用户的商品（公开访问）
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
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
      sellerId: id,
      deleted: false,
    };

    // 权限控制：只有用户自己或管理员可以看到所有状态的商品，其他人只能看在售商品
    const token = req.headers.authorization?.replace('Bearer ', '');
    let currentUserId = null;
    let currentUserRole = null;
    
    if (token) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
        currentUserId = decoded.id;
        currentUserRole = decoded.role;
      } catch (err) {
        // Token无效，按访客处理
      }
    }
    
    // 如果不是商品主人且不是管理员，只显示在售商品
    const isOwner = currentUserId === id;
    const isAdmin = currentUserRole === '管理员' || currentUserRole === '超级管理员';
    
    if (!isOwner && !isAdmin) {
      where.status = '在售'; // 访客只能看在售商品
    } else if (status) {
      where.status = status; // 主人和管理员可以按状态筛选
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
          seller: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          },
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
    }));

    return res.json(success('获取用户商品成功', {
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

// 获取指定用户的评价（基于商品评论）
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 查询用户发布的商品的评论（作为被评价者）
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          deleted: false,
          product: {
            sellerId: id,
            deleted: false
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          },
          product: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.comment.count({
        where: {
          deleted: false,
          product: {
            sellerId: id,
            deleted: false
          }
        }
      })
    ]);

    // 处理评价数据
    const processedReviews = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      rating: 5, // 暂时固定为5星，未来可以添加评分字段
      reviewer: comment.user,
      product: comment.product,
      createdAt: comment.createdAt.toISOString()
    }));

    // 计算平均评分
    const averageRating = processedReviews.length > 0 ? 4.8 : 0; // 暂时固定，未来基于真实评分计算

    return res.json(success('获取用户评价成功', {
      items: processedReviews,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      averageRating,
      ratingStats: {
        excellent: Math.floor(total * 0.7),
        good: Math.floor(total * 0.2),
        fair: Math.floor(total * 0.08),
        poor: Math.floor(total * 0.02)
      }
    }));
  } catch (err) {
    console.error('获取用户评价失败:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 获取指定用户的交易记录
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件 - 查询已售出的商品作为交易记录
    const where: any = {
      sellerId: id,
      deleted: false,
      status: '已售出'
    };

    // 查询用户的交易记录（已售出商品）
    const [transactions, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { soldAt: 'desc' },
        select: {
          id: true,
          name: true,
          price: true,
          soldAt: true,
          createdAt: true,
          category: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // 处理交易数据
    const processedTransactions = transactions.map(product => ({
      id: product.id,
      type: 'sell', // 目前只支持卖出记录
      amount: parseFloat(product.price.toString()),
      product: {
        id: product.id,
        name: product.name
      },
      category: product.category.name,
      createdAt: (product.soldAt || product.createdAt).toISOString()
    }));

    // 计算统计信息
    const totalAmount = processedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlyStats = await prisma.product.groupBy({
      by: ['soldAt'],
      where: {
        sellerId: id,
        deleted: false,
        status: '已售出',
        soldAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: {
        price: true
      },
      _count: {
        id: true
      }
    });

    return res.json(success('获取交易记录成功', {
      items: processedTransactions,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      stats: {
        totalTransactions: total,
        totalAmount: totalAmount,
        monthlyTransactions: monthlyStats.length,
        monthlyAmount: monthlyStats.reduce((sum, stat) => sum + parseFloat(stat._sum.price?.toString() || '0'), 0)
      }
    }));
  } catch (err) {
    console.error('获取交易记录失败:', err);
    return res.status(500).json(error('获取失败'));
  }
});

export default router; 