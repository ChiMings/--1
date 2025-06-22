<template>
  <div class="user-management-page">
    <div class="page-header">
      <h1>用户管理</h1>
      <p>管理平台所有用户和权限</p>
    </div>

    <!-- 统计信息 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-number">{{ userStats.total }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ userStats.verified }}</div>
          <div class="stat-label">认证用户</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-number">{{ userStats.unverified }}</div>
          <div class="stat-label">未认证用户</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🛠️</div>
        <div class="stat-content">
          <div class="stat-number">{{ userStats.admins }}</div>
          <div class="stat-label">管理员</div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="toolbar">
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索用户昵称、学号..."
          class="search-input"
        />
        <button @click="searchUsers" class="btn btn-primary">搜索</button>
      </div>
      
      <div class="filter-options">
        <select v-model="selectedRole" @change="filterUsers" class="filter-select">
          <option value="">全部角色</option>
          <option value="未认证用户">未认证用户</option>
          <option value="认证用户">认证用户</option>
          <option value="管理员">管理员</option>
          <option value="超级管理员">超级管理员</option>
        </select>
        
        <select v-model="sortBy" @change="sortUsers" class="filter-select">
          <option value="createdAt">注册时间</option>
          <option value="credit">信用分</option>
          <option value="nickname">昵称</option>
          <option value="studentId">学号</option>
        </select>
        
        <button @click="refreshUsers" class="btn btn-outline">
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="users-container">
      <div v-if="loading" class="loading">
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="empty-users">
        <div class="empty-icon">👤</div>
        <h3>未找到用户</h3>
        <p>尝试调整搜索条件或筛选器</p>
      </div>

      <div v-else class="users-table">
        <table>
          <thead>
            <tr>
              <th>用户信息</th>
              <th>角色</th>
              <th>注册时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id" class="user-row">
              <td class="user-info">
                <div class="user-avatar">
                  {{ user.nickname?.charAt(0) || 'U' }}
                </div>
                <div class="user-details">
                  <div class="user-name">{{ user.nickname || user.name }}</div>
                  <div class="user-meta">
                    <span class="student-id">{{ user.studentId }}</span>
                    <span v-if="user.contact" class="contact">{{ user.contact }}</span>
                  </div>
                </div>
              </td>
              
              <td>
                <span :class="['role-badge', getRoleClass(user.role)]">
                  {{ user.role }}
                </span>
              </td>
              
              <td class="date-cell">
                {{ formatDate(user.createdAt) }}
              </td>
              
              <td>
                <span :class="['status-badge', getStatusClass(user)]">
                  {{ getUserStatus(user) }}
                </span>
              </td>
              
              <td class="actions-cell">
                <div class="action-buttons">
                  <button 
                    @click="viewUserProfile(user)"
                    class="btn btn-sm btn-outline"
                    title="查看详情"
                  >
                    👁️
                  </button>
                  
                  <button 
                    v-if="canModifyRole(user)"
                    @click="showRoleModal(user)"
                    class="btn btn-sm btn-primary"
                    title="修改角色"
                  >
                    🛠️
                  </button>
                  
                  <button 
                    v-if="canSendMessage(user)"
                    @click="sendMessage(user)"
                    class="btn btn-sm btn-success"
                    title="发送私信"
                  >
                    💬
                  </button>
                  
                  <button 
                    v-if="canToggleStatus(user)"
                    @click="toggleUserStatus(user)"
                    :class="['btn', 'btn-sm', user.status === '正常' ? 'btn-warning' : 'btn-success']"
                    :title="user.status === '正常' ? '禁用用户' : '启用用户'"
                  >
                    {{ user.status === '正常' ? '🚫' : '✅' }}
                  </button>
                  
                  <button 
                    v-if="canResetPassword(user)"
                    @click="resetUserPassword(user)"
                    class="btn btn-sm btn-warning"
                    title="重置密码"
                  >
                    🔑
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="btn btn-outline"
        >
          上一页
        </button>
        
        <span class="page-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页（总计 {{ totalUsers }} 个用户）
        </span>
        
        <button 
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="btn btn-outline"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 角色修改弹窗 -->
    <div v-if="showRoleDialog" class="modal-overlay" @click="closeRoleModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>修改用户角色</h3>
          <button @click="closeRoleModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="user-info-card">
            <div class="user-avatar">
              {{ selectedUser?.nickname?.charAt(0) || 'U' }}
            </div>
            <div class="user-details">
              <div class="user-name">{{ selectedUser?.nickname || selectedUser?.name }}</div>
              <div class="user-meta">学号：{{ selectedUser?.studentId }}</div>
              <div class="current-role">
                当前角色：<span :class="getRoleClass(selectedUser?.role)">{{ selectedUser?.role }}</span>
              </div>
            </div>
          </div>
          
          <div class="role-options">
            <label class="role-option">
              <input 
                v-model="newRole" 
                type="radio" 
                value="认证用户"
                :disabled="!canSetRole('认证用户')"
              />
              <span class="role-label">
                <span class="role-name">认证用户</span>
                <span class="role-desc">基础功能权限</span>
              </span>
            </label>
            
            <label class="role-option">
              <input 
                v-model="newRole" 
                type="radio" 
                value="管理员"
                :disabled="!canSetRole('管理员')"
              />
              <span class="role-label">
                <span class="role-name">管理员</span>
                <span class="role-desc">商品和评论管理权限</span>
              </span>
            </label>
            

          </div>
          
          <div class="role-warning">
            <p>⚠️ 注意：修改用户角色会立即生效，请谨慎操作</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeRoleModal" class="btn btn-outline">取消</button>
          <button 
            @click="confirmRoleChange"
            :disabled="!newRole || newRole === selectedUser?.role"
            class="btn btn-primary"
          >
            确认修改
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { getAdminUsersList, getAdminUsersStats, updateUserRole, updateUserStatus } from '@/api/users';
import { config } from '@/utils/config';

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const users = ref([]);
const searchKeyword = ref('');
const selectedRole = ref('');
const sortBy = ref('createdAt');
const currentPage = ref(1);
const pageSize = 20;
const totalUsers = ref(0);
const totalPages = ref(0);
const statsData = ref({ total: 0, verified: 0, unverified: 0, admins: 0 });

