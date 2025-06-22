import { Router } from 'express';
import { success, error, badRequest } from '../utils/response';
import { prisma } from '../utils/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { sendReportProcessedNotification, sendTradeNotification, sendRoleChangeNotification, sendAccountStatusNotification, NotificationType } from '../utils/notificationService';

const router = Router();

// 为所有管理员路由添加身份验证
router.use(authenticateToken);

// 获取系统统计信息
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // 获取各种统计数据
    const [userCount, productCount, categoryCount, activeUserCount] = await Promise.all([
      prisma.user.count({ where: { deleted: false } }),
      prisma.product.count({ where: { deleted: false } }),
      prisma.category.count({ where: { deleted: false } }),
      prisma.user.count({ where: { status: '正常', deleted: false } })
    ]);

    // 获取最近7天的用户注册数据
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        deleted: false
      }
    });

    // 获取最近7天的商品发布数据
    const recentProducts = await prisma.product.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        deleted: false
      }
    });

    const stats = {
      totalUsers: userCount,
      totalProducts: productCount,
      totalCategories: categoryCount,
      activeUsers: activeUserCount,
      recentUsers,
      recentProducts,
      systemStatus: 'healthy'
    };

    return res.json(success('获取系统统计成功', stats));
  } catch (err) {
    console.error('Get admin stats error:', err);
    return res.status(500).json(error('获取统计信息失败'));
  }
});

// 获取用户统计信息
router.get('/users/stats', requireAdmin, async (req, res) => {
  try {
    const [total, verified, unverified, admins, superAdmins] = await Promise.all([
      prisma.user.count({ where: { deleted: false } }),
      prisma.user.count({ where: { deleted: false, role: '认证用户' } }),
      prisma.user.count({ where: { deleted: false, role: '未认证用户' } }),
      prisma.user.count({ where: { deleted: false, role: '管理员' } }),
      prisma.user.count({ where: { deleted: false, role: '超级管理员' } })
    ]);

    return res.json(success('获取用户统计成功', {
      total,
      verified,
      unverified,
      admins: admins + superAdmins
    }));
  } catch (err) {
    console.error('Get user stats error:', err);
    return res.status(500).json(error('获取用户统计失败'));
  }
});

// 获取用户管理列表
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;

    // 构建查询条件
    const where: any = { deleted: false };
    
    if (search) {
      where.OR = [
        { studentId: { contains: search as string } },
        { name: { contains: search as string } },
        { nickname: { contains: search as string } }
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
    }

    // 查询用户列表
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
                 select: {
           id: true,
           studentId: true,
           name: true,
           nickname: true,
           role: true,
           status: true,
           createdAt: true,
           updatedAt: true,
           _count: {
             select: { products: { where: { deleted: false } } }
           }
         },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.user.count({ where })
    ]);

         const formattedUsers = users.map(user => ({
       id: user.id,
       studentId: user.studentId,
       name: user.name,
       nickname: user.nickname,
       role: user.role,
       status: user.status,
       isActive: user.status === '正常', // 根据状态计算是否激活
       productCount: user._count.products,
       createdAt: user.createdAt.toISOString(),
       updatedAt: user.updatedAt.toISOString()
     }));

    return res.json(success('获取用户列表成功', {
      users: formattedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (err) {
    console.error('Get admin users error:', err);
    return res.status(500).json(error('获取用户列表失败'));
  }
});

// 更新用户角色
router.post('/users/:userId/role/update', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['未认证用户', '认证用户', '管理员', '超级管理员'].includes(role)) {
      return res.status(400).json(badRequest('无效的用户角色'));
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.deleted) {
      return res.status(404).json(error('用户不存在'));
    }

    // 更新用户角色
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    // 发送角色变更通知
    if (user.role !== role) {
      await sendRoleChangeNotification(userId, role);
    }

    return res.json(success('用户角色更新成功', {
      id: updatedUser.id,
      studentId: updatedUser.studentId,
      name: updatedUser.name,
      role: updatedUser.role
    }));
  } catch (err) {
    console.error('Update user role error:', err);
    return res.status(500).json(error('更新用户角色失败'));
  }
});

