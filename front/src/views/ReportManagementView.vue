<template>
  <div class="report-management-page">
    <div class="page-header">
      <h1>举报管理</h1>
      <p>查看和处理用户举报</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-bullhorn"></i></div>
        <div class="stat-content">
          <div class="stat-number">{{ reportStats.total }}</div>
          <div class="stat-label">总举报数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-hourglass-half"></i></div>
        <div class="stat-content">
          <div class="stat-number">{{ reportStats.pending }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-check-double"></i></div>
        <div class="stat-content">
          <div class="stat-number">{{ reportStats.resolved }}</div>
          <div class="stat-label">已处理</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-gavel"></i></div>
        <div class="stat-content">
          <div class="stat-number">{{ reportStats.rejected }}</div>
          <div class="stat-label">已驳回</div>
        </div>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="filter-options">
        <select v-model="selectedStatus" @change="filterReports" class="filter-select">
          <option value="">全部状态</option>
          <option value="待处理">待处理</option>
          <option value="已处理">已处理</option>
          <option value="已驳回">已驳回</option>
        </select>
        

        
        <select v-model="sortBy" @change="sortReports" class="filter-select">
          <option value="createdAt">举报时间</option>
          <option value="status">状态</option>
        </select>
        
        <button @click="refreshReports" class="btn btn-outline">
          <i class="fas fa-sync-alt"></i> 刷新
        </button>
      </div>
    </div>

    <!-- 举报列表 -->
    <div class="reports-container">
      <div v-if="loading" class="loading">
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredReports.length === 0" class="empty-reports">
        <div class="empty-icon"><i class="fas fa-flag-checkered"></i></div>
        <h3>暂无举报</h3>
        <p>当前没有举报需要处理</p>
      </div>

      <div v-else class="reports-list">
        <div 
          v-for="report in paginatedReports" 
          :key="report.id" 
          class="report-item"
        >
          <div class="report-header">
            <div class="report-info">
              <span class="report-time">{{ formatDate(report.createdAt) }}</span>
            </div>
            <span :class="['report-status', getStatusClass(report.status)]">
              {{ getStatusText(report.status) }}
            </span>
          </div>
          
          <div class="report-content">
            <div class="report-reason">
              <strong>举报原因：</strong>{{ report.reason }}
            </div>
            <div v-if="report.content" class="report-description">
              <strong>详细描述：</strong>{{ report.content }}
            </div>
            <div v-if="report.product" class="report-target">
              <strong>举报商品：</strong>
              <div class="product-info">
                <div class="product-thumbnail">
                  <img 
                    :src="getProductImage(report.product)" 
                    :alt="report.product.name"
                    @error="handleImageError"
                  />
                </div>
                <div class="product-details">
                  <div class="product-name">{{ report.product.name }}</div>
                  <div class="product-price">¥{{ report.product.price }}</div>
                  <div class="product-status">
                    <span :class="['status-badge', getProductStatusClass(report.product.status)]">
                      {{ report.product.status }}
                    </span>
                  </div>
                  <div v-if="report.product.seller" class="product-seller">
                    卖家：{{ report.product.seller.nickname }}
                  </div>
                </div>
                <div class="product-actions">
                  <button 
                    @click="viewProduct(report.product.id)"
                    class="btn btn-xs btn-outline-primary"
                  >
                    查看商品
                  </button>
                </div>
              </div>
            </div>
            <div class="report-reporter">
              <strong>举报人：</strong>{{ report.reporter?.nickname || '匿名用户' }}
              <span v-if="report.reporter?.studentId" class="reporter-id">({{ report.reporter.studentId }})</span>
            </div>
          </div>
          
          <div class="report-actions">
            <button 
              v-if="report.status === '待处理'"
              @click="processReport(report, 'approved')"
              class="btn btn-sm btn-success"
              title="确认处理"
            >
              <i class="fas fa-check"></i> 确认处理
            </button>
            
            <button 
              v-if="report.status === '待处理'"
              @click="processReport(report, 'rejected')"
              class="btn btn-sm btn-warning"
              title="驳回举报"
            >
              <i class="fas fa-times"></i> 驳回
            </button>
            
            <button 
              @click="viewReportDetail(report)"
              class="btn btn-sm btn-outline"
              title="查看详情"
            >
              <i class="fas fa-search-plus"></i> 详情
            </button>
          </div>
        </div>
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
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
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

    <!-- 处理确认弹窗 -->
    <div v-if="showProcessDialog" class="modal-overlay" @click="closeProcessDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ processAction === 'approved' ? '确认处理举报' : '驳回举报' }}</h3>
          <button @click="closeProcessDialog" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="report-summary">
            <div class="summary-item">
              <strong>举报原因：</strong>{{ selectedReport?.reason }}
            </div>
            <div v-if="selectedReport?.product" class="summary-item">
              <strong>举报商品：</strong>{{ selectedReport?.product?.name }}
            </div>
          </div>
          
          <div class="process-note">
            <label>处理说明：</label>
            <textarea 
              v-model="processNote" 
              :placeholder="processAction === 'approved' ? '请说明处理结果...' : '请说明驳回原因...'"
              rows="3"
            ></textarea>
          </div>
          
          <div class="process-warning">
            <p v-if="processAction === 'approved'">
              <i class="fas fa-exclamation-triangle"></i> 确认处理后，被举报内容将被相应处理，举报人会收到通知
            </p>
            <p v-else>
              <i class="fas fa-exclamation-triangle"></i> 驳回后，此举报将标记为已驳回，举报人会收到通知
            </p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeProcessDialog" class="btn btn-outline">取消</button>
          <button 
            @click="confirmProcess"
            :disabled="!processNote.trim()"
            :class="['btn', processAction === 'approved' ? 'btn-success' : 'btn-warning']"
          >
            {{ processAction === 'approved' ? '确认处理' : '确认驳回' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { config } from '@/utils/config';
import { getAdminReports, processReport as processReportAPI, getAdminReportsStats } from '@/api/admin';

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const reports = ref([]);
const selectedStatus = ref('');

const sortBy = ref('createdAt');
const currentPage = ref(1);
const pageSize = 10;

// 处理弹窗
const showProcessDialog = ref(false);
const selectedReport = ref(null);
const processAction = ref('');
const processNote = ref('');



// 计算属性
const isAdmin = computed(() => {
  const role = userStore.userInfo?.role;
  return role === '管理员' || role === '超级管理员';
});

const reportStats = computed(() => {
  const total = reports.value.length;
  const pending = reports.value.filter(r => r.status === '待处理').length;
  const resolved = reports.value.filter(r => r.status === '已处理').length;
  const rejected = reports.value.filter(r => r.status === '已驳回').length;
  
  return { total, pending, resolved, rejected };
});

const filteredReports = computed(() => {
  let result = [...reports.value];
  
  // 状态筛选
  if (selectedStatus.value) {
    result = result.filter(report => report.status === selectedStatus.value);
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'createdAt':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'status':
        const statusOrder = { '待处理': 3, '已处理': 2, '已驳回': 1 };
        return statusOrder[b.status] - statusOrder[a.status];
      default:
        return 0;
    }
  });
  
  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredReports.value.length / pageSize);
});

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredReports.value.slice(start, end);
});

