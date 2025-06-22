import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { success, error, badRequest } from '../utils/response';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads');
const headDir = path.join(uploadDir, 'head');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(headDir)) {
  fs.mkdirSync(headDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req: any, file: any, cb: any) => {
  // 检查文件类型
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
    files: 5 // 最多5个文件
  }
});

// 头像专用存储配置
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, headDir);
  },
  filename: (req, file, cb) => {
    // 为头像生成唯一文件名
    const userId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${timestamp}${ext}`);
  }
});

// 头像文件过滤器（更严格的限制）
const avatarFilter = (req: any, file: any, cb: any) => {
  // 只允许常见的图片格式
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
    cb(null, true);
  } else {
    cb(new Error('头像只支持 JPG、PNG、GIF 格式'), false);
  }
};

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 头像限制2MB
    files: 1 // 只能上传一个文件
  }
});

// 头像上传
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(badRequest('请选择头像文件'));
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/head/${req.file.filename}`,
      uploadedAt: new Date().toISOString()
    };

    return res.json(success('头像上传成功', fileInfo));
  } catch (err) {
    console.error('头像上传失败:', err);
    return res.status(500).json(error('头像上传失败'));
  }
});

// 单文件上传
router.post('/single', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(badRequest('请选择要上传的文件'));
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date().toISOString()
    };

    return res.json(success('文件上传成功', fileInfo));
  } catch (err) {
    return res.status(500).json(error('上传失败'));
  }
});

// 多文件上传
router.post('/multiple', upload.array('files', 5), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json(badRequest('请选择要上传的文件'));
    }

    const fileInfos = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date().toISOString()
    }));

    return res.json(success('文件上传成功', fileInfos));
  } catch (err) {
    return res.status(500).json(error('上传失败'));
  }
});

// 删除文件
router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(error('文件不存在'));
    }

    // TODO: 验证用户权限（只能删除自己上传的文件）

    // 删除文件
    fs.unlinkSync(filePath);

    return res.json(success('文件删除成功'));
  } catch (err) {
    return res.status(500).json(error('删除失败'));
  }
});

// 获取文件信息
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(error('文件不存在'));
    }

    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename,
      size: stats.size,
      url: `/uploads/${filename}`,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString()
    };

    return res.json(success('获取文件信息成功', fileInfo));
  } catch (err) {
    return res.status(500).json(error('获取失败'));
  }
});

// 错误处理中间件
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(badRequest('文件大小超过限制（最大5MB）'));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json(badRequest('文件数量超过限制（最多5个）'));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json(badRequest('意外的文件字段'));
    }
  }
  
  if (error.message === '只允许上传图片文件') {
    return res.status(400).json(badRequest(error.message));
  }

  return res.status(500).json(error('上传失败'));
});

export default router; 