// 更新用户状态
router.post('/users/:userId/status/update', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!status || !['正常', '禁用', '冻结'].includes(status)) {
      return res.status(400).json(badRequest('无效的用户状态'));
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.deleted) {
      return res.status(404).json(error('用户不存在'));
    }

    // 更新用户状态
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status }
    });

    // 发送状态变更通知
    if (user.status !== status) {
      await sendAccountStatusNotification(userId, status, reason);
    }

    return res.json(success('用户状态更新成功', {
      id: updatedUser.id,
      studentId: updatedUser.studentId,
      name: updatedUser.name,
      status: updatedUser.status
    }));
  } catch (err) {
    console.error('Update user status error:', err);
    return res.status(500).json(error('更新用户状态失败'));
  }
});

// 获取商品统计信息
router.get('/products/stats', requireAdmin, async (req, res) => {
  try {
    const [total, active, sold, removed] = await Promise.all([
      prisma.product.count({ where: { deleted: false } }),
      prisma.product.count({ where: { deleted: false, status: '在售' } }),
      prisma.product.count({ where: { deleted: false, status: '已售出' } }),
      prisma.product.count({ where: { deleted: false, status: '已下架' } })
    ]);

    return res.json(success('获取商品统计成功', {
      total,
      active,
      sold,
      removed
    }));
  } catch (err) {
    console.error('Get products stats error:', err);
    return res.status(500).json(error('获取统计信息失败'));
  }
});

// 获取商品管理列表
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, categoryId, status } = req.query;

    // 构建查询条件
    const where: any = { deleted: false };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (status) {
      where.status = status;
    }

    // 查询商品列表
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: {
            select: { id: true, studentId: true, name: true, nickname: true }
          },
          category: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.product.count({ where })
    ]);

    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      status: product.status,
      viewCount: product.viewCount,
      images: product.images ? JSON.parse(product.images) : [], // 解析图片JSON数据
      categoryId: product.categoryId, // 添加分类ID
      createdAt: product.createdAt.toISOString(),
      seller: product.seller,
      category: product.category
    }));

    return res.json(success('获取商品列表成功', {
      products: formattedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (err) {
    console.error('Get admin products error:', err);
    return res.status(500).json(error('获取商品列表失败'));
  }
});

// 下架商品
router.post('/products/:productId/remove', requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    // 检查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true
          }
        }
      }
    });

    if (!product || product.deleted) {
      return res.status(404).json(error('商品不存在'));
    }

    // 只下架商品，不软删除
    await prisma.product.update({
      where: { id: productId },
      data: { 
        status: '已下架'
      }
    });

    // 发送通知给商品发布者
    await sendTradeNotification(
      product.sellerId,
      NotificationType.PRODUCT_REMOVED,
      product.name,
      `商品已被管理员下架。${reason ? `原因：${reason}` : ''}`
    );

    return res.json(success('商品下架成功'));
  } catch (err) {
    console.error('Remove product error:', err);
    return res.status(500).json(error('下架商品失败'));
  }
});

// 恢复商品
router.post('/products/:productId/restore', requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;

    // 检查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || product.deleted) {
      return res.status(404).json(error('商品不存在'));
    }

    if (product.status !== '已下架') {
      return res.status(400).json(error('只能恢复已下架的商品'));
    }

    // 恢复商品
    await prisma.product.update({
      where: { id: productId },
      data: { 
        status: '在售'
      }
    });

    // TODO: 发送通知给商品发布者

    return res.json(success('商品恢复成功'));
  } catch (err) {
    console.error('Restore product error:', err);
    return res.status(500).json(error('恢复商品失败'));
  }
});

// 彻底删除商品
router.post('/products/:productId/delete', requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    // 检查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || product.deleted) {
      return res.status(404).json(error('商品不存在'));
    }

    // 软删除商品
    await prisma.product.update({
      where: { id: productId },
      data: { 
        deleted: true,
        status: '已删除'
      }
    });

    // TODO: 发送通知给商品发布者

    return res.json(success('商品删除成功'));
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json(error('删除商品失败'));
  }
});

