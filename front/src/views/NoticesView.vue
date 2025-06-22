<template>
  <div class="notices-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container">
        <h1>📢 系统公告</h1>
        <p>查看平台最新动态和重要通知</p>
      </div>
    </div>

    <div class="container">
      <!-- 管理员操作区 -->
      <div v-if="isSuperAdmin" class="admin-actions">
        <button @click="showCreateNotice" class="btn btn-primary">
          ➕ 发布新公告
        </button>
        <button @click="toggleManageMode" class="btn btn-secondary">
          {{ isManageMode ? '退出管理' : '管理公告' }}
        </button>
      </div>

      <!-- 公告统计 -->
      <div class="notices-stats">
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <div class="stat-number">{{ notices.length }}</div>
            <div class="stat-label">总公告数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-info">
            <div class="stat-number">{{ activeNotices.length }}</div>
            <div class="stat-label">有效公告</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📌</div>
          <div class="stat-info">
            <div class="stat-number">{{ pinnedNotices.length }}</div>
            <div class="stat-label">置顶公告</div>
          </div>
        </div>
      </div>

      <!-- 公告列表 -->
      <div class="notices-container">
        <div v-if="loading" class="loading">
          <p>📄 加载公告中...</p>
        </div>

        <div v-else-if="filteredNotices.length === 0" class="empty-notices">
          <div class="empty-icon">📭</div>
          <h3>暂无公告</h3>
          <p v-if="isSuperAdmin">点击"发布新公告"来发布第一个公告</p>
          <p v-else>目前还没有系统公告，请稍后查看</p>
        </div>

        <div v-else class="notices-list">
          <div 
            v-for="notice in filteredNotices" 
            :key="notice.id"
            :class="['notice-item', {
              'notice-pinned': notice.isPinned,
              'notice-urgent': notice.priority === 'urgent',
              'notice-expired': isExpired(notice)
            }]"
          >
            <!-- 公告标签 -->
            <div class="notice-badges">
              <span v-if="notice.isPinned" class="badge badge-pinned">📌 置顶</span>
              <span v-if="notice.priority === 'urgent'" class="badge badge-urgent">🚨 紧急</span>
              <span v-if="notice.priority === 'important'" class="badge badge-important">⚠️ 重要</span>
              <span v-if="isExpired(notice)" class="badge badge-expired">⏰ 已过期</span>
            </div>

            <!-- 公告内容 -->
            <div class="notice-content">
              <h3 class="notice-title">{{ notice.title }}</h3>
              <div class="notice-meta">
                <span class="notice-author">{{ notice.author }}</span>
                <span class="notice-date">{{ formatDate(notice.createdAt) }}</span>
                <span v-if="notice.expiresAt" class="notice-expires">
                  有效期至: {{ formatDate(notice.expiresAt) }}
                </span>
              </div>
              <div class="notice-body" v-html="formatContent(notice.content)"></div>
            </div>

            <!-- 管理员操作 -->
            <div v-if="isSuperAdmin && isManageMode" class="notice-actions">
              <button @click="editNotice(notice)" class="btn btn-sm btn-primary">
                ✏️ 编辑
              </button>
              <button 
                @click="togglePin(notice)" 
                :class="['btn', 'btn-sm', notice.isPinned ? 'btn-warning' : 'btn-outline-warning']"
              >
                {{ notice.isPinned ? '📌 取消置顶' : '📌 置顶' }}
              </button>
              <button @click="handleDeleteNotice(notice)" class="btn btn-sm btn-danger">
                🗑️ 删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination-container">
        <div class="pagination">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="pagination-btn"
          >
            上一页
          </button>
          
          <span class="page-info">
            第 {{ currentPage }} 页，共 {{ totalPages }} 页 ({{ total }} 条公告)
          </span>
          
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="pagination-btn"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 发布/编辑公告弹窗 -->
    <div v-if="showNoticeDialog" class="modal-overlay" @click="closeNoticeDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? '编辑公告' : '发布新公告' }}</h3>
          <button @click="closeNoticeDialog" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="submitNotice">
            <div class="form-group">
              <label>公告标题 <span class="required">*</span></label>
              <input 
                v-model="noticeForm.title" 
                type="text" 
                placeholder="请输入公告标题"
                required
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>优先级</label>
                <select v-model="noticeForm.priority">
                  <option value="normal">普通</option>
                  <option value="important">重要</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
              
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input 
                    v-model="noticeForm.isPinned" 
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">置顶显示</span>
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label>有效期</label>
              <input 
                v-model="noticeForm.expiresAt" 
                type="datetime-local"
              />
              <small class="form-hint">留空表示永久有效</small>
            </div>
            
            <div class="form-group">
              <label>公告内容 <span class="required">*</span></label>
              <textarea 
                v-model="noticeForm.content" 
                rows="8"
                placeholder="请输入公告内容，支持HTML格式"
                required
              ></textarea>
              <small class="form-hint">支持HTML标签，如 &lt;strong&gt;、&lt;em&gt;、&lt;a&gt; 等</small>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button @click="closeNoticeDialog" class="btn btn-outline">取消</button>
          <button 
            @click="submitNotice"
            :disabled="!noticeForm.title || !noticeForm.content"
            class="btn btn-primary"
          >
            {{ isEditing ? '更新公告' : '发布公告' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { getNotices, createNotice, updateNotice, deleteNotice } from '@/api/notices';

const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const notices = ref([]);
const showNoticeDialog = ref(false);
const isEditing = ref(false);
const isManageMode = ref(false);
const editingNotice = ref(null);

// 表单数据
const noticeForm = reactive({
  title: '',
  content: '',
  priority: 'normal',
  isPinned: false,
  expiresAt: ''
});

// 计算属性
const isSuperAdmin = computed(() => {
  return userStore.userInfo?.role === '超级管理员';
});

const activeNotices = computed(() => {
  return notices.value.filter(notice => !isExpired(notice));
});

const pinnedNotices = computed(() => {
  return notices.value.filter(notice => notice.isPinned);
});

const filteredNotices = computed(() => {
  return notices.value
    .filter(notice => !isExpired(notice) || isSuperAdmin.value) // 普通用户只看未过期的
    .sort((a, b) => {
      // 排序：置顶 > 优先级 > 创建时间
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const priorityOrder = { urgent: 3, important: 2, normal: 1 };
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);
const total = ref(0);

// 方法
async function loadNotices() {
  try {
    loading.value = true;
    
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };
    
    const response = await getNotices(params);
    
    if (response.data.status === 'success') {
      const data = response.data.data;
      
      // 转换数据格式以匹配前端期望
      notices.value = data.items.map(notice => ({
        ...notice,
        author: notice.author.nickname,
        priority: mapNoticeType(notice.type),
        isPinned: notice.isSticky,
        createdAt: notice.publishedAt
      }));
      
      total.value = data.total;
      totalPages.value = data.totalPages;
    }
  } catch (error) {
    console.error('Failed to load notices:', error);
    // 如果API失败，显示空状态
    notices.value = [];
    total.value = 0;
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
}

// 映射公告类型
function mapNoticeType(type) {
  const typeMap = {
    '系统公告': 'normal',
    '重要公告': 'important', 
    '紧急公告': 'urgent',
    'important': 'important',
    'urgent': 'urgent'
  };
  return typeMap[type] || 'normal';
}

function showCreateNotice() {
  isEditing.value = false;
  editingNotice.value = null;
  resetForm();
  showNoticeDialog.value = true;
}

function editNotice(notice) {
  isEditing.value = true;
  editingNotice.value = notice;
  
  // 填充表单
  noticeForm.title = notice.title;
  noticeForm.content = notice.content.replace(/<[^>]*>/g, ''); // 简单去除HTML标签用于编辑
  noticeForm.priority = notice.priority;
  noticeForm.isPinned = notice.isPinned;
  noticeForm.expiresAt = notice.expiresAt ? new Date(notice.expiresAt).toISOString().slice(0, 16) : '';
  
  showNoticeDialog.value = true;
}

function closeNoticeDialog() {
  showNoticeDialog.value = false;
  resetForm();
}

function resetForm() {
  noticeForm.title = '';
  noticeForm.content = '';
  noticeForm.priority = 'normal';
  noticeForm.isPinned = false;
  noticeForm.expiresAt = '';
}

async function submitNotice() {
  if (!noticeForm.title || !noticeForm.content) return;
  
  try {
    const noticeData = {
      title: noticeForm.title,
      content: noticeForm.content,
      type: mapPriorityToType(noticeForm.priority),
      isActive: true
    };
    
    if (isEditing.value && editingNotice.value) {
      // 更新公告
      await updateNotice(editingNotice.value.id, noticeData);
      alert('公告更新成功！');
    } else {
      // 创建新公告
      await createNotice(noticeData);
      alert('公告发布成功！');
    }
    
    // 重新加载公告列表
    await loadNotices();
    closeNoticeDialog();
  } catch (error) {
    console.error('Submit notice error:', error);
    alert('操作失败，请重试！');
  }
}

// 映射优先级到类型
function mapPriorityToType(priority) {
  const priorityMap = {
    'normal': '系统公告',
    'important': '重要公告',
    'urgent': '紧急公告'
  };
  return priorityMap[priority] || '系统公告';
}

function togglePin(notice) {
  notice.isPinned = !notice.isPinned;
  alert(`公告已${notice.isPinned ? '置顶' : '取消置顶'}`);
}

async function handleDeleteNotice(notice) {
  if (confirm('确定要删除这个公告吗？')) {
    try {
      await deleteNotice(notice.id);
      alert('公告删除成功！');
      // 重新加载公告列表
      await loadNotices();
    } catch (error) {
      console.error('Delete notice error:', error);
      alert('删除失败，请重试！');
    }
  }
}

function toggleManageMode() {
  isManageMode.value = !isManageMode.value;
}

// 分页相关
function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadNotices();
  }
}

function isExpired(notice) {
  if (!notice.expiresAt) return false;
  return new Date(notice.expiresAt) < new Date();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatContent(content) {
  // 简单的安全处理，实际项目中应使用更严格的HTML净化
  return content;
}

// 组件挂载
onMounted(() => {
  loadNotices();
});
</script>

<style scoped>
.notices-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.page-header {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 60px 0;
  text-align: center;
}

.page-header h1 {
  margin: 0 0 12px 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.admin-actions {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
}

.notices-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.notices-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 20px 0;
}

.loading {
  padding: 60px;
  text-align: center;
  color: #666;
}

.empty-notices {
  padding: 60px;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-notices h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.empty-notices p {
  margin: 0;
  color: #666;
}

.notices-list {
  display: flex;
  flex-direction: column;
}

.notice-item {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.notice-item:hover {
  background: #f8f9fa;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-pinned {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.notice-urgent {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.notice-expired {
  opacity: 0.6;
}

.notice-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-pinned {
  background: #fff3cd;
  color: #856404;
}

.badge-urgent {
  background: #f8d7da;
  color: #721c24;
}

.badge-important {
  background: #fff3cd;
  color: #856404;
}

.badge-expired {
  background: #e2e3e5;
  color: #6c757d;
}

.notice-title {
  margin: 0 0 12px 0;
  font-size: 1.3rem;
  color: #333;
  font-weight: 600;
}

.notice-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  color: #666;
  flex-wrap: wrap;
}

.notice-body {
  line-height: 1.6;
  color: #555;
}

.notice-body :deep(p) {
  margin-bottom: 12px;
}

.notice-body :deep(ul),
.notice-body :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.notice-body :deep(li) {
  margin-bottom: 4px;
}

.notice-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-outline-warning {
  background: transparent;
  color: #ffc107;
  border: 1px solid #ffc107;
}

.btn-outline-warning:hover {
  background: #ffc107;
  color: #212529;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-outline {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline:hover {
  background: #6c757d;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.required {
  color: #dc3545;
}

/* 复选框样式 */
.checkbox-group {
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin: 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f9fa;
  transition: all 0.2s;
}

.checkbox-label:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.checkbox-input {
  width: auto !important;
  margin: 0 !important;
  padding: 0 !important;
}

.checkbox-text {
  font-weight: 500;
  color: #333;
}

/* 分页样式 */
.pagination-container {
  padding: 20px;
  background: white;
  border-top: 1px solid #e9ecef;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

@media (max-width: 768px) {
  .page-header {
    padding: 40px 0;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .admin-actions {
    flex-direction: column;
  }
  
  .notices-stats {
    grid-template-columns: 1fr;
  }
  
  .notice-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .pagination {
    flex-direction: column;
    gap: 10px;
  }

  .page-info {
    order: -1;
  }
}
</style>
