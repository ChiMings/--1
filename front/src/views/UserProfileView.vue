<template>
  <div class="user-profile-page">
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>

    <div v-else-if="!user" class="error">
      <h2>用户不存在</h2>
      <p>该用户可能已被删除或不存在</p>
      <button @click="$router.go(-1)" class="btn btn-primary">返回</button>
    </div>

    <div v-else class="user-profile">
      <!-- 用户基本信息 -->
      <div class="user-header">
        <div class="user-avatar">
          {{ user.nickname?.charAt(0) || 'U' }}
        </div>
        
        <div class="user-info">
          <div class="user-name">
            <h1>{{ user.nickname || user.name }}</h1>
            <span :class="['user-role', getRoleClass(user.role)]">
              {{ user.role }}
            </span>
          </div>
          
          <div class="user-stats">
            <div class="stat-item">
              <span class="count">{{ user.credit || 0 }}</span>
              <span class="label">信用分</span>
            </div>
            <div class="stat-item">
              <span class="count">{{ userProducts.length }}</span>
              <span class="label">发布商品</span>
            </div>
            <div class="stat-item">
              <span class="count">{{ getActiveProductsCount() }}</span>
              <span class="label">在售商品</span>
            </div>
          </div>
          
          <div class="user-meta">
            <p class="join-date">
              加入时间：{{ formatDate(user.createdAt) }}
            </p>
            <p v-if="user.contact" class="contact-info">
              联系方式：{{ user.contact }}
            </p>
          </div>
        </div>
        
        <div class="user-actions" v-if="!isCurrentUser">
          <button @click="sendMessage" class="btn btn-primary">
            发送私信
          </button>
          <button @click="reportUser" class="btn btn-outline-danger">
            举报用户
          </button>
        </div>
      </div>

      <!-- 标签页切换 -->
      <div class="profile-tabs">
        <button 
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-button', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="count-badge">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 商品列表 -->
        <div v-show="activeTab === 'products'" class="products-section">
          <div class="section-header">
            <h3>发布的商品</h3>
            <div class="filter-controls">
              <select v-model="productFilter" class="filter-select">
                <option value="all">全部商品</option>
                <option value="在售">在售中</option>
                <option value="已售出">已售出</option>
              </select>
              <select v-model="categoryFilter" class="filter-select">
                <option value="">全部分类</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="filteredProducts.length === 0" class="empty-content">
            <p>{{ getEmptyProductsMessage() }}</p>
          </div>

          <div v-else class="products-grid">
            <ProductCard 
              v-for="product in filteredProducts"
              :key="product.id"
              :product="product"
              @click="viewProduct(product.id)"
            />
          </div>
        </div>

        <!-- 用户评价 -->
        <div v-show="activeTab === 'reviews'" class="reviews-section">
          <div class="section-header">
            <h3>用户评价</h3>
            <div class="review-summary">
              <div class="rating-overview">
                <span class="average-rating">4.8</span>
                <span class="rating-stars">⭐⭐⭐⭐⭐</span>
                <span class="review-count">(12条评价)</span>
              </div>
            </div>
          </div>

          <div class="reviews-list">
            <div v-for="review in mockReviews" :key="review.id" class="review-item">
              <div class="review-header">
                <div class="reviewer-info">
                  <div class="reviewer-avatar">
                    {{ review.reviewer.nickname?.charAt(0) || 'U' }}
                  </div>
                  <div class="reviewer-details">
                    <div class="reviewer-name">{{ review.reviewer.nickname }}</div>
                    <div class="review-date">{{ formatDate(review.createdAt) }}</div>
                  </div>
                </div>
                <div class="review-rating">
                  {{ getStarRating(review.rating) }}
                </div>
              </div>
              
              <div class="review-content">
                <p>{{ review.content }}</p>
              </div>
              
              <div v-if="review.product" class="review-product">
                <span>关于商品：</span>
                <a @click="viewProduct(review.product.id)" class="product-link">
                  {{ review.product.name }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- 交易记录 -->
        <div v-show="activeTab === 'transactions'" class="transactions-section">
          <div class="section-header">
            <h3>交易记录</h3>
            <p class="section-desc">公开的交易记录，保护隐私信息</p>
          </div>

          <div class="transactions-list">
            <div v-for="transaction in mockTransactions" :key="transaction.id" class="transaction-item">
              <div class="transaction-header">
                <div class="transaction-type">
                  <span :class="['type-badge', transaction.type === 'sell' ? 'seller' : 'buyer']">
                    {{ transaction.type === 'sell' ? '卖出' : '买入' }}
                  </span>
                  <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
                </div>
                <div class="transaction-amount">
                  ¥{{ transaction.amount }}
                </div>
              </div>
              
              <div class="transaction-product">
                <a @click="viewProduct(transaction.product.id)" class="product-link">
                  {{ transaction.product.name }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { getUserById, getProductsByUserId, mockCategories } from '@/utils/mockData';
import { config } from '@/utils/config';
import ProductCard from '@/components/ProductCard.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const user = ref(null);
const userProducts = ref([]);
const activeTab = ref('products');
const productFilter = ref('all');
const categoryFilter = ref('');

// 模拟数据
const categories = mockCategories;

const mockReviews = [
  {
    id: 1,
    reviewer: { id: 2, nickname: '书虫' },
    rating: 5,
    content: '交易很愉快，商品描述准确，是个诚信的卖家！',
    product: { id: 1, name: '九成新罗技鼠标 MX Master 3' },
    createdAt: '2023-11-01T15:30:00Z'
  },
  {
    id: 2,
    reviewer: { id: 3, nickname: '运动达人' },
    rating: 4,
    content: '商品质量不错，包装很好，推荐！',
    product: { id: 4, name: 'MacBook Pro 13寸 2020款' },
    createdAt: '2023-10-26T10:00:00Z'
  }
];

const mockTransactions = [
  {
    id: 1,
    type: 'sell',
    amount: 6500,
    product: { id: 4, name: 'MacBook Pro 13寸 2020款' },
    createdAt: '2023-10-26T09:00:00Z'
  },
  {
    id: 2,
    type: 'sell',
    amount: 200,
    product: { id: 1, name: '九成新罗技鼠标 MX Master 3' },
    createdAt: '2023-11-02T14:30:00Z'
  }
];

// 计算属性
const isCurrentUser = computed(() => {
  return user.value && userStore.userInfo && user.value.id === userStore.userInfo.id;
});

const tabs = computed(() => [
  { key: 'products', label: '商品', count: userProducts.value.length },
  { key: 'reviews', label: '评价', count: mockReviews.length },
  { key: 'transactions', label: '交易记录', count: mockTransactions.length }
]);

const filteredProducts = computed(() => {
  let products = [...userProducts.value];
  
  if (productFilter.value !== 'all') {
    products = products.filter(p => p.status === productFilter.value);
  }
  
  if (categoryFilter.value) {
    products = products.filter(p => p.categoryId === parseInt(categoryFilter.value));
  }
  
  return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

// 加载用户信息
async function loadUserProfile() {
  try {
    loading.value = true;
    const userId = parseInt(route.params.id);
    
    if (config.useMockData) {
      // 使用模拟数据
      user.value = getUserById(userId);
      if (user.value) {
        userProducts.value = getProductsByUserId(userId);
      }
    } else {
      // 这里应该调用真实的API
      // const response = await getUserProfile(userId);
      // user.value = response.data.user;
      // userProducts.value = response.data.products;
    }
  } catch (error) {
    console.error('Failed to load user profile:', error);
  } finally {
    loading.value = false;
  }
}

// 发送私信
function sendMessage() {
  if (!userStore.userInfo) {
    router.push('/login');
    return;
  }
  
  // 跳转到私信页面
  router.push('/messages');
}

// 举报用户
function reportUser() {
  if (!userStore.userInfo) {
    router.push('/login');
    return;
  }
  
  if (confirm('确定要举报这个用户吗？')) {
    alert('举报功能开发中');
  }
}

// 查看商品详情
function viewProduct(productId) {
  router.push(`/product/${productId}`);
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

function getActiveProductsCount() {
  return userProducts.value.filter(p => p.status === '在售').length;
}

function getEmptyProductsMessage() {
  if (productFilter.value === '在售') {
    return '暂无在售商品';
  } else if (productFilter.value === '已售出') {
    return '暂无已售出商品';
  }
  return '该用户还没有发布任何商品';
}

function getStarRating(rating) {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// 组件挂载
onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped>
.user-profile-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #666;
}

.error {
  text-align: center;
  padding: 60px;
  color: #666;
}

.error h2 {
  margin-bottom: 16px;
  color: #333;
}

.user-header {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 32px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.user-name h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.user-role {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
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

.user-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-item .count {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.stat-item .label {
  font-size: 12px;
  color: #666;
}

.user-meta p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: flex-start;
}

.profile-tabs {
  display: flex;
  background: white;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-button:hover {
  background: #f8f9fa;
  color: #333;
}

.tab-button.active {
  background: #007bff;
  color: white;
}

.count-badge {
  background: rgba(255, 255, 255, 0.3);
  color: inherit;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
}

.tab-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.section-desc {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 12px;
}

.filter-controls {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
}

.empty-content {
  text-align: center;
  padding: 60px;
  color: #666;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-item {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #f8f9fa;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reviewer-avatar {
  width: 36px;
  height: 36px;
  background: #6c757d;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.reviewer-name {
  font-weight: 500;
  color: #333;
}

.review-date {
  font-size: 12px;
  color: #666;
}

.review-rating {
  font-size: 16px;
}

.review-content p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.review-product {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ddd;
  font-size: 12px;
  color: #666;
}

.product-link {
  color: #007bff;
  cursor: pointer;
  text-decoration: none;
}

.product-link:hover {
  text-decoration: underline;
}

.review-summary {
  display: flex;
  align-items: center;
}

.rating-overview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.average-rating {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.rating-stars {
  font-size: 16px;
}

.review-count {
  color: #666;
  font-size: 14px;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #f8f9fa;
}

.transaction-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.type-badge.seller {
  background: #d4edda;
  color: #155724;
}

.type-badge.buyer {
  background: #cce7ff;
  color: #004085;
}

.transaction-date {
  font-size: 12px;
  color: #666;
}

.transaction-amount {
  font-weight: bold;
  color: #28a745;
}

.transaction-product {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

@media (max-width: 768px) {
  .user-profile-page {
    padding: 16px;
  }
  
  .user-header {
    flex-direction: column;
    text-align: center;
  }
  
  .user-actions {
    flex-direction: row;
    justify-content: center;
  }
  
  .profile-tabs {
    flex-direction: column;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .filter-controls {
    width: 100%;
    flex-direction: column;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .transaction-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style> 