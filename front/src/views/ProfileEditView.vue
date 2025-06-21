<template>
  <div class="profile-edit-page">
    <div class="page-header">
      <h1>个人设置</h1>
      <p>管理您的个人信息和账号设置</p>
    </div>

    <!-- 用户基本信息 -->
    <div class="info-section">
      <h3>基本信息</h3>
      <form @submit.prevent="updateProfile" class="profile-form">
        <!-- 头像上传 -->
        <div class="form-group">
          <label>头像</label>
          <div class="avatar-upload-container">
            <div class="current-avatar">
              <img 
                v-if="userInfo?.avatar" 
                :src="userInfo.avatar" 
                :alt="userInfo.nickname"
                class="avatar-preview"
              />
              <div 
                v-else 
                class="default-avatar"
              >
                {{ userInfo?.nickname?.charAt(0) || 'U' }}
              </div>
            </div>
            
            <div class="avatar-upload-controls">
              <input 
                ref="avatarInput"
                type="file" 
                accept="image/*"
                @change="handleAvatarUpload"
                class="hidden-input"
              />
              <button 
                type="button"
                @click="$refs.avatarInput.click()"
                class="btn btn-outline-primary btn-sm"
              >
                {{ userInfo?.avatar ? '更换头像' : '上传头像' }}
              </button>
              <button 
                v-if="userInfo?.avatar"
                type="button"
                @click="removeAvatar"
                class="btn btn-outline-danger btn-sm"
              >
                删除头像
              </button>
            </div>
            
            <div class="avatar-upload-hint">
              支持 JPG、PNG 格式，文件大小不超过 2MB
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>学工号</label>
          <input 
            :value="userInfo?.studentId" 
            type="text" 
            disabled 
            class="disabled-input"
          />
          <div class="form-hint">学工号不可修改</div>
        </div>

        <div class="form-group">
          <label>真实姓名</label>
          <input 
            :value="userInfo?.name" 
            type="text" 
            disabled 
            class="disabled-input"
          />
          <div class="form-hint">真实姓名不可修改</div>
        </div>

        <div class="form-group">
          <label>昵称</label>
          <input 
            v-model="profileForm.nickname" 
            type="text" 
            placeholder="请输入昵称"
            maxlength="20"
            required
          />
          <div class="char-count">{{ profileForm.nickname.length }}/20</div>
        </div>

        <div class="form-group">
          <label>联系方式</label>
          <input 
            v-model="profileForm.contact" 
            type="text" 
            placeholder="QQ/微信/手机号等"
            maxlength="50"
          />
          <div class="form-hint">用于买家联系您，建议填写常用联系方式</div>
        </div>

        <div class="form-group">
          <label>用户角色</label>
          <div class="role-display">
            <span :class="getRoleClass(userInfo?.role)">{{ userInfo?.role }}</span>
            <div class="role-hint">
              <span v-if="userInfo?.role === '未认证用户'">
                完成身份认证可获得更多功能
              </span>
              <span v-else-if="userInfo?.role === '认证用户'">
                您已通过身份认证
              </span>
              <span v-else-if="userInfo?.role === '管理员'">
                您拥有管理员权限
              </span>
            </div>
          </div>
        </div>



        <div class="form-actions">
          <button 
            type="submit" 
            :disabled="updatingProfile"
            class="btn btn-primary"
          >
            {{ updatingProfile ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 密码修改 -->
    <div class="info-section">
      <h3>密码修改</h3>
      <form @submit.prevent="updatePassword" class="password-form">
        <div class="form-group">
          <label>当前密码</label>
          <input 
            v-model="passwordForm.currentPassword" 
            type="password" 
            placeholder="请输入当前密码"
            required
          />
        </div>

        <div class="form-group">
          <label>新密码</label>
          <input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码（至少6位）"
            minlength="6"
            required
          />
        </div>

        <div class="form-group">
          <label>确认新密码</label>
          <input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
            required
          />
        </div>

        <div v-if="passwordError" class="error-message">
          {{ passwordError }}
        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            :disabled="updatingPassword || !isPasswordFormValid"
            class="btn btn-primary"
          >
            {{ updatingPassword ? '修改中...' : '修改密码' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 账号统计 -->
    <div class="info-section">
      <h3>账号统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ userStats.totalProducts }}</div>
          <div class="stat-label">发布商品</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{{ userStats.soldProducts }}</div>
          <div class="stat-label">已售商品</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{{ userStats.favoriteProducts }}</div>
          <div class="stat-label">收藏商品</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{{ userStats.totalMessages }}</div>
          <div class="stat-label">消息总数</div>
        </div>
      </div>
    </div>

    <!-- 隐私设置 -->
    <div class="info-section">
      <h3>隐私设置</h3>
      <div class="privacy-settings">
        <div class="setting-item">
          <label class="setting-label">
            <input 
              v-model="privacySettings.showContact" 
              type="checkbox"
              @change="updatePrivacySettings"
            />
            <span>允许其他用户查看我的联系方式</span>
          </label>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input 
              v-model="privacySettings.showProducts" 
              type="checkbox"
              @change="updatePrivacySettings"
            />
            <span>允许其他用户查看我的商品列表</span>
          </label>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input 
              v-model="privacySettings.receiveMessages" 
              type="checkbox"
              @change="updatePrivacySettings"
            />
            <span>接收其他用户的私信</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- 成功信息 -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { updateUserInfo } from '@/api/users';

const userStore = useUserStore();

// 响应式数据
const updatingProfile = ref(false);
const updatingPassword = ref(false);
const error = ref('');
const passwordError = ref('');
const successMessage = ref('');

const profileForm = reactive({
  nickname: '',
  contact: '',
  avatar: ''
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const privacySettings = reactive({
  showContact: true,
  showProducts: true,
  receiveMessages: true,
});

const userStats = reactive({
  totalProducts: 0,
  soldProducts: 0,
  favoriteProducts: 0,
  totalMessages: 0,
});

// 计算属性
const userInfo = computed(() => userStore.userInfo);

const isPasswordFormValid = computed(() => {
  return passwordForm.currentPassword &&
         passwordForm.newPassword &&
         passwordForm.confirmPassword &&
         passwordForm.newPassword === passwordForm.confirmPassword &&
         passwordForm.newPassword.length >= 6;
});

// 初始化表单数据
function initializeForm() {
  if (userInfo.value) {
    profileForm.nickname = userInfo.value.nickname || '';
    profileForm.contact = userInfo.value.contact || '';
    profileForm.avatar = userInfo.value.avatar || '';
  }
}

// 加载用户统计数据
function loadUserStats() {
  // 模拟统计数据
  userStats.totalProducts = 12;
  userStats.soldProducts = 8;
  userStats.favoriteProducts = 15;
  userStats.totalMessages = 23;
}

// 更新个人信息
async function updateProfile() {
  try {
    updatingProfile.value = true;
    error.value = '';
    successMessage.value = '';
    
    const updateData = {
      nickname: profileForm.nickname.trim(),
      contact: profileForm.contact.trim(),
    };
    
    await updateUserInfo(updateData);
    
    // 更新store中的用户信息
    Object.assign(userStore.userInfo, updateData);
    
    successMessage.value = '个人信息更新成功';
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    console.error('Failed to update profile:', err);
    error.value = err.response?.data?.message || '更新失败，请重试';
  } finally {
    updatingProfile.value = false;
  }
}

// 修改密码
async function updatePassword() {
  try {
    updatingPassword.value = true;
    passwordError.value = '';
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      passwordError.value = '两次输入的新密码不一致';
      return;
    }
    
    // 这里应该调用修改密码的API
    // await changePassword({
    //   currentPassword: passwordForm.currentPassword,
    //   newPassword: passwordForm.newPassword,
    // });
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 清空表单
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    
    successMessage.value = '密码修改成功';
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    console.error('Failed to update password:', err);
    passwordError.value = err.response?.data?.message || '密码修改失败，请检查当前密码是否正确';
  } finally {
    updatingPassword.value = false;
  }
}

// 更新隐私设置
async function updatePrivacySettings() {
  try {
    // 这里应该调用更新隐私设置的API
    // await updatePrivacySettings(privacySettings);
    
    console.log('Privacy settings updated:', privacySettings);
  } catch (err) {
    console.error('Failed to update privacy settings:', err);
  }
}

// 处理头像上传
async function handleAvatarUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }
  
  // 验证文件大小（2MB）
  if (file.size > 2 * 1024 * 1024) {
    error.value = '图片文件大小不能超过 2MB'
    return
  }
  
  try {
    error.value = ''
    
    // 使用 FileReader 预览图片
    const reader = new FileReader()
    reader.onload = (e) => {
      // 更新用户头像
      profileForm.avatar = e.target.result
      
      // 立即更新到用户信息中
      if (userStore.userInfo) {
        userStore.userInfo.avatar = e.target.result
        // 保存到 localStorage
        localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
      }
      
      successMessage.value = '头像更新成功'
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
    
    reader.readAsDataURL(file)
    
  } catch (err) {
    console.error('头像上传失败:', err)
    error.value = '头像上传失败，请重试'
  }
}

// 删除头像
function removeAvatar() {
  if (!confirm('确定要删除头像吗？')) return
  
  profileForm.avatar = ''
  
  if (userStore.userInfo) {
    userStore.userInfo.avatar = ''
    localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  }
  
  successMessage.value = '头像删除成功'
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// 工具函数
function getRoleClass(role) {
  const roleMap = {
    '未认证用户': 'role-unverified',
    '认证用户': 'role-verified',
    '管理员': 'role-admin',
    '超级管理员': 'role-super-admin'
  };
  return roleMap[role] || 'role-default';
}

function getCreditClass(credit) {
  if (credit >= 95) return 'credit-excellent';
  if (credit >= 85) return 'credit-good';
  if (credit >= 70) return 'credit-fair';
  return 'credit-poor';
}

function getCreditText(credit) {
  if (credit >= 95) return '优秀';
  if (credit >= 85) return '良好';
  if (credit >= 70) return '一般';
  return '较差';
}

// 组件挂载
onMounted(() => {
  initializeForm();
  loadUserStats();
});
</script>

<style scoped>
.profile-edit-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.info-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.profile-form,
.password-form {
  max-width: 500px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
}

.disabled-input {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.form-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.role-display,
.credit-display {
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.role-unverified { color: #ffc107; }
.role-verified { color: #28a745; }
.role-admin { color: #007bff; }
.role-super-admin { color: #dc3545; }

.credit-score {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.credit-score span:first-child {
  font-size: 20px;
  font-weight: bold;
}

.credit-excellent { color: #28a745; }
.credit-good { color: #17a2b8; }
.credit-fair { color: #ffc107; }
.credit-poor { color: #dc3545; }

.role-hint,
.credit-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.privacy-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.setting-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 6px;
  margin: 16px 0;
  font-size: 14px;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 12px 16px;
  border-radius: 6px;
  margin: 16px 0;
  font-size: 14px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .info-section {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.avatar-upload-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e9ecef;
  flex-shrink: 0;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
}

.avatar-upload-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hidden-input {
  display: none;
}

.avatar-upload-hint {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-outline-primary {
  border: 1px solid #007bff;
  color: #007bff;
  background: white;
}

.btn-outline-primary:hover {
  background: #007bff;
  color: white;
}

.btn-outline-danger {
  border: 1px solid #dc3545;
  color: #dc3545;
  background: white;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}
</style> 