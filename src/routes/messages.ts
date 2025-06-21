import { Router } from 'express';
import { success, error, badRequest } from '../utils/response';

const router = Router();

// 获取会话列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // TODO: 从JWT获取当前用户ID
    const currentUserId = 'current-user-id';

    // TODO: 查询用户的会话列表
    const mockConversations = [
      {
        id: 'conversation_1',
        otherUser: {
          id: '2',
          nickname: '书虫',
          avatar: null
        },
        lastMessage: {
          content: '商品还在吗？',
          sentAt: new Date().toISOString(),
          senderId: '2'
        },
        unreadCount: 3,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'conversation_2',
        otherUser: {
          id: '3',
          nickname: '运动达人',
          avatar: null
        },
        lastMessage: {
          content: '谢谢，已经买到了',
          sentAt: new Date(Date.now() - 86400000).toISOString(), // 1天前
          senderId: 'current-user-id'
        },
        unreadCount: 0,
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    return res.json(success('获取会话列表成功', {
      items: mockConversations,
      total: mockConversations.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(mockConversations.length / Number(limit))
    }));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 获取与指定用户的消息记录
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // TODO: 从JWT获取当前用户ID
    const currentUserId = 'current-user-id';

    // TODO: 查询与指定用户的消息记录
    const mockMessages = [
      {
        id: 'msg_1',
        content: '你好，这个商品还在吗？',
        senderId: userId,
        receiverId: currentUserId,
        sentAt: new Date(Date.now() - 3600000).toISOString(), // 1小时前
        isRead: true
      },
      {
        id: 'msg_2',
        content: '在的，你可以来看看',
        senderId: currentUserId,
        receiverId: userId,
        sentAt: new Date(Date.now() - 3000000).toISOString(), // 50分钟前
        isRead: false
      },
      {
        id: 'msg_3',
        content: '好的，什么时候方便？',
        senderId: userId,
        receiverId: currentUserId,
        sentAt: new Date(Date.now() - 1800000).toISOString(), // 30分钟前
        isRead: true
      }
    ];

    const otherUser = {
      id: userId,
      nickname: '书虫',
      avatar: null
    };

    return res.json(success('获取消息记录成功', {
      otherUser,
      messages: mockMessages,
      total: mockMessages.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(mockMessages.length / Number(limit))
    }));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 发送私信
router.post('/send', async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json(badRequest('接收者ID和消息内容不能为空'));
    }

    // TODO: 从JWT获取当前用户ID
    const currentUserId = 'current-user-id';

    if (receiverId === currentUserId) {
      return res.status(400).json(badRequest('不能给自己发送消息'));
    }

    // TODO: 验证接收者是否存在
    // TODO: 创建消息记录
    const newMessage = {
      id: `msg_${Date.now()}`,
      content,
      senderId: currentUserId,
      receiverId,
      sentAt: new Date().toISOString(),
      isRead: false
    };

    return res.status(201).json(success('消息发送成功', newMessage));
  } catch (err) {
    return res.status(500).json(error('发送失败'));
  }
});

// 标记消息为已读
router.post('/:userId/read', async (req, res) => {
  try {
    const { userId } = req.params;

    // TODO: 从JWT获取当前用户ID
    const currentUserId = 'current-user-id';

    // TODO: 将与指定用户的未读消息标记为已读
    // UPDATE messages SET isRead = true 
    // WHERE senderId = userId AND receiverId = currentUserId AND isRead = false

    return res.json(success('消息已标记为已读'));
  } catch (err) {
    return res.status(500).json(error('操作失败'));
  }
});

export default router; 