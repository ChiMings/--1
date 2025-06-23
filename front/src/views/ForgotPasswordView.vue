<template>
  <div class="forgot-password-page">
    <div class="forgot-password-container">
      <div class="forgot-password-card frosted-glass">
        <div class="card-header">
          <h1>找回密码</h1>
          <p>请按照以下步骤重置您的密码</p>
        </div>

        <!-- 步骤指示器 -->
        <div class="steps-indicator">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="step-item-wrapper"
          >
            <div
              :class="['step-item', {
                active: currentStep === index + 1,
                completed: currentStep > index + 1
              }]"
            >
              <div class="step-icon">
                <i v-if="currentStep > index + 1" class="fas fa-check"></i>
                <span v-else>{{ index + 1 }}</span>
              </div>
            </div>
            <div class="step-label">{{ step.label }}</div>
            <div v-if="index < steps.length - 1" class="step-connector"></div>
          </div>
        </div>

        <div class="card-content">
          <transition name="fade" mode="out-in">
            <div :key="currentStep">
              <!-- 步骤1：验证学号 -->
              <div v-if="currentStep === 1" class="step-content">
                <form @submit.prevent="verifyStudentId" class="form">
                  <div class="form-group">
                    <label for="studentId">学号</label>
                    <input
                      id="studentId"
                      v-model="formData.studentId"
                      type="text"
                      placeholder="请输入您的学号"
                      class="form-control"
                      :class="{ 'is-invalid': errors.studentId }"
                      :disabled="loading"
                    />
                     <div v-if="errors.studentId" class="error-text">{{ errors.studentId }}</div>
                  </div>
                  <div class="form-actions">
                    <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
                      {{ loading ? '验证中...' : '下一步' }}
                    </button>
                    <router-link to="/login" class="btn btn-link">
                      返回登录
                    </router-link>
                  </div>
                </form>
              </div>

              <!-- 步骤2：安全验证 -->
              <div v-if="currentStep === 2" class="step-content">
                 <div class="user-info-preview">
                  <div class="user-avatar">
                    <span>{{ userInfo?.nickname?.charAt(0) || 'U' }}</span>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ userInfo?.name }}</div>
                    <div class="user-id">学号：{{ userInfo?.studentId }}</div>
                  </div>
                </div>
                <form @submit.prevent="verifySecurityAnswer" class="form">
                  <div class="form-group">
                    <label>安全问题</label>
                    <div class="security-question-display">
                      {{ securityQuestion }}
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="securityAnswer">您的答案</label>
                    <input
                      id="securityAnswer"
                      v-model="formData.securityAnswer"
                      type="text"
                      placeholder="请输入安全问题答案"
                      class="form-control"
                      :class="{ 'is-invalid': errors.securityAnswer }"
                      :disabled="loading"
                    />
                    <div v-if="errors.securityAnswer" class="error-text">{{ errors.securityAnswer }}</div>
                  </div>

                  <div class="form-actions">
                    <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
                      {{ loading ? '验证中...' : '下一步' }}
                    </button>
                    <button type="button" @click="goToPreviousStep" class="btn btn-link">
                      上一步
                    </button>
                  </div>
                </form>
              </div>

              <!-- 步骤3：重置密码 -->
              <div v-if="currentStep === 3" class="step-content">
                <form @submit.prevent="resetPassword" class="form">
                  <div class="form-group">
                    <label for="newPassword">新密码</label>
                    <input
                      id="newPassword"
                      v-model="formData.newPassword"
                      type="password"
                      placeholder="至少6位，包含字母和数字"
                      class="form-control"
                      :class="{ 'is-invalid': errors.newPassword }"
                      :disabled="loading"
                    />
                    <div class="password-tips">
                      <ul>
                        <li :class="{ valid: passwordValidation.length }"><i class="fas fa-check-circle"></i> 至少6位字符</li>
                        <li :class="{ valid: passwordValidation.hasLetter }"><i class="fas fa-check-circle"></i> 包含字母</li>
                        <li :class="{ valid: passwordValidation.hasNumber }"><i class="fas fa-check-circle"></i> 包含数字</li>
                      </ul>
                    </div>
                     <div v-if="errors.newPassword" class="error-text">{{ errors.newPassword }}</div>
                  </div>

                  <div class="form-group">
                    <label for="confirmPassword">确认密码</label>
                    <input
                      id="confirmPassword"
                      v-model="formData.confirmPassword"
                      type="password"
                      placeholder="请再次输入新密码"
                      class="form-control"
                      :class="{ 'is-invalid': errors.confirmPassword }"
                      :disabled="loading"
                    />
                    <div v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</div>
                  </div>

                  <div class="form-actions">
                    <button type="submit" :disabled="loading || !isPasswordValid" class="btn btn-primary btn-block">
                      {{ loading ? '重置中...' : '完成重置' }}
                    </button>
                    <button type="button" @click="goToPreviousStep" class="btn btn-link">
                      上一步
                    </button>
                  </div>
                </form>
              </div>

              <!-- 步骤4：完成 -->
              <div v-if="currentStep === 4" class="step-content">
                <div class="success-content">
                  <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                  </div>
                  <h3>密码重置成功</h3>
                  <p>您的密码已成功重置，现在可以使用新密码登录了。</p>
                  <div class="form-actions">
                    <router-link to="/login" class="btn btn-primary btn-block">
                      立即登录
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- 帮助提示 -->
      <div class="help-section frosted-glass">
        <h4>需要帮助？</h4>
        <p>如果无法通过以上步骤找回密码，请联系管理员。</p>
        <a href="mailto:support@example.com" class="btn btn-outline">联系管理员</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { mockUsers } from '@/utils/mockData';
