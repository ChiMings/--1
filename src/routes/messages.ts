import { Router } from 'express';
import { success, error, badRequest, notFound } from '../utils/response';
import { prisma } from '../utils/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 获取会话列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.user!.id;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 查询用户参与的所有消息，获取对话对象
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ],
        deleted: false
      },
      include: {
        sender: {
          select: { id: true, nickname: true, avatar: true }
        },
        receiver: {
          select: { id: true, nickname: true, avatar: true }
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    // 按对话分组
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
      const otherUser = message.senderId === currentUserId ? message.receiver : message.sender;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          id: `conversation_${otherUserId}`,
          otherUser,
          lastMessage: {
            content: message.content,
            sentAt: message.sentAt.toISOString(),
            senderId: message.senderId
          },
          unreadCount: 0,
          updatedAt: message.sentAt.toISOString()
        });
      }
    });

    // 计算未读消息数
    for (const [otherUserId, conversation] of conversationMap) {
      const unreadCount = await prisma.message.count({
        where: {
          senderId: otherUserId,
          receiverId: currentUserId,
          isRead: false,
          deleted: false
        }
      });
      conversation.unreadCount = unreadCount;
    }

    const conversations = Array.from(conversationMap.values());
    
    // 按最后消息时间排序
    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // 分页
    const paginatedConversations = conversations.slice(skip, skip + limitNum);

    return res.json(success('获取会话列表成功', {
      items: paginatedConversations,
      total: conversations.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(conversations.length / limitNum)
    }));
  } catch (err) {
    console.error('Get conversations error:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 获取未读消息数量
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user!.id;

    // 查询当前用户收到的未读消息数量
    const unreadCount = await prisma.message.count({
      where: { 
        receiverId: currentUserId,
        isRead: false,
        deleted: false 
      }
    });

    return res.json(success('获取未读消息数成功', {
      count: unreadCount
    }));
  } catch (err) {
    console.error('Get unread messages count error:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 获取与指定用户的消息记录
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user!.id;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 验证对方用户是否存在
    const otherUser = await prisma.user.findUnique({
      where: { id: userId, deleted: false },
      select: { id: true, nickname: true, avatar: true }
    });

    if (!otherUser) {
      return res.status(404).json(notFound('用户不存在'));
    }

    // 查询与指定用户的消息记录
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId }
          ],
          deleted: false
        },
        orderBy: { sentAt: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId }
          ],
          deleted: false
        }
      })
    ]);

    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      sentAt: message.sentAt.toISOString(),
      isRead: message.isRead
    }));

    return res.json(success('获取消息记录成功', {
      otherUser,
      messages: formattedMessages,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }));
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json(error('获取失败'));
  }
});

// 发送私信
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json(badRequest('接收者ID和消息内容不能为空'));
    }

    if (!content.trim()) {
      return res.status(400).json(badRequest('消息内容不能为空'));
    }

    const currentUserId = req.user!.id;

    if (receiverId === currentUserId) {
      return res.status(400).json(badRequest('不能给自己发送消息'));
    }

    // 验证接收者是否存在
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId, deleted: false }
    });

    if (!receiver) {
      return res.status(404).json(notFound('接收者不存在'));
    }

    // 创建消息记录
    const newMessage = await prisma.message.create({
      data: {
        senderId: currentUserId,
        receiverId,
        content: content.trim()
      }
    });

    const formattedMessage = {
      id: newMessage.id,
      content: newMessage.content,
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId,
      sentAt: newMessage.sentAt.toISOString(),
      isRead: newMessage.isRead
    };

    return res.status(201).json(success('消息发送成功', formattedMessage));
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json(error('发送失败'));
  }
});

// 标记消息为已读
router.post('/:userId/read', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.id;

    // 将与指定用户的未读消息标记为已读
    const result = await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: currentUserId,
        isRead: false,
        deleted: false
      },
      data: { isRead: true }
    });

    return res.json(success(`已标记 ${result.count} 条消息为已读`));
  } catch (err) {
    console.error('Mark messages read error:', err);
    return res.status(500).json(error('操作失败'));
  }
});

export default router; 