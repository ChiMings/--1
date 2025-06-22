<template>
  <div class="my-reports-page">
    <div class="page-header">
      <h1>我的举报</h1>
      <p>查看您提交的举报记录和处理状态</p>
    </div>

    <!-- 统计信息 -->
    <div class="reports-stats">
      <div class="stat-item">
        <span class="count">{{ reports.length }}</span>
        <span class="label">总举报数</span>
      </div>
      <div class="stat-item">
        <span class="count pending">{{ pendingCount }}</span>
        <span class="label">待处理</span>
      </div>
      <div class="stat-item">
        <span class="count processed">{{ processedCount }}</span>
        <span class="label">已处理</span>
      </div>
      <div class="stat-item">
        <span class="count rejected">{{ rejectedCount }}</span>
        <span class="label">已驳回</span>
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

    <!-- 举报列表 -->
    <div class="reports-container">
      <div v-if="loading" class="loading">
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredReports.length === 0" class="empty-reports">
        <div class="empty-icon">📢</div>
        <h3>暂无{{ getFilterLabel() }}举报</h3>
        <p>{{ getEmptyMessage() }}</p>
      </div>

      <div v-else class="reports-list">
        <div 
          v-for="report in filteredReports"
          :key="report.id"
          class="report-item"
        >
          <div class="report-header">
            <div class="report-info">
              <div class="report-reason">
                <strong>{{ report.reason }}</strong>
              </div>
              <div class="report-time">{{ formatTime(report.createdAt) }}</div>
            </div>
            <span :class="['report-status', getStatusClass(report.status)]">
              {{ getStatusText(report.status) }}
            </span>
          </div>

          <div class="report-content">
            <div v-if="report.product" class="product-info">
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
              </div>
            </div>

            <div v-if="report.content" class="report-description">
              <strong>详细描述：</strong>{{ report.content }}
            </div>
          </div>

          <div class="report-actions">
            <button 
              v-if="report.product"
              @click="viewProduct(report.product.id)"
              class="btn btn-sm btn-outline-primary"
            >
              查看商品
            </button>
            
            <button 
              v-if="report.status === '待处理'"
              @click="cancelReport(report)"
              class="btn btn-sm btn-outline-danger"
            >
              撤销举报
            </button>
            
            <button 
              @click="viewReportDetail(report)"
              class="btn btn-sm btn-outline-secondary"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
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

    <!-- 举报详情弹窗 -->
    <div v-if="showDetailDialog" class="modal-overlay" @click="closeDetailDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>举报详情</h3>
          <button @click="closeDetailDialog" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div v-if="selectedReport" class="report-detail">
            <div class="detail-row">
              <strong>举报原因：</strong>{{ selectedReport.reason }}
            </div>
            
            <div v-if="selectedReport.content" class="detail-row">
              <strong>详细描述：</strong>{{ selectedReport.content }}
            </div>
            
            <div class="detail-row">
              <strong>举报状态：</strong>
              <span :class="['report-status', getStatusClass(selectedReport.status)]">
                {{ getStatusText(selectedReport.status) }}
              </span>
            </div>
            
            <div class="detail-row">
              <strong>举报时间：</strong>{{ formatDate(selectedReport.createdAt) }}
            </div>
            
            <div v-if="selectedReport.updatedAt !== selectedReport.createdAt" class="detail-row">
              <strong>更新时间：</strong>{{ formatDate(selectedReport.updatedAt) }}
            </div>
            
            <div v-if="selectedReport.product" class="detail-row">
              <strong>举报商品：</strong>{{ selectedReport.product.name }}
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeDetailDialog" class="btn btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { getMyReports, cancelReport as cancelReportAPI } from '@/api/reports';
import { config } from '@/utils/config';

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const reports = ref([]);
const selectedFilter = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);

// 弹窗相关
const showDetailDialog = ref(false);
const selectedReport = ref(null);

// 筛选选项
const filterOptions = computed(() => {
  const counts = reports.value.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {});

  return [
    { value: 'all', label: '全部', count: reports.value.length },
    { value: '待处理', label: '待处理', count: counts['待处理'] || 0 },
    { value: '已处理', label: '已处理', count: counts['已处理'] || 0 },
    { value: '已驳回', label: '已驳回', count: counts['已驳回'] || 0 }
  ];
});

// 计算属性
const pendingCount = computed(() => {
  return reports.value.filter(r => r.status === '待处理').length;
});

const processedCount = computed(() => {
  return reports.value.filter(r => r.status === '已处理').length;
});

const rejectedCount = computed(() => {
  return reports.value.filter(r => r.status === '已驳回').length;
});

const filteredReports = computed(() => {
  let filtered = [...reports.value];
  
  if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(r => r.status === selectedFilter.value);
  }
  
  // 按时间倒序排列
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filtered.slice(start, end);
});

const totalPages = computed(() => {
  let filtered = [...reports.value];
  
  if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(r => r.status === selectedFilter.value);
  }
  
  return Math.ceil(filtered.length / pageSize.value);
});

