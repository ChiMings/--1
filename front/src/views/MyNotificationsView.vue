<template>
  <div class="notifications-page">
    <div class="page-header">
      <h1>系统通知</h1>
      <p>查看系统消息和重要通知</p>
    </div>

    <!-- 通知统计和操作 -->
    <div class="notifications-toolbar">
      <div class="notification-stats">
        <div class="stat-item">
          <span class="count">{{ notifications.length }}</span>
          <span class="label">全部通知</span>
        </div>
        <div class="stat-item">
          <span class="count unread">{{ unreadCount }}</span>
          <span class="label">未读通知</span>
        </div>
      </div>

      <div class="toolbar-actions">
        <button 
          @click="markAllAsRead"
          :disabled="unreadCount === 0"
          class="btn btn-outline-primary"
        >
          全部标记已读
        </button>
        
        <button 
          @click="clearAllNotifications"
          class="btn btn-outline-danger"
        >
          清空通知
        </button>
      </div>
    </div>

    <!-- 筛选选项 -->
    <div class="filter-section">
      <div class="filter-tabs">
        <button 
          v-for="filter in filterOptions"
          :key="filter.value"
          :class="['filter-tab', { active: selectedFilter === filter.value }]"
          @click="selectedFilter = filter.value"
        >
          {{ filter.label }}
          <span v-if="filter.count > 0" class="count-badge">{{ filter.count }}</span>
        </button>
      </div>
    </div>

    <!-- 通知列表 -->
    <div class="notifications-container">
      <div v-if="loading" class="loading">
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredNotifications.length === 0" class="empty-notifications">
        <div class="empty-icon">🔔</div>
        <h3>暂无{{ getFilterLabel() }}通知</h3>
        <p>{{ getEmptyMessage() }}</p>
      </div>

      <div v-else class="notifications-list">
        <div 
          v-for="notification in filteredNotifications"
          :key="notification.id"
          :class="['notification-item', {
            unread: !notification.isRead,
            [notification.type.toLowerCase()]: true
          }]"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            {{ getNotificationIcon(notification.type) }}
          </div>

          <div class="notification-content">
            <div class="notification-header">
              <div class="notification-title">{{ getNotificationTitle(notification.type) }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
            
            <div class="notification-text">{{ notification.content }}</div>
            
            <div class="notification-actions" @click.stop>
              <button 
                v-if="!notification.isRead"
                @click="markAsRead(notification)"
                class="action-btn mark-read"
              >
                标记已读
              </button>
              
              <button 
                @click="deleteNotification(notification)"
                class="action-btn delete"
              >
                删除
              </button>
            </div>
          </div>

          <div v-if="!notification.isRead" class="unread-indicator"></div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="filteredNotifications.length > 0 && totalPages > 1" class="pagination">
        <button 
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
          class="btn btn-outline-secondary btn-sm"
        >
          上一页
        </button>
        
        <span class="page-info">
          第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
        </span>
        
        <button 
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
          class="btn btn-outline-secondary btn-sm"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { mockNotifications } from '@/utils/mockData';
import { config } from '@/utils/config';
import { getNotifications, getUnreadCount, markAsRead as markAsReadAPI, markAllAsRead as markAllAsReadAPI, deleteNotification as deleteNotificationAPI } from '@/api/notifications';

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const notifications = ref([]);
const selectedFilter = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);

// 筛选选项
const filterOptions = computed(() => {
  const counts = notifications.value.reduce((acc, notif) => {
    acc[notif.type] = (acc[notif.type] || 0) + 1;
    if (!notif.isRead) {
      acc.unread = (acc.unread || 0) + 1;
    }
    return acc;
  }, {});

  return [
    { value: 'all', label: '全部', count: notifications.value.length },
    { value: 'unread', label: '未读', count: counts.unread || 0 },
    { value: 'NEW_COMMENT', label: '评论通知', count: counts.NEW_COMMENT || 0 },
    { value: 'NEW_MESSAGE', label: '私信通知', count: counts.NEW_MESSAGE || 0 },
    { value: 'PRODUCT_SOLD', label: '交易通知', count: counts.PRODUCT_SOLD || 0 },
    { value: 'SYSTEM', label: '系统通知', count: counts.SYSTEM || 0 }
  ];
});

// 计算属性
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.isRead).length;
});

const filteredNotifications = computed(() => {
  let filtered = [...notifications.value];
  
  if (selectedFilter.value === 'unread') {
    filtered = filtered.filter(n => !n.isRead);
  } else if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(n => n.type === selectedFilter.value);
  }
  
  // 按时间倒序排列
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filtered.slice(start, end);
});

const totalPages = computed(() => {
  let filtered = [...notifications.value];
  
  if (selectedFilter.value === 'unread') {
    filtered = filtered.filter(n => !n.isRead);
  } else if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(n => n.type === selectedFilter.value);
  }
  
  return Math.ceil(filtered.length / pageSize.value);
});

// 加载通知数据
async function loadNotifications() {
  try {
    loading.value = true;
    
    if (config.useMockData) {
      // 使用模拟数据
      notifications.value = [...mockNotifications];
    } else {
      // 调用真实的API
      const response = await getNotifications();
      const apiData = response.data.data || response.data;
      notifications.value = apiData.items || [];
    }
  } catch (error) {
    console.error('Failed to load notifications:', error);
    // 如果API失败，fallback到模拟数据
    if (!config.useMockData) {
      notifications.value = [...mockNotifications];
    }
  } finally {
    loading.value = false;
  }
}

