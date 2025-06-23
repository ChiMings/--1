<template>
  <div class="my-favorites-view card frosted-glass">
    <div class="page-header">
      <h1>我的收藏</h1>
      <div class="header-actions">
        <button
          v-if="selectedProducts.length > 0"
          @click="batchUnfavorite"
          class="btn btn-danger"
        >
          <i class="fas fa-trash-alt"></i> 批量取消 ({{ selectedProducts.length }})
        </button>
        <button
          v-if="favorites.length > 0"
          @click="toggleSelectAll"
          class="btn btn-secondary"
        >
          <i :class="isAllSelected ? 'fas fa-check-square' : 'far fa-square'"></i>
          {{ isAllSelected ? '取消全选' : '全选' }}
        </button>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="filter-group">
        <!-- Category Filter -->
        <div class="filter-dropdown" ref="categoryDropdownRef">
          <button class="filter-btn" @click="toggleDropdown('category')">
            <i class="fas fa-tags"></i>
            <span>{{ selectedCategoryName }}</span>
            <i class="fas fa-chevron-down arrow-icon" :class="{ 'open': activeDropdown === 'category' }"></i>
          </button>
          <transition name="dropdown-fade">
            <div v-if="activeDropdown === 'category'" class="dropdown-menu frosted-glass">
              <a @click.prevent="selectFilter('categoryId', '')" href="#">所有分类</a>
              <a v-for="category in categories" :key="category.id" @click.prevent="selectFilter('categoryId', category.id)" href="#">
                {{ category.name }}
              </a>
            </div>
          </transition>
        </div>

        <!-- Status Filter -->
        <div class="filter-dropdown" ref="statusDropdownRef">
          <button class="filter-btn" @click="toggleDropdown('status')">
            <i class="fas fa-check-circle"></i>
            <span>{{ selectedStatusName }}</span>
            <i class="fas fa-chevron-down arrow-icon" :class="{ 'open': activeDropdown === 'status' }"></i>
          </button>
          <transition name="dropdown-fade">
            <div v-if="activeDropdown === 'status'" class="dropdown-menu frosted-glass">
              <a @click.prevent="selectFilter('status', '')" href="#">全部状态</a>
              <a @click.prevent="selectFilter('status', '在售')" href="#">在售</a>
              <a @click.prevent="selectFilter('status', '已售出')" href="#">已售出</a>
            </div>
          </transition>
        </div>
      </div>

      <div class="filter-group">
        <!-- SortBy Filter -->
        <div class="filter-dropdown" ref="sortDropdownRef">
          <button class="filter-btn" @click="toggleDropdown('sort')">
            <i class="fas fa-sort-amount-down"></i>
            <span>{{ selectedSortName }}</span>
            <i class="fas fa-chevron-down arrow-icon" :class="{ 'open': activeDropdown === 'sort' }"></i>
          </button>
          <transition name="dropdown-fade">
            <div v-if="activeDropdown === 'sort'" class="dropdown-menu frosted-glass">
              <a @click.prevent="selectFilter('sortBy', 'createdAt')" href="#">收藏时间</a>
              <a @click.prevent="selectFilter('sortBy', 'price')" href="#">价格</a>
            </div>
          </transition>
        </div>

        <!-- Order Filter -->
        <div class="filter-dropdown" ref="orderDropdownRef">
          <button class="filter-btn" @click="toggleDropdown('order')">
             <i :class="filters.order === 'desc' ? 'fas fa-sort-amount-down-alt' : 'fas fa-sort-amount-up-alt'"></i>
            <span>{{ selectedOrderName }}</span>
            <i class="fas fa-chevron-down arrow-icon" :class="{ 'open': activeDropdown === 'order' }"></i>
          </button>
          <transition name="dropdown-fade">
            <div v-if="activeDropdown === 'order'" class="dropdown-menu frosted-glass">
              <a @click.prevent="selectFilter('order', 'desc')" href="#">降序</a>
              <a @click.prevent="selectFilter('order', 'asc')" href="#">升序</a>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- 商品列表 -->
    <div v-else-if="favorites.length > 0" class="products-grid">
      <div
        v-for="product in favorites"
        :key="product.id"
        class="favorite-item-card"
        :class="{ selected: selectedProducts.includes(product.id) }"
        @click="toggleProductSelection(product.id)"
      >
        <ProductCard :product="product" />
        <div class="selection-overlay">
          <i class="fas fa-check-circle"></i>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon"><i class="far fa-heart"></i></div>
      <h2>您还没有收藏任何商品</h2>
      <router-link to="/" class="btn btn-primary">
        去首页逛逛
      </router-link>
    </div>

    <!-- 分页 -->
    <div v-if="!loading && totalPages > 1" class="pagination">
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
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import ProductCard from '@/components/ProductCard.vue';
import { getMyFavorites } from '@/api/users';
import { unfavoriteProduct as apiUnfavoriteProduct } from '@/api/products';
import { getCategories } from '@/api/categories';

const router = useRouter();

// 新增：用于下拉菜单
const activeDropdown = ref(null);
const categoryDropdownRef = ref(null);
const statusDropdownRef = ref(null);
const sortDropdownRef = ref(null);
const orderDropdownRef = ref(null);

// 响应式数据
const loading = ref(false);
const favorites = ref([]);
const categories = ref([]);
const selectedProducts = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);

const filters = reactive({
  categoryId: '',
  status: '',
  sortBy: 'createdAt',
  order: 'desc',
});