import { config } from '@/utils/config';

const router = useRouter();

// 响应式数据
const loading = ref(false);
const currentStep = ref(1);
const userInfo = ref(null);
const securityQuestion = ref('');

const formData = reactive({
  studentId: '',
  securityAnswer: '',
  newPassword: '',
  confirmPassword: ''
});

const errors = reactive({
  studentId: '',
  securityAnswer: '',
  newPassword: '',
  confirmPassword: ''
});

// 步骤配置
const steps = [
  { label: '验证学号' },
  { label: '安全验证' },
  { label: '重置密码' },
  { label: '完成' }
];

// 模拟的安全问题
const securityQuestions = [
  '您的第一个宠物叫什么名字？',
  '您小学最好的朋友叫什么名字？',
  '您出生的医院名称是什么？',
  '您第一份工作的公司名称是什么？',
  '您最喜欢的电影是什么？'
];

// 计算属性
const passwordValidation = computed(() => {
  const password = formData.newPassword;
  return {
    length: password.length >= 6,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password)
  };
});

const isPasswordValid = computed(() => {
  return passwordValidation.value.length &&
         passwordValidation.value.hasNumber &&
         passwordValidation.value.hasLetter &&
         formData.newPassword === formData.confirmPassword;
});

// 清除错误信息
function clearErrors() {
  Object.keys(errors).forEach(key => {
    errors[key] = '';
  });
}

