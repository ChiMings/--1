import request from '@/utils/request';

/**
 * 认证登录
 * @param {object} data { studentId, password }
 */
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  });
}

/**
 * 游客登录
 * @param {object} data { studentId, name }
 */
export function guestLogin(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  });
}


/**
 * 账号激活
 * @param {object} data { studentId, name, activationCode, password, nickname }
 */
export function activate(data) {
  return request({
    url: '/auth/activate',
    method: 'post',
    data,
  });
} 