<template>
  <div class="product-card">
    <div class="product-image">
      <img 
        :src="product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOWbvueJhzwvdGV4dD4KPC9zdmc+'" 
        :alt="product.name"
        @error="handleImageError"
      />
      <div class="product-status" :class="statusClass">
        {{ product.status }}
      </div>
    </div>
    
    <div class="product-info">
      <h3 class="product-name" :title="product.name">
        {{ product.name }}
      </h3>
      
      <p class="product-description">
        {{ truncatedDescription }}
      </p>
      
      <div class="product-price">
        ¥{{ product.price }}
      </div>
      
      <div class="product-meta">
        <span class="seller-name">{{ product.seller?.nickname || '卖家' }}</span>
        <span class="created-at">{{ formatDate(product.createdAt) }}</span>
      </div>
      
      <div class="product-actions" v-if="showActions">
        <button 
          v-if="isOwner" 
          @click="$emit('edit', product)"
          class="btn btn-secondary"
        >
          编辑
        </button>
        <button 
          v-if="isOwner && product.status === '在售'" 
          @click="$emit('mark-sold', product)"
          class="btn btn-warning"
        >
          标记已售
        </button>
        <button 
          v-if="isOwner" 
          @click="$emit('delete', product)"
          class="btn btn-danger"
        >
          删除
        </button>
        <button 
          v-if="!isOwner && userStore.token && !isUnverifiedUser" 
          @click="$emit('favorite', product)"
          class="btn btn-primary"
        >
          {{ product.isFavorite ? '取消收藏' : '收藏' }}
        </button>
        <button 
          v-if="!isOwner && isUnverifiedUser" 
          @click="$emit('activation-tip')"
          class="btn btn-outline-secondary"
          disabled
        >
          收藏 (需要认证)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/store/user';

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  showActions: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['edit', 'delete', 'mark-sold', 'favorite', 'activation-tip']);

const userStore = useUserStore();

const isOwner = computed(() => {
  return userStore.userInfo?.id === props.product.seller?.id;
});

const isUnverifiedUser = computed(() => {
  return userStore.isLoggedIn && userStore.userInfo?.role === '未认证用户';
});

const statusClass = computed(() => {
  return {
    'status-available': props.product.status === '在售',
    'status-sold': props.product.status === '已售出',
  };
});

const truncatedDescription = computed(() => {
  const desc = props.product.description || '';
  return desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
});

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
}

function handleImageError(event) {
  // 使用SVG占位图片，避免无限循环加载
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOWbvueJhzwvdGV4dD4KPC9zdmc+';
  // 移除事件监听器，防止重复触发
  event.target.onerror = null;
}
</script>

<style scoped>
.product-card {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.status-available {
  background-color: #28a745;
}

.status-sold {
  background-color: #6c757d;
}

.product-info {
  padding: 16px;
}

.product-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  min-height: 40px;
}

.product-price {
  font-size: 18px;
  font-weight: 700;
  color: #e74c3c;
  margin-bottom: 12px;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 12px;
  color: #999;
}

.product-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
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

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background-color: #e0a800;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 