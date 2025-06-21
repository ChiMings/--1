<template>
  <div class="login-container">
    <div class="login-card">
      <div class="tabs">
        <button @click="activeTab = 'login'" :class="{ active: activeTab === 'login' }">认证登录</button>
        <button @click="activeTab = 'guest'" :class="{ active: activeTab === 'guest' }">游客登录</button>
        <button @click="activeTab = 'activate'" :class="{ active: activeTab === 'activate' }">账号激活</button>
      </div>

      <!-- 认证登录 -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin">
        <h2>认证登录</h2>
        <div class="form-group">
          <label for="login-id">学工号</label>
          <input id="login-id" type="text" v-model="loginForm.studentId" required>
        </div>
        <div class="form-group">
          <label for="login-password">密码</label>
          <input id="login-password" type="password" v-model="loginForm.password" required>
        </div>
        <button type="submit" class="submit-btn">登录</button>
      </form>

      <!-- 游客登录 -->
      <form v-if="activeTab === 'guest'" @submit.prevent="handleGuestLogin">
        <h2>游客登录</h2>
        <div class="form-group">
          <label for="guest-id">学工号</label>
          <input id="guest-id" type="text" v-model="guestForm.studentId" required>
        </div>
        <div class="form-group">
          <label for="guest-name">姓名</label>
          <input id="guest-name" type="text" v-model="guestForm.name" required>
        </div>
        <button type="submit" class="submit-btn">作为游客进入</button>
      </form>

      <!-- 账号激活 -->
      <form v-if="activeTab === 'activate'" @submit.prevent="handleActivate">
        <h2>账号激活</h2>
        <div class="form-group">
          <label for="activate-id">学工号</label>
          <input id="activate-id" type="text" v-model="activateForm.studentId" required>
        </div>
        <div class="form-group">
          <label for="activate-name">姓名</label>
          <input id="activate-name" type="text" v-model="activateForm.name" required>
        </div>
         <div class="form-group">
          <label for="activate-code">激活码</label>
          <input id="activate-code" type="text" v-model="activateForm.activationCode" required>
        </div>
        <div class="form-group">
          <label for="activate-nickname">昵称</label>
          <input id="activate-nickname" type="text" v-model="activateForm.nickname" required>
        </div>
        <div class="form-group">
          <label for="activate-password">设置密码</label>
          <input id="activate-password" type="password" v-model="activateForm.password" required>
        </div>
        <button type="submit" class="submit-btn">激活并登录</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useUserStore } from '@/store/user';

const activeTab = ref('login');
const userStore = useUserStore();

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
  nickname: '',
  password: '',
});

const handleLogin = async () => {
  try {
    await userStore.login(loginForm);
  } catch (error) {
    console.error('登录失败:', error);
    alert('登录失败，请检查学工号或密码！');
  }
};

const handleGuestLogin = async () => {
  try {
    await userStore.guestLogin(guestForm);
  } catch (error) {
    console.error('游客登录失败:', error);
    alert('登录失败，请检查学工号或姓名！');
  }
};

const handleActivate = async () => {
  try {
    await userStore.activate(activateForm);
  } catch (error) {
    console.error('激活失败:', error);
    alert('激活失败，请检查您的信息！');
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}
.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
}
.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  border-bottom: 2px solid transparent;
}
.tabs button.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  background-color: #1890ff;
  color: white;
  font-size: 16px;
  cursor: pointer;
}
.submit-btn:hover {
  background-color: #40a9ff;
}
</style> 