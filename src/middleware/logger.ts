import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // 简单的控制台日志
    process.stdout.write(
      `${new Date().toISOString()} [${method}] ${url} - ${statusCode} - ${duration}ms - ${ip}\n`
    );
  });

  next();
} 