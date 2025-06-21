<template>
  <div class="product-management-page">
    <div class="page-header">
      <h1>商品管理</h1>
      <p>管理平台所有商品</p>
    </div>

    <!-- 统计信息 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-number">{{ productStats.total }}</div>
          <div class="stat-label">总商品数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🛒</div>
        <div class="stat-content">
          <div class="stat-number">{{ productStats.active }}</div>
          <div class="stat-label">在售商品</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ productStats.sold }}</div>
          <div class="stat-label">已售商品</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🚫</div>
        <div class="stat-content">
          <div class="stat-number">{{ productStats.removed }}</div>
          <div class="stat-label">已下架</div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索商品名称、描述..."
          class="search-input"
        />
        <button @click="searchProducts" class="btn btn-primary">搜索</button>
      </div>
      
      <div class="filter-options">
        <select v-model="selectedCategory" @change="filterProducts" class="filter-select">
          <option value="">全部分类</option>
          <option value="1">电子产品</option>
          <option value="2">书籍教材</option>
          <option value="3">生活用品</option>
          <option value="4">服装饰品</option>
          <option value="5">体育用品</option>
          <option value="6">其他</option>
        </select>
        
        <select v-model="selectedStatus" @change="filterProducts" class="filter-select">
          <option value="">全部状态</option>
          <option value="在售">在售</option>
          <option value="已售出">已售出</option>
          <option value="已下架">已下架</option>
        </select>
        
        <select v-model="sortBy" @change="sortProducts" class="filter-select">
          <option value="createdAt">发布时间</option>
          <option value="price">价格</option>
          <option value="name">商品名称</option>
        </select>
        
        <button @click="refreshProducts" class="btn btn-outline">
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="products-container">
      <div v-if="loading" class="loading">
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="empty-products">
        <div class="empty-icon">📦</div>
        <h3>未找到商品</h3>
        <p>尝试调整搜索条件或筛选器</p>
      </div>

      <div v-else class="products-grid">
        <div 
          v-for="product in paginatedProducts" 
          :key="product.id" 
          class="product-card"
        >
          <div class="product-image">
            <img 
              :src="product.images?.[0] || '/placeholder.jpg'" 
              :alt="product.name"
              @error="handleImageError"
            />
            <div class="product-status">
              <span :class="['status-badge', getStatusClass(product.status)]">
                {{ product.status }}
              </span>
            </div>
          </div>
          
          <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <p class="product-description">{{ getShortDescription(product.description) }}</p>
            
            <div class="product-meta">
              <div class="product-price">¥{{ product.price }}</div>
              <div class="product-category">{{ getCategoryName(product.categoryId) }}</div>
            </div>
            
            <div class="seller-info">
              <span class="seller-name">{{ product.seller.nickname }}</span>
              <span class="publish-time">{{ formatDate(product.createdAt) }}</span>
            </div>
          </div>
          
          <div class="product-actions">
            <button 
              @click="viewProduct(product)"
              class="btn btn-sm btn-outline"
              title="查看详情"
            >
              👁️ 查看
            </button>
            
            <button 
              v-if="canEditProduct(product)"
              @click="editProduct(product)"
              class="btn btn-sm btn-warning"
              title="编辑商品"
            >
              ✏️ 编辑
            </button>
            
            <button 
              v-if="canRemoveProduct(product)"
              @click="removeProduct(product)"
              class="btn btn-sm btn-danger"
              title="下架商品"
            >
              🗑️ 下架
            </button>
            
            <button 
              v-if="canRestoreProduct(product)"
              @click="restoreProduct(product)"
              class="btn btn-sm btn-success"
              title="恢复商品"
            >
              🔄 恢复
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="btn btn-outline"
        >
          上一页
        </button>
        
        <span class="page-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </span>
        
        <button 
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="btn btn-outline"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 下架确认弹窗 -->
    <div v-if="showRemoveDialog" class="modal-overlay" @click="closeRemoveDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>下架商品确认</h3>
          <button @click="closeRemoveDialog" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="product-info-card">
            <img 
              :src="selectedProduct?.images?.[0] || '/placeholder.jpg'" 
              :alt="selectedProduct?.name"
              class="product-thumbnail"
            />
            <div class="product-details">
              <div class="product-name">{{ selectedProduct?.name }}</div>
              <div class="product-seller">发布者: {{ selectedProduct?.seller?.nickname }}</div>
              <div class="product-price">价格: ¥{{ selectedProduct?.price }}</div>
            </div>
          </div>
          
          <div class="remove-reason">
            <label>下架原因：</label>
            <select v-model="removeReason" class="reason-select">
              <option value="">请选择下架原因</option>
              <option value="违规内容">包含违规内容</option>
              <option value="虚假信息">虚假商品信息</option>
              <option value="重复发布">重复发布</option>
              <option value="价格异常">价格明显异常</option>
              <option value="用户举报">用户举报核实</option>
              <option value="其他">其他原因</option>
            </select>
          </div>
          
          <div v-if="removeReason === '其他'" class="custom-reason">
            <label>详细说明：</label>
            <textarea 
              v-model="customReason" 
              placeholder="请详细说明下架原因..."
              rows="3"
            ></textarea>
          </div>
          
          <div class="remove-warning">
            <p>⚠️ 下架后商品将不再对用户可见，发布者会收到下架通知</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeRemoveDialog" class="btn btn-outline">取消</button>
          <button 
            @click="confirmRemove"
            :disabled="!removeReason"
            class="btn btn-danger"
          >
            确认下架
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { mockProducts } from '@/utils/mockData';
import { config } from '@/utils/config';

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const products = ref([]);
const searchKeyword = ref('');
const selectedCategory = ref('');
const selectedStatus = ref('');
const sortBy = ref('createdAt');
const currentPage = ref(1);
const pageSize = 12;

