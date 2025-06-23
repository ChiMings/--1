<template>
  <div class="my-reports-view card frosted-glass">
    <!-- Page Header -->
    <div class="page-header">
      <h1><i class="fas fa-flag"></i> 我的举报</h1>
      <p class="subtitle">查看您提交的举报记录和处理状态</p>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper"><i class="fas fa-list-ul"></i></div>
        <div class="stat-info">
          <div class="stat-number">{{ reports.length }}</div>
          <div class="stat-label">总举报数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper icon-pending"><i class="fas fa-hourglass-half"></i></div>
        <div class="stat-info">
          <div class="stat-number">{{ pendingCount }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper icon-processed"><i class="fas fa-check-double"></i></div>
        <div class="stat-info">
          <div class="stat-number">{{ processedCount }}</div>
          <div class="stat-label">已处理</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper icon-rejected"><i class="fas fa-times-circle"></i></div>
        <div class="stat-info">
          <div class="stat-number">{{ rejectedCount }}</div>
          <div class="stat-label">已驳回</div>
        </div>
      </div>
    </div>
    
    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        v-for="filter in filterOptions"
        :key="filter.value"
        :class="['filter-tab', { 'active': selectedFilter === filter.value }]"
        @click="selectedFilter = filter.value"
      >
        <i :class="filter.icon"></i>
        <span>{{ filter.label }}</span>
        <span v-if="filter.count > 0" class="count-badge">{{ filter.count }}</span>
      </button>
    </div>

    <!-- Reports List -->
    <div class="reports-list-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载举报记录...</p>
      </div>
      
      <div v-else-if="filteredReports.length === 0" class="empty-state">
        <i class="fas fa-gavel fa-3x"></i>
        <h3>暂无{{ getFilterLabel() }}的举报记录</h3>
        <p>您可以在商品页面或用户主页发起举报</p>
      </div>

      <div v-else class="reports-list">
        <div v-for="report in paginatedReports" :key="report.id" class="report-item">
          <div class="report-main">
            <div class="report-details">
              <div class="report-reason">
                <strong>举报原因：</strong> {{ report.reason }}
              </div>
              <div v-if="report.content" class="report-description">
                <strong>详细描述：</strong> {{ report.content }}
              </div>
              <div class="report-meta">
                <i class="fas fa-clock"></i> {{ formatTime(report.createdAt) }}
              </div>
            </div>
            <div :class="['report-status-badge', getStatusClass(report.status)]">
              <i :class="getStatusIcon(report.status)"></i>
              {{ getStatusText(report.status) }}
            </div>
          </div>

          <div v-if="report.product" class="report-target">
            <div class="target-info">
              <img :src="getProductImage(report.product)" :alt="report.product.name" @error="handleImageError" class="target-image" />
              <div class="target-details">
                <div class="target-name">{{ report.product.name }}</div>
                <div class="target-price">¥{{ report.product.price }}</div>
              </div>
            </div>
            <div class="target-actions">
              <button @click="viewProduct(report.product.id)" class="btn btn-sm">
                <i class="fas fa-eye"></i> 查看商品
              </button>
            </div>
          </div>
          
          <div class="report-footer">
            <div class="admin-reply" v-if="report.status !== '待处理' && report.adminComment">
              <strong>处理说明：</strong> {{ report.adminComment }}
            </div>
            <div class="report-actions">
              <button v-if="report.status === '待处理'" @click="cancelReport(report)" class="btn btn-sm btn-danger">
                <i class="fas fa-ban"></i> 撤销举报
              </button>
            </div>
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

    <!-- Details modal is removed for now to simplify, can be re-added if needed -->
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
    { value: 'all', label: '全部', count: reports.value.length, icon: 'fas fa-list' },
    { value: '待处理', label: '待处理', count: counts['待处理'] || 0, icon: 'fas fa-hourglass-half' },
    { value: '已处理', label: '已处理', count: counts['已处理'] || 0, icon: 'fas fa-check-double' },
    { value: '已驳回', label: '已驳回', count: counts['已驳回'] || 0, icon: 'fas fa-times-circle' }
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
  return Math.ceil(filteredReports.value.length / pageSize.value);
});

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredReports.value.slice(start, end);
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
  router.push(`/products/${productId}`);
}