// 获取举报管理列表
router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    // 状态映射：前端使用英文，后端存储中文
    const statusMap: { [key: string]: string } = {
      'pending': '待处理',
      'approved': '已处理',
      'rejected': '已驳回',
      '待处理': '待处理',
      '已处理': '已处理',
      '已驳回': '已驳回'
    };

    // 构建查询条件
    const whereCondition: any = { deleted: false };
    
    // 只有当明确传递了status参数时才添加状态筛选
    if (status) {
      const actualStatus = statusMap[status as string];
      if (actualStatus) {
        whereCondition.status = actualStatus;
      }
    }

    // 查询举报列表
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereCondition,
        include: {
          reporter: {
            select: { 
              id: true, 
              studentId: true, 
              name: true, 
              nickname: true 
            }
          },
          product: {
            select: { 
              id: true, 
              name: true, 
              images: true,
              price: true,
              status: true,
              sellerId: true,
              seller: {
                select: {
                  id: true,
                  nickname: true,
                  studentId: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.report.count({ 
        where: whereCondition
      })
    ]);

    const formattedReports = reports.map(report => ({
      id: report.id,
      reason: report.reason,
      content: report.content,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      reporter: {
        id: report.reporter.id,
        nickname: report.reporter.nickname,
        studentId: report.reporter.studentId
      },
      product: report.product ? {
        id: report.product.id,
        name: report.product.name,
        images: report.product.images,
        price: report.product.price,
        status: report.product.status,
        seller: report.product.seller
      } : null
    }));

    return res.json(success('获取举报列表成功', {
      items: formattedReports,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }));
  } catch (err) {
    console.error('Get admin reports error:', err);
    return res.status(500).json(error('获取举报列表失败'));
  }
});



// 创建公告
router.post('/notices/create', requireAdmin, async (req, res) => {
  try {
    const { title, content, type = '系统公告', isActive = true } = req.body;

    if (!title || !content) {
      return res.status(400).json(badRequest('标题和内容不能为空'));
    }

    // 创建公告
    const notice = await prisma.notice.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        type,
        isActive
      }
    });

    return res.status(201).json(success('公告创建成功', {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type,
      isActive: notice.isActive,
      createdAt: notice.createdAt.toISOString()
    }));
  } catch (err) {
    console.error('Create notice error:', err);
    return res.status(500).json(error('创建公告失败'));
  }
});

// 更新公告
router.post('/notices/:noticeId/update', requireAdmin, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { title, content, type, isActive } = req.body;

    // 检查公告是否存在
    const notice = await prisma.notice.findFirst({
      where: {
        id: noticeId,
        deleted: false
      }
    });

    if (!notice) {
      return res.status(404).json(error('公告不存在'));
    }

    // 更新公告
    const updatedNotice = await prisma.notice.update({
      where: { id: noticeId },
      data: {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return res.json(success('公告更新成功', {
      id: updatedNotice.id,
      title: updatedNotice.title,
      content: updatedNotice.content,
      type: updatedNotice.type,
      isActive: updatedNotice.isActive,
      updatedAt: updatedNotice.updatedAt.toISOString()
    }));
  } catch (err) {
    console.error('Update notice error:', err);
    return res.status(500).json(error('更新公告失败'));
  }
});

// 删除公告
router.post('/notices/:noticeId/delete', requireAdmin, async (req, res) => {
  try {
    const { noticeId } = req.params;

    // 检查公告是否存在
    const notice = await prisma.notice.findFirst({
      where: {
        id: noticeId,
        deleted: false
      }
    });

    if (!notice) {
      return res.status(404).json(error('公告不存在'));
    }

    // 软删除公告
    await prisma.notice.update({
      where: { id: noticeId },
      data: { deleted: true }
    });

    return res.json(success('公告删除成功'));
  } catch (err) {
    console.error('Delete notice error:', err);
    return res.status(500).json(error('删除公告失败'));
  }
});

// 管理员创建分类
router.post('/categories/create', requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json(badRequest('分类名称不能为空'));
    }

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

    return res.status(201).json(success('分类创建成功', {
      id: newCategory.id,
      name: newCategory.name,
      description: newCategory.description,
      createdAt: newCategory.createdAt.toISOString(),
      updatedAt: newCategory.updatedAt.toISOString()
    }));
  } catch (err) {
    console.error('Admin create category error:', err);
    return res.status(500).json(error('创建分类失败'));
  }
});

