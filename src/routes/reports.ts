import { Router } from 'express';
import { success, error, badRequest, notFound } from '../utils/response';
import { prisma } from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import { createNotification, NotificationType } from '../utils/notificationService';

const router = Router();

// 创建举报
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { productId, reason, content } = req.body;

    // 验证必填字段
    if (!productId || !reason) {
      return res.status(400).json(badRequest('商品ID和举报原因不能为空'));
    }

    const reporterId = req.user!.id;

    // 验证商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId, deleted: false }
    });

    if (!product) {
      return res.status(404).json(notFound('商品不存在'));
    }

    // 不能举报自己的商品
    if (product.sellerId === reporterId) {
      return res.status(400).json(badRequest('不能举报自己的商品'));
    }

    // 检查是否重复举报
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        productId,
        deleted: false
      }
    });

    if (existingReport) {
      return res.status(400).json(badRequest('您已经举报过该商品'));
    }

    // 创建举报记录
    const newReport = await prisma.report.create({
      data: {
        reporterId,
        productId,
        reason,
        content: content || '',
        status: '待处理'
      },
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true,
            studentId: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            sellerId: true
          }
        }
      }
    });

    // 发送通知给管理员
    await createNotification({
      type: NotificationType.REPORT_SUBMITTED,
      title: '新举报待处理',
      content: `用户 "${newReport.reporter.nickname}" 举报了商品 "${newReport.product!.name}"，原因：${reason}`,
      recipientType: 'admin'
    });

    return res.status(201).json(success('举报提交成功，我们会尽快处理', {
      id: newReport.id,
      reason: newReport.reason,
      content: newReport.content,
      status: newReport.status,
      createdAt: newReport.createdAt.toISOString()
    }));
  } catch (err) {
    console.error('Create report error:', err);
    return res.status(500).json(error('举报提交失败'));
  }
});

// 获取用户的举报记录
router.get('/my-reports', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const reporterId = req.user!.id;

    // 查询用户的举报记录
    const reports = await prisma.report.findMany({
      where: {
        reporterId,
        deleted: false
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    // 获取总数
    const total = await prisma.report.count({
      where: {
        reporterId,
        deleted: false
      }
    });

    // 格式化数据
    const formattedReports = reports.map(report => ({
      id: report.id,
      reason: report.reason,
      content: report.content,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      product: report.product ? {
        id: report.product.id,
        name: report.product.name,
        images: report.product.images,
        price: report.product.price,
        status: report.product.status
      } : null
    }));

    return res.json(success('获取举报记录成功', {
      items: formattedReports,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }));
  } catch (err) {
    console.error('Get my reports error:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 撤销举报（仅限待处理状态）
router.post('/:reportId/cancel', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const reporterId = req.user!.id;

    // 验证举报是否存在且属于当前用户
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        product: {
          select: {
            name: true
          }
        }
      }
    });

    if (!report || report.deleted) {
      return res.status(404).json(notFound('举报记录不存在'));
    }

    if (report.reporterId !== reporterId) {
      return res.status(403).json(error('无权限操作此举报'));
    }

    // 验证举报状态是否为待处理
    if (report.status !== '待处理') {
      return res.status(400).json(badRequest('只能撤销待处理状态的举报'));
    }

    // 软删除举报记录
    await prisma.report.update({
      where: { id: reportId },
      data: { deleted: true }
    });

    return res.json(success('举报已撤销'));
  } catch (err) {
    console.error('Cancel report error:', err);
    return res.status(500).json(error('撤销失败'));
  }
});

export default router; 