// 角色修改弹窗
const showRoleDialog = ref(false);
const selectedUser = ref(null);
const newRole = ref('');

// 计算属性
const isSuperAdmin = computed(() => {
  return userStore.userInfo?.role === '超级管理员';
});

const userStats = computed(() => {
  return statsData.value;
});

// 模拟数据和实际API数据使用不同的分页逻辑
const filteredUsers = computed(() => {
  if (config.useMockData) {
    // 模拟数据需要前端筛选和排序
    let result = [...users.value];
    
    // 搜索筛选
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      result = result.filter(user => 
        user.nickname?.toLowerCase().includes(keyword) ||
        user.name?.toLowerCase().includes(keyword) ||
        user.studentId?.includes(keyword)
      );
    }
    
    // 角色筛选
    if (selectedRole.value) {
      result = result.filter(user => user.role === selectedRole.value);
    }
    
    // 排序
    result.sort((a, b) => {
      switch (sortBy.value) {
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'credit':
          return (b.credit || 0) - (a.credit || 0);
        case 'nickname':
          return (a.nickname || a.name).localeCompare(b.nickname || b.name);
        case 'studentId':
          return a.studentId.localeCompare(b.studentId);
        default:
          return 0;
      }
    });
    
    return result;
  } else {
    // 真实API数据已经在后端筛选和排序
    return users.value;
  }
});

const paginatedUsers = computed(() => {
  if (config.useMockData) {
    // 模拟数据需要前端分页
    const start = (currentPage.value - 1) * pageSize;
    const end = start + pageSize;
    return filteredUsers.value.slice(start, end);
  } else {
    // 真实API数据已经分页
    return users.value;
  }
});

// 监听搜索和筛选条件变化，自动重新加载数据
watch([searchKeyword, selectedRole, sortBy, currentPage], () => {
  if (!config.useMockData) {
    loadUsers();
  }
}, { deep: true });

// 加载用户统计数据
async function loadUserStats() {
  try {
    const response = await getAdminUsersStats();
    if (config.useMockData) {
      statsData.value = response.data || { total: 0, verified: 0, unverified: 0, admins: 0 };
    } else {
      // 真实API数据结构：response.data.data
      const apiData = response.data.data || response.data;
      statsData.value = apiData || { total: 0, verified: 0, unverified: 0, admins: 0 };
    }
    
    console.log('加载用户统计成功:', {
      原始响应: response.data,
      统计数据: statsData.value
    });
  } catch (error) {
    console.error('Failed to load user stats:', error);
  }
}

