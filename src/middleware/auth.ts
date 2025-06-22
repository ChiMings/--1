import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { error, badRequest } from '../utils/response';
import { prisma } from '../utils/database';

// JWT密钥 - 在生产环境中应该使用环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        studentId: string;
        role: string;
      };
    }
  }
}

// 生成JWT token
export function generateToken(user: any) {
  return jwt.sign(
    {
      id: user.id,
      studentId: user.studentId,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// 验证JWT token
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

// 身份验证中间件
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json(badRequest('访问令牌缺失'));
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json(badRequest('访问令牌无效'));
    return;
  }

  req.user = decoded;
  next();
}

// 可选的身份验证中间件（用于不强制要求登录的接口）
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

// 管理员权限验证
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json(badRequest('未登录'));
    return;
  }

  if (req.user.role !== '管理员' && req.user.role !== '超级管理员') {
    res.status(403).json(error('权限不足'));
    return;
  }

  next();
} 