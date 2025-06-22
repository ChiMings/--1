import { Router } from 'express';
import { success, error, notFound, badRequest } from '../utils/response';
import { prisma } from '../utils/database';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { sendTradeNotification, sendCommentNotification, NotificationType } from '../utils/notificationService';

const router = Router();

// 获取商品列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      categoryId, 
      keyword, 
      status,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {
      deleted: false,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { description: { contains: keyword as string } }
      ];
    }

    // 如果指定了status参数则使用，否则默认只显示在售商品
    if (status) {
      where.status = status;
    } else {
      // 对于普通用户（首页），只显示在售商品
      where.status = '在售';
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
          favorites: req.user ? {
            where: {
              userId: req.user.id
            }
          } : false,
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

    // 处理图片数据和收藏状态
    const processedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      isFavorite: req.user ? product.favorites.length > 0 : false,
      favorites: undefined // 移除 favorites 字段，避免暴露给前端
    }));

    return res.json(success('获取商品列表成功', {
      items: processedProducts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }));
  } catch (err) {
    console.error('获取商品列表失败:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 获取商品详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 查询商品并增加浏览量
    const product = await prisma.product.findUnique({
      where: { 
        id, 
        deleted: false,
        // 排除已下架的商品，但允许访问已售出的商品
        NOT: {
          status: '已下架'
        }
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            nickname: true,
            name: true,
            studentId: true,
            avatar: true,
            createdAt: true
          }
        },
        favorites: req.user ? {
          where: {
            userId: req.user.id
          }
        } : false,
        _count: {
          select: {
            favorites: true,
            comments: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json(notFound('商品不存在'));
    }

    // 增加浏览量
    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    // 处理图片数据和收藏状态
    const processedProduct = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      isFavorite: req.user ? product.favorites.length > 0 : false,
      favorites: undefined // 移除 favorites 字段，避免暴露给前端
    };

    return res.json(success('获取商品详情成功', processedProduct));
  } catch (err) {
    console.error('获取商品详情失败:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 发布商品
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, categoryId, contact, images } = req.body;

    console.log('接收到的数据:', { name, description, price, categoryId, contact, images: images?.length }); // 调试日志

    // 验证必填字段
    if (!name || name.trim() === '') {
      return res.status(400).json(badRequest('商品名称不能为空'));
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json(badRequest('商品价格必须大于0'));
    }

    if (!categoryId) {
      return res.status(400).json(badRequest('商品分类不能为空'));
    }

    // 从JWT获取当前用户ID
    const sellerId = req.user!.id;

    // 验证分类是否存在（确保categoryId是正确的类型）
    const categoryIdString = String(categoryId);
    const category = await prisma.category.findUnique({
      where: { id: categoryIdString, deleted: false }
    });

    if (!category) {
      return res.status(400).json(badRequest('指定的分类不存在'));
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : '',
        price: parseFloat(price),
        categoryId: categoryIdString,
        sellerId,
        contact: contact ? contact.trim() : '',
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        status: '在售'
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    // 处理返回数据
    const processedProduct = {
      ...newProduct,
      images: newProduct.images ? JSON.parse(newProduct.images) : [],
      isFavorite: false
    };

    return res.status(201).json(success('商品发布成功', processedProduct));
  } catch (err: any) {
    console.error('发布商品失败:', err);
    if (err.code === 'P2002') {
      return res.status(400).json(badRequest('商品信息重复'));
    }
    return res.status(500).json(error('发布失败'));
  }
});

// 更新商品信息
router.post('/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, contact, images } = req.body;

    // 验证商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id, deleted: false }
    });

    if (!existingProduct) {
      return res.status(404).json(notFound('商品不存在'));
    }

    // TODO: 验证用户权限（只能更新自己的商品）

    // 构建更新数据
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (contact !== undefined) updateData.contact = contact;
    if (images !== undefined) updateData.images = JSON.stringify(images);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    // 处理返回数据
    const processedProduct = {
      ...updatedProduct,
      images: updatedProduct.images ? JSON.parse(updatedProduct.images) : [],
      isFavorite: false
    };

    return res.json(success('商品更新成功', processedProduct));
  } catch (err) {
    console.error('更新商品失败:', err);
    return res.status(500).json(error('更新失败'));
  }
});