const pageSize = 20;

// 计算属性
const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const isAllSelected = computed(() => {
  return favorites.value.length > 0 && selectedProducts.value.length === favorites.value.length;
});

const selectedCategoryName = computed(() => {
  const category = categories.value.find(c => c.id === filters.categoryId);
  return category ? category.name : '所有分类';
});

const selectedStatusName = computed(() => {
  if (filters.status === '在售') return '在售';
  if (filters.status === '已售出') return '已售出';
  return '全部状态';
});

const selectedSortName = computed(() => {
  return filters.sortBy === 'price' ? '价格' : '收藏时间';
});

const selectedOrderName = computed(() => {
  return filters.order === 'asc' ? '升序' : '降序';
});

// 方法
const toggleDropdown = (dropdown) => {
  activeDropdown.value = activeDropdown.value === dropdown ? null : dropdown;
};

const closeDropdown = () => {
  activeDropdown.value = null;
};

const selectFilter = (key, value) => {
  filters[key] = value;
  closeDropdown();
  loadFavorites();
};

const handleClickOutside = (event) => {
  const refs = [categoryDropdownRef, statusDropdownRef, sortDropdownRef, orderDropdownRef];
  if (!refs.some(ref => ref.value && ref.value.contains(event.target))) {
    closeDropdown();
  }
};

// 加载收藏商品
async function loadFavorites() {
  try {
    loading.value = true;
    
    const params = {
      page: currentPage.value,
      limit: pageSize,
      ...filters,
    };

    // 清理空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await getMyFavorites(params);
    console.log('收藏列表响应:', response.data); // 添加调试日志
    
    // 处理API响应数据结构
    const apiData = response.data.data || response.data;
    favorites.value = apiData.items || [];
    total.value = apiData.total || 0;
    totalPages.value = Math.ceil(total.value / pageSize);
    
    console.log('处理后的收藏数据:', favorites.value); // 添加调试日志
    
    // 清空选择
    selectedProducts.value = [];
  } catch (error) {
    console.error('Failed to load favorites:', error);
    favorites.value = [];
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
    categories.value = [];
  }
}

// 页面切换
function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadFavorites();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 商品选择
function toggleProductSelection(productId) {
  const index = selectedProducts.value.indexOf(productId);
  if (index > -1) {
    selectedProducts.value.splice(index, 1);
  } else {
    selectedProducts.value.push(productId);
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedProducts.value = [];
  } else {
    selectedProducts.value = favorites.value.map(product => product.id);
  }
}

// 取消收藏单个商品
async function unfavoriteProduct(productId) {
  if (!confirm('确定要取消收藏这个商品吗？')) return;
  
  try {
    await apiUnfavoriteProduct(productId);
    
    // 从列表中移除
    favorites.value = favorites.value.filter(product => product.id !== productId);
    total.value = Math.max(0, total.value - 1);
    
    // 从选择中移除
    const index = selectedProducts.value.indexOf(productId);
    if (index > -1) {
      selectedProducts.value.splice(index, 1);
    }
    
    // 如果当前页没有商品了，返回上一页
    if (favorites.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      loadFavorites();
    }
  } catch (error) {
    console.error('Failed to unfavorite product:', error);
    alert('取消收藏失败，请重试');
  }
}

// 批量取消收藏
async function batchUnfavorite() {
  if (!confirm(`确定要取消收藏选中的 ${selectedProducts.value.length} 个商品吗？`)) return;
  
  try {
    // 依次取消收藏
    for (const productId of selectedProducts.value) {
      await apiUnfavoriteProduct(productId);
    }
    
    // 重新加载列表
    await loadFavorites();
    alert('批量取消收藏成功');
  } catch (error) {
    console.error('Failed to batch unfavorite:', error);
    alert('批量取消收藏失败，请重试');
  }
}

// 跳转到商品详情
function goToProductDetail(productId) {
  router.push(`/product/${productId}`);
}

// 组件挂载
onMounted(() => {
  loadCategories();
  loadFavorites();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.my-favorites-view {
  padding: 2rem;
  border-radius: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}
.page-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}
.header-actions {
  display: flex;
  gap: 1rem;
}
.header-actions .btn {
  gap: 0.5rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.favorite-item-card {
  position: relative;
  cursor: pointer;
  border-radius: 16px; /* Match ProductCard */
  border: 3px solid transparent;
  transition: all 0.2s ease;
}

.favorite-item-card.selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 20px rgba(var(--primary-color), 0.3);
}

.selection-overlay {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 30px;
  height: 30px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s ease-in-out;
  border: 2px solid white;
}

.favorite-item-card.selected .selection-overlay {
  opacity: 1;
  transform: scale(1);
}

/* Reusing loading and empty state styles from HomeView */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
  min-height: 300px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--primary-color-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state .empty-icon {
  font-size: 3rem;
  color: var(--text-color-secondary);
  opacity: 0.6;
  margin-bottom: 1.5rem;
}
.empty-state h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

/* Filter Toolbar Styles */
.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-dropdown {
  position: relative;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--border-color);
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s ease;
  min-width: 150px;
  justify-content: space-between;
}

.filter-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: var(--primary-color);
}

.filter-btn .arrow-icon {
  transition: transform 0.2s ease;
}

.filter-btn .arrow-icon.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 100;
  width: 100%;
  min-width: 180px;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.dropdown-menu a {
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.dropdown-menu a:hover {
  background-color: var(--primary-color-light);
  color: var(--primary-color);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style> 