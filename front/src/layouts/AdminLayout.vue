<template>
  <div class="admin-layout">
    <aside class="sidebar frosted-glass">
      <h2 class="sidebar-title">后台管理</h2>
      <nav class="sidebar-nav">
        <router-link to="/admin/dashboard" class="nav-link">
          <i class="fas fa-chart-pie"></i>
          <span>数据看板</span>
        </router-link>
        <router-link to="/admin/users" class="nav-link">
          <i class="fas fa-users-cog"></i>
          <span>用户管理</span>
        </router-link>
        <router-link to="/admin/products" class="nav-link">
          <i class="fas fa-box"></i>
          <span>商品管理</span>
        </router-link>
        <router-link to="/admin/categories" class="nav-link">
          <i class="fas fa-sitemap"></i>
          <span>分类管理</span>
        </router-link>
        <router-link to="/admin/reports" class="nav-link">
          <i class="fas fa-gavel"></i>
          <span>举报管理</span>
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

<style scoped>
.admin-layout {
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
  font-weight: 500;
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