// 方法
async function loadUsers() {
  try {
    loading.value = true;
    
    const params = {
      page: currentPage.value,
      limit: pageSize,
      search: searchKeyword.value || undefined,
      role: selectedRole.value || undefined,
      sortBy: sortBy.value || 'createdAt'
    };
    
    const response = await getAdminUsersList(params);
    
    if (config.useMockData) {
      // 模拟数据结构
      users.value = response.data.data || response.data || [];
      totalUsers.value = users.value.length;
      totalPages.value = Math.ceil(totalUsers.value / pageSize);
    } else {
      // 真实API数据结构：response.data.data.users
      const apiData = response.data.data || response.data;
      users.value = apiData.users || [];
      totalUsers.value = apiData.pagination?.total || 0;
      totalPages.value = apiData.pagination?.totalPages || 1;
    }
    
    console.log('加载用户数据成功:', {
      原始响应: response.data,
      解析后用户数量: users.value.length,
      总用户数: totalUsers.value,
      总页数: totalPages.value,
      用户数据: users.value.slice(0, 2) // 只显示前两个用户以避免日志过长
    });
    
  } catch (error) {
    console.error('Failed to load users:', error);
    alert('加载用户列表失败，请检查网络连接');
  } finally {
    loading.value = false;
  }
}

function searchUsers() {
  currentPage.value = 1;
  if (!config.useMockData) {
    loadUsers();
  }
}

function filterUsers() {
  currentPage.value = 1;
  if (!config.useMockData) {
    loadUsers();
  }
}

function sortUsers() {
  currentPage.value = 1;
  if (!config.useMockData) {
    loadUsers();
  }
}

function refreshUsers() {
  searchKeyword.value = '';
  selectedRole.value = '';
  sortBy.value = 'createdAt';
  currentPage.value = 1;
  loadUsers();
  loadUserStats();
}

function viewUserProfile(user) {
  router.push(`/profile/${user.id}`);
}

function showRoleModal(user) {
  selectedUser.value = user;
  newRole.value = user.role;
  showRoleDialog.value = true;
}

function closeRoleModal() {
  showRoleDialog.value = false;
  selectedUser.value = null;
  newRole.value = '';
}

async function confirmRoleChange() {
  if (!selectedUser.value || !newRole.value) return;
  
  try {
    const response = await updateUserRole(selectedUser.value.id, newRole.value);
    
    // 更新本地数据
    const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id);
    if (userIndex !== -1) {
      users.value[userIndex].role = newRole.value;
    }
    
    alert(`用户 "${selectedUser.value.nickname || selectedUser.value.name}" 的角色已修改为 "${newRole.value}"`);
    closeRoleModal();
    
    // 重新加载数据以确保同步
    loadUsers();
    
  } catch (error) {
    console.error('Failed to update user role:', error);
    alert('修改角色失败：' + (error.response?.data?.message || error.message));
  }
}

function sendMessage(user) {
  router.push('/user/messages');
}

function resetUserPassword(user) {
  if (confirm(`确定要重置用户 "${user.nickname || user.name}" 的密码吗？\n重置后将发送新密码到用户注册邮箱。`)) {
    alert('密码重置功能开发中');
  }
}

// 权限检查
function canModifyRole(user) {
  if (!isSuperAdmin.value) return false;
  if (user.id === userStore.userInfo?.id) return false; // 不能修改自己
  return true;
}

function canSetRole(role) {
  const currentUserRole = userStore.userInfo?.role;
  
  // 超级管理员不能设置其他人为超级管理员
  if (role === '超级管理员') {
    return false;
  }
  
  // 管理员不能设置其他人为管理员或超级管理员
  if (currentUserRole === '管理员' && (role === '管理员' || role === '超级管理员')) {
    return false;
  }
  
  // 只有超级管理员可以设置认证用户和管理员
  if (currentUserRole === '超级管理员' && (role === '认证用户' || role === '管理员')) {
    return true;
  }
  
  return false;
}

function canSendMessage(user) {
  return user.id !== userStore.userInfo?.id;
}

function canToggleStatus(user) {
  return isSuperAdmin.value && user.id !== userStore.userInfo?.id;
}

function canResetPassword(user) {
  return isSuperAdmin.value && user.id !== userStore.userInfo?.id;
}

