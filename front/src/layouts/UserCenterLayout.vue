<template>
  <div class="user-center-layout">
    <aside class="sidebar">
      <h2>个人中心</h2>
      <nav>
        <router-link to="/user/profile">资料编辑</router-link>
        <router-link to="/user/products">我的发布</router-link>
        <router-link to="/user/favorites">我的收藏</router-link>
        <router-link to="/user/messages">我的私信</router-link>
        <router-link to="/user/notifications">我的通知</router-link>
        <router-link to="/user/reports">我的举报</router-link>
      </nav>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.user-center-layout {
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