<template>
  <header class="navbar frosted-glass">
    <div class="container">
      <router-link to="/" class="logo">
        <i class="fas fa-store logo-icon"></i>
        <h1>闲置交易</h1>
      </router-link>

      <div v-if="userStore.token" class="search-bar">
        <i class="fas fa-search search-icon"></i>
        <input type="text" placeholder="搜索商品..." />
      </div>

      <nav class="nav-links">
        <router-link to="/" class="nav-link" title="首页">
          <i class="fas fa-home"></i>
          <span class="nav-text">首页</span>
        </router-link>
        <router-link to="/notices" class="nav-link" title="公告">
          <i class="fas fa-bullhorn"></i>
          <span class="nav-text">公告</span>
        </router-link>
        <router-link v-if="userStore.token" to="/user/product/create" class="nav-link cta-link" title="发布商品">
          <i class="fas fa-plus-circle"></i>
          <span class="nav-text">发布商品</span>
        </router-link>
      </nav>

      <div class="user-actions">
        <template v-if="userStore.token">
          <div class="user-menu" ref="userMenuRef">
            <button @click="toggleUserMenu" class="user-info-button">
              <img
                v-if="userStore.userInfo?.avatar"
                :src="userStore.userInfo.avatar"
                :alt="userName"
                class="avatar-image"
              />
              <span v-else class="avatar-initial">{{ userAvatar }}</span>
               <span class="user-name">{{ userName }}</span>
               <i class="fas fa-chevron-down dropdown-arrow" :class="{ 'open': showUserMenu }"></i>
            </button>

            <transition name="fade">
              <div v-if="showUserMenu" class="dropdown-menu frosted-glass">
                <div class="dropdown-header">
                  <div class="user-info-dropdown">
                    <img
                      v-if="userStore.userInfo?.avatar"
                      :src="userStore.userInfo.avatar"
                      :alt="userName"
                      class="avatar-image large"
                    />
                     <span v-else class="avatar-initial large">{{ userAvatar }}</span>
                    <div class="user-meta">
                      <span class="user-name-large">{{ userName }}</span>
                      <span class="user-role-badge">{{ userStore.userInfo?.role }}</span>
                    </div>
                  </div>
                </div>

                <div class="dropdown-section">
                  <router-link to="/user/profile" class="dropdown-item">
                    <i class="fas fa-user-circle item-icon"></i>
                    个人主页
                  </router-link>
                   <router-link to="/user/products" class="dropdown-item">
                    <i class="fas fa-box-open item-icon"></i>
                    我的发布
                  </router-link>
                  <router-link to="/user/favorites" class="dropdown-item">
                    <i class="fas fa-heart item-icon"></i>
                    我的收藏
                  </router-link>
                </div>

                <div class="dropdown-section">
                   <router-link to="/user/messages" class="dropdown-item">
                    <i class="fas fa-envelope item-icon"></i>
                    私信消息
                    <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
                  </router-link>
                  <router-link to="/user/notifications" class="dropdown-item">
                    <i class="fas fa-bell item-icon"></i>
                    系统通知
                    <span v-if="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>
                  </router-link>
                </div>

                <router-link
                  v-if="isAdmin"
                  to="/admin/dashboard"
                  class="dropdown-item admin-item"
                >
                  <i class="fas fa-shield-alt item-icon"></i>
                  管理后台
                </router-link>

                <div class="dropdown-divider"></div>

                <button @click="handleLogout" class="dropdown-item logout-item">
                  <i class="fas fa-sign-out-alt item-icon"></i>
                  退出登录
                </button>
              </div>
            </transition>
          </div>
        </template>

        <template v-else>
          <router-link to="/login" class="btn btn-primary login-btn">
            登录/注册
          </router-link>
        </template>
      </div>

      <!-- 移动端菜单按钮 -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <i :class="showMobileMenu ? 'fas fa-times' : 'fas fa-bars'"></i>
      </button>
    </div>

    <!-- 移动端菜单 -->
    <transition name="slide-fade">
      <div v-if="showMobileMenu" class="mobile-menu frosted-glass">
        <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu">
          <i class="fas fa-home"></i> 首页
        </router-link>
        <router-link to="/notices" class="mobile-nav-link" @click="closeMobileMenu">
          <i class="fas fa-bullhorn"></i> 公告
        </router-link>
        <router-link v-if="userStore.token" to="/user/product/create" class="mobile-nav-link" @click="closeMobileMenu">
          <i class="fas fa-plus-circle"></i> 发布商品
        </router-link>

        <div class="mobile-divider"></div>

        <template v-if="userStore.token">
           <router-link to="/user/profile" class="mobile-nav-link" @click="closeMobileMenu">
            <i class="fas fa-user-circle"></i> 个人主页
          </router-link>
          <router-link to="/user/products" class="mobile-nav-link" @click="closeMobileMenu">
            <i class="fas fa-box-open"></i> 我的发布
          </router-link>
          <button @click="handleLogout" class="mobile-nav-link logout-item">
            <i class="fas fa-sign-out-alt"></i> 退出登录
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="mobile-nav-link" @click="closeMobileMenu">
            <i class="fas fa-sign-in-alt"></i> 登录/注册
          </router-link>
        </template>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { getUnreadMessageCount } from '@/api/messages';
