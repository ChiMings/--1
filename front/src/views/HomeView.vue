<template>
  <div class="home-view">
    <!-- 搜索和筛选区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1>发现校园好物</h1>
        <p>一个专为本校学生打造的、安全可靠的闲置交易平台</p>
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input
            v-model="searchKeyword"
            @keyup.enter="handleSearch"
            placeholder="搜索你感兴趣的宝贝..."
            class="search-input"
          />
          <button @click="handleSearch" class="btn btn-primary search-button">
            搜索
          </button>
        </div>
      </div>
    </div>
    
    <!-- 未认证用户提示 -->
    <div v-if="showUnverifiedNotice" class="unverified-banner frosted-glass">
        <div class="banner-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="banner-text">
          <strong>您的账号尚未激活，部分功能受限。</strong>
          <span>激活后即可发布商品、自由交易。</span>
        </div>
        <router-link to="/login?tab=activate" class="btn btn-warning btn-sm">
          立即激活
        </router-link>
    </div>

    <!-- 商品展示区域 -->
    <div class="content-section">
      <!-- 筛选栏 -->
       <div class="filters-bar frosted-glass">
        <div class="filter-group">
          <label for="category-filter">分类</label>
          <select id="category-filter" v-model="filters.categoryId" @change="loadProducts" class="form-control">
            <option value="">所有分类</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label for="sort-filter">排序</label>
           <div class="sort-controls">
            <select id="sort-filter" v-model="filters.sortBy" @change="loadProducts" class="form-control">
              <option value="createdAt">最新发布</option>
              <option value="price">价格</option>
            </select>
            <button @click="toggleSortOrder" class="btn sort-order-btn">
              <i :class="filters.order === 'desc' ? 'fas fa-sort-amount-down' : 'fas fa-sort-amount-up'"></i>
            </button>
          </div>
        </div>
         <div class="results-count">
            <span v-if="!loading">共 {{ total }} 件商品</span>
            <span v-else>正在加载...</span>
          </div>
      </div>


      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载商品...</p>
      </div>

      <!-- 商品网格 -->
      <div v-else-if="products.length > 0" class="products-grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          @click="goToProductDetail(product.id)"
          @favorite="handleFavoriteToggle"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-box-open"></i>
        </div>
        <h2>{{ emptyMessage }}</h2>
        <p>换个筛选条件试试，或者看看最新发布的商品吧！</p>
         <button @click="clearFiltersAndSearch" class="btn btn-primary">查看所有商品</button>
      </div>

      <!-- 分页 -->
      <div v-if="!loading && totalPages > 1" class="pagination">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage <= 1"
          class="btn"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="changePage(page)"
            :class="['btn', { 'btn-primary': page === currentPage }]"
            :disabled="page === '...'"
          >
            {{ page }}
          </button>
        </div>
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage >= totalPages"
          class="btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import ProductCard from '@/components/ProductCard.vue';
import { getProducts, favoriteProduct, unfavoriteProduct } from '@/api/products';
import { getCategories } from '@/api/categories';

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const products = ref([]);
const categories = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);
const searchKeyword = ref('');

const filters = reactive({
  categoryId: '',
  status: '',
  sortBy: 'createdAt',
  order: 'desc',
});

const pageSize = 20;

// 计算属性
const showUnverifiedNotice = computed(() => {
  return userStore.isLoggedIn && userStore.userInfo?.role === '未认证用户';
});

const emptyMessage = computed(() => {
  if (searchKeyword.value || filters.categoryId || filters.status) {
    return '没有找到符合条件的商品';
  }
  return '暂无商品发布';
});

const visiblePages = computed(() => {
  if (totalPages.value <= 7) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  }
  const pages = [];
  const current = currentPage.value;
  const total = totalPages.value;

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current > total - 4) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
});