// 下架弹窗
const showRemoveDialog = ref(false);
const selectedProduct = ref(null);
const removeReason = ref('');
const customReason = ref('');

// 计算属性
const isAdmin = computed(() => {
  const role = userStore.userInfo?.role;
  return role === '管理员' || role === '超级管理员';
});

const productStats = computed(() => {
  const total = products.value.length;
  const active = products.value.filter(p => p.status === '在售').length;
  const sold = products.value.filter(p => p.status === '已售出').length;
  const removed = products.value.filter(p => p.status === '已下架').length;
  
  return { total, active, sold, removed };
});

const filteredProducts = computed(() => {
  let result = [...products.value];
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(product => 
      product.name.toLowerCase().includes(keyword) ||
      product.description.toLowerCase().includes(keyword)
    );
  }
  
  // 分类筛选
  if (selectedCategory.value) {
    result = result.filter(product => product.categoryId === parseInt(selectedCategory.value));
  }
  
  // 状态筛选
  if (selectedStatus.value) {
    result = result.filter(product => product.status === selectedStatus.value);
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'createdAt':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'price':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
  
  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / pageSize);
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredProducts.value.slice(start, end);
});

// 扩展商品数据（包含已下架商品）
const extendedProducts = [
  ...mockProducts,
  {
    id: 7,
    name: '已下架的违规商品',
    description: '此商品因违反平台规则已被下架',
    price: 999,
    categoryId: 6,
    category: { id: 6, name: '其他' },
    contact: 'test@example.com',
    status: '已下架',
    images: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'],
    seller: {
      id: 1,
      nickname: '技术宅',
      credit: 100
    },
    isFavorite: false,
    createdAt: '2023-10-15T08:00:00Z'
  }
];

// 方法
async function loadProducts() {
  try {
    loading.value = true;
    
    if (config.useMockData) {
      products.value = extendedProducts;
    } else {
      // 这里应该调用真实的API
      // const response = await getAdminProducts();
      // products.value = response.data;
    }
  } catch (error) {
    console.error('Failed to load products:', error);
  } finally {
    loading.value = false;
  }
}

function searchProducts() {
  currentPage.value = 1;
}

function filterProducts() {
  currentPage.value = 1;
}

function sortProducts() {
  currentPage.value = 1;
}

function refreshProducts() {
  searchKeyword.value = '';
  selectedCategory.value = '';
  selectedStatus.value = '';
  sortBy.value = 'createdAt';
  currentPage.value = 1;
  loadProducts();
}

function viewProduct(product) {
  router.push(`/product/${product.id}`);
}

function editProduct(product) {
  router.push(`/user/product/edit/${product.id}`);
}

