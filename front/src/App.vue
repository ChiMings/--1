<template>
  <Navbar />
  <main class="main-content">
    <router-view />
  </main>
</template>

<script setup>
import Navbar from './components/Navbar.vue';
</script>

<style>
/* 这里可以放一些全局样式 */
.main-content {
  flex-grow: 1; /* 让主内容区占据剩余空间 */
  overflow-y: auto; /* 如果内容超长，仅在内容区滚动 */
}
</style>
