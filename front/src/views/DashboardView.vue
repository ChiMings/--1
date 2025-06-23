<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1>数据看板</h1>
      <p>平台关键运营数据概览</p>
    </div>

    <!-- 概览统计卡片 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon users"><i class="fas fa-users"></i></div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
          <div class="stat-change positive">
            +{{ stats.todayVerifiedUsers }} 今日新认证
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon products"><i class="fas fa-box-open"></i></div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalProducts }}</div>
          <div class="stat-label">商品总数</div>
          <div class="stat-change positive">
            +{{ stats.todayProducts }} 今日发布
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon transactions"><i class="fas fa-hand-holding-usd"></i></div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalTransactions }}</div>
          <div class="stat-label">交易总数</div>
          <div class="stat-change positive">
            +{{ stats.todayTransactions }} 今日交易
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon active"><i class="fas fa-bolt"></i></div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.activeUsers }}</div>
          <div class="stat-label">活跃用户</div>
          <div class="stat-change">
            近7天
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-container">
        <div class="chart-header">
          <h3>认证用户增长趋势</h3>
          <div class="chart-actions">
            <select v-model="selectedPeriod" @change="loadChartData">
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
            </select>
          </div>
        </div>
        <div class="chart-content">
          <div class="simple-chart">
            <div 
              v-for="(point, index) in userGrowthData"
              :key="index"
              class="chart-bar"
              :style="{ height: `${(point.count / maxUserCount) * 100}%` }"
              :title="`${point.date}: ${point.count}人`"
            >
              <div class="bar-value">{{ point.count }}</div>
            </div>
          </div>
          <div class="chart-labels">
            <span 
              v-for="(point, index) in userGrowthData"
              :key="index"
              class="chart-label"
            >
              {{ formatChartDate(point.date) }}
            </span>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-header">
          <h3>商品分类分布</h3>
        </div>
        <div class="chart-content">
          <div class="pie-chart">
            <div 
              v-for="category in stats.productsByCategory"
              :key="category.category"
              class="category-item"
            >
              <div class="category-bar">
                <div 
                  class="category-fill"
                  :style="{ 
                    width: `${(category.count / maxCategoryCount) * 100}%`,
                    background: getCategoryColor(category.category)
                  }"
                ></div>
              </div>
              <div class="category-info">
                <span class="category-name">{{ category.category }}</span>
                <span class="category-count">{{ category.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities">
      <h3>最近活动</h3>
      <div class="activities-list">
        <div 
          v-for="activity in recentActivities"
          :key="activity.id"
          class="activity-item"
        >
          <div class="activity-icon" v-html="getActivityIcon(activity.type)">
          </div>
          <div class="activity-content">
            <div class="activity-text">{{ activity.description }}</div>
            <div class="activity-time">{{ formatTime(activity.createdAt) }}</div>
          </div>
          <div class="activity-status">
            <span :class="['status-badge', activity.status]">
              {{ getStatusText(activity.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 待处理事项 -->
    <div class="pending-tasks">
      <h3>待处理事项</h3>
      <div class="tasks-grid">
        <div class="task-card">
          <div class="task-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="task-content">
            <div class="task-number">{{ pendingReports }}</div>
            <div class="task-label">待处理举报</div>
          </div>
          <router-link to="/admin/reports" class="task-action">
            查看详情
          </router-link>
        </div>

        <div class="task-card">
          <div class="task-icon"><i class="fas fa-ban"></i></div>
          <div class="task-content">
            <div class="task-number">{{ violationProducts }}</div>
            <div class="task-label">违规商品</div>
          </div>
          <router-link to="/admin/products" class="task-action">
            查看详情
          </router-link>
        </div>

        <div class="task-card">
          <div class="task-icon"><i class="fas fa-user-check"></i></div>
          <div class="task-content">
            <div class="task-number">{{ unverifiedUsers }}</div>
            <div class="task-label">未认证用户</div>
          </div>
          <router-link to="/admin/users" class="task-action">
            查看详情
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getDashboardStats } from '@/api/admin';

// 响应式数据
const loading = ref(false);
const stats = ref({
  totalUsers: 0,
  todayVerifiedUsers: 0,
  totalProducts: 0,
  todayProducts: 0,
  totalTransactions: 0,
  todayTransactions: 0,
  activeUsers: 0,
  productsByCategory: [],
  userGrowth: [],
  recentActivities: []
});
const selectedPeriod = ref('week');
const pendingReports = ref(0);
const violationProducts = ref(0);
const unverifiedUsers = ref(0);


// 计算属性
const userGrowthData = computed(() => stats.value.userGrowth || []);
const recentActivities = computed(() => stats.value.recentActivities || []);

const maxUserCount = computed(() => {
  if (!userGrowthData.value.length) return 1;
  return Math.max(...userGrowthData.value.map(p => p.count), 1);
});

const maxCategoryCount = computed(() => {
  if (!stats.value.productsByCategory.length) return 1;
  return Math.max(...(stats.value.productsByCategory || []).map(c => c.count), 1);
});


// 方法
async function loadDashboardData() {
  try {
    loading.value = true;
    const response = await getDashboardStats({ period: selectedPeriod.value });
    if (response.data.status === 'success') {
      stats.value = response.data.data;
      // 从返回数据中提取待处理事项
      pendingReports.value = stats.value.pendingReportsCount || 0;
      violationProducts.value = stats.value.violationProductsCount || 0;
      unverifiedUsers.value = stats.value.unactivatedUsersCount || 0;
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    loading.value = false;
  }
}


function loadChartData() {
  // 在实际应用中，这里会根据选择的周期重新从API获取数据
  // 目前我们假设 getDashboardStats 已经能处理 period
  loadDashboardData();
}

function formatChartDate(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatTime(timeString) {
  const date = new Date(timeString);
  const now = new Date();
  const diffInMinutes = (now - date) / (1000 * 60);
  
  if (diffInMinutes < 1) {
    return '刚刚';
  } else if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)}分钟前`;
  } else if (diffInMinutes < 24 * 60) {
    return `${Math.floor(diffInMinutes / 60)}小时前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

function getActivityIcon(type) {
  const icons = {
    'user_register': '<i class="fas fa-user-plus"></i>',
    'product_create': '<i class="fas fa-plus-circle"></i>',
    'report_create': '<i class="fas fa-flag"></i>',
    'transaction': '<i class="fas fa-exchange-alt"></i>',
    'product_delete': '<i class="fas fa-trash-alt"></i>'
  };
  return icons[type] || '<i class="fas fa-info-circle"></i>';
}

function getStatusText(status) {
  const statusMap = {
    'success': '成功',
    'pending': '待处理',
    'warning': '警告',
    'error': '错误'
  };
  return statusMap[status] || status;
}

function getCategoryColor(category) {
  const colors = [
    '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#20c997'
  ];
  const hash = category.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const index = Math.abs(hash % colors.length);
  return colors[index];
}

// 组件挂载
onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
.dashboard-page {
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
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
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.users { background: #e3f2fd; }
.stat-icon.products { background: #e8f5e8; }
.stat-icon.transactions { background: #fff3cd; }
.stat-icon.active { background: #f3e5f5; }

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 12px;
  color: #666;
}

.stat-change.positive {
  color: #28a745;
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.chart-actions select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.simple-chart {
  display: flex;
  align-items: end;
  height: 200px;
  gap: 8px;
  padding: 20px 0;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #007bff, #66b3ff);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 20px;
  display: flex;
  align-items: end;
  justify-content: center;
  color: white;
  font-size: 10px;
  transition: all 0.3s ease;
}

.chart-bar:hover {
  background: linear-gradient(to top, #0056b3, #4da6ff);
}

.bar-value {
  position: absolute;
  bottom: 4px;
  font-weight: bold;
}

.chart-labels {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.chart-label {
  flex: 1;
  text-align: center;
  font-size: 10px;
  color: #666;
}

.pie-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-bar {
  flex: 1;
  height: 20px;
  background: #f5f5f5;
  border-radius: 10px;
  overflow: hidden;
}

.category-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.category-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 120px;
  font-size: 12px;
}

.category-name {
  color: #333;
}

.category-count {
  color: #666;
  font-weight: bold;
}

.recent-activities {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.recent-activities h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 16px;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.activity-item:hover {
  background: #f8f9fa;
}

.activity-icon {
  width: 32px;
  height: 32px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.activity-time {
  font-size: 12px;
  color: #666;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.status-badge.success {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.warning {
  background: #f8d7da;
  color: #721c24;
}

.pending-tasks {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pending-tasks h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 16px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.task-card {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s;
}

.task-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.task-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.task-number {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.task-label {
  color: #666;
  font-size: 12px;
  margin-bottom: 12px;
}

.task-action {
  color: #007bff;
  text-decoration: none;
  font-size: 12px;
}

.task-action:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .chart-container {
    padding: 16px;
  }
  
  .simple-chart {
    height: 150px;
  }
  
  .tasks-grid {
    grid-template-columns: 1fr;
  }
}
</style> 