function removeProduct(product) {
  selectedProduct.value = product;
  removeReason.value = '';
  customReason.value = '';
  showRemoveDialog.value = true;
}

function restoreProduct(product) {
  if (confirm(`确定要恢复商品 "${product.name}" 吗？`)) {
    if (config.useMockData) {
      const index = products.value.findIndex(p => p.id === product.id);
      if (index !== -1) {
        products.value[index].status = '在售';
      }
      alert('商品已恢复');
    } else {
      // 调用真实API
      // await restoreProductById(product.id);
    }
  }
}

function closeRemoveDialog() {
  showRemoveDialog.value = false;
  selectedProduct.value = null;
  removeReason.value = '';
  customReason.value = '';
}

async function confirmRemove() {
  if (!selectedProduct.value || !removeReason.value) return;
  
  try {
    const reason = removeReason.value === '其他' ? customReason.value : removeReason.value;
    
    if (config.useMockData) {
      // 模拟下架操作
      const index = products.value.findIndex(p => p.id === selectedProduct.value.id);
      if (index !== -1) {
        products.value[index].status = '已下架';
      }
      alert(`商品已下架\n原因：${reason}`);
    } else {
      // 这里应该调用真实的API
      // await removeProductById(selectedProduct.value.id, reason);
    }
    
    closeRemoveDialog();
  } catch (error) {
    console.error('Failed to remove product:', error);
    alert('下架失败，请重试');
  }
}

// 权限检查
function canEditProduct(product) {
  return isAdmin.value;
}

function canRemoveProduct(product) {
  return isAdmin.value && product.status !== '已下架';
}

function canRestoreProduct(product) {
  return isAdmin.value && product.status === '已下架';
}

// 工具函数
function getCategoryName(categoryId) {
  const categories = {
    1: '电子产品',
    2: '书籍教材',
    3: '生活用品',
    4: '服装饰品',
    5: '体育用品',
    6: '其他'
  };
  return categories[categoryId] || '未知';
}

function getStatusClass(status) {
  const statusMap = {
    '在售': 'status-active',
    '已售出': 'status-sold',
    '已下架': 'status-removed'
  };
  return statusMap[status] || 'status-default';
}

function getShortDescription(description) {
  return description.length > 60 ? description.substring(0, 60) + '...' : description;
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function handleImageError(event) {
  event.target.src = '/placeholder.jpg';
}

// 组件挂载
onMounted(() => {
  if (!isAdmin.value) {
    alert('您没有权限访问此页面');
    router.push('/admin/dashboard');
    return;
  }
  
  loadProducts();
});
</script>

<style scoped>
.product-management-page {
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  color: #666;
  font-size: 12px;
}

.toolbar {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  gap: 8px;
  flex: 1;
  max-width: 400px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-options {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.products-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.loading {
  padding: 60px;
  text-align: center;
  color: #666;
}

.empty-products {
  padding: 60px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-products h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.empty-products p {
  margin: 0;
  color: #666;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.product-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.product-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-status {
  position: absolute;
  top: 8px;
  right: 8px;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  color: white;
}

.status-active {
  background: #28a745;
}

.status-sold {
  background: #6c757d;
}

.status-removed {
  background: #dc3545;
}

.product-info {
  padding: 16px;
}

.product-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  line-height: 1.3;
}

.product-description {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.product-price {
  font-size: 18px;
  font-weight: bold;
  color: #e74c3c;
}

.product-category {
  font-size: 12px;
  color: #666;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 10px;
}

.seller-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.seller-name {
  font-weight: 500;
}

.product-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: #f8f9fa;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
  flex: 1;
  text-align: center;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.page-info {
  font-size: 14px;
  color: #666;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
}

.product-info-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 20px;
}

.product-thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.product-details {
  flex: 1;
}

.product-details .product-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.product-seller,
.product-price {
  font-size: 14px;
  color: #666;
  margin-bottom: 2px;
}

.remove-reason {
  margin-bottom: 16px;
}

.remove-reason label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.reason-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.custom-reason {
  margin-bottom: 16px;
}

.custom-reason label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.custom-reason textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.remove-warning {
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #856404;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .product-management-page {
    padding: 16px;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .filter-options {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .product-info-card {
    flex-direction: column;
    text-align: center;
  }
  
  .product-thumbnail {
    align-self: center;
  }
}
</style> 