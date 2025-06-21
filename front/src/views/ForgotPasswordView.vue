<template>
  <div class="forgot-password-page">
    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <div class="card-header">
          <h1>找回密码</h1>
          <p>请按照以下步骤重置您的密码</p>
        </div>

        <!-- 步骤指示器 -->
        <div class="steps-indicator">
          <div 
            v-for="(step, index) in steps"
            :key="index"
            :class="['step-item', {
              active: currentStep === index + 1,
              completed: currentStep > index + 1
            }]"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-label">{{ step.label }}</div>
          </div>
        </div>

        <div class="card-content">
          <!-- 步骤1：验证学号 -->
          <div v-if="currentStep === 1" class="step-content">
            <h3>验证学号</h3>
            <p class="step-desc">请输入您的学号，我们将验证您的身份</p>

            <form @submit.prevent="verifyStudentId" class="form">
              <div class="form-group">
                <label for="studentId">学号</label>
                <input
                  id="studentId"
                  v-model="formData.studentId"
                  type="text"
                  placeholder="请输入学号"
                  :class="['form-control', { error: errors.studentId }]"
                  :disabled="loading"
                />
                <div v-if="errors.studentId" class="error-message">
                  {{ errors.studentId }}
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
                  {{ loading ? '验证中...' : '下一步' }}
                </button>
                
                <router-link to="/login" class="btn btn-link">
                  返回登录
                </router-link>
              </div>

              <div class="activation-hint">
                <p>还没有激活账号？</p>
                <router-link to="/login" class="activation-link">
                  点击这里激活账号并设置密码
                </router-link>
              </div>
            </form>
          </div>

          <!-- 步骤2：安全验证 -->
          <div v-if="currentStep === 2" class="step-content">
            <h3>安全验证</h3>
            <p class="step-desc">请回答您设置的安全问题来验证身份</p>

            <div class="user-info-preview">
              <div class="user-avatar">
                {{ userInfo?.nickname?.charAt(0) || 'U' }}
              </div>
              <div class="user-details">
                <div class="user-name">{{ userInfo?.name }}</div>
                <div class="user-id">学号：{{ userInfo?.studentId }}</div>
              </div>
            </div>

            <form @submit.prevent="verifySecurityAnswer" class="form">
              <div class="form-group">
                <label>安全问题</label>
                <div class="security-question">
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
                  :class="['form-control', { error: errors.securityAnswer }]"
                  :disabled="loading"
                />
                <div v-if="errors.securityAnswer" class="error-message">
                  {{ errors.securityAnswer }}
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
                  {{ loading ? '验证中...' : '下一步' }}
                </button>
                
                <button type="button" @click="goToPreviousStep" class="btn btn-outline-secondary">
                  上一步
                </button>
              </div>
            </form>
          </div>

          <!-- 步骤3：重置密码 -->
          <div v-if="currentStep === 3" class="step-content">
            <h3>重置密码</h3>
            <p class="step-desc">请设置您的新密码</p>

            <form @submit.prevent="resetPassword" class="form">
              <div class="form-group">
                <label for="newPassword">新密码</label>
                <input
                  id="newPassword"
                  v-model="formData.newPassword"
                  type="password"
                  placeholder="请输入新密码"
                  :class="['form-control', { error: errors.newPassword }]"
                  :disabled="loading"
                />
                <div v-if="errors.newPassword" class="error-message">
                  {{ errors.newPassword }}
                </div>
                <div class="password-tips">
                  <p>密码要求：</p>
                  <ul>
                    <li :class="{ valid: passwordValidation.length }">至少6位字符</li>
                    <li :class="{ valid: passwordValidation.hasNumber }">包含数字</li>
                    <li :class="{ valid: passwordValidation.hasLetter }">包含字母</li>
                  </ul>
                </div>
              </div>

              <div class="form-group">
                <label for="confirmPassword">确认密码</label>
                <input
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  :class="['form-control', { error: errors.confirmPassword }]"
                  :disabled="loading"
                />
                <div v-if="errors.confirmPassword" class="error-message">
                  {{ errors.confirmPassword }}
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" :disabled="loading || !isPasswordValid" class="btn btn-primary btn-block">
                  {{ loading ? '重置中...' : '完成重置' }}
                </button>
                
                <button type="button" @click="goToPreviousStep" class="btn btn-outline-secondary">
                  上一步
                </button>
              </div>
            </form>
          </div>

          <!-- 步骤4：完成 -->
          <div v-if="currentStep === 4" class="step-content">
            <div class="success-content">
              <div class="success-icon">✅</div>
              <h3>密码重置成功</h3>
              <p>您的密码已成功重置，现在可以使用新密码登录了。</p>

              <div class="form-actions">
                <router-link to="/login" class="btn btn-primary btn-block">
                  立即登录
                </router-link>
                
                <router-link to="/" class="btn btn-outline-primary">
                  返回首页
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 帮助提示 -->
      <div class="help-section">
        <h4>遇到问题？</h4>
        <div class="help-items">
          <div class="help-item">
            <h5>忘记学号？</h5>
            <p>请联系学校管理员或查看学生证</p>
          </div>
          <div class="help-item">
            <h5>忘记安全问题答案？</h5>
            <p>请联系系统管理员进行人工验证</p>
          </div>
          <div class="help-item">
            <h5>其他问题？</h5>
            <p>请发送邮件至 support@example.com</p>
          </div>
        </div>
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
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.forgot-password-container {
  width: 100%;
  max-width: 600px;
}

