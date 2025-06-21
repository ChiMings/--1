import { Router } from 'express';
import { success, error, badRequest } from '../utils/response';

const router = Router();

// 获取公告列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // TODO: 查询公告列表，按置顶和发布时间排序
    const mockNotices = [
      {
        id: '1',
        title: '平台使用规范',
        content: '为了维护良好的交易环境，请所有用户遵守以下规范：\n\n1. 诚信交易，如实描述商品信息\n2. 文明用语，禁止恶意辱骂\n3. 保护个人隐私，谨慎透露个人信息\n4. 遇到问题及时联系客服\n\n违反规范的用户将面临警告、限制功能或封号处理。',
        type: 'important',
        isSticky: true,
        publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(), // 7天前
        author: {
          id: '2',
          nickname: '管理员'
        }
      },
      {
        id: '2',
        title: '系统维护通知',
        content: '亲爱的用户：\n\n为了提升系统性能和用户体验，我们将于本周六（12月2日）晚上22:00-23:00进行系统维护。\n\n维护期间，平台将暂时无法访问，请大家提前安排好交易时间。\n\n维护完成后，系统将恢复正常服务。如有紧急问题，请联系客服。\n\n感谢大家的理解与支持！',
        type: 'normal',
        isSticky: false,
        publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2天前
        author: {
          id: '2',
          nickname: '管理员'
        }
      },
      {
        id: '3',
        title: '新功能上线：商品收藏',
        content: '好消息！平台新增商品收藏功能：\n\n✨ 可以收藏感兴趣的商品\n✨ 在个人中心查看收藏列表\n✨ 收藏商品有更新时会收到通知\n\n快去试试吧！点击商品页面的心形图标即可收藏。',
        type: 'normal',
        isSticky: false,
        publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(), // 5天前
        author: {
          id: '2',
          nickname: '管理员'
        }
      },
      {
        id: '4',
        title: '防诈骗提醒',
        content: '最近发现有不法分子冒充买家进行诈骗，请大家注意：\n\n⚠️ 不要点击可疑链接\n⚠️ 不要透露银行卡密码\n⚠️ 建议面对面交易\n⚠️ 使用平台内置聊天功能\n\n如遇可疑情况，请立即举报！',
        type: 'important',
        isSticky: false,
        publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(), // 10天前
        author: {
          id: '2',
          nickname: '管理员'
        }
      }
    ];

    // 按置顶和发布时间排序
    const sortedNotices = mockNotices.sort((a, b) => {
      if (a.isSticky && !b.isSticky) return -1;
      if (!a.isSticky && b.isSticky) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedNotices = sortedNotices.slice(startIndex, endIndex);

    return res.json(success('获取公告列表成功', {
      items: paginatedNotices,
      total: sortedNotices.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(sortedNotices.length / Number(limit))
    }));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 获取公告详情
router.get('/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;

    // TODO: 根据ID查询公告详情
    const mockNotice = {
      id: noticeId,
      title: '平台使用规范',
      content: '为了维护良好的交易环境，请所有用户遵守以下规范：\n\n1. 诚信交易，如实描述商品信息\n2. 文明用语，禁止恶意辱骂\n3. 保护个人隐私，谨慎透露个人信息\n4. 遇到问题及时联系客服\n\n违反规范的用户将面临警告、限制功能或封号处理。\n\n本规范自发布之日起生效，平台保留最终解释权。',
      type: 'important',
      isSticky: true,
      publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      viewCount: 1250,
      author: {
        id: '2',
        nickname: '管理员',
        avatar: null
      }
    };

    // TODO: 增加浏览量
    // UPDATE notices SET viewCount = viewCount + 1 WHERE id = noticeId

    return res.json(success('获取公告详情成功', mockNotice));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

export default router; 