import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login as apiLogin, activate as apiActivate, guestLogin as apiGuestLogin } from '@/api/auth';
import { useRouter } from 'vue-router';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const userInfo = ref(null);
  const router = useRouter();

  async function handleLogin(loginFn, credentials) {
    const response = await loginFn(credentials);
    const data = response.data;
    token.value = data.token;
    userInfo.value = data.user;
    localStorage.setItem('token', data.token);
    // 登录成功后跳转到首页
    await router.push('/');
  }

  // 认证登录
  async function login(credentials) {
    await handleLogin(apiLogin, credentials);
  }

  // 游客登录
  async function guestLogin(credentials) {
    await handleLogin(apiGuestLogin, credentials);
  }

  // 账号激活
  async function activate(credentials) {
    await handleLogin(apiActivate, credentials);
  }

  // 退出登录
  function logout() {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    router.push('/login');
  }

  return {
    token,
    userInfo,
    login,
    guestLogin,
    activate,
    logout,
  };
}); 