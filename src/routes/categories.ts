import { Router } from 'express';
import { success, error, badRequest } from '../utils/response';
import { prisma } from '../utils/database';

const router = Router();

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    // 从数据库查询分类，包含商品数量
    const categories = await prisma.category.findMany({
      where: { deleted: false },
      include: {
        _count: {
          select: { products: { where: { deleted: false } } }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // 格式化返回数据
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      productCount: category._count.products,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    }));

    return res.json(success('获取分类列表成功', formattedCategories));
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 创建分类（管理员功能）
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json(badRequest('分类名称不能为空'));
    }

    // TODO: 验证管理员权限
    
    // 检查分类名称是否已存在
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: name.trim(),
        deleted: false 
      }
    });

    if (existingCategory) {
      return res.status(409).json(badRequest('分类名称已存在'));
    }

    // 创建新分类
    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null
      }
    });

    const formattedCategory = {
      id: newCategory.id,
      name: newCategory.name,
      description: newCategory.description,
      productCount: 0,
      createdAt: newCategory.createdAt.toISOString(),
      updatedAt: newCategory.updatedAt.toISOString()
    };

    return res.status(201).json(success('分类创建成功', formattedCategory));
  } catch (err) {
    console.error('Create category error:', err);
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
    
    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: { where: { deleted: false } } }
        }
      }
    });

    if (!category || category.deleted) {
      return res.status(404).json(error('分类不存在'));
    }

    // 检查分类下是否有商品
    if (category._count.products > 0) {
      return res.status(400).json(badRequest('该分类下还有商品，无法删除'));
    }

    // 软删除分类
    await prisma.category.update({
      where: { id },
      data: { deleted: true }
    });

    return res.json(success('分类删除成功'));
  } catch (err) {
    console.error('Delete category error:', err);
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