// 加载商品列表
async function loadProducts() {
  try {
    loading.value = true;
    
    const params = {
      page: currentPage.value,
      limit: pageSize,
      keyword: searchKeyword.value,
      ...filters,
    };

    // 清理空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await getProducts(params);
    if (response.data.status === 'success') {
      const data = response.data.data;
      products.value = data.items || [];
      total.value = data.total || 0;
      totalPages.value = data.totalPages || 1;
    } else {
      console.error('Failed to load products:', response.data.message);
      products.value = [];
      total.value = 0;
      totalPages.value = 1;
    }
  } catch (error) {
    console.error('Failed to load products:', error);
    products.value = [];
    total.value = 0;
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
}

// 加载商品分类
async function loadCategories() {
  try {
    const response = await getCategories();
    if (response.data.status === 'success') {
      categories.value = response.data.data || [];
    } else {
      console.error('Failed to load categories:', response.data.message);
      categories.value = [];
    }
  } catch (error) {
    console.error('Failed to load categories:', error);
    // 使用备用的默认分类
    categories.value = [
      { id: 1, name: '电子产品' },
      { id: 2, name: '书籍教材' },
      { id: 3, name: '生活用品' },
      { id: 4, name: '服装饰品' },
      { id: 5, name: '体育用品' },
      { id: 6, name: '其他' },
    ];
  }
}

// 搜索处理
function handleSearch() {
  currentPage.value = 1;
  loadProducts();
}

// 页面切换
function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadProducts();
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 跳转到商品详情
function goToProductDetail(productId) {
  router.push(`/product/${productId}`);
}

// 处理收藏/取消收藏
async function handleFavoriteToggle(product) {
  if (!userStore.isLoggedIn) {
    alert('请先登录后再收藏商品');
    return;
  }

  if (userStore.userInfo?.role === '未认证用户') {
    showActivationTip();
    return;
  }

  try {
    if (product.isFavorite) {
      await unfavoriteProduct(product.id);
      product.isFavorite = false;
    } else {
      await favoriteProduct(product.id);
      product.isFavorite = true;
    }
    
    // 更新本地数据
    const productIndex = products.value.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
      products.value[productIndex].isFavorite = product.isFavorite;
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    alert('操作失败，请重试');
  }
}

// 显示账号激活提示
function showActivationTip() {
  alert('您当前为未认证用户，请先完成账号激活以使用完整功能。');
}

function toggleSortOrder() {
  filters.order = filters.order === 'desc' ? 'asc' : 'desc';
  loadProducts();
}

function clearFiltersAndSearch() {
  searchKeyword.value = '';
  filters.categoryId = '';
  filters.sortBy = 'createdAt';
  filters.order = 'desc';
  currentPage.value = 1;
  loadProducts();
}

// 组件挂载时加载数据
onMounted(() => {
  loadCategories();
  loadProducts();
});
</script>

<style scoped>
.home-view {
  width: 100%;
}

.hero-section {
  position: relative;
  padding: 6rem 1rem;
  text-align: center;
  border-radius: 1.5rem;
  overflow: hidden;
  color: white;
  margin-bottom: 2rem;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('/首页bj.jpg') no-repeat center center;
  background-size: cover;
  z-index: -1;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-content h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
}

.hero-content p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.7);
}

.search-box {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  background-color: var(--bg-elevated);
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.search-icon {
  align-self: center;
  margin: 0 0.5rem 0 1rem;
  color: var(--text-color-secondary);
}
.search-input {
  flex-grow: 1;
  border: none;
  background: transparent;
  padding: 0.75rem 0.5rem;
  font-size: 1rem;
  color: var(--text-color);
}
.search-input:focus {
  outline: none;
}
.search-button {
  flex-shrink: 0;
}

.unverified-banner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}
.banner-icon {
  font-size: 1.5rem;
  color: var(--warning-color);
}
.banner-text {
  flex-grow: 1;
}
.banner-text strong {
  display: block;
  font-weight: 600;
}
.banner-text span {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}
.unverified-banner .btn {
  white-space: nowrap;
}

.content-section {
  padding: 0 0.5rem;
}

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  position: sticky;
  top: 80px; /* Navbar height + some space */
  z-index: 900;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.filter-group label {
  font-weight: 500;
  color: var(--text-color-secondary);
  white-space: nowrap;
}
.filter-group .form-control {
  background-color: var(--bg-color);
  min-width: 150px;
}
.sort-controls {
  display: flex;
  gap: 0.5rem;
}
.sort-order-btn {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  color: var(--text-color-secondary);
}
.sort-order-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.results-count {
  margin-left: auto;
  font-weight: 500;
  color: var(--text-color-secondary);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
  min-height: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid var(--primary-color-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state .empty-icon {
  font-size: 4rem;
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
  opacity: 0.5;
}
.empty-state h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.empty-state p {
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2.5rem;
  padding: 1rem;
}
.pagination .btn {
  min-width: 40px;
}
.page-numbers {
  display: flex;
  gap: 0.5rem;
}
</style> 