// 管理员更新分类
router.post('/categories/:categoryId/update', requireAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category || category.deleted) {
      return res.status(404).json(error('分类不存在'));
    }

    // 如果更新名称，检查是否与其他分类重名
    if (name && name.trim() !== category.name) {
      const existingCategory = await prisma.category.findFirst({
        where: { 
          name: name.trim(),
          deleted: false,
          id: { not: categoryId }
        }
      });

      if (existingCategory) {
        return res.status(409).json(badRequest('分类名称已存在'));
      }
    }

    // 更新分类
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null })
      }
    });

    return res.json(success('分类更新成功', {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      updatedAt: updatedCategory.updatedAt.toISOString()
    }));
  } catch (err) {
    console.error('Admin update category error:', err);
    return res.status(500).json(error('更新分类失败'));
  }
});

// 管理员删除分类
router.post('/categories/:categoryId/delete', requireAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params;

    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
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
      where: { id: categoryId },
      data: { deleted: true }
    });

    return res.json(success('分类删除成功'));
  } catch (err) {
    console.error('Admin delete category error:', err);
    return res.status(500).json(error('删除分类失败'));
  }
});



// 处理举报
router.post('/reports/:reportId/process', requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, adminNote } = req.body;

    if (!action || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json(badRequest('处理动作必须是 approved 或 rejected'));
    }

    // 查询举报记录
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            sellerId: true,
            status: true,
            seller: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        }
      }
    });

    if (!report || report.deleted) {
      return res.status(404).json(error('举报记录不存在'));
    }

    if (report.status !== '待处理') {
      return res.status(400).json(badRequest('该举报已经处理过了'));
    }

    // 更新举报状态
    const newStatus = action === 'approved' ? '已处理' : '已驳回';
    await prisma.report.update({
      where: { id: reportId },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      }
    });

    // 发送通知给举报人
    if (report.product) {
      await sendReportProcessedNotification(
        report.reporter.id,
        report.product.name,
        action,
        adminNote
      );

      // 如果举报被认定为有效且商品还在售，则下架商品并通知卖家
      if (action === 'approved' && report.product.status === '在售') {
        // 下架商品
        await prisma.product.update({
          where: { id: report.product.id },
          data: { status: '已下架' }
        });

        // 通知卖家商品被下架
        await sendTradeNotification(
          report.product.sellerId,
          NotificationType.PRODUCT_REMOVED,
          report.product.name,
          `因举报核实违规，商品已被下架。${adminNote ? `管理员备注：${adminNote}` : ''}`
        );
      }
    }

    const actionText = action === 'approved' ? '通过' : '驳回';
    return res.json(success(`举报已${actionText}处理`));
  } catch (err) {
    console.error('Process report error:', err);
    return res.status(500).json(error('处理举报失败'));
  }
});

// 获取举报统计信息
router.get('/reports/stats', requireAdmin, async (req, res) => {
  try {
    const [totalReports, pendingReports, approvedReports, rejectedReports] = await Promise.all([
      prisma.report.count({ where: { deleted: false } }),
      prisma.report.count({ where: { status: '待处理', deleted: false } }),
      prisma.report.count({ where: { status: '已处理', deleted: false } }),
      prisma.report.count({ where: { status: '已驳回', deleted: false } })
    ]);

    // 获取最近7天的举报数据
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentReports = await prisma.report.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        deleted: false
      }
    });

    return res.json(success('获取举报统计成功', {
      total: totalReports,
      pending: pendingReports,
      approved: approvedReports,
      rejected: rejectedReports,
      recent: recentReports
    }));
  } catch (err) {
    console.error('Get reports stats error:', err);
    return res.status(500).json(error('获取举报统计失败'));
  }
});

export default router; 