<template>
  <div class="category-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1><i class="fas fa-sitemap"></i> 分类管理</h1>
      <p>管理商品分类，组织平台商品结构</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <button @click="showCreateCategory" class="btn btn-primary">
        <i class="fas fa-plus"></i> 添加分类
      </button>
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索分类名称..."
          class="search-input"
        />
        <span class="search-icon"><i class="fas fa-search"></i></span>
      </div>
    </div>

    <!-- 分类统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-folder-open"></i></div>
        <div class="stat-info">
          <div class="stat-number">{{ categories.length }}</div>
          <div class="stat-label">总分类数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-toggle-on"></i></div>
        <div class="stat-info">
          <div class="stat-number">{{ activeCategories.length }}</div>
          <div class="stat-label">启用分类</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-box-open"></i></div>
        <div class="stat-info">
          <div class="stat-number">{{ totalProducts }}</div>
          <div class="stat-label">商品总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-fire"></i></div>
        <div class="stat-info">
          <div class="stat-number">{{ mostPopularCategory?.name || '暂无' }}</div>
          <div class="stat-label">热门分类</div>
        </div>
      </div>
    </div>

    <!-- 分类列表 -->
    <div class="categories-container">
      <div v-if="loading" class="loading">
        <p><i class="fas fa-spinner fa-spin"></i> 加载分类中...</p>
      </div>

      <div v-else-if="filteredCategories.length === 0" class="empty-state">
        <div class="empty-icon"><i class="fas fa-folder-minus"></i></div>
        <h3>{{ searchQuery ? '未找到匹配的分类' : '暂无分类' }}</h3>
        <p>{{ searchQuery ? '尝试调整搜索条件' : '点击"添加分类"创建第一个分类' }}</p>
      </div>

      <div v-else class="categories-grid">
        <div 
          v-for="category in filteredCategories" 
          :key="category.id"
          :class="['category-card', { 'category-disabled': !category.isActive }]"
        >
          <div class="category-header">
            <div class="category-icon"><i :class="category.icon || 'fas fa-folder'"></i></div>
            <div class="category-info">
              <h3 class="category-name">{{ category.name }}</h3>
              <p class="category-desc">{{ category.description }}</p>
            </div>
            <div class="category-status">
              <span v-if="category.isDefault" class="status-badge status-default">
                <i class="fas fa-home"></i> 默认分类
              </span>
              <span :class="['status-badge', category.isActive ? 'status-active' : 'status-inactive']">
                {{ category.isActive ? '启用' : '禁用' }}
              </span>
            </div>
          </div>

          <div class="category-stats">
            <div class="stat-item">
              <span class="stat-label">商品数量:</span>
              <span class="stat-value">{{ category.productCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">创建时间:</span>
              <span class="stat-value">{{ formatDate(category.createdAt) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最后更新:</span>
              <span class="stat-value">{{ formatDate(category.updatedAt) }}</span>
            </div>
          </div>

          <div class="category-actions">
            <button @click="editCategory(category)" class="btn btn-sm btn-primary">
              <i class="fas fa-edit"></i> 编辑
            </button>
            <button 
              @click="toggleCategoryStatus(category)" 
              :class="['btn', 'btn-sm', category.isActive ? 'btn-warning' : 'btn-success']"
            >
              <i :class="category.isActive ? 'fas fa-toggle-off' : 'fas fa-toggle-on'"></i>
              {{ category.isActive ? '禁用' : '启用' }}
            </button>
            <button 
              @click="deleteCategoryHandler(category)" 
              class="btn btn-sm btn-danger"
              :disabled="category.isDefault"
              :title="category.isDefault ? '默认分类不能删除' : (category.productCount > 0 ? '删除后商品将移动到默认分类' : '删除分类')"
            >
              <i class="fas fa-trash-alt"></i> 删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑分类弹窗 -->
    <div v-if="showCategoryDialog" class="modal-overlay" @click="closeCategoryDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? '编辑分类' : '添加新分类' }}</h3>
          <button @click="closeCategoryDialog" class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="submitCategory">
            <div class="form-group">
              <label>分类名称 <span class="required">*</span></label>
              <input 
                v-model="categoryForm.name" 
                type="text" 
                placeholder="例如：电子产品、书籍教材"
                required
              />
            </div>
            
            <div class="form-group">
              <label>分类图标</label>
              <div class="icon-selector">
                <div 
                  v-for="icon in iconOptions" 
                  :key="icon"
                  :class="['icon-option', { 'icon-selected': categoryForm.icon === icon }]"
                  @click="categoryForm.icon = icon"
                  :title="icon"
                >
                  <i :class="icon"></i>
                </div>
              </div>
              <small class="form-hint">选择一个能代表该分类的图标</small>
            </div>
            
            <div class="form-group">
              <label>分类描述</label>
              <textarea 
                v-model="categoryForm.description" 
                rows="3"
                placeholder="简单描述这个分类下包含哪些商品（可选）"
              ></textarea>
            </div>

            <div class="form-group">
              <label>排序权重</label>
              <input 
                v-model.number="categoryForm.sortOrder" 
                type="number" 
                min="0"
                placeholder="数值越大越靠前，默认为0"
              />
              <small class="form-hint">用于控制分类在列表中的显示顺序</small>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="categoryForm.isActive" 
                  type="checkbox"
                  class="checkbox-input"
                  :disabled="editingCategory?.isDefault"
                />
                <span class="checkbox-text">启用分类</span>
              </label>
              <small v-if="editingCategory?.isDefault" class="form-hint">
                默认分类必须保持启用状态
              </small>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button @click="closeCategoryDialog" class="btn btn-outline">取消</button>
          <button 
            @click="submitCategory"
            :disabled="!categoryForm.name.trim()"
            class="btn btn-primary"
          >
            {{ isEditing ? '更新分类' : '添加分类' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories';

const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const categories = ref([]);
const searchQuery = ref('');
const showCategoryDialog = ref(false);
const isEditing = ref(false);
const editingCategory = ref(null);

// 表单数据
const categoryForm = reactive({
  name: '',
  icon: 'fas fa-folder',
  description: '',
  sortOrder: 0,
  isActive: true
});

// 图标选项
const iconOptions = [
  'fas fa-mobile-alt', 'fas fa-laptop', 'fas fa-book', 'fas fa-tshirt', 'fas fa-shoe-prints', 
  'fas fa-gamepad', 'fas fa-basketball-ball', 'fas fa-music', 'fas fa-palette', 'fas fa-tools', 
  'fas fa-futbol', 'fas fa-home', 'fas fa-car', 'fas fa-hamburger', 'fas fa-camera', 
  'fas fa-paint-brush', 'fas fa-guitar', 'fas fa-glasses', 'fas fa-clock', 'fas fa-shapes', 
  'fas fa-birthday-cake', 'fas fa-seedling', 'fas fa-pen', 'fas fa-folder-plus'
];

// 计算属性
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value;
  
  const query = searchQuery.value.toLowerCase();
  return categories.value.filter(category => 
    category.name.toLowerCase().includes(query) ||
    category.description.toLowerCase().includes(query)
  );
});

const activeCategories = computed(() => {
  return categories.value.filter(category => category.isActive);
});

const totalProducts = computed(() => {
  return categories.value.reduce((total, category) => total + (category.productCount || 0), 0);
});

const mostPopularCategory = computed(() => {
  return categories.value
    .filter(category => category.isActive)
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))[0];
});

// 方法
async function loadCategories() {
  try {
    loading.value = true;
    const response = await getCategories();
    if (response.data.status === 'success') {
      categories.value = response.data.data.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
    }
  } catch (error) {
    console.error('Failed to load categories:', error);
    alert('加载分类失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

function showCreateCategory() {
  isEditing.value = false;
  editingCategory.value = null;
  resetForm();
  showCategoryDialog.value = true;
}

function editCategory(category) {
  isEditing.value = true;
  editingCategory.value = category;
  
  // 填充表单
  categoryForm.name = category.name;
  categoryForm.icon = category.icon;
  categoryForm.description = category.description;
  categoryForm.sortOrder = category.sortOrder;
  categoryForm.isActive = category.isActive;
  
  showCategoryDialog.value = true;
}

function closeCategoryDialog() {
  showCategoryDialog.value = false;
  resetForm();
}

function resetForm() {
  categoryForm.name = '';
  categoryForm.icon = 'fas fa-folder';
  categoryForm.description = '';
  categoryForm.sortOrder = 0;
  categoryForm.isActive = true;
}

async function submitCategory() {
  if (!categoryForm.name.trim()) return;
  
  const categoryData = {
    name: categoryForm.name.trim(),
    icon: categoryForm.icon,
    description: categoryForm.description.trim(),
    sortOrder: categoryForm.sortOrder || 0,
    isActive: categoryForm.isActive
  };
  
  try {
    if (isEditing.value && editingCategory.value) {
      // 更新分类
      const response = await updateCategory(editingCategory.value.id, categoryData);
      if (response.data.status === 'success') {
        alert('分类更新成功！');
        loadCategories(); // 重新加载分类列表
      }
    } else {
      // 创建新分类
      const response = await createCategory(categoryData);
      if (response.data.status === 'success') {
        alert('分类添加成功！');
        loadCategories(); // 重新加载分类列表
      }
    }
    closeCategoryDialog();
  } catch (error) {
    console.error('提交分类失败:', error);
    alert(error.response?.data?.message || '操作失败，请稍后重试');
  }
}

async function toggleCategoryStatus(category) {
  try {
    const newStatus = !category.isActive;
    const response = await updateCategory(category.id, {
      ...category,
      isActive: newStatus
    });
    if (response.data.status === 'success') {
      category.isActive = newStatus;
      alert(`分类已${newStatus ? '启用' : '禁用'}`);
    }
  } catch (error) {
    console.error('更新分类状态失败:', error);
    alert('操作失败，请稍后重试');
  }
}

async function deleteCategoryHandler(category) {
  // 构建确认消息
  let confirmMessage = `确定要删除分类"${category.name}"吗？`;
  if (category.productCount > 0) {
    confirmMessage += `\n\n该分类下有 ${category.productCount} 个商品，删除后这些商品将自动移动到默认分类。`;
  }
  
  if (confirm(confirmMessage)) {
    try {
      const response = await deleteCategory(category.id);
      if (response.data.status === 'success') {
        alert('分类删除成功！');
        loadCategories(); // 重新加载分类列表
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      alert(error.response?.data?.message || '删除失败，请稍后重试');
    }
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// 组件挂载
onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
.category-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 2rem;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.search-box {
  position: relative;
  max-width: 300px;
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.categories-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading {
  padding: 60px;
  text-align: center;
  color: #666;
}

.empty-state {
  padding: 60px;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.empty-state p {
  margin: 0;
  color: #666;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  padding: 20px;
}

.category-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
  background: white;
}

.category-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.category-disabled {
  opacity: 0.6;
  background: #f8f9fa;
}

.category-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.category-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
}

.category-name {
  margin: 0 0 4px 0;
  font-size: 1.2rem;
  color: #333;
  font-weight: 600;
}

.category-desc {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.category-status {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-inactive {
  background: #f8d7da;
  color: #721c24;
}

.status-default {
  background: #e3f2fd;
  color: #1976d2;
  margin-bottom: 4px;
}

.category-stats {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 0.85rem;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  color: #666;
}

.stat-value {
  color: #333;
  font-weight: 500;
}

.category-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #1e7e34;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-outline {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline:hover {
  background: #6c757d;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.required {
  color: #dc3545;
}

/* 图标选择器 */
.icon-selector {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.icon-option {
  width: 40px;
  height: 40px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-option:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.icon-selected {
  border-color: #007bff;
  background: #e3f2fd;
}

/* 复选框样式 */
.checkbox-group {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin: 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f9fa;
  transition: all 0.2s;
}

.checkbox-label:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.checkbox-input {
  width: auto !important;
  margin: 0 !important;
  padding: 0 !important;
}

.checkbox-text {
  font-weight: 500;
  color: #333;
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
    padding: 15px;
  }
  
  .category-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .category-status {
    align-self: flex-start;
  }
  
  .icon-selector {
    grid-template-columns: repeat(6, 1fr);
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style> 