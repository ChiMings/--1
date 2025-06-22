import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/user';

//  layouts
import AdminLayout from '../layouts/AdminLayout.vue';
import UserCenterLayout from '../layouts/UserCenterLayout.vue';

// Top-level views
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import UserProfileView from '../views/UserProfileView.vue';
import ForgotPasswordView from '../views/ForgotPasswordView.vue';
import NoticesView from '../views/NoticesView.vue';

// User Center views
import MyProductsView from '../views/MyProductsView.vue';
import ProductEditView from '../views/ProductEditView.vue';
import MyFavoritesView from '../views/MyFavoritesView.vue';
import MyMessagesView from '../views/MyMessagesView.vue';
import MyNotificationsView from '../views/MyNotificationsView.vue';

import ProfileEditView from '../views/ProfileEditView.vue';

// Admin views
import DashboardView from '../views/DashboardView.vue';
import UserManagementView from '../views/UserManagementView.vue';
import ProductManagementView from '../views/ProductManagementView.vue';
import CategoryManagementView from '../views/CategoryManagementView.vue';
import ReportManagementView from '../views/ReportManagementView.vue';


const routes = [
  // --- 前台核心页面 ---
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView,
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: ProductDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/:userId',
    name: 'UserProfile',
    component: UserProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/notices',
    name: 'Notices',
    component: NoticesView,
    meta: { requiresAuth: true }
  },

  // --- 个人中心 (需要认证) ---
  {
    path: '/user',
    component: UserCenterLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'profile',
        name: 'ProfileEdit',
        component: ProfileEditView,
      },
      {
        path: 'products',
        name: 'MyProducts',
        component: MyProductsView,
      },
      {
        path: 'product/create',
        name: 'ProductCreate',
        component: ProductEditView,
      },
      {
        path: 'product/edit/:id',
        name: 'ProductEdit',
        component: ProductEditView,
      },
      {
        path: 'favorites',
        name: 'MyFavorites',
        component: MyFavoritesView,
      },
      {
        path: 'messages',
        name: 'MyMessages',
        component: MyMessagesView,
      },
      {
        path: 'notifications',
        name: 'MyNotifications',
        component: MyNotificationsView,
      },
      {
        path: 'reports',
        name: 'MyReports',
        component: () => import('@/views/MyReportsView.vue'),
      },

    ],
  },

  // --- 后台管理 (需要管理员权限) ---
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagementView,
      },
      {
        path: 'products',
        name: 'ProductManagement',
        component: ProductManagementView,
      },
      {
        path: 'categories',
        name: 'CategoryManagement',
        component: CategoryManagementView,
      },
      {
        path: 'reports',
        name: 'ReportManagement',
        component: ReportManagementView,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  // 检查是否需要登录认证
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 未登录用户重定向到登录页
    next('/login');
    return;
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    // 非管理员用户重定向到首页
    next('/');
    return;
  }
  
  // 如果已经登录，访问登录页面则重定向到首页
  if (to.name === 'Login' && userStore.isLoggedIn) {
    next('/');
    return;
  }
  
  next();
});

export default router; 