// 处理通知点击
function handleNotificationClick(notification) {
  // 标记为已读
  if (!notification.isRead) {
    markAsRead(notification);
  }
  
  // 根据通知类型导航到相应页面
  switch (notification.type) {
    case 'NEW_COMMENT':
      // 假设从通知内容中提取商品ID
      const productMatch = notification.content.match(/商品 "([^"]+)"/);
      if (productMatch) {
        // 导航到商品详情页
        // router.push(`/product/${productId}`);
      }
      break;
      
    case 'NEW_MESSAGE':
      // 导航到私信页面
      router.push('/messages');
      break;
      
    case 'PRODUCT_SOLD':
      // 导航到我的发布页面
      router.push('/my-products');
      break;
      
    default:
      // 其他类型通知的处理
      break;
  }
}

// 标记单个通知为已读
async function markAsRead(notification) {
  try {
    if (!config.useMockData) {
      await markAsReadAPI(notification.id);
    }
    notification.isRead = true;
  } catch (error) {
    console.error('Failed to mark as read:', error);
    // 如果API失败，依然更新本地状态作为用户反馈
    notification.isRead = true;
  }
}

// 标记所有通知为已读
async function markAllAsRead() {
  if (confirm('确定要将所有未读通知标记为已读吗？')) {
    try {
      if (!config.useMockData) {
        await markAllAsReadAPI();
      }
      
      notifications.value.forEach(notification => {
        if (!notification.isRead) {
          notification.isRead = true;
        }
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // 如果API失败，依然更新本地状态作为用户反馈
      notifications.value.forEach(notification => {
        if (!notification.isRead) {
          notification.isRead = true;
        }
      });
    }
  }
}

// 删除单个通知
async function deleteNotification(notification) {
  if (confirm('确定要删除这条通知吗？')) {
    try {
      if (!config.useMockData) {
        await deleteNotificationAPI(notification.id);
      }
      
      const index = notifications.value.findIndex(n => n.id === notification.id);
      if (index > -1) {
        notifications.value.splice(index, 1);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // 如果API失败，依然删除本地数据作为用户反馈
      const index = notifications.value.findIndex(n => n.id === notification.id);
      if (index > -1) {
        notifications.value.splice(index, 1);
      }
    }
  }
}

// 清空所有通知
function clearAllNotifications() {
  if (confirm('确定要清空所有通知吗？此操作不可恢复。')) {
    notifications.value = [];
    
    if (!config.useMockData) {
      // 这里应该调用API
      // clearAllNotificationsAPI();
    }
  }
}

// 改变页码
function changePage(page) {
  currentPage.value = page;
}

// 工具函数
function getNotificationIcon(type) {
  const icons = {
    'NEW_COMMENT': '💬',
    'NEW_MESSAGE': '📩',
    'PRODUCT_SOLD': '💰',
    'SYSTEM': '🔔',
    'WARNING': '⚠️',
    'SUCCESS': '✅'
  };
  return icons[type] || '🔔';
}

function getNotificationTitle(type) {
  const titles = {
    'NEW_COMMENT': '新评论',
    'NEW_MESSAGE': '新私信',
    'PRODUCT_SOLD': '交易成功',
    'SYSTEM': '系统通知',
    'WARNING': '警告',
    'SUCCESS': '成功'
  };
  return titles[type] || '通知';
}

function getFilterLabel() {
  const option = filterOptions.value.find(opt => opt.value === selectedFilter.value);
  return option ? option.label : '';
}

function getEmptyMessage() {
  switch (selectedFilter.value) {
    case 'unread':
      return '所有通知都已读完了';
    case 'NEW_COMMENT':
      return '暂无评论相关通知';
    case 'NEW_MESSAGE':
      return '暂无私信相关通知';
    case 'PRODUCT_SOLD':
      return '暂无交易相关通知';
    case 'SYSTEM':
      return '暂无系统通知';
    default:
      return '暂时没有任何通知';
  }
}

function formatTime(timeString) {
  if (!timeString) return '';
  
  const date = new Date(timeString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return '刚刚';
  } else if (diffInHours < 24) {
    return Math.floor(diffInHours) + ' 小时前';
  } else if (diffInHours < 48) {
    return '昨天';
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

// 组件挂载
onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.notifications-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
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

.notifications-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.notification-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-item .count {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-item .count.unread {
  color: #dc3545;
}

.stat-item .label {
  font-size: 12px;
  color: #666;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-tab:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.filter-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.count-badge {
  background: rgba(255, 255, 255, 0.3);
  color: inherit;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.filter-tab.active .count-badge {
  background: rgba(255, 255, 255, 0.3);
}

.notifications-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #666;
}

.empty-notifications {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-notifications h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.empty-notifications p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}

.notifications-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #fff8e1;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-item.new_comment .notification-icon {
  background: #e3f2fd;
}

.notification-item.new_message .notification-icon {
  background: #f3e5f5;
}

.notification-item.product_sold .notification-icon {
  background: #e8f5e8;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.notification-title {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.notification-time {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
}

.notification-text {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.mark-read {
  background: #007bff;
  color: white;
}

.action-btn.mark-read:hover {
  background: #0056b3;
}

.action-btn.delete {
  background: #dc3545;
  color: white;
}

.action-btn.delete:hover {
  background: #c82333;
}

.unread-indicator {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: #dc3545;
  border-radius: 50%;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid #f5f5f5;
  background: #f8f9fa;
}

.page-info {
  font-size: 14px;
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

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .notifications-page {
    padding: 16px;
  }
  
  .notifications-toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .notification-stats {
    justify-content: center;
  }
  
  .toolbar-actions {
    justify-content: center;
  }
  
  .filter-tabs {
    justify-content: center;
  }
  
  .notification-header {
    flex-direction: column;
    gap: 4px;
  }
  
  .notification-actions {
    flex-wrap: wrap;
  }
}
</style> 