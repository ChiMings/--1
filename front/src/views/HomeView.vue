<template>
  <div class="home-container">
    <div v-if="userStore.token">
      <h1>欢迎, {{ userStore.userInfo?.nickname || '用户' }}!</h1>
      <p>您已成功登录校园二手交易平台。</p>
      <button @click="handleLogout" class="logout-btn">退出登录</button>
      <div class="nav-links">
        <router-link to="/user/profile">进入个人中心</router-link>
        <router-link to="/admin/dashboard">进入后台管理 (仅管理员)</router-link>
      </div>
    </div>
    <div v-else>
      <h1>欢迎来到校园二手交易平台</h1>
      <p>发现校园内的好物，开始您的第一笔交易吧！</p>
      <router-link to="/login" class="login-link">前往登录</router-link>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const handleLogout = () => {
  userStore.logout();
};
</script>

<style scoped>
.home-container {
  text-align: center;
  margin-top: 50px;
}
.logout-btn, .login-link {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: #f44336;
  color: white;
  cursor: pointer;
  font-size: 16px;
  text-decoration: none;
  display: inline-block;
  margin-top: 20px;
}
.login-link {
  background-color: #1890ff;
}
.nav-links {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style> 