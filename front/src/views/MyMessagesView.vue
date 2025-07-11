<template>
  <div class="messages-page">
    <div class="page-header">
      <h1>私信消息</h1>
      <p>与其他用户的私信对话</p>
    </div>

    <div class="messages-container">
      <!-- 左侧：对话列表 -->
      <div class="conversations-panel">
        <div class="panel-header">
          <h3>对话列表</h3>
          <div class="search-box">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="搜索用户..."
              @input="filterConversations"
            />
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loadingConversations" class="loading">
          <p>加载中...</p>
        </div>

        <!-- 对话列表 -->
        <div v-else class="conversations-list">
          <div v-if="filteredConversations.length === 0" class="empty-conversations">
            <p>暂无对话</p>
            <p class="hint">与其他用户的对话将在这里显示</p>
          </div>

          <div 
            v-for="conversation in filteredConversations"
            :key="conversation.id"
            :class="['conversation-item', { 
              active: selectedConversation?.id === conversation.id,
              unread: conversation.unreadCount > 0 
            }]"
            @click="selectConversation(conversation)"
          >
            <div class="user-avatar">
              <img 
                v-if="conversation.otherUser.avatar" 
                :src="conversation.otherUser.avatar" 
                :alt="conversation.otherUser.nickname"
                class="avatar-image"
              />
              <span v-else class="avatar-initial">
                {{ conversation.otherUser.nickname?.charAt(0) || 'U' }}
              </span>
            </div>
            
            <div class="conversation-info">
              <div class="user-name">{{ conversation.otherUser.nickname }}</div>
              <div class="last-message">{{ conversation.lastMessage?.content || '暂无消息' }}</div>
              <div class="message-time">{{ formatMessageTime(conversation.lastMessage?.createdAt) }}</div>
            </div>

            <div class="conversation-meta">
              <span v-if="conversation.unreadCount > 0" class="unread-badge">
                {{ conversation.unreadCount }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：消息区域 -->
      <div class="messages-panel">
        <!-- 未选择对话时的占位 -->
        <div v-if="!selectedConversation" class="no-conversation">
          <div class="placeholder-icon">💬</div>
          <h3>选择一个对话开始聊天</h3>
          <p>从左侧选择一个对话，或搜索用户开始新的对话</p>
        </div>

        <!-- 选中对话时显示消息 -->
        <div v-else class="conversation-view">
          <!-- 对话头部 -->
          <div class="conversation-header">
            <div class="user-info">
              <div class="user-avatar large">
                <img 
                  v-if="selectedConversation.otherUser.avatar" 
                  :src="selectedConversation.otherUser.avatar" 
                  :alt="selectedConversation.otherUser.nickname"
                  class="avatar-image"
                />
                <span v-else class="avatar-initial">
                  {{ selectedConversation.otherUser.nickname?.charAt(0) || 'U' }}
                </span>
              </div>
              <div class="user-details">
                <div class="user-name">{{ selectedConversation.otherUser.nickname }}</div>
                <div class="user-status">
                  <span :class="getUserRoleClass(selectedConversation.otherUser.role)">
                    {{ selectedConversation.otherUser.role }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="conversation-actions">
              <button @click="viewUserProfile" class="btn btn-outline-primary btn-sm">
                查看主页
              </button>
              <button @click="blockUser" class="btn btn-outline-danger btn-sm">
                屏蔽用户
              </button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div class="messages-list" ref="messagesContainer">
            <div v-if="loadingMessages" class="loading">
              <p>加载消息中...</p>
            </div>

            <div v-else>
              <div 
                v-for="message in messages"
                :key="message.id"
                :class="['message-item', {
                  'own': message.senderId === userStore.userInfo?.id,
                  'other': message.senderId !== userStore.userInfo?.id
                }]"
              >
                <div class="message-avatar">
                  <div class="avatar">
                    {{ getMessageSenderName(message)?.charAt(0) || 'U' }}
                  </div>
                </div>
                
                <div class="message-content">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="message-meta">
                    <span class="message-time">{{ formatMessageTime(message.sentAt) }}</span>
                    <span v-if="message.senderId === userStore.userInfo?.id" class="message-status">
                      {{ message.isRead ? '已读' : '已发送' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 消息输入框 -->
          <div class="message-input-area">
            <div class="input-container">
              <textarea
                v-model="newMessage"
                placeholder="输入消息..."
                rows="2"
                @keypress.enter.prevent="sendMessageToUser"
                @keypress.shift.enter="newMessage += '\n'"
                class="message-input"
              ></textarea>
              
              <div class="input-actions">
                <div class="input-hint">
                  <span>按 Enter 发送，Shift + Enter 换行</span>
                </div>
                <button 
                  @click="sendMessageToUser"
                  :disabled="!newMessage.trim() || sendingMessage"
                  class="btn btn-primary"
                >
                  {{ sendingMessage ? '发送中...' : '发送' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { getConversations, getConversationMessages, sendMessage, markMessagesAsRead } from '@/api/messages';
import { mockConversations, mockMessages } from '@/utils/mockData';
import { config } from '@/utils/config';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 响应式数据
const loadingConversations = ref(false);
const loadingMessages = ref(false);
const sendingMessage = ref(false);
const searchQuery = ref('');
const conversations = ref([]);
const selectedConversation = ref(null);
const messages = ref([]);
const newMessage = ref('');
const messagesContainer = ref(null);

// 计算属性
const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value;
  
  return conversations.value.filter(conversation =>
    conversation.otherUser.nickname.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 加载对话列表
async function loadConversations() {
  try {
    loadingConversations.value = true;
    
    const response = await getConversations({ page: 1, limit: 50 });
    
    if (response.data.status === 'success') {
      conversations.value = response.data.data.items || [];
    } else {
      console.error('Failed to load conversations:', response.data.message);
      conversations.value = [];
    }
    
  } catch (error) {
    console.error('Failed to load conversations:', error);
    conversations.value = [];
  } finally {
    loadingConversations.value = false;
  }
}

// 选择对话
async function selectConversation(conversation) {
  selectedConversation.value = conversation;
  await loadMessages(conversation.otherUser.id);
  
  // 标记消息为已读
  if (conversation.unreadCount > 0) {
    try {
      await markMessagesAsRead(conversation.otherUser.id);
      conversation.unreadCount = 0;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }
}

// 加载消息列表
async function loadMessages(userId) {
  try {
    loadingMessages.value = true;
    
    const response = await getConversationMessages(userId, { page: 1, limit: 100 });
    
    if (response.data.status === 'success') {
      const messagesData = response.data.data;
      messages.value = messagesData.messages || [];
    } else {
      console.error('Failed to load messages:', response.data.message);
      messages.value = [];
    }
    
    // 滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    console.error('Failed to load messages:', error);
    messages.value = [];
  } finally {
    loadingMessages.value = false;
  }
}

// 发送消息
async function sendMessageToUser() {
  if (!newMessage.value.trim() || !selectedConversation.value) return;
  
  try {
    sendingMessage.value = true;
    
    const messageContent = newMessage.value.trim();
    
    const response = await sendMessage({
      receiverId: selectedConversation.value.otherUser.id,
      content: messageContent
    });
    
    if (response.data.status === 'success') {
      // 添加到消息列表
      messages.value.push(response.data.data);
      
      // 更新对话的最后一条消息
      selectedConversation.value.lastMessage = {
        content: messageContent,
        sentAt: response.data.data.sentAt,
        senderId: response.data.data.senderId
      };
      
      // 清空输入框
      newMessage.value = '';
      
      // 滚动到底部
      nextTick(() => {
        scrollToBottom();
      });
    } else {
      alert('发送失败：' + response.data.message);
    }
    
  } catch (error) {
    console.error('Failed to send message:', error);
    alert('发送失败，请重试');
  } finally {
    sendingMessage.value = false;
  }
}

// 筛选对话
function filterConversations() {
  // 搜索功能通过计算属性实现
}

// 查看用户主页
function viewUserProfile() {
  if (selectedConversation.value) {
    router.push(`/profile/${selectedConversation.value.otherUser.id}`);
  }
}

// 屏蔽用户
function blockUser() {
  if (confirm('确定要屏蔽这个用户吗？屏蔽后将不会收到对方的消息。')) {
    alert('屏蔽功能开发中');
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// 工具函数
function getMessageSenderName(message) {
  if (message.senderId === userStore.userInfo?.id) {
    return userStore.userInfo.nickname;
  }
  return selectedConversation.value?.otherUser.nickname || '未知用户';
}

function getUserRoleClass(role) {
  const roleMap = {
    '未认证用户': 'role-unverified',
    '认证用户': 'role-verified',
    '管理员': 'role-admin',
    '超级管理员': 'role-super-admin'
  };
  return roleMap[role] || 'role-default';
}

function formatMessageTime(timeString) {
  if (!timeString) return '';
  
  const date = new Date(timeString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return '刚刚';
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
}

// 组件挂载
onMounted(async () => {
  await loadConversations();
  
  // 检查是否从商品详情页跳转过来，需要自动开启与卖家的对话
  const { userId, nickname, productId, productName } = route.query;
  if (userId && nickname) {
    await startConversationWithUser(userId, nickname, productId, productName);
  }
});

// 开始与指定用户的对话
async function startConversationWithUser(targetUserId, targetNickname, productId, productName) {
  // 查找是否已有与该用户的对话
  let conversation = conversations.value.find(conv => 
    conv.otherUser.id === targetUserId
  );
  
  // 如果没有对话，创建一个新的
  if (!conversation) {
    // 不依赖mockUsers，直接创建用户对象
    const targetUser = {
      id: targetUserId,
      nickname: targetNickname,
      role: '认证用户'
    };
    
    conversation = {
      id: `conversation_${targetUserId}`,
      lastMessage: null,
      unreadCount: 0,
      otherUser: targetUser,
      createdAt: new Date().toISOString()
    };
    
    conversations.value.unshift(conversation);
  }
  
  // 选中该对话
  await selectConversation(conversation);
  
  // 如果是从商品页面跳转过来，自动填入商品相关的消息
  if (productId && productName && !conversation.lastMessage) {
    newMessage.value = `你好，我对你发布的商品"${productName}"很感兴趣，请问现在还有吗？`;
  }
  
  // 清除URL参数
  router.replace({ name: 'MyMessages' });
}
</script>

<style scoped>
.messages-page {
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  min-height: 600px; /* 确保最小高度 */
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.messages-container {
  display: flex;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex: 1;
  overflow: hidden;
  min-height: 0; /* 确保可以收缩 */
}

.conversations-panel {
  width: 320px;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.search-box input:focus {
  outline: none;
  border-color: #007bff;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
}

.empty-conversations {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-conversations .hint {
  font-size: 12px;
  margin-top: 8px;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background: #f8f9fa;
}

.conversation-item.active {
  background: #e3f2fd;
  border-right: 3px solid #007bff;
}

.conversation-item.unread {
  background: #fff8e1;
}

.conversation-item .user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  overflow: hidden;
}

.user-avatar .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar .avatar-initial {
  width: 100%;
  height: 100%;
  background: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.last-message {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  color: #999;
  font-size: 12px;
}

.conversation-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.unread-badge {
  background: #dc3545;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.messages-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-conversation {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  text-align: center;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-conversation h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.no-conversation p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}

.conversation-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 确保可以收缩 */
}

.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0; /* 防止头部区域被压缩 */
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar.large {
  width: 48px;
  height: 48px;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.user-details .user-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-status {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.role-verified { color: #28a745; }
.role-admin { color: #007bff; }
.user-credit { color: #666; }

.conversation-actions {
  display: flex;
  gap: 8px;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background: #f8f9fa;
  min-height: 0; /* 确保可以收缩 */
  max-height: 100%; /* 限制最大高度 */
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  gap: 12px;
}

.message-item.own {
  flex-direction: row-reverse;
}

.message-item.own .message-content {
  background: #007bff;
  color: white;
}

.message-item.other .message-content {
  background: white;
  color: #333;
}

.message-avatar .avatar {
  width: 32px;
  height: 32px;
  background: #6c757d;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.message-item.own .message-avatar .avatar {
  background: #007bff;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  word-wrap: break-word;
}

.message-text {
  line-height: 1.4;
  white-space: pre-wrap;
}

.message-meta {
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.8;
  display: flex;
  gap: 8px;
}

.message-input-area {
  border-top: 1px solid #eee;
  padding: 16px 20px;
  background: white;
  flex-shrink: 0; /* 防止输入区域被压缩 */
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-family: inherit;
  max-height: 120px; /* 限制输入框最大高度 */
  overflow-y: auto; /* 内容过多时滚动 */
  font-size: 14px;
  line-height: 1.4;
  box-sizing: border-box;
}

.message-input:focus {
  outline: none;
  border-color: #007bff;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-hint {
  font-size: 12px;
  color: #666;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-outline-primary {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline-primary:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.btn-outline-danger:hover:not(:disabled) {
  background: #dc3545;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .messages-page {
    height: calc(100vh - 80px); /* 移动端减少顶部间距 */
    padding: 0 8px;
  }
  
  .messages-container {
    flex-direction: column;
    height: 100%;
  }
  
  .conversations-panel {
    width: 100%;
    max-height: 40vh;
    min-height: 200px; /* 确保对话列表有足够高度 */
  }
  
  .messages-panel {
    min-height: 0;
    flex: 1;
  }
  
  .conversation-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 16px;
  }
  
  .messages-list {
    padding: 12px 16px;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .message-input-area {
    padding: 12px 16px;
  }
  
  .input-actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .input-hint {
    text-align: center;
  }
}
</style> 