// 更新商品状态
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json(badRequest('状态不能为空'));
    }

    // 获取商品信息
    const product = await prisma.product.findUnique({
      where: { id, deleted: false },
      include: {
        seller: {
          select: { id: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json(notFound('商品不存在'));
    }

    const updateData: any = { status };
    if (status === '已售出') {
      updateData.soldAt = new Date();
    }

    const updatedProduct = await prisma.product.update({
      where: { id, deleted: false },
      data: updateData
    });

    return res.json(success('商品状态更新成功', {
      id: updatedProduct.id,
      status: updatedProduct.status,
      soldAt: updatedProduct.soldAt
    }));
  } catch (err) {
    console.error('更新商品状态失败:', err);
    return res.status(500).json(error('更新失败'));
  }
});

// 删除商品
router.post('/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: 验证用户权限（只能删除自己的商品）

    await prisma.product.update({
      where: { id, deleted: false },
      data: { deleted: true }
    });

    return res.json(success('商品删除成功'));
  } catch (err) {
    console.error('删除商品失败:', err);
    return res.status(500).json(error('删除失败'));
  }
});

// 收藏商品
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // 检查是否已收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: id
        }
      }
    });

    if (existingFavorite) {
      return res.status(400).json(badRequest('已收藏该商品'));
    }

    await prisma.favorite.create({
      data: {
        userId,
        productId: id
      }
    });

    return res.json(success('收藏成功'));
  } catch (err) {
    console.error('收藏失败:', err);
    return res.status(500).json(error('收藏失败'));
  }
});

// 取消收藏
router.post('/:id/unfavorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await prisma.favorite.deleteMany({
      where: {
        userId,
        productId: id
      }
    });

    return res.json(success('取消收藏成功'));
  } catch (err) {
    console.error('操作失败:', err);
    return res.status(500).json(error('操作失败'));
  }
});

// 获取商品评论
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { 
          productId: id,
          deleted: false 
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
          }
        }
      }),
      prisma.comment.count({
        where: { 
          productId: id,
          deleted: false 
        }
      })
    ]);

    const processedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      author: comment.user,
      createdAt: comment.createdAt
    }));

    return res.json(success('获取评论成功', {
      items: processedComments,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }));
  } catch (err) {
    console.error('获取评论失败:', err);
    return res.status(500).json(error('获取评论失败'));
  }
});

// 添加评论
router.post('/:id/comments/create', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json(badRequest('评论内容不能为空'));
    }

    // 验证商品是否存在且可评论
    const product = await prisma.product.findUnique({
      where: { 
        id, 
        deleted: false,
        NOT: { status: '已下架' }
      }
    });

    if (!product) {
      return res.status(404).json(notFound('商品不存在或不可评论'));
    }

    const userId = req.user!.id;

    const newComment = await prisma.comment.create({
      data: {
        productId: id,
        userId,
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    const processedComment = {
      id: newComment.id,
      content: newComment.content,
      author: newComment.user,
      createdAt: newComment.createdAt
    };

    // 发送通知给卖家（不给自己发通知）
    if (product.sellerId !== userId) {
      await sendCommentNotification(
        product.sellerId,
        product.name,
        newComment.user.nickname || '匿名用户',
        content.trim()
      );
    }

    return res.status(201).json(success('评论发表成功', processedComment));
  } catch (err) {
    console.error('添加评论失败:', err);
    return res.status(500).json(error('评论失败'));
  }
});

// 删除评论
router.post('/:productId/comments/:commentId/delete', authenticateToken, async (req, res) => {
  try {
    const { productId, commentId } = req.params;
    const userId = req.user!.id;

    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        product: {
          select: { id: true, sellerId: true }
        }
      }
    });

    if (!comment || comment.deleted) {
      return res.status(404).json(notFound('评论不存在'));
    }

    if (comment.productId !== productId) {
      return res.status(400).json(badRequest('评论与商品不匹配'));
    }

    // 权限检查：评论作者、商品发布者、管理员可以删除评论
    const userRole = req.user!.role;
    const isCommentAuthor = comment.userId === userId;
    const isProductOwner = comment.product.sellerId === userId;
    const isAdmin = userRole === '管理员' || userRole === '超级管理员';

    if (!isCommentAuthor && !isProductOwner && !isAdmin) {
      return res.status(403).json(error('无权限删除此评论'));
    }

    // 软删除评论
    await prisma.comment.update({
      where: { id: commentId },
      data: { deleted: true }
    });

    return res.json(success('评论删除成功'));
  } catch (err) {
    console.error('删除评论失败:', err);
    return res.status(500).json(error('删除失败'));
  }
});

export default router; 