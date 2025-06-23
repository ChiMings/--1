<template>
  <div class="product-card frosted-glass">
    <div class="product-image-wrapper">
      <img
        :src="product.images?.[0] || '/首页bj.jpg'"
        :alt="product.name"
        class="product-image"
        @error="handleImageError"
      />
      <div class="status-badge" :class="statusClass">
        {{ product.status }}
      </div>
      <div 
        v-if="showFavoriteButton"
        class="favorite-button" 
        @click.stop="onFavoriteClick"
      >
         <i :class="product.isFavorite ? 'fas fa-heart' : 'far fa-heart'"></i>
      </div>
    </div>

    <div class="product-info">
      <h3 class="product-name" :title="product.name">
        {{ product.name }}
      </h3>

      <div class="product-meta">
         <div class="seller-info">
            <img :src="product.seller?.avatar || '/首页bj.jpg'" alt="seller avatar" class="seller-avatar" @error="handleAvatarError">
            <span class="seller-name">{{ product.seller?.nickname || '匿名用户' }}</span>
        </div>
        <span class="time-ago">{{ timeAgo(product.createdAt) }}</span>
      </div>

      <div class="product-price">
        <span class="price-symbol">¥</span>
        <span class="price-value">{{ product.price }}</span>
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
  showFavoriteButton: {
    type: Boolean,
    default: true,
  }
});

const emit = defineEmits(['edit', 'delete', 'mark-sold', 'favorite', 'activation-tip']);

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

const onFavoriteClick = () => {
  emit('favorite', props.product);
};

const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " 年前";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " 月前";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " 天前";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " 小时前";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " 分钟前";
    return "刚刚";
}

const handleImageError = (event) => {
  event.target.src = '/首页bj.jpg';
  event.target.onerror = null;
};

const handleAvatarError = (event) => {
    event.target.src = '/首页bj.jpg';
    event.target.onerror = null;
}
</script>

<style scoped>
.product-card {
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 Aspect Ratio */
  overflow: hidden;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.product-card:hover .product-image {
  transform: scale(1.05);
}

.status-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-available {
  background: rgba(var(--success-color), 0.8);
}
.status-sold {
  background: rgba(var(--secondary-color), 0.8);
}

.favorite-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--danger-color);
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.favorite-button:hover {
  transform: scale(1.1);
  background: white;
}
.favorite-button .fa-heart.fas {
  color: var(--danger-color);
}
.favorite-button .fa-heart.far {
  color: var(--text-color-secondary);
}

.product-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.product-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}
.seller-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.seller-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
}

.product-price {
  margin-top: auto;
  font-weight: 700;
  color: var(--primary-color);
}
.price-symbol {
  font-size: 0.9rem;
  margin-right: 2px;
}
.price-value {
  font-size: 1.5rem;
}
</style> 