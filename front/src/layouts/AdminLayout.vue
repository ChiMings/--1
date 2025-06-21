<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <h2>后台管理</h2>
      <nav>
        <router-link to="/admin/dashboard">数据看板</router-link>
        <router-link to="/admin/users">用户管理</router-link>
        <router-link to="/admin/products">商品管理</router-link>
        <router-link to="/admin/categories">分类管理</router-link>
        <router-link to="/admin/reports">举报管理</router-link>
      </nav>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  height: 100%; /* 占满父容器（main-content）的高度 */
}
.sidebar {
  width: 200px;
  background-color: #f8f9fa;
  padding: 20px;
  border-right: 1px solid #dee2e6;
  flex-shrink: 0; /* 防止侧边栏被压缩 */
}
.sidebar h2 {
  margin-top: 0;
}
.sidebar nav {
  display: flex;
  flex-direction: column;
}
.sidebar a {
  margin-bottom: 10px;
  text-decoration: none;
  color: #333;
  padding: 8px;
  border-radius: 4px;
}
.sidebar a.router-link-exact-active {
  background-color: #e9ecef;
  font-weight: bold;
}
.content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto; /* 仅内容区滚动 */
}
</style> 