.forgot-password-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 24px;
}

.card-header {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 32px 24px;
  text-align: center;
}

.card-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
}

.card-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.steps-indicator {
  display: flex;
  justify-content: center;
  padding: 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  max-width: 120px;
}

.step-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 16px;
  right: -50%;
  width: 100%;
  height: 2px;
  background: #ddd;
  z-index: 1;
}

.step-item.completed:not(:last-child)::after {
  background: #28a745;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ddd;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
}

.step-item.active .step-number {
  background: #007bff;
  color: white;
}

.step-item.completed .step-number {
  background: #28a745;
  color: white;
}

.step-label {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.step-item.active .step-label {
  color: #007bff;
  font-weight: 500;
}

.card-content {
  padding: 32px 24px;
}

.step-content h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.step-desc {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 14px;
}

.user-info-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 24px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.user-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-id {
  font-size: 12px;
  color: #666;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-control.error {
  border-color: #dc3545;
}

.form-control:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.security-question {
  padding: 12px 16px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #333;
  font-size: 14px;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

.password-tips {
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
}

.password-tips p {
  margin: 0 0 8px 0;
  color: #666;
  font-weight: 500;
}

.password-tips ul {
  margin: 0;
  padding-left: 16px;
  list-style: none;
}

.password-tips li {
  margin-bottom: 4px;
  color: #dc3545;
  position: relative;
}

.password-tips li::before {
  content: '✗';
  position: absolute;
  left: -16px;
  font-weight: bold;
}

.password-tips li.valid {
  color: #28a745;
}

.password-tips li.valid::before {
  content: '✓';
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
  text-align: center;
  display: inline-block;
}

.btn-block {
  width: 100%;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-outline-primary {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline-primary:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.btn-link {
  background: transparent;
  color: #007bff;
  border: none;
  text-decoration: underline;
}

.btn-link:hover {
  color: #0056b3;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.activation-hint {
  text-align: center;
  padding: 16px 0;
  border-top: 1px solid #eee;
  margin-top: 16px;
}

.activation-hint p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.activation-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.activation-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

.success-content {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.success-content h3 {
  color: #28a745;
  margin-bottom: 16px;
}

.success-content p {
  color: #666;
  margin-bottom: 24px;
}

.help-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.help-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.help-items {
  display: grid;
  gap: 16px;
}

.help-item h5 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 14px;
}

.help-item p {
  margin: 0;
  color: #666;
  font-size: 12px;
}

@media (max-width: 768px) {
  .forgot-password-page {
    padding: 16px;
  }
  
  .card-header {
    padding: 24px 16px;
  }
  
  .card-header h1 {
    font-size: 24px;
  }
  
  .steps-indicator {
    padding: 16px;
  }
  
  .step-item {
    max-width: 80px;
  }
  
  .step-number {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .step-label {
    font-size: 10px;
  }
  
  .card-content {
    padding: 24px 16px;
  }
  
  .help-items {
    grid-template-columns: 1fr;
  }
}
</style> 