// 验证学号
async function verifyStudentId() {
  clearErrors();
  
  if (!formData.studentId.trim()) {
    errors.studentId = '请输入学号';
    return;
  }

  try {
    loading.value = true;
    
    if (config.useMockData) {
      // 使用模拟数据验证
      const user = mockUsers.find(u => u.studentId === formData.studentId);
      
      if (!user) {
        errors.studentId = '学号不存在，请检查输入';
        return;
      }
      
      userInfo.value = user;
      securityQuestion.value = securityQuestions[user.id % securityQuestions.length];
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      currentStep.value = 2;
    } else {
      // 这里应该调用真实的API
      // const response = await verifyStudentIdAPI(formData.studentId);
      // userInfo.value = response.data.user;
      // securityQuestion.value = response.data.securityQuestion;
      // currentStep.value = 2;
    }
  } catch (error) {
    console.error('Failed to verify student ID:', error);
    errors.studentId = '验证失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

// 验证安全问题答案
async function verifySecurityAnswer() {
  clearErrors();
  
  if (!formData.securityAnswer.trim()) {
    errors.securityAnswer = '请输入安全问题答案';
    return;
  }

  try {
    loading.value = true;
    
    if (config.useMockData) {
      // 模拟验证安全问题（这里简化处理，实际应该有真正的答案验证）
      const correctAnswers = ['小白', '张三', '人民医院', '腾讯', '泰坦尼克号'];
      const correctAnswer = correctAnswers[userInfo.value.id % correctAnswers.length];
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (formData.securityAnswer.toLowerCase() !== correctAnswer.toLowerCase()) {
        errors.securityAnswer = '安全问题答案不正确';
        return;
      }
      
      currentStep.value = 3;
    } else {
      // 这里应该调用真实的API
      // const response = await verifySecurityAnswerAPI(userInfo.value.id, formData.securityAnswer);
      // if (response.success) {
      //   currentStep.value = 3;
      // } else {
      //   errors.securityAnswer = '安全问题答案不正确';
      // }
    }
  } catch (error) {
    console.error('Failed to verify security answer:', error);
    errors.securityAnswer = '验证失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

// 重置密码
async function resetPassword() {
  clearErrors();
  
  // 验证新密码
  if (!formData.newPassword) {
    errors.newPassword = '请输入新密码';
    return;
  }
  
  if (!passwordValidation.value.length) {
    errors.newPassword = '密码至少需要6位字符';
    return;
  }
  
  if (!passwordValidation.value.hasNumber || !passwordValidation.value.hasLetter) {
    errors.newPassword = '密码需要包含字母和数字';
    return;
  }
  
  // 验证确认密码
  if (!formData.confirmPassword) {
    errors.confirmPassword = '请确认新密码';
    return;
  }
  
  if (formData.newPassword !== formData.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致';
    return;
  }

  try {
    loading.value = true;
    
    if (config.useMockData) {
      // 模拟密码重置
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 这里实际应该更新用户密码
      console.log('Password reset for user:', userInfo.value.studentId);
      
      currentStep.value = 4;
    } else {
      // 这里应该调用真实的API
      // const response = await resetPasswordAPI(userInfo.value.id, formData.newPassword);
      // if (response.success) {
      //   currentStep.value = 4;
      // }
    }
  } catch (error) {
    console.error('Failed to reset password:', error);
    errors.newPassword = '密码重置失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

// 返回上一步
function goToPreviousStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
    clearErrors();
  }
}
</script>

<style scoped>
.forgot-password-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 64px);
  padding: 2rem 1rem;
}

.forgot-password-container {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.forgot-password-card {
  padding: 2.5rem;
  border-radius: 1.5rem;
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}
.card-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.card-header p {
  color: var(--text-color-secondary);
}

.steps-indicator {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.5rem;
  position: relative;
}
.step-item-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}
.step-item {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  background-color: var(--bg-color-alt);
  border: 2px solid var(--border-color);
  color: var(--text-color-secondary);
}
.step-icon {
  font-size: 1.2rem;
}
.step-item.active {
  background-color: var(--primary-color-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.step-item.completed {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
}
.step-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}
.step-item-wrapper:not(:last-child) .step-connector {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateY(-50%);
  height: 2px;
  background: var(--border-color);
  width: 100%;
  z-index: -1;
}

.step-item.completed ~ .step-connector {
    background: var(--success-color);
}

.step-content {
  margin-top: 1rem;
  text-align: left;
}
.step-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-align: center;
}
.step-content .step-desc {
    color: var(--text-color-secondary);
    text-align: center;
    margin-bottom: 2rem;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}
.btn-block {
  width: 100%;
  padding: 0.8rem;
}
.error-text {
  color: var(--danger-color);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.success-content {
  text-align: center;
  padding: 2rem 0;
}
.success-icon {
  font-size: 4rem;
  color: var(--success-color);
  margin-bottom: 1.5rem;
}
.success-content h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.success-content p {
  color: var(--text-color-secondary);
  margin-bottom: 2rem;
}

.help-section {
  padding: 1.5rem;
  text-align: center;
  border-radius: 1rem;
}

.help-section h4 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.help-section p {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Retaining some specific logic from original component's CSS */
.password-tips {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}
.password-tips ul {
  list-style: none;
  padding-left: 0;
}
.password-tips li {
  transition: color 0.2s;
}
.password-tips li.valid {
  color: var(--success-color);
  text-decoration: line-through;
}
.security-question {
  background: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  font-style: italic;
}
.user-info-preview {
  display: flex;
  align-items: center;
  background-color: var(--bg-color-alt);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}
.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.5rem;
  margin-right: 1rem;
  flex-shrink: 0;
}
.user-details {
  min-width: 0;
}
.user-name {
  font-weight: 600;
  color: var(--text-color);
}
.user-id {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.security-question-display {
  padding: 1rem;
  background-color: var(--bg-color-alt);
  border-radius: 8px;
  font-style: italic;
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color);
}

.password-tips {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin-top: 0.75rem;
}
.password-tips ul {
  list-style: none;
  padding-left: 0;
  display: flex;
  gap: 1rem;
}
.password-tips li {
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.password-tips li .fa-check-circle {
    display: none;
}
.password-tips li.valid {
  color: var(--success-color);
}
.password-tips li.valid .fa-check-circle {
    display: inline-block;
}

.is-invalid {
    border-color: var(--danger-color) !important;
}

/* Remove old specific styles that are now handled by global styles or new scoped styles */
.security-question,
.form-control.error,
.password-tips p,
.activation-hint,
.user-avatar {
  /* These are now replaced or handled differently */
}
</style> 