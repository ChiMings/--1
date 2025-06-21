<template>
  <header class="navbar">
    <div class="container">
      <router-link to="/" class="logo">
        <span class="logo-icon">🛒</span>
        校园二手市场
      </router-link>
      
      <nav class="nav-links">
        <router-link to="/" class="nav-link">首页</router-link>
        
        <template v-if="userStore.token">
          <!-- 用户菜单 -->
          <div class="user-menu" @click="toggleUserMenu" ref="userMenuRef">
            <div class="user-info">
              <span class="user-avatar">{{ userAvatar }}</span>
              <span class="user-name">{{ userName }}</span>
              <span class="dropdown-arrow">▼</span>
            </div>
            
            <div v-if="showUserMenu" class="dropdown-menu">
              <router-link to="/user/products" class="dropdown-item" @click="closeUserMenu">
                我的发布
              </router-link>
              <router-link to="/user/favorites" class="dropdown-item" @click="closeUserMenu">
                我的收藏
              </router-link>
              <router-link to="/user/messages" class="dropdown-item" @click="closeUserMenu">
                私信消息
              </router-link>
              <router-link to="/user/notifications" class="dropdown-item" @click="closeUserMenu">
                系统通知
              </router-link>
              <router-link to="/user/profile" class="dropdown-item" @click="closeUserMenu">
                个人设置
              </router-link>
              <div class="dropdown-divider"></div>
              <button @click="handleLogout" class="dropdown-item logout-item">
                退出登录
              </button>
            </div>
          </div>
          
          <!-- 管理员入口 -->
          <router-link 
            v-if="isAdmin" 
            to="/admin/dashboard" 
            class="nav-link admin-link"
          >
            后台管理
          </router-link>
        </template>
        
        <template v-else>
          <router-link to="/login" class="nav-link login-link">
            登录/注册
          </router-link>
        </template>
      </nav>
      
      <!-- 移动端菜单按钮 -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
    
    <!-- 移动端菜单 -->
    <div v-if="showMobileMenu" class="mobile-menu">
      <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu">
        首页
      </router-link>
      
      <template v-if="userStore.token">
        <router-link to="/user/products" class="mobile-nav-link" @click="closeMobileMenu">
          我的发布
        </router-link>
        <router-link to="/user/favorites" class="mobile-nav-link" @click="closeMobileMenu">
          我的收藏
        </router-link>
        <router-link to="/user/messages" class="mobile-nav-link" @click="closeMobileMenu">
          私信消息
        </router-link>
        <router-link to="/user/profile" class="mobile-nav-link" @click="closeMobileMenu">
          个人设置
        </router-link>
        <button @click="handleLogout" class="mobile-nav-link logout-item">
          退出登录
        </button>
      </template>
      
      <template v-else>
        <router-link to="/login" class="mobile-nav-link" @click="closeMobileMenu">
          登录/注册
        </router-link>
      </template>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

const showUserMenu = ref(false);
const showMobileMenu = ref(false);
const userMenuRef = ref(null);

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
  userStore.logout();
  closeUserMenu();
  closeMobileMenu();
  router.push('/');
}

// 点击外部关闭用户菜单
function handleClickOutside(event) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    closeUserMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  // 初始化用户状态
  userStore.initializeFromStorage();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  text-decoration: none;
  transition: color 0.2s;
}

.logo:hover {
  color: #007bff;
}

.logo-icon {
  font-size: 24px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #007bff;
  background: #f8f9fa;
}

.login-link {
  background: #007bff;
  color: white !important;
}

.login-link:hover {
  background: #0056b3;
  color: white !important;
}

.admin-link {
  background: #28a745;
  color: white !important;
}

.admin-link:hover {
  background: #218838;
  color: white !important;
}

.user-menu {
  position: relative;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background: #f8f9fa;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.dropdown-arrow {
  font-size: 12px;
  color: #666;
  transition: transform 0.2s;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 180px;
  z-index: 1001;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.logout-item {
  color: #dc3545;
}

.logout-item:hover {
  background: #f8d7da;
}

.dropdown-divider {
  height: 1px;
  background: #e9ecef;
  margin: 8px 0;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.mobile-menu-btn span {
  width: 24px;
  height: 3px;
  background: #333;
  border-radius: 2px;
  transition: all 0.2s;
}

.mobile-menu {
  display: none;
  background: white;
  border-top: 1px solid #e9ecef;
  padding: 16px 20px;
}

.mobile-nav-link {
  display: block;
  padding: 12px 0;
  color: #333;
  text-decoration: none;
  border-bottom: 1px solid #f8f9fa;
  font-weight: 500;
}

.mobile-nav-link:hover {
  color: #007bff;
}

.mobile-nav-link:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .mobile-menu {
    display: block;
  }
  
  .container {
    padding: 0 16px;
  }
}
</style> 