// 加载举报数据
async function loadReports() {
  try {
    loading.value = true;
    
    const response = await getMyReports();
    
    console.log('My Reports API Response:', response.data);
    
    // 应用内存中的API数据结构处理经验
    if (response.data.status === 'success') {
      const apiData = response.data.data || response.data;
      reports.value = apiData.items || [];
    } else {
      console.error('API Error:', response.data.message);
      reports.value = [];
    }
    
  } catch (error) {
    console.error('Failed to load reports:', error);
    // 如果API失败，可以显示空状态
    reports.value = [];
  } finally {
    loading.value = false;
  }
}

// 查看商品详情
function viewProduct(productId) {
  router.push(`/product/${productId}`);
}

// 撤销举报
async function cancelReport(report) {
  if (!confirm('确定要撤销这个举报吗？撤销后无法恢复。')) {
    return;
  }
  
  try {
    const response = await cancelReportAPI(report.id);
    
    if (response.data.status === 'success') {
      // 从本地列表中移除
      const index = reports.value.findIndex(r => r.id === report.id);
      if (index !== -1) {
        reports.value.splice(index, 1);
      }
      
      alert('举报已撤销');
    } else {
      throw new Error(response.data.message || '撤销失败');
    }
    
  } catch (error) {
    console.error('Failed to cancel report:', error);
    alert(error.message || '撤销失败，请重试');
  }
}

// 查看举报详情
function viewReportDetail(report) {
  selectedReport.value = report;
  showDetailDialog.value = true;
}

// 关闭详情弹窗
function closeDetailDialog() {
  showDetailDialog.value = false;
  selectedReport.value = null;
}

// 改变页码
function changePage(page) {
  currentPage.value = page;
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
    '已处理': 'status-processed',
    '已驳回': 'status-rejected'
  };
  return statusMap[status] || 'status-default';
}

function getProductStatusClass(status) {
  const statusMap = {
    '在售': 'product-available',
    '已售出': 'product-sold',
    '已下架': 'product-removed'
  };
  return statusMap[status] || 'product-default';
}

function getProductImage(product) {
  if (product.images && product.images.length > 0) {
    try {
      const images = typeof product.images === 'string' 
        ? JSON.parse(product.images) 
        : product.images;
      return images[0] || '/placeholder-image.jpg';
    } catch (e) {
      return '/placeholder-image.jpg';
    }
  }
  return '/placeholder-image.jpg';
}

function handleImageError(event) {
  event.target.src = '/placeholder-image.jpg';
}

function getFilterLabel() {
  const option = filterOptions.value.find(opt => opt.value === selectedFilter.value);
  return option && option.value !== 'all' ? option.label : '';
}

function getEmptyMessage() {
  switch (selectedFilter.value) {
    case '待处理':
      return '没有待处理的举报';
    case '已处理':
      return '没有已处理的举报';
    case '已驳回':
      return '没有被驳回的举报';
    default:
      return '您还没有提交过任何举报';
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

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 组件挂载
onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  
  loadReports();
});
</script>

<style scoped>
.my-reports-page {
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

.reports-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-item .count {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-item .count.pending {
  color: #ffc107;
}

.stat-item .count.processed {
  color: #28a745;
}

.stat-item .count.rejected {
  color: #dc3545;
}

.stat-item .label {
  color: #666;
  font-size: 12px;
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
  transition: all 0.2s;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-tab:hover {
  border-color: #007bff;
  color: #007bff;
}

.filter-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.count-badge {
  background: rgba(255, 255, 255, 0.3);
  color: inherit;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: bold;
}

.filter-tab.active .count-badge {
  background: rgba(255, 255, 255, 0.3);
}

.filter-tab:not(.active) .count-badge {
  background: #f8f9fa;
  color: #666;
}

.reports-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-reports {
  text-align: center;
  padding: 60px 20px;
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
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.report-item:last-child {
  border-bottom: none;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.report-info .report-reason {
  font-size: 16px;
  margin-bottom: 4px;
  color: #333;
}

.report-time {
  font-size: 12px;
  color: #666;
}

.report-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-processed {
  background: #d4edda;
  color: #155724;
}

.status-rejected {
  background: #f8d7da;
  color: #721c24;
}

.report-content {
  margin-bottom: 16px;
}

.product-info {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
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

.status-badge {
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

.report-description {
  color: #555;
  line-height: 1.5;
}

.report-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.page-info {
  color: #666;
  font-size: 14px;
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
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
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
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.report-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.detail-row strong {
  min-width: 80px;
  color: #333;
}

/* 按钮样式 */
.btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  transition: all 0.2s;
  background: white;
  color: #333;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-outline-primary {
  color: #007bff;
  border-color: #007bff;
}

.btn-outline-primary:hover {
  background: #007bff;
  color: white;
}

.btn-outline-danger {
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .my-reports-page {
    padding: 16px;
  }
  
  .reports-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-tabs {
    flex-direction: column;
  }
  
  .report-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .product-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .report-actions {
    flex-direction: column;
  }
}
</style> 