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
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        :show-actions="true"
        @edit="handleEdit"
        @delete="handleDelete"
        @mark-sold="handleMarkSold"
      />
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
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ProductCard from '@/components/ProductCard.vue';
import { getUserProducts } from '@/api/users';
import { updateProductStatus, deleteProduct } from '@/api/products';

const router = useRouter();

// 响应式数据
const loading = ref(false);
const products = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);

const filters = reactive({
  status: '',
  sortBy: 'createdAt',
  order: 'desc',
});

const pageSize = 12;

// 加载商品列表
async function loadProducts() {
  try {
    loading.value = true;
    
    const params = {
      page: currentPage.value,
      limit: pageSize,
      ...filters,
    };

    const response = await getUserProducts('me', params);
    const data = response.data;
    
    products.value = data.items || [];
    total.value = data.total || 0;
    totalPages.value = Math.ceil(total.value / pageSize);
  } catch (error) {
    console.error('Failed to load products:', error);
    // 这里可以添加错误提示
  } finally {
    loading.value = false;
  }
}

// 页面切换
function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadProducts();
  }
}

// 编辑商品
function handleEdit(product) {
  router.push(`/user/product/edit/${product.id}`);
}

// 标记为已售出
async function handleMarkSold(product) {
  if (!confirm('确定要将此商品标记为已售出吗？')) {
    return;
  }
  
  try {
    await updateProductStatus(product.id, '已售出');
    // 更新本地数据
    const index = products.value.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products.value[index].status = '已售出';
    }
  } catch (error) {
    console.error('Failed to mark product as sold:', error);
    // 这里可以添加错误提示
  }
}

// 删除商品
async function handleDelete(product) {
  if (!confirm('确定要删除此商品吗？此操作不可撤销。')) {
    return;
  }
  
  try {
    await deleteProduct(product.id);
    // 从列表中移除
    const index = products.value.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products.value.splice(index, 1);
      total.value--;
    }
  } catch (error) {
    console.error('Failed to delete product:', error);
    // 这里可以添加错误提示
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadProducts();
});
</script>

<style scoped>
.my-products {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.filter-toolbar {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px;
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
  color: #333;
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
  color: #666;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.2s;
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
  .my-products {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-toolbar {
    flex-direction: column;
    gap: 12px;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
  }
}
</style> 