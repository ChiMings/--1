import { Request } from 'express';

// API响应类型
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  code?: number;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  status: 'success';
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT载荷类型
export interface JwtPayload {
  userId: string;
  studentId: string;
  role: string;
  iat?: number;
  exp?: number;
}

// 扩展Request类型，包含用户信息
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// 用户相关类型
export interface CreateUserDto {
  studentId: string;
  name: string;
  nickname?: string;
  contact?: string;
  activationCode?: string;
}

export interface LoginDto {
  studentId: string;
  password?: string;
  name?: string;
}

export interface ActivateAccountDto {
  studentId: string;
  name: string;
  activationCode: string;
  password: string;
  nickname: string;
}

export interface ResetPasswordDto {
  studentId: string;
  resetCode: string;
  newPassword: string;
}

// 商品相关类型
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  contact?: string;
  images?: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  contact?: string;
  status?: string;
  images?: string[];
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  sellerId?: string;
  status?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

// 分类相关类型
export interface CreateCategoryDto {
  name: string;
  description?: string;
}

// 评论相关类型
export interface CreateCommentDto {
  productId: string;
  content: string;
}

// 消息相关类型
export interface CreateMessageDto {
  receiverId: string;
  content: string;
}

// 举报相关类型
export interface CreateReportDto {
  productId?: string;
  reason: string;
  content?: string;
}

// 文件上传类型
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
} 