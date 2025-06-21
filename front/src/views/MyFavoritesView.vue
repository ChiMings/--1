<template>
  <div class="favorites-page">
    <div class="page-header">
      <h1>我的收藏</h1>
      <p>这里显示您收藏的所有商品</p>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="filters">
        <select v-model="filters.categoryId" @change="loadFavorites">
          <option value="">所有分类</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        
        <select v-model="filters.status" @change="loadFavorites">
          <option value="">全部状态</option>
          <option value="在售">在售</option>
          <option value="已售出">已售出</option>
        </select>
        
        <select v-model="filters.sortBy" @change="loadFavorites">
          <option value="createdAt">收藏时间</option>
          <option value="price">价格</option>
        </select>
        
        <select v-model="filters.order" @change="loadFavorites">
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </select>
      </div>

      <div class="actions">
        <button 
          v-if="selectedProducts.length > 0"
          @click="batchUnfavorite"
          class="btn btn-danger"
        >
          批量取消收藏 ({{ selectedProducts.length }})
        </button>
        
        <button 
          v-if="selectedProducts.length > 0"
          @click="clearSelection"
          class="btn btn-secondary"
        >
          取消选择
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <span class="total-count">共 {{ total }} 个收藏商品</span>
      <span v-if="selectedProducts.length > 0" class="selected-count">
        已选择 {{ selectedProducts.length }} 个
      </span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>

    <!-- 收藏商品列表 -->
    <div v-else-if="favorites.length > 0" class="favorites-content">
      <!-- 批量选择选项 -->
      <div class="batch-selector">
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            :checked="isAllSelected"
            @change="toggleSelectAll"
          />
          <span class="checkmark"></span>
          全选
        </label>
      </div>

      <!-- 商品网格 -->
      <div class="products-grid">
        <div 
          v-for="product in favorites" 
          :key="product.id"
          :class="['product-item', { selected: selectedProducts.includes(product.id) }]"
        >
          <!-- 选择框 -->
          <div class="product-selector">
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                :checked="selectedProducts.includes(product.id)"
                @change="toggleProductSelection(product.id)"
              />
              <span class="checkmark"></span>
            </label>
          </div>

          <!-- 商品卡片 -->
          <ProductCard
            :product="product"
            :show-actions="false"
            @click="goToProductDetail(product.id)"
          />

          <!-- 操作按钮 -->
          <div class="product-actions">
            <button 
              @click="unfavoriteProduct(product.id)"
              class="btn btn-outline-danger btn-sm"
            >
              取消收藏
            </button>
            
            <button 
              v-if="product.status === '在售'"
              @click="contactSeller(product)"
              class="btn btn-outline-primary btn-sm"
            >
              联系卖家
            </button>
          </div>

          <!-- 收藏时间 -->
          <div class="favorite-time">
            收藏于 {{ formatDate(product.createdAt) }}
          </div>
        </div>
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

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">♡</div>
      <h3>暂无收藏商品</h3>
      <p>去首页逛逛，收藏喜欢的商品吧！</p>
      <router-link to="/" class="btn btn-primary">
        去首页看看
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ProductCard from '@/components/ProductCard.vue';
import { getMyFavorites } from '@/api/users';
import { unfavoriteProduct as apiUnfavoriteProduct } from '@/api/products';
import { getCategories } from '@/api/products';

const router = useRouter();

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
    const data = response.data;
    
    favorites.value = data.items || [];
    total.value = data.total || 0;
    totalPages.value = Math.ceil(total.value / pageSize);
    
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
    categories.value = response.data || [];
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

function clearSelection() {
  selectedProducts.value = [];
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

// 联系卖家
function contactSeller(product) {
  alert(`联系卖家：${product.contact}`);
}

// 跳转到商品详情
function goToProductDetail(productId) {
  router.push(`/product/${productId}`);
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
}

// 组件挂载
onMounted(() => {
  loadCategories();
  loadFavorites();
});
</script>

<style scoped>
.favorites-page {
  max-width: 1200px;
  margin: 0 auto;
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 8px;
}

.stats {
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.selected-count {
  margin-left: 16px;
  color: #007bff;
  font-weight: 500;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.favorites-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.batch-selector {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.checkbox-container {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.checkbox-container input {
  margin-right: 8px;
}

.checkmark {
  margin-left: 8px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.product-item {
  position: relative;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.product-item.selected {
  border-color: #007bff;
  background: #f8f9ff;
}

.product-selector {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: white;
  border-radius: 4px;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.favorite-time {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 64px;
  color: #ddd;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 20px;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 32px;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-sm {
  padding: 6px 12px;
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

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-outline-primary {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline-primary:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.btn-outline-danger:hover:not(:disabled) {
  background: #dc3545;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .actions {
    justify-content: center;
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