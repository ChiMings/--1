import { Router } from 'express';
import { success, error, badRequest } from '../utils/response';

const router = Router();

// 创建举报
router.post('/create', async (req, res) => {
  try {
    const { type, targetId, reason, description } = req.body;

    // 验证必填字段
    if (!type || !targetId || !reason) {
      return res.status(400).json(badRequest('举报类型、目标ID和举报原因不能为空'));
    }

    // 验证举报类型
    const validTypes = ['product', 'comment', 'user'];
    if (!validTypes.includes(type)) {
      return res.status(400).json(badRequest('举报类型无效，必须是 product、comment 或 user'));
    }

    // TODO: 从JWT获取当前用户ID
    const reporterId = 'current-user-id';

    // TODO: 验证目标是否存在
    // 根据type验证targetId对应的商品/评论/用户是否存在

    // TODO: 检查是否重复举报
    // SELECT * FROM reports WHERE reporterId = reporterId AND type = type AND targetId = targetId

    // TODO: 创建举报记录
    const newReport = {
      id: `report_${Date.now()}`,
      type,
      targetId,
      reason,
      description: description || '',
      reporterId,
      status: '待处理',
      createdAt: new Date().toISOString(),
      processedAt: null,
      processorId: null,
      adminNote: null
    };

    return res.status(201).json(success('举报提交成功，我们会尽快处理', newReport));
  } catch (err) {
    return res.status(500).json(error('举报提交失败'));
  }
});

// 获取用户的举报记录
router.get('/my-reports', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // TODO: 从JWT获取当前用户ID
    const reporterId = 'current-user-id';

    // TODO: 查询用户的举报记录
    const mockReports = [
      {
        id: 'report_1',
        type: 'product',
        targetId: '123',
        reason: '虚假信息',
        description: '该商品描述与实际不符，涉嫌欺诈',
        status: '已处理',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1天前
        processedAt: new Date(Date.now() - 43200000).toISOString(), // 12小时前
        adminNote: '经核实，商品信息确实存在问题，已下架处理'
      },
      {
        id: 'report_2',
        type: 'comment',
        targetId: '456',
        reason: '恶意骚扰',
        description: '该用户在评论中使用不当言论',
        status: '待处理',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1小时前
        processedAt: null,
        adminNote: null
      }
    ];

    return res.json(success('获取举报记录成功', {
      items: mockReports,
      total: mockReports.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(mockReports.length / Number(limit))
    }));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 撤销举报（仅限待处理状态）
router.post('/:reportId/cancel', async (req, res) => {
  try {
    const { reportId } = req.params;

    // TODO: 从JWT获取当前用户ID
    const reporterId = 'current-user-id';

    // TODO: 验证举报是否存在且属于当前用户
    // TODO: 验证举报状态是否为待处理
    // TODO: 更新举报状态为已撤销

    return res.json(success('举报已撤销'));
  } catch (err) {
    return res.status(500).json(error('撤销失败'));
  }
});

export default router; 