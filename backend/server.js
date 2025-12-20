import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';

// Import cấu hình database
import { connectDB } from './config/database.js';
import { gridFSStorage } from './middleware/upload.js';

// Import các route
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import commentsRouter from './routes/comments.js';
import promotionsRouter from './routes/promotions.js';
import customersRouter from './routes/customers.js';
import bookingsRouter from './routes/bookings.js';
import adminRouter from './routes/admin.js';
import cartRouter from './routes/cart.js';
import authRouter from './routes/auth.js';
import bannerRouter from './routes/banners.js';

// Khởi tạo dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Kết nối MongoDB
connectDB();

// Middleware (trung gian)
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route để lấy file từ GridFS
app.get('/api/files/:fileId', async (req, res) => {
  try {
    const fileInfo = await gridFSStorage.getFileInfo(req.params.fileId);
    if (!fileInfo) {
      return res.status(404).json({ 
        success: false, 
        message: 'File không tìm thấy' 
      });
    }

    // Thiết lập headers
    res.set({
      'Content-Type': fileInfo.metadata?.mimetype || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${fileInfo.metadata?.originalname || fileInfo.filename}"`,
      'Cache-Control': 'public, max-age=31536000' // Cache 1 năm
    });

    // Stream file
    const downloadStream = gridFSStorage.getFileStream(req.params.fileId);
    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      console.error('❌ Lỗi khi stream file:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Lỗi khi lấy file' 
        });
      }
    });

  } catch (error) {
    console.error('❌ Lỗi khi lấy file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi lấy file' 
    });
  }
});

// Định nghĩa các route API
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cart', cartRouter);
app.use('/api/banners', bannerRouter);

// Endpoint kiểm tra sức khỏe hệ thống
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server đang hoạt động bình thường',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Middleware xử lý lỗi
app.use((error, req, res, next) => {
  console.error('❌ Lỗi server:', error);
  
  // Lỗi MongoDB
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: messages
    });
  }

  // Lỗi duplicate key (MongoDB)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} đã tồn tại`
    });
  }

  // Lỗi JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }

  // Lỗi multer (file upload)
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa là 10MB'
      });
    }
  }

  // Lỗi mặc định
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Lỗi server không xác định'
  });
});

// Xử lý 404 (không tìm thấy route)
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Không tìm thấy API endpoint này',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend server đang chạy tại port ${PORT}`);
  console.log(`📡 API base URL: http://localhost:${PORT}/api`);
  console.log(`📁 Files URL: http://localhost:${PORT}/api/files/:fileId`);
});
