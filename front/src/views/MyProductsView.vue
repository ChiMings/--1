<template>
  <div class="my-products-view card frosted-glass">
    <div class="page-header">
      <h1>我的发布</h1>
      <router-link to="/user/product/create" class="btn btn-primary">
        <i class="fas fa-plus"></i> 发布新商品
      </router-link>
    </div>

    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="filter-group">
        <label for="status-filter">状态</label>
        <select id="status-filter" v-model="filters.status" @change="loadProducts" class="form-control">
          <option value="">全部</option>
          <option value="在售">在售</option>
          <option value="已售出">已售出</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="sort-filter">排序</label>
        <div class="sort-controls">
          <select id="sort-filter" v-model="filters.sortBy" @change="loadProducts" class="form-control">
            <option value="createdAt">发布时间</option>
            <option value="price">价格</option>
          </select>
           <button @click="toggleSortOrder" class="btn sort-order-btn">
              <i :class="filters.order === 'desc' ? 'fas fa-sort-amount-down' : 'fas fa-sort-amount-up'"></i>
            </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- 商品列表 -->
    <div v-else-if="products.length > 0" class="products-grid">
      <div v-for="product in products" :key="product.id" class="product-management-card">
        <ProductCard
          :product="product"
          :show-favorite-button="false"
          @click="handleEdit(product)"
        />
        <div class="card-actions">
           <button @click.stop="handleEdit(product)" class="btn btn-sm btn-secondary">
              <i class="fas fa-edit"></i> 编辑
            </button>
            <button 
              v-if="product.status === '在售'" 
              @click.stop="handleMarkSold(product)"
              class="btn btn-sm btn-warning"
            >
              <i class="fas fa-check-circle"></i> 标记已售
            </button>
            <button @click.stop="handleDelete(product)" class="btn btn-sm btn-danger">
              <i class="fas fa-trash-alt"></i> 删除
            </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon"><i class="fas fa-box-open"></i></div>
      <h2>您还没有发布任何商品</h2>
      <router-link to="/user/product/create" class="btn btn-primary">
        去发布第一个商品
      </router-link>
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
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { updateProductStatus, deleteProduct } from '@/api/products'
import { getUserProducts } from '@/api/users'
import ProductCard from '@/components/ProductCard.vue'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const products = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)

const filters = reactive({
  status: '',
  sortBy: 'createdAt',
  order: 'desc',
})

const pageSize = 12

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
    loading.value = true
    
    const params = {
      page: currentPage.value,
      limit: pageSize,
      ...filters,
    }

    const response = await getUserProducts('me', params)
    
    // 处理服务器返回的数据（双层嵌套格式）
    const outerData = response.data
    
    // 检查是否是标准的API响应格式
    if (outerData.status === 'success' && outerData.data) {
      const data = outerData.data // 获取真正的数据
      products.value = data.items || []
      total.value = data.total || 0
      totalPages.value = Math.ceil(total.value / pageSize)
    } else {
      // 兼容处理：如果不是标准格式，直接使用外层数据
      products.value = outerData.items || []
      total.value = outerData.total || 0
      totalPages.value = Math.ceil(total.value / pageSize)
    }
  } catch (error) {
    console.error('Failed to load products:', error)
    // 如果是认证错误，可以在这里处理跳转到登录页
    if (error.response?.status === 401) {
      // 可以添加跳转到登录页的逻辑
    }
  } finally {
    loading.value = false
  }
}

// 页面切换
function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadProducts()
  }
}

// 编辑商品
function handleEdit(product) {
  router.push(`/user/product/edit/${product.id}`)
}

// 删除商品
async function handleDelete(product) {
  const confirmed = confirm('确定要删除这个商品吗？此操作不可撤销。')
  if (!confirmed) return
  
  try {
    await deleteProduct(product.id)
    await loadProducts() // 重新加载列表
    alert('商品删除成功')
  } catch (error) {
    console.error('Failed to delete product:', error)
    alert('删除失败，请重试')
  }
}

// 标记为已售出
async function handleMarkSold(product) {
  const confirmed = confirm('确定要将此商品标记为已售出吗？')
  if (!confirmed) return
  
  try {
    await updateProductStatus(product.id, '已售出')
    // 更新本地数据
    const index = products.value.findIndex(p => p.id === product.id)
    if (index !== -1) {
      products.value[index].status = '已售出'
    }
    alert('商品已标记为已售出')
  } catch (error) {
    console.error('Failed to mark product as sold:', error)
    alert('操作失败，请重试')
  }
}

function toggleSortOrder() {
  filters.order = filters.order === 'desc' ? 'asc' : 'desc';
  loadProducts();
}

// 组件挂载时加载数据
onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.my-products-view {
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
.page-header .btn {
  gap: 0.5rem;
}

.filter-toolbar {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1rem;
  border-radius: 12px;
  background-color: var(--bg-color-alt);
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
.sort-controls {
  display: flex;
  gap: 0.5rem;
}
.sort-order-btn {
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  color: var(--text-color-secondary);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.product-management-card {
  position: relative;
  border-radius: 16px; /* Match ProductCard radius */
  overflow: hidden;
  transition: all 0.2s ease;
}

.product-management-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.product-management-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

.card-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 0.75rem;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  opacity: 0;
  transform: translateY(100%);
  transition: all 0.3s ease;
}

.card-actions .btn-sm {
  flex-grow: 1;
  margin: 0 0.25rem;
  gap: 0.5rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  --btn-shadow-color: rgba(0,0,0,0.3);
  box-shadow: 0 2px 5px var(--btn-shadow-color);
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
</style> 