import { getUnreadCount } from '@/api/notifications';

const router = useRouter();
const userStore = useUserStore();

const showUserMenu = ref(false);
const showMobileMenu = ref(false);
const userMenuRef = ref(null);

// 未读消息和通知数量（动态获取）
const unreadMessages = ref(0);
const unreadNotifications = ref(0);

// 计算属性
const userName = computed(() => {
  return userStore.userInfo?.nickname || userStore.userInfo?.name || '用户';
});

const userAvatar = computed(() => {
  const name = userName.value;
  return name.charAt(0).toUpperCase();
});

const isAdmin = computed(() => {
  const role = userStore.userInfo?.role;
  return role === '管理员' || role === '超级管理员';
});

// 方法
function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
}

function closeUserMenu() {
  showUserMenu.value = false;
}

function toggleMobileMenu() {
  showMobileMenu.value = !showMobileMenu.value;
}

function closeMobileMenu() {
  showMobileMenu.value = false;
}

function handleLogout() {
  if (window.confirm('确定要退出登录吗？')) {
    userStore.logout();
    closeUserMenu();
    closeMobileMenu();
    router.replace('/');
  }
}

// 点击外部关闭用户菜单
function handleClickOutside(event) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    closeUserMenu();
  }
}

// 获取未读消息数量
async function fetchUnreadCounts() {
  if (!userStore.isLoggedIn) {
    unreadMessages.value = 0;
    unreadNotifications.value = 0;
    return;
  }

  try {
    // 并行获取未读消息和通知数量
    const [messagesResponse, notificationsResponse] = await Promise.all([
      getUnreadMessageCount(),
      getUnreadCount()
    ]);

    const messagesData = messagesResponse.data.data || messagesResponse.data;
    const notificationsData = notificationsResponse.data.data || notificationsResponse.data;

    unreadMessages.value = messagesData.count || 0;
    unreadNotifications.value = notificationsData.count || 0;
  } catch (error) {
    console.error('获取未读数量失败:', error);
    // 失败时设置为0，避免显示错误的数字
    unreadMessages.value = 0;
    unreadNotifications.value = 0;
  }
}

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    fetchUnreadCounts();
  } else {
    unreadMessages.value = 0;
    unreadNotifications.value = 0;
  }
}, { immediate: true });

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  // 初始化用户状态
  userStore.initializeFromStorage();
  
  // 获取未读数量
  if (userStore.isLoggedIn) {
    fetchUnreadCounts();
    
    // 定期更新未读数量（每30秒）
    const interval = setInterval(() => {
      if (userStore.isLoggedIn) {
        fetchUnreadCounts();
      }
    }, 30000);
    
    // 清理定时器
    onUnmounted(() => {
      clearInterval(interval);
    });
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  padding: 0 1.5rem;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.navbar.frosted-glass {
  background: rgba(var(--bg-color-rgb), 0.65);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  box-shadow: none;
}

.container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  gap: 1.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-color);
}

