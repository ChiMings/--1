import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('错误详情:', err);

  // Prisma错误处理
  if (err.code === 'P2002') {
    return res.status(409).json(error('数据已存在，请检查唯一性约束'));
  }

  if (err.code === 'P2025') {
    return res.status(404).json(error('记录不存在'));
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(error('无效的令牌'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(error('令牌已过期'));
  }

  // 验证错误处理
  if (err.name === 'ValidationError') {
    return res.status(400).json(error(err.message));
  }

  // 默认错误处理
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || '服务器内部错误';

  return res.status(statusCode).json(error(message, statusCode));
} 