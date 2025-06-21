import { createRouter, createWebHistory } from 'vue-router';

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
  },
  {
    path: '/profile/:userId',
    name: 'UserProfile',
    component: UserProfileView,
  },
  {
    path: '/notices',
    name: 'Notices',
    component: NoticesView,
  },

  // --- 个人中心 (需要认证) ---
  {
    path: '/user',
    component: UserCenterLayout,
    // meta: { requiresAuth: true }, // 可选：用于路由守卫
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

    ],
  },

  // --- 后台管理 (需要管理员权限) ---
  {
    path: '/admin',
    component: AdminLayout,
    // meta: { requiresAdmin: true }, // 可选：用于路由守卫
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

export default router; 