<template>
  <div class="login-page">
    <div class="login-container frosted-glass">
      <div class="login-header">
        <h1>欢迎回来</h1>
        <p>登录以继续探索闲置交易</p>
      </div>

      <!-- 登录类型切换 -->
      <div class="login-tabs">
        <button
          :class="['tab', { active: activeTab === 'login' }]"
          @click="activeTab = 'login'"
        >
          <i class="fas fa-sign-in-alt"></i> 登录
        </button>
        <button
          :class="['tab', { active: activeTab === 'guest' }]"
          @click="activeTab = 'guest'"
        >
          <i class="fas fa-user-friends"></i> 游客
        </button>
        <button
          :class="['tab', { active: activeTab === 'activate' }]"
          @click="activeTab = 'activate'"
        >
          <i class="fas fa-user-check"></i> 激活
        </button>
      </div>
      
      <transition name="fade" mode="out-in">
        <div :key="activeTab">
          <!-- 认证登录表单 -->
          <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label for="login-studentId">学工号</label>
              <input
                id="login-studentId"
                v-model="loginForm.studentId"
                type="text"
                class="form-control"
                placeholder="请输入学工号"
                required
              />
            </div>
            <div class="form-group">
              <label for="login-password">密码</label>
              <input
                id="login-password"
                v-model="loginForm.password"
                type="password"
                class="form-control"
                placeholder="请输入密码"
                required
              />
            </div>
            <button type="submit" :disabled="loading" class="btn btn-primary submit-btn">
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </form>

          <!-- 游客登录表单 -->
          <form v-if="activeTab === 'guest'" @submit.prevent="handleGuestLogin" class="login-form">
            <div class="form-group">
              <label for="guest-studentId">学工号</label>
              <input
                id="guest-studentId"
                v-model="guestForm.studentId"
                type="text"
                class="form-control"
                placeholder="请输入学工号"
                required
              />
            </div>
            <div class="form-group">
              <label for="guest-name">姓名</label>
              <input
                id="guest-name"
                v-model="guestForm.name"
                type="text"
                class="form-control"
                placeholder="请输入真实姓名"
                required
              />
            </div>
            <button type="submit" :disabled="loading" class="btn btn-primary submit-btn">
              {{ loading ? '登录中...' : '游客登录' }}
            </button>
             <p class="form-note">
              注：游客身份功能受限，建议激活账号获得完整功能
            </p>
          </form>

          <!-- 账号激活表单 -->
          <form v-if="activeTab === 'activate'" @submit.prevent="handleActivate" class="login-form">
             <div class="form-group">
              <label for="activate-studentId">学工号</label>
              <input
                id="activate-studentId"
                v-model="activateForm.studentId"
                type="text"
                class="form-control"
                placeholder="请输入学工号"
                required
              />
            </div>
            <div class="form-group">
              <label for="activate-name">姓名</label>
              <input
                id="activate-name"
                v-model="activateForm.name"
                type="text"
                class="form-control"
                placeholder="请输入真实姓名"
                required
              />
            </div>
            <div class="form-group">
              <label for="activate-code">激活码</label>
              <input
                id="activate-code"
                v-model="activateForm.activationCode"
                type="text"
                class="form-control"
                placeholder="请输入激活码"
                required
              />
            </div>
            <div class="form-group">
              <label for="activate-password">设置密码</label>
              <input
                id="activate-password"
                v-model="activateForm.password"
                type="password"
                class="form-control"
                placeholder="请设置登录密码"
                required
              />
            </div>
            <div class="form-group">
              <label for="activate-nickname">昵称</label>
              <input
                id="activate-nickname"
                v-model="activateForm.nickname"
                type="text"
                class="form-control"
                placeholder="请设置一个独特的昵称"
                required
              />
            </div>
            <button type="submit" :disabled="loading" class="btn btn-primary submit-btn">
              {{ loading ? '激活中...' : '激活账号' }}
            </button>
          </form>
        </div>
      </transition>

      <!-- 错误信息 -->
      <transition name="fade">
        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i> {{ error }}
        </div>
      </transition>

      <!-- 开发模式快速登录 -->
      <div v-if="isDevelopmentMode" class="quick-login-section">
        <div class="divider"><span>或</span></div>
        <p class="quick-login-title">快速登录 (开发模式)</p>
        <div class="quick-login-buttons">
          <button @click="quickLoginAs(2)" class="btn btn-sm">管理员</button>
          <button @click="quickLoginAs(1)" class="btn btn-sm">认证用户</button>
          <button @click="quickLoginAs(6)" class="btn btn-sm">未认证用户</button>
          <button @click="quickLoginAs(5)" class="btn btn-sm">待激活</button>
        </div>
      </div>

      <!-- 忘记密码链接 -->
      <div class="login-footer">
        <router-link to="/forgot-password" class="forgot-link">
          忘记密码？
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { config } from '@/utils/config';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const activeTab = ref('login');

