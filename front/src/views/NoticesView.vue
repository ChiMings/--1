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
              <button @click="deleteNotice(notice)" class="btn btn-sm btn-danger">
                🗑️ 删除
              </button>
            </div>
          </div>
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

// 模拟公告数据
const mockNotices = [
  {
    id: 1,
    title: '🎉 校园二手交易平台正式上线！',
    content: `<p>亲爱的同学们，</p>
              <p>经过开发团队的不懈努力，<strong>校园二手交易平台</strong>正式上线了！</p>
              <p>平台主要功能：</p>
              <ul>
                <li>📱 发布和浏览二手商品</li>
                <li>💬 私信沟通交易详情</li>
                <li>⭐ 收藏心仪商品</li>
                <li>🔍 智能搜索和分类筛选</li>
              </ul>
              <p>欢迎大家积极使用，共建绿色环保的校园交易环境！</p>`,
    author: '系统管理员',
    priority: 'important',
    isPinned: true,
    createdAt: '2023-11-01T10:00:00Z',
    expiresAt: null
  },
  {
    id: 2,
    title: '⚠️ 交易安全须知',
    content: `<p>为保障大家的交易安全，请注意以下几点：</p>
              <ol>
                <li><strong>当面交易</strong>：建议选择校内公共场所进行交易</li>
                <li><strong>验货付款</strong>：先验货再付款，确保商品质量</li>
                <li><strong>保留凭证</strong>：保留交易记录和聊天截图</li>
                <li><strong>举报违规</strong>：发现可疑行为及时举报</li>
              </ol>
              <p>如遇到问题，请及时联系平台客服。</p>`,
    author: '安全管理员',
    priority: 'urgent',
    isPinned: true,
    createdAt: '2023-11-02T14:30:00Z',
    expiresAt: null
  },
  {
    id: 3,
    title: '📖 平台使用指南',
    content: `<p>新用户使用指南：</p>
              <p><strong>1. 账号激活</strong></p>
              <p>首次登录需要完成账号激活，激活后可享受完整功能。</p>
              <p><strong>2. 发布商品</strong></p>
              <p>点击"发布商品"按钮，填写商品信息、上传图片、设置价格。</p>
              <p><strong>3. 搜索商品</strong></p>
              <p>使用搜索框或分类筛选查找心仪商品。</p>
              <p><strong>4. 联系卖家</strong></p>
              <p>通过私信功能与卖家沟通交易详情。</p>`,
    author: '客服团队',
    priority: 'normal',
    isPinned: false,
    createdAt: '2023-11-03T09:15:00Z',
    expiresAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 4,
    title: '🛠️ 系统维护通知',
    content: `<p>系统将于本周六凌晨2:00-4:00进行例行维护。</p>
              <p>维护期间可能无法正常访问，请大家提前安排好交易事宜。</p>
              <p>维护内容包括：</p>
              <ul>
                <li>性能优化</li>
                <li>安全更新</li>
                <li>Bug修复</li>
              </ul>
              <p>感谢大家的理解与支持！</p>`,
    author: '技术团队',
    priority: 'normal',
    isPinned: false,
    createdAt: '2023-11-05T16:20:00Z',
    expiresAt: '2023-11-12T00:00:00Z'
  }
];

// 方法
async function loadNotices() {
  try {
    loading.value = true;
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    notices.value = mockNotices;
  } catch (error) {
    console.error('Failed to load notices:', error);
  } finally {
    loading.value = false;
  }
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

function submitNotice() {
  if (!noticeForm.title || !noticeForm.content) return;
  
  const noticeData = {
    title: noticeForm.title,
    content: noticeForm.content,
    author: userStore.userInfo.nickname || userStore.userInfo.name,
    priority: noticeForm.priority,
    isPinned: noticeForm.isPinned,
    expiresAt: noticeForm.expiresAt || null,
    createdAt: new Date().toISOString()
  };
  
  if (isEditing.value && editingNotice.value) {
    // 更新公告
    const index = notices.value.findIndex(n => n.id === editingNotice.value.id);
    if (index !== -1) {
      notices.value[index] = { ...notices.value[index], ...noticeData };
    }
    alert('公告更新成功！');
  } else {
    // 创建新公告
    const newNotice = {
      id: Date.now(),
      ...noticeData
    };
    notices.value.unshift(newNotice);
    alert('公告发布成功！');
  }
  
  closeNoticeDialog();
}

function togglePin(notice) {
  notice.isPinned = !notice.isPinned;
  alert(`公告已${notice.isPinned ? '置顶' : '取消置顶'}`);
}

function deleteNotice(notice) {
  if (confirm('确定要删除这个公告吗？')) {
    const index = notices.value.findIndex(n => n.id === notice.id);
    if (index !== -1) {
      notices.value.splice(index, 1);
      alert('公告删除成功！');
    }
  }
}

function toggleManageMode() {
  isManageMode.value = !isManageMode.value;
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
}
</style>
