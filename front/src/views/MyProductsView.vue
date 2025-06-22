<template>
  <div class="my-products">
    <div class="page-header">
      <h1>我的发布</h1>
      <router-link to="/user/product/create" class="btn btn-primary">
        发布新商品
      </router-link>
    </div>

    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="filter-group">
        <label>状态筛选：</label>
        <select v-model="filters.status" @change="loadProducts">
          <option value="">全部</option>
          <option value="在售">在售</option>
          <option value="已售出">已售出</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>排序：</label>
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

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>

    <!-- 商品列表 -->
    <div v-else-if="products.length > 0" class="products-grid">
      <div v-for="product in products" :key="product.id" class="product-wrapper">
        <ProductCard
          :product="product"
          :show-actions="true"
          @edit="handleEdit"
          @delete="handleDelete"
          @mark-sold="handleMarkSold"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>您还没有发布任何商品</p>
      <router-link to="/user/product/create" class="btn btn-primary">
        发布第一个商品
      </router-link>
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
      
      <span class="page-info">
        第 {{ currentPage }} 页，共 {{ totalPages }} 页
      </span>
      
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
import { ref, reactive, onMounted } from 'vue'
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

// 组件挂载时加载数据
onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.my-products {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c3e50;
  margin: 0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filter-toolbar {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
}

.filter-group select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-state p {
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.page-info {
  color: #6c757d;
  font-weight: 500;
}

@media (max-width: 768px) {
  .my-products {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .filter-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    justify-content: space-between;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 