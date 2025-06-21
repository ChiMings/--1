<template>
  <header class="navbar">
    <div class="container">
      <router-link to="/" class="logo">校园二手市场</router-link>
      <nav class="nav-links">
        <router-link to="/">首页</router-link>
        <template v-if="userStore.token">
          <router-link to="/user/profile">个人中心</router-link>
          <button @click="handleLogout" class="logout-btn">退出登录</button>
        </template>
        <template v-else>
          <router-link to="/login">登录/激活</router-link>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useUserStore } from '@/store/user';
const userStore = useUserStore();

const handleLogout = () => {
  userStore.logout();
};
</script>

<style scoped>
.navbar {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 40px;
}
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}
.logo {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  text-decoration: none;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}
.nav-links a {
  text-decoration: none;
  color: #333;
}
.logout-btn {
  border: none;
  background: none;
  color: #333;
  cursor: pointer;
  font-size: 16px;
  font-family: inherit;
}
</style> 