async function toggleUserStatus(user) {
  const newStatus = user.status === '正常' ? '禁用' : '正常';
  const action = newStatus === '正常' ? '启用' : '禁用';
  
  if (confirm(`确定要${action}用户 "${user.nickname || user.name}" 吗？`)) {
    try {
      const response = await updateUserStatus(user.id, newStatus);
      
      // 更新本地数据
      const userIndex = users.value.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users.value[userIndex].status = newStatus;
      }
      
      alert(`用户 "${user.nickname || user.name}" 已${action}`);
      
      // 重新加载数据以确保同步
      loadUsers();
      
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert(`${action}用户失败：` + (error.response?.data?.message || error.message));
    }
  }
}

// 工具函数
function getRoleClass(role) {
  const roleMap = {
    '未认证用户': 'role-unverified',
    '认证用户': 'role-verified',
    '管理员': 'role-admin',
    '超级管理员': 'role-super-admin'
  };
  return roleMap[role] || 'role-default';
}

function getCreditClass(credit) {
  if (credit >= 95) return 'credit-excellent';
  if (credit >= 85) return 'credit-good';
  if (credit >= 70) return 'credit-fair';
  return 'credit-poor';
}

function getCreditStars(credit) {
  const level = Math.floor((credit || 0) / 20);
  return '★'.repeat(Math.min(level, 5)) + '☆'.repeat(Math.max(0, 5 - level));
}

function getUserStatus(user) {
  if (user.role === '未认证用户') return '未认证';
  if (user.role === '管理员' || user.role === '超级管理员') return '管理员';
  return '正常';
}

function getStatusClass(user) {
  if (user.role === '未认证用户') return 'status-unverified';
  if (user.role === '管理员' || user.role === '超级管理员') return 'status-admin';
  return 'status-normal';
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// 组件挂载
onMounted(() => {
  if (!isSuperAdmin.value) {
    alert('您没有权限访问此页面');
    router.push('/admin/dashboard');
    return;
  }
  
  loadUsers();
  loadUserStats();
});
</script>

<style scoped>
.user-management-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 32px;
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

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  color: #666;
  font-size: 12px;
}

.toolbar {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  gap: 8px;
  flex: 1;
  max-width: 400px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-options {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.users-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading {
  padding: 60px;
  text-align: center;
  color: #666;
}

.empty-users {
  padding: 60px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-users h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.empty-users p {
  margin: 0;
  color: #666;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.users-table th {
  background: #f8f9fa;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.user-row:hover {
  background: #f8f9fa;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.user-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.role-unverified {
  background: #fff3cd;
  color: #856404;
}

.role-verified {
  background: #d4edda;
  color: #155724;
}

.role-admin {
  background: #d1ecf1;
  color: #0c5460;
}

.role-super-admin {
  background: #f8d7da;
  color: #721c24;
}

.credit-display {
  text-align: center;
}

.credit-excellent { color: #28a745; font-weight: bold; }
.credit-good { color: #007bff; }
.credit-fair { color: #ffc107; }
.credit-poor { color: #dc3545; }

.credit-stars {
  font-size: 10px;
  color: #ffc107;
}

.date-cell {
  font-size: 12px;
  color: #666;
}

.status-badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.status-unverified {
  background: #fff3cd;
  color: #856404;
}

.status-excellent {
  background: #d4edda;
  color: #155724;
}

.status-normal {
  background: #e2e3e5;
  color: #495057;
}

.status-watch {
  background: #f8d7da;
  color: #721c24;
}

.actions-cell {
  width: 160px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
  min-width: 28px;
  height: 28px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.page-info {
  font-size: 14px;
  color: #666;
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
}

.user-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 24px;
}

.user-info-card .user-avatar {
  width: 48px;
  height: 48px;
  font-size: 18px;
}

.user-info-card .user-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.user-info-card .user-meta {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.current-role {
  font-size: 14px;
  color: #333;
}

.role-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-option:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.role-option input[type="radio"] {
  margin: 0;
}

.role-option input[type="radio"]:disabled {
  cursor: not-allowed;
}

.role-option:has(input:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

.role-label {
  flex: 1;
}

.role-name {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.role-desc {
  display: block;
  font-size: 12px;
  color: #666;
}

.role-warning {
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #856404;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .user-management-page {
    padding: 16px;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .filter-options {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .users-table {
    overflow-x: auto;
  }
  
  .users-table table {
    min-width: 800px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style> 