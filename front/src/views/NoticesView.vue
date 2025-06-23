<template>
  <div class="notices-view">
    <div class="frosted-glass content-card">
      <!-- Header -->
      <div class="card-header">
        <h2 class="page-title">
          <i class="fas fa-bullhorn"></i> 系统公告
        </h2>
        <div v-if="isSuperAdmin" class="admin-controls">
          <button @click="showCreateNotice" class="btn btn-primary">
            <i class="fas fa-plus"></i> 发布新公告
          </button>
          <button @click="toggleManageMode" class="btn">
            <i :class="isManageMode ? 'fas fa-times' : 'fas fa-edit'"></i>
            {{ isManageMode ? '退出管理' : '管理公告' }}
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrapper"><i class="fas fa-file-alt"></i></div>
          <div class="stat-info">
            <div class="stat-number">{{ notices.length }}</div>
            <div class="stat-label">总公告数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper"><i class="fas fa-check-circle"></i></div>
          <div class="stat-info">
            <div class="stat-number">{{ activeNotices.length }}</div>
            <div class="stat-label">有效公告</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper"><i class="fas fa-thumbtack"></i></div>
          <div class="stat-info">
            <div class="stat-number">{{ pinnedNotices.length }}</div>
            <div class="stat-label">置顶公告</div>
          </div>
        </div>
      </div>
      
      <!-- Notices List -->
      <div class="notices-list-container">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>正在加载公告...</p>
        </div>

        <div v-else-if="filteredNotices.length === 0" class="empty-state">
          <i class="fas fa-inbox fa-3x"></i>
          <h3>暂无公告</h3>
          <p v-if="isSuperAdmin">点击"发布新公告"来发布第一个公告</p>
          <p v-else>目前还没有系统公告，请稍后查看</p>
        </div>

        <div v-else class="notices-list">
          <div
            v-for="notice in filteredNotices"
            :key="notice.id"
            :class="['notice-item', { 'is-pinned': notice.isPinned, 'is-expired': isExpired(notice) }]"
          >
            <div class="notice-header">
              <h3 class="notice-title">{{ notice.title }}</h3>
              <div class="notice-tags">
                <span v-if="notice.isPinned" class="tag tag-pinned"><i class="fas fa-thumbtack"></i> 置顶</span>
                <span v-if="notice.priority === 'urgent'" class="tag tag-urgent"><i class="fas fa-exclamation-triangle"></i> 紧急</span>
                <span v-if="notice.priority === 'important'" class="tag tag-important"><i class="fas fa-info-circle"></i> 重要</span>
                <span v-if="isExpired(notice)" class="tag tag-expired"><i class="fas fa-clock"></i> 已过期</span>
              </div>
            </div>
            <div class="notice-meta">
              <span><i class="fas fa-user"></i> {{ notice.author }}</span>
              <span><i class="fas fa-calendar-alt"></i> {{ formatDate(notice.createdAt) }}</span>
              <span v-if="notice.expiresAt"><i class="fas fa-hourglass-end"></i> 有效期至: {{ formatDate(notice.expiresAt) }}</span>
            </div>
            <div class="notice-body" v-html="formatContent(notice.content)"></div>
            <div v-if="isSuperAdmin && isManageMode" class="notice-actions">
              <button @click="editNotice(notice)" class="btn btn-sm">
                <i class="fas fa-pencil-alt"></i> 编辑
              </button>
              <button @click="togglePin(notice)" :class="['btn', 'btn-sm', notice.isPinned ? 'btn-secondary' : '']">
                <i :class="notice.isPinned ? 'fas fa-unlink' : 'fas fa-thumbtack'"></i> {{ notice.isPinned ? '取消置顶' : '置顶' }}
              </button>
              <button @click="handleDeleteNotice(notice)" class="btn btn-sm btn-danger">
                <i class="fas fa-trash-alt"></i> 删除
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination-controls">
          <button @click="changePage(currentPage - 1)" :disabled="currentPage <= 1" class="btn">
              <i class="fas fa-chevron-left"></i>
          </button>
          <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages" class="btn">
              <i class="fas fa-chevron-right"></i>
          </button>
      </div>
    </div>

    <!-- Create/Edit Notice Modal -->
    <transition name="modal-fade">
      <div v-if="showNoticeDialog" class="modal-backdrop" @click="closeNoticeDialog">
        <div class="modal-dialog frosted-glass" @click.stop>
          <div class="modal-header">
            <h3>{{ isEditing ? '编辑公告' : '发布新公告' }}</h3>
            <button @click="closeNoticeDialog" class="close-button">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitNotice">
              <div class="form-group">
                <label for="notice-title">公告标题 <span class="required-mark">*</span></label>
                <input id="notice-title" v-model="noticeForm.title" type="text" placeholder="请输入公告标题" required class="form-control" />
              </div>
              
              <div class="form-grid">
                <div class="form-group">
                  <label for="notice-priority">优先级</label>
                  <select id="notice-priority" v-model="noticeForm.priority" class="form-control">
                    <option value="normal">普通</option>
                    <option value="important">重要</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
                <div class="form-group checkbox-group">
                  <input id="notice-pinned" v-model="noticeForm.isPinned" type="checkbox" class="custom-checkbox" />
                  <label for="notice-pinned">置顶显示</label>
                </div>
              </div>
              
              <div class="form-group">
                <label for="notice-expires">有效期</label>
                <input id="notice-expires" v-model="noticeForm.expiresAt" type="datetime-local" class="form-control" />
                <small class="form-text">留空表示永久有效</small>
              </div>
              
              <div class="form-group">
                <label for="notice-content">公告内容 <span class="required-mark">*</span></label>
                <textarea id="notice-content" v-model="noticeForm.content" rows="8" placeholder="请输入公告内容，支持 Markdown 和部分 HTML" required class="form-control"></textarea>
                <small class="form-text">支持 &lt;strong&gt;bold&lt;/strong&gt;, &lt;em&gt;italic&lt;/em&gt;, &lt;a href="#"&gt;links&lt;/a&gt; 等.</small>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button @click="closeNoticeDialog" class="btn btn-secondary">取消</button>
            <button @click="submitNotice" :disabled="!noticeForm.title || !noticeForm.content" class="btn btn-primary">
              <i class="fas fa-paper-plane"></i> {{ isEditing ? '更新公告' : '发布公告' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
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
/* Main Layout */
.notices-view {
  padding: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.content-card {
  padding: 2rem;
  border-radius: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-controls {
  display: flex;
  gap: 1rem;
}

.admin-controls .btn i {
  margin-right: 0.5rem;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s ease, background-color 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  background-color: rgba(255, 255, 255, 0.2);
}

.stat-icon-wrapper {
  font-size: 1.75rem;
  color: var(--primary-color);
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  background-color: rgba(var(--primary-color-rgb), 0.1);
  border-radius: 50%;
}

.stat-info .stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-info .stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Notices List */
.notices-list-container {
  min-height: 300px;
}

.notices-list {
  display: grid;
  gap: 1.5rem;
}

.notice-item {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.notice-item:hover {
  border-color: var(--primary-color);
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.notice-item.is-pinned {
  border-left: 4px solid var(--primary-color);
}

.notice-item.is-expired {
  opacity: 0.6;
}
.notice-item.is-expired .notice-title {
 text-decoration: line-through;
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.notice-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.notice-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.tag-pinned { background-color: rgba(var(--primary-color-rgb), 0.2); color: var(--primary-color); }
.tag-urgent { background-color: rgba(239, 68, 68, 0.2); color: #ef4444; }
.tag-important { background-color: rgba(234, 179, 8, 0.2); color: #eab308; }
.tag-expired { background-color: rgba(107, 114, 128, 0.2); color: #6b7280; }

.notice-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.notice-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.notice-body {
  color: var(--text-secondary);
  line-height: 1.6;
}
.notice-body ::v-deep(p) {
  margin-bottom: 1rem;
}
.notice-body ::v-deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}
.notice-body ::v-deep(a:hover) {
  text-decoration: underline;
}

.notice-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}
.notice-actions .btn i {
  margin-right: 0.3rem;
}

/* Loading and Empty States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-secondary);
}
.empty-state i {
  color: var(--text-primary);
  opacity: 0.5;
  margin-bottom: 1rem;
}
.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

/* Pagination */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.pagination-controls .btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
}


/* Modal */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-dialog {
  width: 90%;
  max-width: 700px;
  border-radius: 1.5rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}

.modal-header {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.modal-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}
.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.3s;
  padding: 0.5rem;
  line-height: 1;
}
.close-button:hover { color: var(--text-primary); }

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex-grow: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.required-mark {
  color: var(--danger-color);
}

.form-text {
  display: block;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1.5rem; /* Align with label of sibling */
}
.checkbox-group label {
  margin-bottom: 0;
  color: var(--text-primary);
  cursor: pointer;
}

.custom-checkbox {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border-color);
  border-radius: 0.375rem;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}
.custom-checkbox:checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}
.custom-checkbox:checked::after {
  content: "✔";
  color: white;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
}

.modal-footer {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}
</style>