// 方法
async function loadReports() {
  try {
    loading.value = true;
    
    // 总是加载所有举报数据，不传递status参数
    const response = await getAdminReports();
    
    console.log('API Response:', response.data);
    
    if (response.data.status === 'success') {
      const apiData = response.data.data;
      // API 返回的数据在 data.items 字段中
      reports.value = apiData.items || [];
    } else {
      console.error('API Error:', response.data.message);
      reports.value = [];
    }
  } catch (error) {
    console.error('Failed to load reports:', error);
    reports.value = [];
  } finally {
    loading.value = false;
  }
}

function filterReports() {
  currentPage.value = 1;
  // 只改变页码，不重新加载数据，依靠 filteredReports computed 进行客户端筛选
}

function sortReports() {
  currentPage.value = 1;
}

function refreshReports() {
  selectedStatus.value = '';
  sortBy.value = 'createdAt';
  currentPage.value = 1;
  loadReports();
}

function viewProduct(productId) {
  router.push(`/product/${productId}`);
}

function getProductImage(product) {
  if (product.images && product.images.length > 0) {
    try {
      const images = typeof product.images === 'string' 
        ? JSON.parse(product.images) 
        : product.images;
      return images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOWbvueJhzwvdGV4dD4KPC9zdmc+';
    } catch (e) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOWbvueJhzwvdGV4dD4KPC9zdmc+';
    }
  }
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOWbvueJhzwvdGV4dD4KPC9zdmc+';
}

function handleImageError(event) {
  // 使用SVG占位图片，避免无限加载
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOWbvueJhzwvdGV4dD4KPC9zdmc+';
  // 移除事件监听器，防止重复触发
  event.target.onerror = null;
}

