import request from '@/utils/request';
import { config } from '@/utils/config';
import { mockConversations, mockMessages } from '@/utils/mockData';

/**
 * 获取会话列表
 * @param {object} params 查询参数
 */
export function getConversations(params = {}) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { page = 1, limit = 20 } = params;
        
        // 分页处理
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedConversations = mockConversations.slice(startIndex, endIndex);
        
        resolve({
          data: {
            status: 'success',
            message: '获取会话列表成功',
            data: {
              items: paginatedConversations,
              total: mockConversations.length,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: Math.ceil(mockConversations.length / limit)
            }
          }
        });
      }, 200);
    });
  }
  
  return request({
    url: '/messages',
    method: 'get',
    params,
  });
}

/**
 * 获取与指定用户的消息记录
 * @param {string} userId 用户ID
 * @param {object} params 查询参数
 */
export function getConversationMessages(userId, params = {}) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { page = 1, limit = 50 } = params;
        
        // 筛选与指定用户的消息
        const userMessages = mockMessages.filter(message => 
          message.conversationId === parseInt(userId) || 
          message.senderId === userId || 
          message.receiverId === userId
        );
        
        // 分页处理
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedMessages = userMessages.slice(startIndex, endIndex);
        
        // 模拟对方用户信息
        const otherUser = {
          id: userId,
          nickname: '书虫',
          avatar: null
        };
        
        resolve({
          data: {
            status: 'success',
            message: '获取消息记录成功',
            data: {
              otherUser,
              messages: paginatedMessages,
              total: userMessages.length,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: Math.ceil(userMessages.length / limit)
            }
          }
        });
      }, 300);
    });
  }
  
  return request({
    url: `/messages/${userId}`,
    method: 'get',
    params,
  });
}

/**
 * 发送私信
 * @param {object} data 消息数据
 */
export function sendMessage(data) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newMessage = {
          id: `msg_${Date.now()}`,
          content: data.content,
          senderId: '1', // 假设当前用户ID为1
          receiverId: data.receiverId,
          sentAt: new Date().toISOString(),
          isRead: false
        };
        
        // 添加到模拟数据
        mockMessages.push(newMessage);
        
        resolve({
          data: {
            status: 'success',
            message: '消息发送成功',
            data: newMessage
          }
        });
      }, 400);
    });
  }
  
  return request({
    url: '/messages/send',
    method: 'post',
    data,
  });
}

/**
 * 标记消息为已读
 * @param {string} userId 对方用户ID
 */
export function markMessagesAsRead(userId) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 在模拟数据中标记消息为已读
        mockMessages.forEach(message => {
          if (message.senderId === userId && !message.isRead) {
            message.isRead = true;
          }
        });
        
        resolve({
          data: {
            status: 'success',
            message: '消息已标记为已读'
          }
        });
      }, 200);
    });
  }
  
  return request({
    url: `/messages/${userId}/read`,
    method: 'post',
  });
}

/**
 * 删除会话（软删除）
 * @param {string} userId 对方用户ID
 */
export function deleteConversation(userId) {
  if (config.useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 在模拟数据中删除会话
        const conversationIndex = mockConversations.findIndex(conv => 
          conv.otherUser.id === userId
        );
        
        if (conversationIndex !== -1) {
          mockConversations.splice(conversationIndex, 1);
        }
        
        resolve({
          data: {
            status: 'success',
            message: '会话已删除'
          }
        });
      }, 300);
    });
  }
  
  return request({
    url: `/messages/${userId}/delete`,
    method: 'post',
  });
}

/**
 * 获取未读消息总数
 */
export function getUnreadMessageCount() {
  return request({
    url: '/messages/unread-count',
    method: 'get',
  });
} 