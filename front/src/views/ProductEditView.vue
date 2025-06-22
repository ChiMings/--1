<template>
  <div class="product-edit-page">
    <div class="container">
      <div class="page-header">
        <h1>{{ isEditMode ? '编辑商品' : '发布商品' }}</h1>
        <p>{{ isEditMode ? '修改您的商品信息' : '发布您的闲置物品，让它们找到新主人' }}</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <p>加载中...</p>
      </div>

      <!-- 商品表单 -->
      <form v-else @submit.prevent="handleSubmit" class="product-form">
        <div class="form-section">
          <h3>基本信息</h3>
          
          <div class="form-group">
            <label class="required">商品名称</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="请输入商品名称（不超过50字）"
              maxlength="50"
              required
            />
            <div class="char-count">{{ form.name.length }}/50</div>
          </div>

          <div class="form-group">
            <label class="required">商品分类</label>
            <select v-model="form.categoryId" required>
              <option value="">请选择分类</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <div v-if="form.categoryId" class="form-hint">已选择: {{ getCategoryName(form.categoryId) }}</div>
          </div>

          <div class="form-group">
            <label class="required">商品价格</label>
            <div class="price-input">
              <span class="currency">¥</span>
              <input
                v-model.number="form.price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <div class="form-hint">请输入合理的价格，有助于快速交易</div>
          </div>

          <div class="form-group">
            <label class="required">联系方式</label>
            <input
              v-model="form.contact"
              type="text"
              placeholder="QQ/微信/手机号等联系方式"
              required
            />
            <div class="form-hint">买家将通过此方式联系您</div>
          </div>
        </div>

        <div class="form-section">
          <h3>商品图片</h3>
          <div class="image-upload-section">
            <div class="image-grid">
              <!-- 已上传的图片 -->
              <div 
                v-for="(image, index) in form.images" 
                :key="index"
                class="image-item"
              >
                <img :src="image" :alt="`商品图片 ${index + 1}`" />
                <div class="image-overlay">
                  <button 
                    type="button" 
                    @click="removeImage(index)"
                    class="btn-remove"
                  >
                    ×
                  </button>
                </div>
                <div v-if="index === 0" class="main-badge">封面</div>
              </div>

              <!-- 上传按钮 -->
              <div 
                v-if="form.images.length < maxImages"
                class="upload-placeholder"
                @click="triggerImageUpload"
              >
                <div class="upload-icon">+</div>
                <div class="upload-text">添加图片</div>
              </div>
            </div>

            <input
              ref="imageInput"
              type="file"
              accept="image/*"
              multiple
              @change="handleImageUpload"
              style="display: none"
            />

            <div class="upload-tips">
              <p>• 最多上传{{ maxImages }}张图片，第一张为封面图</p>
              <p>• 支持 JPG、PNG、GIF 格式</p>
              <p>• 单张图片不超过5MB</p>
              <p v-if="uploadingImages" class="uploading-text">📤 正在上传图片...</p>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>商品描述</h3>
          <div class="form-group">
            <label class="required">详细描述</label>
            <textarea
              v-model="form.description"
              placeholder="详细描述商品的外观、功能、使用情况等，让买家更了解您的商品"
              rows="6"
              maxlength="1000"
              required
            ></textarea>
            <div class="char-count">{{ form.description.length }}/1000</div>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="form-section">
          <h3>商品预览</h3>
          <div class="product-preview">
            <ProductCard
              v-if="previewProduct"
              :product="previewProduct"
              :show-actions="false"
            />
            <div v-else class="preview-placeholder">
              <p>填写商品信息后，这里将显示预览效果</p>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- 表单操作 -->
        <div class="form-actions">
          <button 
            type="button" 
            @click="goBack"
            class="btn btn-secondary"
          >
            取消
          </button>
          
          <button 
            type="submit" 
            :disabled="submitting || !isFormValid"
            class="btn btn-primary"
          >
            {{ submitting ? '保存中...' : (isEditMode ? '保存修改' : '发布商品') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import ProductCard from '@/components/ProductCard.vue';
import { getProductDetail, createProduct, updateProduct } from '@/api/products';
import { getCategories } from '@/api/categories';
import { uploadMultipleFiles } from '@/api/upload';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const submitting = ref(false);
const error = ref('');
const categories = ref([]);
const imageInput = ref(null);
const uploadingImages = ref(false);

const maxImages = 5;

// 表单数据
const form = reactive({
  name: '',
  categoryId: null,
  price: '',
  contact: '',
  description: '',
  images: [], // 存储图片URL数组
  imageFiles: [], // 存储待上传的文件
});

// 计算属性
const isEditMode = computed(() => !!route.params.id);

const isFormValid = computed(() => {
  return form.name.trim() && 
         form.categoryId && 
         form.price > 0 && 
         form.contact.trim() && 
         form.description.trim();
});

const previewProduct = computed(() => {
  if (!isFormValid.value) return null;
  
  const category = categories.value.find(c => c.id === parseInt(form.categoryId));
  
  return {
    id: 'preview',
    name: form.name,
    price: form.price,
    category: category,
    description: form.description,
    images: form.images.length > 0 ? form.images : ['https://via.placeholder.com/300x300?text=暂无图片'],
    contact: form.contact,
    status: '在售',
    seller: {
      id: userStore.userInfo?.id,
      nickname: userStore.userInfo?.nickname || '我',
      credit: userStore.userInfo?.credit || 100,
    },
    createdAt: new Date().toISOString(),
    isFavorite: false,
  };
});

// 加载商品详情（编辑模式）
async function loadProduct() {
  if (!isEditMode.value) return;
  
  try {
    loading.value = true;
    const response = await getProductDetail(route.params.id);
    const product = response.data;
    
    // 检查是否是当前用户的商品
    if (product.seller.id !== userStore.userInfo?.id) {
      error.value = '您只能编辑自己发布的商品';
      return;
    }
    
    // 填充表单
    form.name = product.name;
    form.categoryId = product.categoryId;
    form.price = product.price;
    form.contact = product.contact;
    form.description = product.description;
    form.images = [...(product.images || [])];
  } catch (err) {
    console.error('Failed to load product:', err);
    error.value = '加载商品信息失败';
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
  } catch (err) {
    console.error('Failed to load categories:', err);
    categories.value = [];
  }
}

// 图片上传处理
function triggerImageUpload() {
  imageInput.value?.click();
}

async function handleImageUpload(event) {
  const files = Array.from(event.target.files || []);
  const remainingSlots = maxImages - form.images.length;
  const filesToProcess = files.slice(0, remainingSlots);
  
  if (filesToProcess.length === 0) {
    event.target.value = '';
    return;
  }

  // 验证文件
  const validFiles = [];
  for (const file of filesToProcess) {
    // 检查文件大小
    if (file.size > 5 * 1024 * 1024) {
      alert(`图片 ${file.name} 超过5MB，已跳过`);
      continue;
    }
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert(`文件 ${file.name} 不是图片格式，已跳过`);
      continue;
    }
    
    validFiles.push(file);
  }

  if (validFiles.length === 0) {
    event.target.value = '';
    return;
  }

  try {
    uploadingImages.value = true;
    
    // 上传文件到服务器
    const response = await uploadMultipleFiles(validFiles);
    
    if (response.data.status === 'success') {
      const uploadedFiles = response.data.data;
      
      // 添加上传成功的图片URL到form.images
      uploadedFiles.forEach(fileInfo => {
        // 使用相对路径，利用Vite代理
        const imageUrl = fileInfo.url; // fileInfo.url 已经是 /uploads/filename 格式
        form.images.push(imageUrl);
      });
    } else {
      alert('图片上传失败：' + response.data.message);
    }
  } catch (err) {
    console.error('图片上传失败:', err);
    alert('图片上传失败，请重试');
  } finally {
    uploadingImages.value = false;
    event.target.value = '';
  }
}

function removeImage(index) {
  form.images.splice(index, 1);
}

// 获取分类名称
function getCategoryName(categoryId) {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : '';
}

// 表单提交
async function handleSubmit() {
  if (!isFormValid.value) return;
  
  try {
    submitting.value = true;
    error.value = '';
    
    const submitData = {
      name: form.name.trim(),
      categoryId: form.categoryId, // 保持原始类型，不强制转换
      price: parseFloat(form.price),
      contact: form.contact.trim(),
      description: form.description.trim(),
      images: form.images,
    };

    console.log('提交数据:', submitData); // 调试日志
    
    if (isEditMode.value) {
      await updateProduct(route.params.id, submitData);
      alert('商品信息已更新');
      router.push('/user/products');
    } else {
      await createProduct(submitData);
      alert('商品发布成功');
      router.push('/user/products');
    }
  } catch (err) {
    console.error('Failed to submit:', err);
    error.value = err.response?.data?.message || err.message || '操作失败，请重试';
  } finally {
    submitting.value = false;
  }
}

// 返回
function goBack() {
  router.back();
}

// 组件挂载
onMounted(() => {
  // 检查登录状态
  if (!userStore.userInfo) {
    router.push('/login');
    return;
  }
  
  loadCategories();
  loadProduct();
});
</script>

<style scoped>
.product-edit-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.product-form {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 40px;
}

.form-section h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
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

.form-group label.required::after {
  content: ' *';
  color: #dc3545;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
}

.price-input {
  position: relative;
  display: flex;
  align-items: center;
}

.currency {
  position: absolute;
  left: 16px;
  color: #666;
  font-weight: 500;
  z-index: 1;
}

.price-input input {
  padding-left: 32px;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.form-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.image-upload-section {
  margin-bottom: 20px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #ddd;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.main-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: #007bff;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.upload-placeholder {
  aspect-ratio: 1;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-placeholder:hover {
  border-color: #007bff;
}

.upload-icon {
  font-size: 32px;
  color: #666;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 12px;
  color: #666;
}

.upload-tips {
  font-size: 12px;
  color: #666;
}

.upload-tips p {
  margin: 4px 0;
}

.uploading-text {
  color: #007bff !important;
  font-weight: 500;
}

.product-preview {
  max-width: 300px;
}

.preview-placeholder {
  text-align: center;
  padding: 40px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  color: #666;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  .product-form {
    padding: 24px 16px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .image-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style> 