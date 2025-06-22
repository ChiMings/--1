<template>
  <div class="home">
    <!-- 未认证用户提示 -->
    <div v-if="showUnverifiedNotice" class="unverified-banner">
      <div class="banner-content">
        <div class="banner-message">
          <span class="banner-icon">⚠️</span>
          <div class="banner-text">
            <strong>您当前为未认证用户</strong>
            <p>功能受限：无法发布商品、评论、查看联系方式。完成账号激活可获得完整功能。</p>
          </div>
        </div>
        <router-link to="/login" class="btn btn-warning">
          去激活账号
        </router-link>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-box">
          <input
            v-model="searchKeyword"
            @keyup.enter="handleSearch"
            placeholder="搜索商品名称或描述..."
            class="search-input"
          />
          <button @click="handleSearch" class="search-button">
            搜索
          </button>
        </div>
        
        <div class="filters">
          <select v-model="filters.categoryId" @change="loadProducts">
            <option value="">所有分类</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
          
          <select v-model="filters.status" @change="loadProducts">
            <option value="">全部状态</option>
            <option value="在售">在售</option>
            <option value="已售出">已售出</option>
          </select>
          
          <select v-model="filters.sortBy" @change="loadProducts">
            <option value="createdAt">发布时间</option>
            <option value="price">价格</option>
          </select>
          
          <select v-model="filters.order" @change="loadProducts">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 商品展示区域 -->
    <div class="content-section">
      <!-- 结果统计 -->
      <div class="results-header">
        <span v-if="!loading" class="results-count">
          找到 {{ total }} 个商品
        </span>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <p>加载中...</p>
      </div>

      <!-- 商品网格 -->
      <div v-else-if="products.length > 0" class="products-grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          :show-actions="false"
          @click="goToProductDetail(product.id)"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <p>{{ emptyMessage }}</p>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage <= 1"
          class="btn btn-secondary"
        >
          上一页
        </button>
        
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="changePage(page)"
            :class="['btn', page === currentPage ? 'btn-primary' : 'btn-secondary']"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage >= totalPages"
          class="btn btn-secondary"
        >
          下一页
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
import { getProducts } from '@/api/products';
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
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
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

// 组件挂载时加载数据
onMounted(() => {
  loadCategories();
  loadProducts();
});
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.unverified-banner {
  background: linear-gradient(135deg, #ff9f43, #f39c12);
  color: white;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.banner-message {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.banner-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.banner-text strong {
  display: block;
  margin-bottom: 4px;
  font-size: 16px;
}

.banner-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.btn-warning {
  background: #fff;
  color: #f39c12;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-warning:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.search-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  color: white;
}

.search-container {
  max-width: 1200px;
  margin: 0 auto;
}

.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  max-width: 600px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  outline: none;
}

.search-button {
  padding: 12px 24px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
}

.search-button:hover {
  background: #218838;
}

.filters {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filters select {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
}

.content-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}

.results-header {
  margin-bottom: 20px;
}

.results-count {
  color: #666;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}

.empty-state p {
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .search-section {
    padding: 24px 16px;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .content-section {
    padding: 16px;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .page-numbers {
    order: 1;
    width: 100%;
    justify-content: center;
  }
}
</style> 