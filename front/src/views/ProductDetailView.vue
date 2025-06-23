<template>
  <div class="product-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>

    <!-- 商品不存在 -->
    <div v-else-if="!product" class="not-found">
      <h2>商品不存在</h2>
      <p>该商品可能已被删除或不存在</p>
      <button @click="$router.push('/')" class="btn btn-primary">返回首页</button>
    </div>

    <!-- 商品详情 -->
    <div v-else class="product-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb">
        <router-link to="/">首页</router-link>
        <span class="separator">></span>
        <span v-if="product.category">{{ product.category.name }}</span>
        <span class="separator">></span>
        <span class="current">{{ product.name }}</span>
      </div>

      <div class="product-main">
        <!-- 左侧：图片展示 -->
        <div class="product-gallery">
          <div class="main-image">
            <img :src="currentImage" :alt="product.name" />
          </div>
          <div v-if="product.images && product.images.length > 1" class="thumbnail-list">
            <div
              v-for="(image, index) in product.images"
              :key="index"
              :class="['thumbnail', { active: currentImageIndex === index }]"
              @click="currentImageIndex = index"
            >
              <img :src="image" :alt="`${product.name} 图片 ${index + 1}`" />
            </div>
          </div>
        </div>

        <!-- 右侧：商品信息 -->
        <div class="product-info">
          <div class="product-header">
            <h1 class="product-title">{{ product.name }}</h1>
            <div class="product-status">
              <span :class="['status-badge', getStatusClass(product.status)]">
                {{ product.status }}
              </span>
            </div>
          </div>

          <div class="product-price">
            <span class="price">¥{{ product.price }}</span>
          </div>

          <div class="product-meta">
            <div class="meta-item">
              <span class="label">分类：</span>
              <span class="value">{{ product.category?.name || '未分类' }}</span>
            </div>
            <div class="meta-item">
              <span class="label">发布时间：</span>
              <span class="value">{{ formatDate(product.createdAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">联系方式：</span>
              <span v-if="userStore.isLoggedIn && !isUnverifiedUser" class="value">{{ product.contact }}</span>
              <span v-else class="value contact-restricted">
                <span class="restriction-icon">🔒</span>
                需要认证后查看
              </span>
            </div>
          </div>

          <!-- 卖家信息 -->
          <div class="seller-info">
            <h3>卖家信息</h3>
            <div class="seller-card">
              <div class="seller-avatar">
                <div class="avatar">{{ product.seller?.nickname?.charAt(0) || 'U' }}</div>
              </div>
              <div class="seller-details">
                <div class="seller-name">{{ product.seller?.nickname || '匿名用户' }}</div>
                <div class="seller-role">
                  <span :class="getRoleClass(product.seller?.role)">
                    {{ product.seller?.role || '认证用户' }}
                  </span>
                </div>
              </div>
              <button 
                v-if="!isUnverifiedUser"
                @click="contactSeller" 
                class="btn btn-secondary btn-sm"
                :disabled="isOwnProduct"
              >
                {{ isOwnProduct ? '这是您的商品' : '联系卖家' }}
              </button>
              
              <div v-if="isUnverifiedUser && !isOwnProduct" class="unverified-contact">
                <span class="unverified-text">需要认证后查看</span>
                <router-link to="/login?tab=activate" class="btn btn-warning btn-sm">去激活</router-link>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="product-actions">
            <!-- 收藏按钮 - 只有认证用户可以收藏 -->
            <button 
              v-if="!isOwnProduct && product.status === '在售' && userStore.isLoggedIn && !isUnverifiedUser"
              @click="toggleFavorite"
              :class="['btn', product.isFavorite ? 'btn-danger' : 'btn-outline-primary']"
            >
              {{ product.isFavorite ? '取消收藏' : '收藏商品' }}
            </button>
            
            <!-- 未认证用户的收藏按钮 - 禁用状态 -->
            <button 
              v-if="!isOwnProduct && product.status === '在售' && isUnverifiedUser"
              @click="showActivationTip"
              class="btn btn-outline-secondary"
              disabled
            >
              收藏商品 (需要认证)
            </button>
            
            <button 
              v-if="!isOwnProduct && product.status === '在售' && !isUnverifiedUser"
              @click="contactSeller"
              class="btn btn-primary"
            >
              我想要
            </button>
            
            <button 
              v-if="!isOwnProduct && product.status === '在售' && isUnverifiedUser"
              @click="showActivationTip"
              class="btn btn-outline-secondary"
              disabled
            >
              我想要 (需要认证)
            </button>

            <!-- 举报按钮 - 只有认证用户可以举报 -->
            <button 
              v-if="!isOwnProduct && userStore.isLoggedIn && !isUnverifiedUser"
              @click="reportProduct"
              class="btn btn-outline-danger btn-sm"
            >
              举报
            </button>
            
            <!-- 未认证用户的举报按钮 - 禁用状态 -->
            <button 
              v-if="!isOwnProduct && isUnverifiedUser"
              @click="showActivationTip"
              class="btn btn-outline-secondary btn-sm"
              disabled
            >
              举报 (需要认证)
            </button>
          </div>
        </div>
      </div>

      <!-- 商品描述 -->
      <div class="product-description">
        <h3>商品描述</h3>
        <div class="description-content">
          <p>{{ product.description }}</p>
        </div>
      </div>

      <!-- 评论区 -->
      <div class="comments-section">
        <h3>商品评论</h3>
        
        <!-- 发表评论 -->
        <div v-if="userStore.userInfo && !isOwnProduct && !isUnverifiedUser" class="comment-form">
          <div class="form-group">
            <textarea
              v-model="newComment"
              placeholder="发表您的评论..."
              class="comment-input"
              rows="3"
            ></textarea>
          </div>
          <div class="form-actions">
            <button 
              @click="submitComment" 
              :disabled="!newComment.trim() || submittingComment"
              class="btn btn-primary"
            >
              {{ submittingComment ? '发布中...' : '发表评论' }}
            </button>
          </div>
        </div>

        <div v-else-if="!userStore.userInfo" class="login-prompt">
          <p>请 <router-link to="/login">登录</router-link> 后发表评论</p>
        </div>
        
        <div v-else-if="isUnverifiedUser" class="unverified-prompt">
          <p>⚠️ 完成账号激活后可发表评论 <router-link to="/login?tab=activate">去激活</router-link></p>
        </div>

        <!-- 评论列表 -->
        <div class="comments-list">
          <div v-if="comments.length === 0" class="no-comments">
            <p>暂无评论，快来发表第一条评论吧！</p>
          </div>
          
          <!-- 未认证用户无法查看评论 -->
          <div v-if="isUnverifiedUser" class="comments-restricted">
            <p class="restriction-notice">
              <span class="restriction-icon">🔒</span>
              完成账号激活后可查看和发表评论
            </p>
            <router-link to="/login?tab=activate" class="btn btn-warning">去激活</router-link>
          </div>
          
          <!-- 认证用户可以查看评论 -->
          <div v-else v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-avatar">
              <div class="avatar">{{ comment.author?.nickname?.charAt(0) || 'U' }}</div>
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="author-name">{{ comment.author?.nickname || '匿名用户' }}</span>
                <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                
                <!-- 删除评论按钮 -->
                <button 
                  v-if="canDeleteComment(comment)"
                  @click="handleDeleteComment(comment)"
                  class="delete-comment-btn"
                  title="删除评论"
                >
                  ×
                </button>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 举报弹窗 -->
    <div v-if="showReportDialog" class="modal-overlay" @click="closeReportDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>举报商品</h3>
          <button @click="closeReportDialog" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="product-info-summary">
            <div class="product-thumbnail">
              <img :src="currentImage" :alt="product.name" />
            </div>
            <div class="product-details">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-price">¥{{ product.price }}</div>
            </div>
          </div>
          
          <div class="form-group">
            <label>举报原因：<span class="required">*</span></label>
            <select v-model="reportReason" class="form-control">
              <option value="">请选择举报原因</option>
              <option value="虚假信息">虚假商品信息</option>
              <option value="商品质量问题">商品质量问题</option>
              <option value="价格异常">价格明显异常</option>
              <option value="违禁物品">违禁物品</option>
              <option value="欺诈行为">欺诈行为</option>
              <option value="重复发布">重复发布</option>
              <option value="其他">其他问题</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>详细描述：</label>
            <textarea 
              v-model="reportContent" 
              placeholder="请详细描述举报原因，有助于我们更好地处理..."
              rows="4"
              class="form-control"
            ></textarea>
          </div>
          
          <div class="report-warning">
            <p>⚠️ 请确保举报内容真实有效，恶意举报将承担相应责任</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeReportDialog" class="btn btn-secondary">取消</button>
          <button 
            @click="submitReport"
            :disabled="!reportReason.trim() || submittingReport"
            class="btn btn-danger"
          >
            {{ submittingReport ? '提交中...' : '提交举报' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { getProductDetail, favoriteProduct, unfavoriteProduct, getProductComments, createComment, deleteComment } from '@/api/products';
import { createReport } from '@/api/reports';
import { mockComments } from '@/utils/mockData';
import { config } from '@/utils/config';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(true);
const product = ref(null);
const currentImageIndex = ref(0);
const comments = ref([]);
const newComment = ref('');
const submittingComment = ref(false);

// 举报相关数据
const showReportDialog = ref(false);
const reportReason = ref('');
const reportContent = ref('');
const submittingReport = ref(false);

// 计算属性
const currentImage = computed(() => {
  if (!product.value?.images?.length) return '';
  return product.value.images[currentImageIndex.value];
});

const isOwnProduct = computed(() => {
  return userStore.userInfo?.id === product.value?.seller?.id;
});

const isUnverifiedUser = computed(() => {
  return userStore.isLoggedIn && userStore.userInfo?.role === '未认证用户';
});

// 加载商品详情
async function loadProduct() {
  try {
    loading.value = true;
    const productId = route.params.id;
    
    // 并行加载商品详情和评论
    const [productResponse, commentsResponse] = await Promise.all([
      getProductDetail(productId),
      getProductComments(productId, { page: 1, limit: 20 })
    ]);
    
    // 处理商品详情
    if (productResponse.data.status === 'success') {
      product.value = productResponse.data.data;
    } else {
      console.error('Failed to load product:', productResponse.data.message);
      product.value = null;
      return;
    }
    
    // 处理评论数据
    if (commentsResponse.data.status === 'success') {
      const commentsData = commentsResponse.data.data;
      comments.value = commentsData.items || [];
    } else {
      console.error('Failed to load comments:', commentsResponse.data.message);
      comments.value = [];
    }
    
  } catch (error) {
    console.error('Failed to load product:', error);
    product.value = null;
    comments.value = [];
  } finally {
    loading.value = false;
  }
}

// 收藏/取消收藏
async function toggleFavorite() {
  // 权限检查
  if (isUnverifiedUser.value) {
    showActivationTip();
    return;
  }
  
  if (!userStore.isLoggedIn) {
    alert('请先登录后再收藏商品');
    return;
  }
  
  try {
    if (product.value.isFavorite) {
      await unfavoriteProduct(product.value.id);
    } else {
      await favoriteProduct(product.value.id);
    }
    product.value.isFavorite = !product.value.isFavorite;
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
  }
}

// 联系卖家
function contactSeller() {
  if (isUnverifiedUser.value) {
    showActivationTip();
    return;
  }
  
  if (!userStore.isLoggedIn) {
    alert('请先登录后再联系卖家');
    return;
  }
  
  // 跳转到私信页面，并开始与卖家的对话
  startConversationWithSeller();
}

// 开始与卖家的对话
function startConversationWithSeller() {
  const sellerId = product.value.seller.id;
  const currentUserId = userStore.userInfo.id;
  
  if (sellerId === currentUserId) {
    alert('这是您自己的商品');
    return;
  }
  
  // 跳转到私信页面，并传递卖家信息
  router.push({
    name: 'MyMessages',
    query: {
      userId: sellerId,
      nickname: product.value.seller.nickname,
      productId: product.value.id,
      productName: product.value.name
    }
  });
}

// 显示激活提示
function showActivationTip() {
  alert('完成账号激活后可查看联系方式、发表评论、收藏商品和举报功能');
}

// 举报商品
function reportProduct() {
  // 权限检查
  if (isUnverifiedUser.value) {
    showActivationTip();
    return;
  }
  
  if (!userStore.isLoggedIn) {
    alert('请先登录后再举报商品');
    return;
  }
  
  // 显示举报弹窗
  showReportDialog.value = true;
  reportReason.value = '';
  reportContent.value = '';
}

// 关闭举报弹窗
function closeReportDialog() {
  showReportDialog.value = false;
  reportReason.value = '';
  reportContent.value = '';
}

// 提交举报
async function submitReport() {
  if (!reportReason.value.trim()) {
    alert('请选择举报原因');
    return;
  }
  
  try {
    submittingReport.value = true;
    
    const reportData = {
      productId: product.value.id,
      reason: reportReason.value,
      content: reportContent.value.trim()
    };
    
    const response = await createReport(reportData);
    
    if (response.data.status === 'success') {
      alert('举报提交成功，我们会尽快处理');
      closeReportDialog();
    } else {
      throw new Error(response.data.message || '举报提交失败');
    }
    
  } catch (error) {
    console.error('Failed to submit report:', error);
    alert(error.message || '举报提交失败，请重试');
  } finally {
    submittingReport.value = false;
  }
}

// 发表评论
async function submitComment() {
  if (!newComment.value.trim()) return;
  
  try {
    submittingComment.value = true;
    
    const response = await createComment(product.value.id, { 
      content: newComment.value.trim() 
    });
    
    if (response.data.status === 'success') {
      // 添加新评论到列表开头
      comments.value.unshift(response.data.data);
      newComment.value = '';
      
      // 更新商品评论数
      if (product.value._count) {
        product.value._count.comments++;
      }
    }
    
  } catch (error) {
    console.error('Failed to submit comment:', error);
    alert('发表评论失败，请重试');
  } finally {
    submittingComment.value = false;
  }
}

// 检查是否可以删除评论
function canDeleteComment(comment) {
  if (!userStore.isLoggedIn) return false;
  
  // 评论作者可以删除自己的评论
  if (comment.author?.id === userStore.userInfo.id) return true;
  
  // 管理员和超级管理员可以删除任意评论
  const role = userStore.userInfo?.role;
  return role === '管理员' || role === '超级管理员';
}

// 删除评论
async function handleDeleteComment(comment) {
  const isOwnComment = comment.author?.id === userStore.userInfo.id;
  const confirmMessage = isOwnComment 
    ? '确定要删除您的评论吗？' 
    : '确定要删除这条评论吗？';
    
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    const response = await deleteComment(product.value.id, comment.id);
    
    if (response.data.status === 'success') {
      // 从本地评论列表中移除
      const index = comments.value.findIndex(c => c.id === comment.id);
      if (index !== -1) {
        comments.value.splice(index, 1);
        
        // 更新商品评论数
        if (product.value._count) {
          product.value._count.comments--;
        }
      }
      
      alert('评论删除成功');
    }
  } catch (error) {
    console.error('Failed to delete comment:', error);
    alert('删除评论失败，请重试');
  }
}

// 工具函数
function getStatusClass(status) {
  const statusMap = {
    '在售': 'status-available',
    '已售出': 'status-sold',
    '已下架': 'status-removed'
  };
  return statusMap[status] || 'status-default';
}

function getRoleClass(role) {
  const roleMap = {
    '超级管理员': 'role-super-admin',
    '管理员': 'role-admin',
    '认证用户': 'role-verified',
    '未认证用户': 'role-unverified'
  };
  return roleMap[role] || 'role-default';
}

function getCreditClass(credit) {
  if (credit >= 95) return 'credit-excellent';
  if (credit >= 85) return 'credit-good';
  if (credit >= 70) return 'credit-fair';
  return 'credit-poor';
}

function getCreditText(credit) {
  if (credit >= 95) return '优秀';
  if (credit >= 85) return '良好';
  if (credit >= 70) return '一般';
  return '较差';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// 组件挂载
onMounted(() => {
  loadProduct();
});
</script>

<style scoped>
.product-detail {
  min-height: 100vh;
  background: #f8f9fa;
}

.loading, .not-found {
  text-align: center;
  padding: 80px 20px;
}

.not-found h2 {
  margin-bottom: 16px;
  color: #666;
}

.product-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: white;
}

.breadcrumb {
  margin-bottom: 24px;
  font-size: 14px;
  color: #666;
}

.breadcrumb a {
  color: #007bff;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.separator {
  margin: 0 8px;
}

.current {
  color: #333;
}

.product-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.product-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-image {
  aspect-ratio: 1;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.thumbnail {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.thumbnail.active {
  border-color: #007bff;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.product-title {
  margin: 0;
  font-size: 24px;
  color: #333;
  line-height: 1.3;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-available {
  background: #d4edda;
  color: #155724;
}

.status-sold {
  background: #f8d7da;
  color: #721c24;
}

.status-removed {
  background: #fff3cd;
  color: #856404;
}

.product-price {
  font-size: 32px;
  font-weight: bold;
  color: #e74c3c;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  gap: 8px;
}

.meta-item .label {
  color: #666;
  min-width: 80px;
}

.meta-item .value {
  color: #333;
}

.seller-info h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.seller-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.seller-avatar .avatar {
  width: 48px;
  height: 48px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.seller-details {
  flex: 1;
}

.seller-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.seller-credit {
  font-size: 14px;
  color: #666;
}

.credit-excellent { color: #28a745; }
.credit-good { color: #17a2b8; }
.credit-fair { color: #ffc107; }
.credit-poor { color: #dc3545; }

/* 角色样式 */
.role-super-admin {
  color: #dc3545;
  font-weight: bold;
}

.role-admin {
  color: #fd7e14;
  font-weight: bold;
}

.role-verified {
  color: #28a745;
  font-weight: 500;
}

.role-unverified {
  color: #6c757d;
  font-style: italic;
}

.role-default {
  color: #6c757d;
}

.product-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.product-description,
.comments-section {
  margin-bottom: 40px;
}

.product-description h3,
.comments-section h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.description-content {
  line-height: 1.6;
  color: #555;
}

.comment-form {
  margin-bottom: 32px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.comment-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}

.comment-input:focus {
  outline: none;
  border-color: #007bff;
}

.form-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.login-prompt,
.unverified-prompt {
  text-align: center;
  padding: 20px;
  color: #666;
}

.unverified-prompt {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
}

.login-prompt a,
.unverified-prompt a {
  color: #007bff;
  text-decoration: none;
}

.unverified-contact {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff3cd;
  border-radius: 4px;
  border: 1px solid #ffeaa7;
}

.unverified-text {
  color: #856404;
  font-size: 12px;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.no-comments {
  text-align: center;
  padding: 40px;
  color: #666;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.comment-avatar .avatar {
  width: 40px;
  height: 40px;
  background: #6c757d;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.author-name {
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #666;
}

.delete-comment-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  transition: background-color 0.2s;
  margin-left: 8px;
}

.delete-comment-btn:hover {
  background: #f8d7da;
  color: #721c24;
}

.comment-text {
  line-height: 1.5;
  color: #555;
}

.contact-restricted {
  color: #6c757d !important;
  font-style: italic;
}

.restriction-icon {
  color: #ffc107;
  margin-right: 4px;
}

.comments-restricted {
  text-align: center;
  padding: 32px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 16px 0;
}

.restriction-notice {
  margin: 0 0 16px 0;
  color: #6c757d;
  font-size: 14px;
}

.restriction-notice .restriction-icon {
  font-size: 16px;
  margin-right: 8px;
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
  .product-content {
    padding: 16px;
  }
  
  .product-main {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .product-title {
    font-size: 20px;
  }
  
  .product-price {
    font-size: 24px;
  }
  
  .seller-card {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .product-actions {
    flex-direction: column;
  }
  
  .comment-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .comment-header {
    flex-direction: column;
    gap: 4px;
  }
}

/* 举报弹窗样式 */
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
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
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
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.product-info-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.product-thumbnail {
  flex-shrink: 0;
}

.product-thumbnail img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.product-details {
  flex: 1;
}

.product-details .product-name {
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.product-details .product-price {
  color: #007bff;
  font-weight: bold;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #dc3545;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.report-warning {
  margin-top: 16px;
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
}

.report-warning p {
  margin: 0;
  color: #856404;
  font-size: 13px;
}
</style> 