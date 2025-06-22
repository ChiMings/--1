import { Router } from 'express';
import { success, error, notFound, badRequest } from '../utils/response';
import { prisma } from '../utils/database';

const router = Router();

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { 
        deleted: false
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // 只使用Prisma schema中存在的字段
    const processedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description || '',
      icon: '📁', // 固定图标
      isActive: true,
      isDefault: false,
      sortOrder: 0,
      productCount: 0
    }));

    return res.json(success('获取分类成功', processedCategories));
  } catch (err) {
    console.error('获取分类失败:', err);
    return res.status(500).json(error('获取分类失败'));
  }
});

// 创建分类（管理员功能）
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, isActive, sortOrder } = req.body;

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
        description: description ? description.trim() : null,
        icon: icon || '📁',
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0
      }
    });

    const formattedCategory = {
      id: newCategory.id,
      name: newCategory.name,
      description: newCategory.description,
      icon: newCategory.icon,
      isActive: newCategory.isActive,
      isDefault: newCategory.isDefault,
      sortOrder: newCategory.sortOrder,
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

    const category = await prisma.category.findUnique({
      where: { 
        id,
        deleted: false 
      }
    });

    if (!category) {
      return res.status(404).json(notFound('分类不存在'));
    }

    const processedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      icon: '📁',
      isActive: true,
      isDefault: false,
      sortOrder: 0,
      productCount: 0,
      createdAt: category.createdAt
    };

    return res.json(success('获取分类详情成功', processedCategory));
  } catch (err) {
    console.error('获取分类详情失败:', err);
    return res.status(500).json(error('获取分类详情失败'));
  }
});

// 更新分类（管理员功能）
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive, sortOrder } = req.body;

    // TODO: 验证管理员权限
    
    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category || category.deleted) {
      return res.status(404).json(error('分类不存在'));
    }

    // 如果修改名称，检查是否重复
    if (name && name.trim() !== category.name) {
      const existingCategory = await prisma.category.findFirst({
        where: { 
          name: name.trim(),
          deleted: false,
          id: { not: id }
        }
      });

      if (existingCategory) {
        return res.status(409).json(badRequest('分类名称已存在'));
      }
    }

    // 更新分类
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name ? name.trim() : category.name,
        description: description !== undefined ? (description ? description.trim() : null) : category.description,
        icon: icon || category.icon,
        isActive: isActive !== undefined ? isActive : category.isActive,
        sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder
      },
      include: {
        _count: {
          select: { products: { where: { deleted: false } } }
        }
      }
    });

    const formattedCategory = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      icon: updatedCategory.icon,
      isActive: updatedCategory.isActive,
      isDefault: updatedCategory.isDefault,
      sortOrder: updatedCategory.sortOrder,
      productCount: updatedCategory._count.products,
      createdAt: updatedCategory.createdAt.toISOString(),
      updatedAt: updatedCategory.updatedAt.toISOString()
    };

    return res.json(success('分类更新成功', formattedCategory));
  } catch (err) {
    console.error('Update category error:', err);
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

    // 不能删除默认分类
    if (category.isDefault) {
      return res.status(400).json(badRequest('默认分类不能删除'));
    }

    // 如果分类下有商品，需要将商品移动到默认分类
    if (category._count.products > 0) {
      // 查找或创建默认分类
      let defaultCategory = await prisma.category.findFirst({
        where: { 
          isDefault: true,
          deleted: false 
        }
      });

      // 如果没有默认分类，创建一个
      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            name: '其他',
            description: '未分类商品',
            icon: '📦',
            isActive: true,
            isDefault: true,
            sortOrder: 0
          }
        });
      }

      // 将该分类下的所有商品移动到默认分类
      await prisma.product.updateMany({
        where: { 
          categoryId: id,
          deleted: false 
        },
        data: { 
          categoryId: defaultCategory.id 
        }
      });
    }

    // 软删除分类
    await prisma.category.update({
      where: { id },
      data: { deleted: true }
    });

    return res.json(success('分类删除成功，该分类下的商品已移动到默认分类'));
  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json(error('删除失败'));
  }
});

// 获取分类下的商品
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 20,
      keyword,
      status,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 验证分类是否存在
    const category = await prisma.category.findUnique({
      where: { id, deleted: false }
    });

    if (!category) {
      return res.status(404).json(notFound('分类不存在'));
    }

    // 构建查询条件
    const where: any = {
      categoryId: id,
      deleted: false,
    };

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
      // 对于普通用户，只显示在售商品
      where.status = '在售';
    }

    // 构建排序条件
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.price = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = order === 'asc' ? 'asc' : 'desc';
    }

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
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    const processedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      isFavorite: false
    }));

    return res.json(success('获取分类商品成功', {
      items: processedProducts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      category: {
        id: category.id,
        name: category.name,
        description: category.description
      }
    }));
  } catch (err) {
    console.error('获取分类商品失败:', err);
    return res.status(500).json(error('获取分类商品失败'));
  }
});

export default router; 