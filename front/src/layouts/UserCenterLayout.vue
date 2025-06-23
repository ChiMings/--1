<template>
  <div class="user-center-layout">
    <aside class="sidebar frosted-glass">
      <h2 class="sidebar-title">个人中心</h2>
      <nav class="sidebar-nav">
        <router-link to="/user/profile" class="nav-link" v-if="isVerifiedUser">
          <i class="fas fa-user-edit fa-fw"></i>
          <span>资料编辑</span>
        </router-link>
        <router-link to="/user/products" class="nav-link">
          <i class="fas fa-box-open fa-fw"></i>
          <span>我的发布</span>
        </router-link>
        <router-link to="/user/favorites" class="nav-link" v-if="isVerifiedUser">
          <i class="fas fa-heart fa-fw"></i>
          <span>我的收藏</span>
        </router-link>
        <router-link to="/user/messages" class="nav-link" v-if="isVerifiedUser">
          <i class="fas fa-envelope fa-fw"></i>
          <span>我的私信</span>
        </router-link>
        <router-link to="/user/notifications" class="nav-link">
          <i class="fas fa-bell fa-fw"></i>
          <span>我的通知</span>
        </router-link>
        <router-link to="/user/reports" class="nav-link" v-if="isVerifiedUser">
          <i class="fas fa-flag fa-fw"></i>
          <span>我的举报</span>
        </router-link>
      </nav>
    </aside>
    <div class="content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const isVerifiedUser = computed(() => {
  if (!userStore.isLoggedIn) return false;
  const role = userStore.userInfo?.role;
  return role === '认证用户' || role === '管理员' || role === '超级管理员';
});
</script>

<style scoped>
.user-center-layout {
  display: flex;
  gap: 1.5rem;
  height: 100%;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  padding: 1.5rem;
  border-radius: 16px; /* consistent with card */
  height: fit-content;
  position: sticky;
  top: 100px; /* Adjust based on navbar height */
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding-left: 0.5rem;
  color: var(--text-color);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-color-secondary);
  font-weight: 600;
  transition: all 0.2s ease;
}

.nav-link i {
  width: 20px;
  text-align: center;
  font-size: 1.1rem;
}

.nav-link:hover {
  background-color: rgba(var(--primary-color), 0.1);
  color: var(--primary-color);
}

.nav-link.router-link-exact-active {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(var(--primary-color), 0.3);
}

.content {
  flex-grow: 1;
  overflow-y: auto;
  min-width: 0; /* Prevents content from overflowing */
}

/* Page transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 