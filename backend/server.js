import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware (trung gian)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ file tĩnh (ảnh)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cấu hình multer để upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Đưa middleware upload ra toàn cục
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Định nghĩa các route
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/customers', customersRouter); // Đã có GET /api/customers và GET /api/customers/:id public
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cart', cartRouter);
app.use('/api/banners', bannerRouter);

// Endpoint kiểm tra sức khỏe hệ thống
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Middleware xử lý lỗi
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message });
});

// Xử lý 404 (không tìm thấy route)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
