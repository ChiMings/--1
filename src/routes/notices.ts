import { Router } from 'express';
import { success, error, badRequest } from '../utils/response';
import { prisma } from '../utils/database';

const router = Router();

// 获取公告列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    // 查询公告列表，只返回有效的公告
    const notices = await prisma.notice.findMany({
      where: {
        deleted: false,
        isActive: true
      },
      orderBy: [
        // 首先按创建时间排序（最新的在前）
        { createdAt: 'desc' }
      ],
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber
    });

    // 查询总数
    const total = await prisma.notice.count({
      where: {
        deleted: false,
        isActive: true
      }
    });

    // 转换数据格式以匹配前端期望
    const formattedNotices = notices.map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type,
      isSticky: false, // 数据库中没有置顶字段，暂时设为false
      publishedAt: notice.createdAt.toISOString(),
      author: {
        id: 'system',
        nickname: '系统管理员'
      }
    }));

    return res.json(success('获取公告列表成功', {
      items: formattedNotices,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }));
  } catch (err) {
    console.error('Get notices error:', err);
    return res.status(500).json(error('获取公告列表失败'));
  }
});

// 获取公告详情
router.get('/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;

    // 查询公告详情
    const notice = await prisma.notice.findFirst({
      where: {
        id: noticeId,
        deleted: false,
        isActive: true
      }
    });

    if (!notice) {
      return res.status(404).json(error('公告不存在'));
    }

    // 转换数据格式
    const formattedNotice = {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type,
      isSticky: false,
      publishedAt: notice.createdAt.toISOString(),
      updatedAt: notice.updatedAt.toISOString(),
      viewCount: 0, // 数据库中没有浏览量字段
      author: {
        id: 'system',
        nickname: '系统管理员',
        avatar: null
      }
    };

    return res.json(success('获取公告详情成功', formattedNotice));
  } catch (err) {
    console.error('Get notice detail error:', err);
    return res.status(500).json(error('获取公告详情失败'));
  }
});

export default router; 