import { Request, Response, NextFunction } from 'express';
import { prisma } from './database';

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

// 从token中提取用户ID（简化版本）
export function extractUserIdFromToken(token: string): string | null {
  if (!token) return null;
  
  // 简化的token解析：jwt-token-{userId}-{timestamp}
  const parts = token.split('-');
  if (parts.length >= 3 && parts[0] === 'jwt' && parts[1] === 'token') {
    return parts[2];
  }
  
  return null;
}

// 认证中间件
export async function authenticateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: '未提供认证token'
      });
      return;
    }

    const userId = extractUserIdFromToken(token);
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '无效的token格式'
      });
      return;
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        studentId: true,
        name: true,
        role: true,
        status: true
      }
    });

    if (!user || user.status !== '正常') {
      res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
      return;
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      studentId: user.studentId,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: '认证失败'
    });
    return;
  }
}

// 获取当前用户ID（用于不需要强制认证的接口）
export function getCurrentUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return null;
  
  return extractUserIdFromToken(token);
} 