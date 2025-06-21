import { Router } from 'express';
import { success, error, notFound, badRequest } from '../utils/response';

const router = Router();

// 获取商品列表
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoryId, 
      search, 
      minPrice, 
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // TODO: 实现商品查询逻辑
    const mockProducts = [
      {
        id: '1',
        name: '二手MacBook Pro',
        description: '9成新，配置高，适合学习工作',
        price: 8500.00,
        categoryId: 'cat1',
        sellerId: 'user1',
        contact: '13888888888',
        status: '在售',
        images: ['macbook1.jpg', 'macbook2.jpg'],
        viewCount: 125,
        createdAt: new Date().toISOString(),
        category: { id: 'cat1', name: '电子产品' },
        seller: { id: 'user1', name: '李四', nickname: '小李' }
      },
      {
        id: '2',
        name: '大学教材《高等数学》',
        description: '同济版第七版，无笔记，九成新',
        price: 25.00,
        categoryId: 'cat2',
        sellerId: 'user2',
        contact: '13999999999',
        status: '在售',
        images: ['book1.jpg'],
        viewCount: 45,
        createdAt: new Date().toISOString(),
        category: { id: 'cat2', name: '教材书籍' },
        seller: { id: 'user2', name: '王五', nickname: '小王' }
      }
    ];

    return res.json(success('获取商品列表成功', {
      products: mockProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 2,
        totalPages: 1
      }
    }));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 发布商品
router.post('/', async (req, res) => {
  try {
    const { name, description, price, categoryId, contact, images } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json(badRequest('商品名称、价格和分类不能为空'));
    }

    // TODO: 实现商品创建逻辑
    const newProduct = {
      id: 'new-product-id',
      name,
      description: description || '',
      price: Number(price),
      categoryId,
      sellerId: 'current-user-id', // TODO: 从JWT获取
      contact: contact || '',
      status: '在售',
      images: images || [],
      viewCount: 0,
      createdAt: new Date().toISOString()
    };

    return res.status(201).json(success('商品发布成功', newProduct));
  } catch (err) {
    return res.status(500).json(error('发布失败'));
  }
});

// 获取商品详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: 根据ID查询商品并增加浏览量
    const mockProduct = {
      id,
      name: '二手MacBook Pro',
      description: '9成新，配置高，适合学习工作。包含原装充电器，无维修记录。',
      price: 8500.00,
      categoryId: 'cat1',
      sellerId: 'user1',
      contact: '13888888888',
      status: '在售',
      images: ['macbook1.jpg', 'macbook2.jpg', 'macbook3.jpg'],
      viewCount: 126, // 浏览量+1
      createdAt: new Date().toISOString(),
      category: { id: 'cat1', name: '电子产品', description: '手机、电脑等电子设备' },
      seller: { 
        id: 'user1', 
        name: '李四', 
        nickname: '小李',
        studentId: '20240002',
        avatar: null,
        createdAt: new Date().toISOString()
      }
    };

    return res.json(success('获取商品详情成功', mockProduct));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 更新商品
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, contact, status, images } = req.body;

    // TODO: 验证用户权限（只能更新自己的商品）
    // TODO: 实现商品更新逻辑

    const updatedProduct = {
      id,
      name: name || '二手MacBook Pro',
      description: description || '9成新，配置高，适合学习工作',
      price: price ? Number(price) : 8500.00,
      categoryId: categoryId || 'cat1',
      contact: contact || '13888888888',
      status: status || '在售',
      images: images || ['macbook1.jpg'],
      updatedAt: new Date().toISOString()
    };

    return res.json(success('商品更新成功', updatedProduct));
  } catch (err) {
    return res.status(500).json(error('更新失败'));
  }
});

// 删除商品
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: 验证用户权限（只能删除自己的商品）
    // TODO: 实现软删除逻辑

    return res.json(success('商品删除成功'));
  } catch (err) {
    return res.status(500).json(error('删除失败'));
  }
});

// 收藏商品
router.post('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: 实现收藏逻辑
    return res.json(success('收藏成功'));
  } catch (err) {
    return res.status(500).json(error('收藏失败'));
  }
});

// 取消收藏
router.delete('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: 实现取消收藏逻辑
    return res.json(success('取消收藏成功'));
  } catch (err) {
    return res.status(500).json(error('操作失败'));
  }
});

// 添加评论
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json(badRequest('评论内容不能为空'));
    }

    // TODO: 实现评论创建逻辑
    const newComment = {
      id: 'new-comment-id',
      productId: id,
      userId: 'current-user-id',
      content,
      createdAt: new Date().toISOString(),
      user: {
        id: 'current-user-id',
        name: '张三',
        nickname: '小张',
        avatar: null
      }
    };

    return res.status(201).json(success('评论添加成功', newComment));
  } catch (err) {
    return res.status(500).json(error('评论失败'));
  }
});

// 获取商品评论
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // TODO: 查询商品评论
    const mockComments = [
      {
        id: '1',
        productId: id,
        userId: 'user1',
        content: '商品看起来不错，还能便宜点吗？',
        createdAt: new Date().toISOString(),
        user: {
          id: 'user1',
          name: '张三',
          nickname: '小张',
          avatar: null
        }
      }
    ];

    return res.json(success('获取评论成功', {
      comments: mockComments,
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

// 删除评论
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;

    // TODO: 验证用户权限（只能删除自己的评论或商品所有者可以删除）
    // TODO: 实现评论删除逻辑

    return res.json(success('评论删除成功'));
  } catch (err) {
    return res.status(500).json(error('删除失败'));
  }
});

export default router; 