// 根据URL参数设置默认标签
onMounted(() => {
  if (route.query.tab === 'activate') {
    activeTab.value = 'activate';
  } else if (route.query.tab === 'guest') {
    activeTab.value = 'guest';
  }
});

// 监听路由变化，确保参数变化时也能切换标签
watch(() => route.query.tab, (newTab) => {
  if (newTab === 'activate') {
    activeTab.value = 'activate';
  } else if (newTab === 'guest') {
    activeTab.value = 'guest';
  } else if (newTab === 'login') {
    activeTab.value = 'login';
  }
});
const loading = ref(false);
const error = ref('');

// 是否为开发模式
const isDevelopmentMode = computed(() => config.useMockData);

const loginForm = reactive({
  studentId: '',
  password: '',
});

const guestForm = reactive({
  studentId: '',
  name: '',
});

const activateForm = reactive({
  studentId: '',
  name: '',
  activationCode: '',
  password: '',
  nickname: '',
});

// 快速登录
async function quickLoginAs(userId) {
  try {
    loading.value = true;
    error.value = '';
    
    userStore.quickLogin(userId);
    
    // 登录成功，跳转到首页
    router.push('/');
  } catch (err) {
    error.value = '快速登录失败';
  } finally {
    loading.value = false;
  }
}

// 认证登录
async function handleLogin() {
  try {
    loading.value = true;
    error.value = '';
    
    await userStore.login(loginForm);
    
    // 登录成功，跳转到首页
    router.push('/');
  } catch (err) {
    console.error('Login error:', err);
    
    // 提供更友好的错误提示
    if (err.response?.status === 404) {
      error.value = '学号不存在，请检查学号是否正确或联系管理员';
    } else if (err.response?.status === 401) {
      error.value = '密码错误，请检查密码或使用忘记密码功能';
    } else if (err.response?.status === 403) {
      error.value = '账号被禁用，请联系管理员';
    } else if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = '登录失败，请检查学号和密码是否正确';
    }
  } finally {
    loading.value = false;
  }
}

// 游客登录
async function handleGuestLogin() {
  try {
    loading.value = true;
    error.value = '';
    
    await userStore.guestLogin(guestForm);
    
    // 登录成功，跳转到首页
    router.push('/');
  } catch (err) {
    console.error('Guest login error:', err);
    
    // 提供更友好的错误提示
    if (err.response?.status === 404) {
      error.value = '学号不存在或姓名不匹配，请检查信息是否正确';
    } else if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = '游客登录失败，请检查学号和姓名是否正确';
    }
  } finally {
    loading.value = false;
  }
}

// 账号激活
async function handleActivate() {
  try {
    loading.value = true;
    error.value = '';
    
    await userStore.activate(activateForm);
    
    // 激活成功，跳转到首页
    router.push('/');
  } catch (err) {
    console.error('Activation error:', err);
    
    // 提供更友好的错误提示
    if (err.response?.status === 404) {
      error.value = '学号不存在或姓名不匹配，请检查信息是否正确';
    } else if (err.response?.status === 400) {
      error.value = '激活码无效或已过期，请检查激活码是否正确';
    } else if (err.response?.status === 409) {
      error.value = '该账号已激活，请直接使用认证登录';
    } else if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = '账号激活失败，请检查所有信息是否正确';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 64px); /* Subtract navbar height */
  padding: 2rem 1rem;
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  border-radius: 1.5rem; /* Larger radius for a softer look */
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.login-header p {
  color: var(--text-color-secondary);
}

.login-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  background-color: var(--bg-color-alt);
  border-radius: 8px;
  padding: 0.25rem;
  margin-bottom: 1.5rem;
}

.tab {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  background: transparent;
  color: var(--text-color-secondary);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.tab:hover {
  background-color: rgba(var(--bg-elevated-rgb), 0.5);
}

.tab.active {
  background-color: var(--bg-elevated);
  color: var(--text-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.login-form .form-group {
  margin-bottom: 1.25rem;
}

.submit-btn {
  width: 100%;
  padding-top: 0.8rem;
  padding-bottom: 0.8rem;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.form-note {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  text-align: center;
  margin-top: 1rem;
}

.error-message {
  background-color: rgba(var(--danger-color), 0.1);
  color: var(--danger-color);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-top: 1.5rem;
  text-align: center;
  font-weight: 500;
}

.quick-login-section {
  margin-top: 1.5rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  margin: 1.5rem 0;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-color);
}
.divider:not(:empty)::before {
  margin-right: .5em;
}
.divider:not(:empty)::after {
  margin-left: .5em;
}

.quick-login-title {
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.quick-login-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}
.btn.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  background: var(--bg-color-alt);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}
.btn.btn-sm:hover {
  background: var(--bg-elevated);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.login-footer {
  text-align: center;
  margin-top: 1.5rem;
}

.forgot-link {
  color: var(--text-color-secondary);
  text-decoration: none;
  font-size: 0.9rem;
}

.forgot-link:hover {
  color: var(--primary-color);
  text-decoration: underline;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 