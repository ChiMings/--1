import { ApiResponse, PaginatedResponse } from '../types';

/**
 * 成功响应
 */
export function success<T>(message: string, data?: T): ApiResponse<T> {
  return {
    status: 'success',
    message,
    data
  };
}

/**
 * 错误响应
 */
export function error(message: string, code?: number): ApiResponse {
  return {
    status: 'error',
    message,
    code
  };
}

/**
 * 分页响应
 */
export function paginated<T>(
  message: string,
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    status: 'success',
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * 未找到响应
 */
export function notFound(message: string = '资源不存在'): ApiResponse {
  return error(message, 404);
}

/**
 * 未授权响应
 */
export function unauthorized(message: string = '未授权访问'): ApiResponse {
  return error(message, 401);
}

/**
 * 禁止访问响应
 */
export function forbidden(message: string = '禁止访问'): ApiResponse {
  return error(message, 403);
}

/**
 * 参数错误响应
 */
export function badRequest(message: string = '参数错误'): ApiResponse {
  return error(message, 400);
}

/**
 * 冲突响应
 */
export function conflict(message: string = '资源冲突'): ApiResponse {
  return error(message, 409);
} 