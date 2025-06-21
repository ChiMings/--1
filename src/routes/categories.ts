import { Router } from 'express';
import { success, error, badRequest } from '../utils/response';

const router = Router();

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    // TODO: 从数据库查询分类
    const mockCategories = [
      {
        id: 'cat1',
        name: '电子产品',
        description: '手机、电脑、平板等电子设备',
        icon: 'electronics',
        productCount: 156,
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat2',
        name: '教材书籍',
        description: '各类教材、参考书、小说等',
        icon: 'books',
        productCount: 89,
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat3',
        name: '生活用品',
        description: '日用品、化妆品、服装等',
        icon: 'lifestyle',
        productCount: 234,
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat4',
        name: '体育用品',
        description: '运动器材、健身用品等',
        icon: 'sports',
        productCount: 67,
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat5',
        name: '其他',
        description: '其他未分类商品',
        icon: 'other',
        productCount: 45,
        createdAt: new Date().toISOString()
      }
    ];

    return res.json(success('获取分类列表成功', mockCategories));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 创建分类（管理员功能）
router.post('/', async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name) {
      return res.status(400).json(badRequest('分类名称不能为空'));
    }

    // TODO: 验证管理员权限
    // TODO: 实现分类创建逻辑

    const newCategory = {
      id: 'new-category-id',
      name,
      description: description || '',
      icon: icon || 'default',
      productCount: 0,
      createdAt: new Date().toISOString()
    };

    return res.status(201).json(success('分类创建成功', newCategory));
  } catch (err) {
    return res.status(500).json(error('创建失败'));
  }
});

// 获取分类详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: 根据ID查询分类
    const mockCategory = {
      id,
      name: '电子产品',
      description: '手机、电脑、平板等电子设备',
      icon: 'electronics',
      productCount: 156,
      createdAt: new Date().toISOString()
    };

    return res.json(success('获取分类详情成功', mockCategory));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 更新分类（管理员功能）
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    // TODO: 验证管理员权限
    // TODO: 实现分类更新逻辑

    const updatedCategory = {
      id,
      name: name || '电子产品',
      description: description || '手机、电脑、平板等电子设备',
      icon: icon || 'electronics',
      productCount: 156,
      updatedAt: new Date().toISOString()
    };

    return res.json(success('分类更新成功', updatedCategory));
  } catch (err) {
    return res.status(500).json(error('更新失败'));
  }
});

// 删除分类（管理员功能）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: 验证管理员权限
    // TODO: 检查分类下是否有商品
    // TODO: 实现分类删除逻辑

    return res.json(success('分类删除成功'));
  } catch (err) {
    return res.status(500).json(error('删除失败'));
  }
});

// 获取分类下的商品
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // TODO: 查询分类下的商品
    const mockProducts = [
      {
        id: '1',
        name: '二手MacBook Pro',
        description: '9成新，配置高，适合学习工作',
        price: 8500.00,
        categoryId: id,
        sellerId: 'user1',
        contact: '13888888888',
        status: '在售',
        images: ['macbook1.jpg', 'macbook2.jpg'],
        viewCount: 125,
        createdAt: new Date().toISOString(),
        seller: { id: 'user1', name: '李四', nickname: '小李' }
      }
    ];

    return res.json(success('获取分类商品成功', {
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