// 撤销举报
async function cancelReport(report) {
  if (confirm('确定要撤销这条举报吗？')) {
    try {
      await cancelReportAPI(report.id);
      fetchReports();
      alert('举报已撤销');
    } catch (error) {
      console.error('撤销举报失败:', error);
      alert('操作失败，请重试');
    }
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
  if (page > 0 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

// 工具函数
function getStatusText(status) {
  const map = {
    '待处理': '待处理',
    '已处理': '已处理',
    '已驳回': '已驳回',
  };
  return map[status] || '未知';
}

function getStatusClass(status) {
  const map = {
    '待处理': 'status-pending',
    '已处理': 'status-processed',
    '已驳回': 'status-rejected',
  };
  return map[status] || 'status-unknown';
}

function getStatusIcon(status) {
  const map = {
    '待处理': 'fas fa-hourglass-half',
    '已处理': 'fas fa-check-double',
    '已驳回': 'fas fa-times-circle',
  };
  return map[status] || 'fas fa-question-circle';
}

function getProductImage(product) {
  if (product.images && product.images.length > 0) {
    return product.images[0].startsWith('http') ? product.images[0] : `${config.API_URL}${product.images[0]}`;
  }
  return '/首页bj.jpg';
}

function handleImageError(event) {
  event.target.src = '/首页bj.jpg';
}

function getFilterLabel() {
  const filter = filterOptions.value.find(f => f.value === selectedFilter.value);
  return filter ? filter.label : '';
}

function formatTime(time) {
  return new Date(time).toLocaleString('zh-CN');
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
/* Main Layout */
.my-reports-view {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}
.page-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}
.page-header .subtitle {
  color: var(--text-color-secondary);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
}
.stat-card {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.stat-icon-wrapper {
  font-size: 1.5rem;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: white;
  background-color: var(--primary-color);
}
.stat-icon-wrapper.icon-pending { background-color: var(--warning-color); }
.stat-icon-wrapper.icon-processed { background-color: var(--success-color); }
.stat-icon-wrapper.icon-rejected { background-color: var(--danger-color); }

.stat-info .stat-number {
  font-size: 1.75rem;
  font-weight: 700;
}
.stat-info .stat-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background-color: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.filter-tab:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.filter-tab.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(var(--primary-color), 0.2);
}

.count-badge {
  background-color: rgba(0,0,0,0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 8px;
  font-size: 0.75rem;
}
.filter-tab.active .count-badge {
  background-color: rgba(255,255,255,0.2);
}

/* Reports List */
.reports-list-container {
  min-height: 300px;
}
.reports-list {
  display: grid;
  gap: 1.5rem;
}

.report-item {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  transition: all 0.3s ease;
}

.report-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.report-main {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.report-details .report-reason {
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.report-details .report-description {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}
.report-details .report-meta {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.report-status-badge {
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-weight: 500;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}
.status-pending { background-color: rgba(var(--warning-color), 0.1); color: var(--warning-color); }
.status-processed { background-color: rgba(var(--success-color), 0.1); color: var(--success-color); }
.status-rejected { background-color: rgba(var(--danger-color), 0.1); color: var(--danger-color); }

.report-target {
  background-color: rgba(0,0,0,0.05);
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.target-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.target-image {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}
.target-details .target-name {
  font-weight: 500;
}
.target-details .target-price {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}
.target-actions .btn i { margin-right: 0.4rem; }

.report-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.admin-reply {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}
.report-actions .btn i { margin-right: 0.4rem; }


/* States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-color-secondary);
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
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.pagination-controls .btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
}
</style> 