function getProductStatusClass(status) {
  const statusMap = {
    '在售': 'product-available',
    '已售出': 'product-sold',
    '已下架': 'product-removed'
  };
  return statusMap[status] || 'product-default';
}

function processReport(report, action) {
  selectedReport.value = report;
  processAction.value = action;
  processNote.value = '';
  showProcessDialog.value = true;
}

function closeProcessDialog() {
  showProcessDialog.value = false;
  selectedReport.value = null;
  processAction.value = '';
  processNote.value = '';
}

async function confirmProcess() {
  if (!selectedReport.value || !processNote.value.trim()) return;
  
  try {
    // 调用真实的API
    await processReportAPI(selectedReport.value.id, processAction.value, processNote.value);
    
    const actionText = processAction.value === 'approved' ? '处理' : '驳回';
    alert(`举报已${actionText}`);
    
    closeProcessDialog();
    
    // 处理完成后重新加载所有数据，确保显示最新状态
    await loadReports();
  } catch (error) {
    console.error('Failed to process report:', error);
    alert('操作失败，请重试');
  }
}

function viewReportDetail(report) {
  alert(`举报详情：\n\n原因：${report.reason}\n描述：${report.content || '无'}\n状态：${getStatusText(report.status)}\n举报时间：${formatDate(report.createdAt)}`);
}

// 工具函数
function getStatusText(status) {
  const statusMap = {
    '待处理': '待处理',
    '已处理': '已处理',
    '已驳回': '已驳回'
  };
  return statusMap[status] || status;
}

function getStatusClass(status) {
  const statusMap = {
    '待处理': 'status-pending',
    '已处理': 'status-resolved',
    '已驳回': 'status-rejected'
  };
  return statusMap[status] || 'status-default';
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 组件挂载
onMounted(() => {
  if (!isAdmin.value) {
    alert('您没有权限访问此页面');
    router.push('/admin/dashboard');
    return;
  }
  
  loadReports();
});
</script>

<style scoped>
.report-management-page {
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
}

.filter-options {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.reports-container {
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

.empty-reports {
  padding: 60px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-reports h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.empty-reports p {
  margin: 0;
  color: #666;
}

.reports-list {
  display: flex;
  flex-direction: column;
}

.report-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px;
  transition: background-color 0.2s;
}

.report-item:hover {
  background: #f8f9fa;
}

.report-item:last-child {
  border-bottom: none;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.report-info {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.report-type {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.type-product {
  background: #e3f2fd;
  color: #1976d2;
}

.type-comment {
  background: #f3e5f5;
  color: #7b1fa2;
}

.type-user {
  background: #fff3e0;
  color: #f57c00;
}

.report-priority {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.priority-high {
  background: #ffebee;
  color: #d32f2f;
}

.priority-medium {
  background: #fff3e0;
  color: #f57c00;
}

.priority-low {
  background: #e8f5e8;
  color: #388e3c;
}

.report-time {
  font-size: 12px;
  color: #666;
}

.report-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-resolved {
  background: #d4edda;
  color: #155724;
}

.status-rejected {
  background: #f8d7da;
  color: #721c24;
}

.report-content {
  margin-bottom: 16px;
  line-height: 1.5;
}

.report-content > div {
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
}

.product-info {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-top: 8px;
}

.product-thumbnail {
  flex-shrink: 0;
}

.product-thumbnail img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.product-details {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.product-price {
  color: #007bff;
  font-weight: bold;
  margin-bottom: 4px;
}

.product-status .status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.product-available {
  background: #d4edda;
  color: #155724;
}

.product-sold {
  background: #cce5ff;
  color: #004085;
}

.product-removed {
  background: #f8d7da;
  color: #721c24;
}

.product-seller {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.product-actions {
  align-self: flex-start;
}

.btn-xs {
  padding: 2px 6px;
  font-size: 10px;
}

.reporter-id {
  color: #666;
  font-size: 12px;
  margin-left: 4px;
}

.target-link {
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
}

.target-link:hover {
  color: #0056b3;
}

.report-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
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

.report-summary {
  margin-bottom: 20px;
}

.summary-item {
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
}

.process-note {
  margin-bottom: 16px;
}

.process-note label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.process-note textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.process-warning {
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
  .report-management-page {
    padding: 16px;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-options {
    flex-direction: column;
    align-items: stretch;
  }
  
  .report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .report-actions {
    justify-content: flex-start;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style> 