.logo-icon {
  font-size: 1.75rem;
  color: var(--primary-color);
}

.logo h1 {
  font-size: 1.25rem;
  font-weight: 600;
  white-space: nowrap;
}

.search-bar {
  position: relative;
  flex-grow: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: var(--text-color-secondary);
}

.search-bar input {
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border-radius: 8px;
  border: none;
  background: var(--bg-color-alt);
  color: var(--text-color);
  transition: all 0.2s ease;
}
.search-bar input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-color-light);
  background: var(--bg-elevated);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-color-secondary);
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-exact-active {
  color: var(--primary-color);
  background-color: var(--primary-color-light);
}

.nav-link.cta-link {
  background-color: var(--primary-color);
  color: white;
}
.nav-link.cta-link:hover {
  background-color: var(--primary-color);
  filter: brightness(1.1);
}

.user-actions {
  display: flex;
  align-items: center;
}

.login-btn {
  white-space: nowrap;
}

.user-menu {
  position: relative;
}

.user-info-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}
.user-info-button:hover {
  background-color: var(--bg-color-alt);
}

.avatar-image,
.avatar-initial {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
}
.avatar-initial {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  color: white;
  font-weight: 600;
}

.user-name {
  font-weight: 500;
  color: var(--text-color);
}

.dropdown-arrow {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}
.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 280px;
  padding: 0.5rem;
  border-radius: 12px;
  z-index: 1010;
}

.dropdown-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.user-info-dropdown {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.avatar-image.large,
.avatar-initial.large {
  width: 48px;
  height: 48px;
}
.user-meta {
  display: flex;
  flex-direction: column;
}
.user-name-large {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}
.user-role-badge {
  font-size: 0.8rem;
  background: var(--bg-color-alt);
  color: var(--text-color-secondary);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  align-self: flex-start;
  margin-top: 0.25rem;
}

.dropdown-section {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}
.dropdown-section:last-of-type {
  border-bottom: none;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  color: var(--text-color);
  background: none;
  border: none;
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.dropdown-item:hover {
  background-color: var(--bg-color-alt);
}
.item-icon {
  width: 20px;
  text-align: center;
  color: var(--text-color-secondary);
}
.dropdown-item:hover .item-icon {
  color: var(--primary-color);
}

.badge {
  margin-left: auto;
  background-color: var(--danger-color);
  color: white;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.admin-item {
  color: var(--success-color);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.5rem 0;
}

.logout-item {
  color: var(--danger-color);
}
.logout-item:hover {
  background-color: rgba(var(--danger-color), 0.1);
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-color);
  cursor: pointer;
}

.mobile-menu {
  display: none;
}


@media (max-width: 1024px) {
  .search-bar {
    display: none;
  }
  .nav-links .nav-text {
    display: none;
  }
  .nav-link {
    padding: 0.5rem;
  }
   .nav-links {
    gap: 0;
  }
  .nav-link i {
    font-size: 1.25rem;
  }
}

@media (max-width: 768px) {
  .nav-links, .user-actions .btn, .user-actions .user-menu {
    display: none;
  }
  .mobile-menu-btn {
    display: block;
  }
  .search-bar {
    display: flex;
    max-width: none;
  }
  .container {
    height: 56px;
  }
  .navbar {
    padding: 0 1rem;
  }
  
  .mobile-menu {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding: 1rem;
    gap: 0.5rem;
    border-top: 1px solid var(--border-color);
  }

  .mobile-nav-link {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-color);
    font-size: 1.1rem;
    font-weight: 500;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
  }
  .mobile-nav-link:hover {
    background-color: var(--bg-color-alt);
  }
  .mobile-divider {
    height: 1px;
    background: var(--border-color);
    margin: 0.5rem 0;
  }
  .slide-fade-enter-active {
    transition: all 0.3s ease-out;
  }
  .slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
  }
  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateY(-20px);
    opacity: 0;
  }
}
</style> 