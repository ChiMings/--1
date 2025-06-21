<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>校园二手交易平台</h1>
        <p>安全、便捷、高效的校园交易平台</p>
      </div>

      <!-- 开发模式快速登录 -->
      <div v-if="isDevelopmentMode" class="quick-login-section">
        <h3>快速登录 (开发模式)</h3>
        <div class="quick-login-buttons">
          <button @click="quickLoginAs(1)" class="btn btn-primary">
            登录为: 技术宅 (普通用户)
          </button>
          <button @click="quickLoginAs(2)" class="btn btn-success">
            登录为: 书虫 (管理员)
          </button>
          <button @click="quickLoginAs(3)" class="btn btn-warning">
            登录为: 运动达人 (普通用户)
          </button>
        </div>
        <div class="divider">或者手动登录</div>
      </div>

      <!-- 登录类型切换 -->
      <div class="login-tabs">
        <button 
          :class="['tab', { active: activeTab === 'login' }]"
          @click="activeTab = 'login'"
        >
          登录
        </button>
        <button 
          :class="['tab', { active: activeTab === 'guest' }]"
          @click="activeTab = 'guest'"
        >
          游客登录
        </button>
        <button 
          :class="['tab', { active: activeTab === 'activate' }]"
          @click="activeTab = 'activate'"
        >
          账号激活
        </button>
      </div>

      <!-- 认证登录表单 -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>学工号</label>
          <input 
            v-model="loginForm.studentId" 
            type="text" 
            placeholder="请输入学工号"
            required 
          />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            required 
          />
        </div>
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        
        <!-- 开发模式提示 -->
        <div v-if="isDevelopmentMode" class="dev-hint">
          <small>💡 开发模式：任意学工号和密码都可以登录</small>
        </div>
      </form>

      <!-- 游客登录表单 -->
      <form v-if="activeTab === 'guest'" @submit.prevent="handleGuestLogin" class="login-form">
        <div class="form-group">
          <label>学工号</label>
          <input 
            v-model="guestForm.studentId" 
            type="text" 
            placeholder="请输入学工号"
            required 
          />
        </div>
        <div class="form-group">
          <label>姓名</label>
          <input 
            v-model="guestForm.name" 
            type="text" 
            placeholder="请输入真实姓名"
            required 
          />
        </div>
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? '登录中...' : '游客登录' }}
        </button>
        <p class="form-note">
          注：游客身份功能受限，建议激活账号获得完整功能
        </p>
        
        <!-- 开发模式示例 -->
        <div v-if="isDevelopmentMode" class="dev-hint">
          <small>💡 示例：学工号 20210001，姓名 张三</small>
        </div>
      </form>

      <!-- 账号激活表单 -->
      <form v-if="activeTab === 'activate'" @submit.prevent="handleActivate" class="login-form">
        <div class="form-group">
          <label>学工号</label>
          <input 
            v-model="activateForm.studentId" 
            type="text" 
            placeholder="请输入学工号"
            required 
          />
        </div>
        <div class="form-group">
          <label>姓名</label>
          <input 
            v-model="activateForm.name" 
            type="text" 
            placeholder="请输入真实姓名"
            required 
          />
        </div>
        <div class="form-group">
          <label>激活码</label>
          <input 
            v-model="activateForm.activationCode" 
            type="text" 
            placeholder="请输入激活码"
            required 
          />
        </div>
        <div class="form-group">
          <label>设置密码</label>
          <input 
            v-model="activateForm.password" 
            type="password" 
            placeholder="请设置登录密码"
            required 
          />
        </div>
        <div class="form-group">
          <label>昵称</label>
          <input 
            v-model="activateForm.nickname" 
            type="text" 
            placeholder="请设置昵称"
            required 
          />
        </div>
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? '激活中...' : '激活账号' }}
        </button>
        
        <!-- 开发模式示例 -->
        <div v-if="isDevelopmentMode" class="dev-hint">
          <small>💡 示例：学工号 20210001，姓名 张三，激活码 ABC123</small>
        </div>
      </form>

      <!-- 错误信息 -->
      <div v-if="error" class="error-message">
        {{ error }}
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
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { config } from '@/utils/config';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('login');
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
    error.value = err.response?.data?.message || err.message || '登录失败，请检查学工号和密码';
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
    error.value = err.response?.data?.message || err.message || '游客登录失败，请检查学工号和姓名';
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
    error.value = err.response?.data?.message || err.message || '账号激活失败，请检查信息是否正确';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.login-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.quick-login-section {
  margin-bottom: 32px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #007bff;
}

.quick-login-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #007bff;
  text-align: center;
}

.quick-login-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-login-buttons .btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.divider {
  text-align: center;
  margin: 16px 0 0 0;
  padding-top: 16px;
  border-top: 1px solid #dee2e6;
  color: #666;
  font-size: 14px;
}

.login-tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #e1e5e9;
}

.tab {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab:hover {
  color: #007bff;
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-note {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.dev-hint {
  margin-top: 12px;
  padding: 8px;
  background: #e3f2fd;
  border-radius: 4px;
  text-align: center;
}

.dev-hint small {
  color: #1976d2;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.login-footer {
  text-align: center;
}

.forgot-link {
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
}

.forgot-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-container {
    padding: 24px;
    margin: 16px;
  }
  
  .login-header h1 {
    font-size: 20px;
  }
  
  .tab {
    padding: 10px 12px;
    font-size: 12px;
  }
  
  .quick-login-section {
    padding: 16px;
  }
}
</style> 