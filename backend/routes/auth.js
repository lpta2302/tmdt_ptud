import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readJsonFile, writeJsonFile, validateEmail } from '../helpers/fileHelper.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Đăng ký khách hàng mới
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra khách hàng đã tồn tại chưa
    const customers = readJsonFile('customers.json') || [];
    const existingCustomer = customers.find(c => c.email === email);
    
    if (existingCustomer) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo khách hàng mới
    const newCustomer = {
      id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      phone: phone || '',
      dateOfBirth: '',
      gender: '',
      avatar: '',
      addresses: [],
      preferences: {
        newsletter: false,
        smsNotification: false,
        emailNotification: true
      },
      status: 'active',
      emailVerified: false,
      phoneVerified: false,
      totalSpent: 0,
      orderCount: 0,
      wishlist: [],
      viewedProducts: [],
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    customers.push(newCustomer);
    writeJsonFile('customers.json', customers);

    // Sinh token JWT
    const token = jwt.sign(
      { 
        id: newCustomer.id, 
        email: newCustomer.email, 
        type: 'customer' 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Xóa mật khẩu khỏi dữ liệu trả về
    const { password: _, ...customerData } = newCustomer;

    res.status(201).json({
      message: 'Đăng ký thành công',
      customer: customerData,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Đăng nhập khách hàng
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });
    }

    // Tìm khách hàng
    const customers = readJsonFile('customers.json') || [];
    const customer = customers.find(c => c.email === email && c.status === 'active');

    if (!customer) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Kiểm tra mật khẩu
    const isValidPassword = await bcrypt.compare(password, customer.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Cập nhật lần đăng nhập cuối
    customer.lastLoginAt = new Date().toISOString();
    writeJsonFile('customers.json', customers);

    // Sinh token JWT
    const token = jwt.sign(
      { 
        id: customer.id, 
        email: customer.email, 
        type: 'customer' 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Xóa mật khẩu khỏi dữ liệu trả về
    const { password: _, ...customerData } = customer;

    res.json({
      message: 'Đăng nhập thành công',
      customer: customerData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Đăng nhập quản trị viên
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập username và mật khẩu' });
    }

    // Tìm admin
    const admins = readJsonFile('admins.json') || [];
    const admin = admins.find(a => 
      (a.username === username || a.email === username) && a.status === 'active'
    );

    if (!admin) {
      return res.status(401).json({ error: 'Username hoặc mật khẩu không đúng' });
    }

    // Kiểm tra mật khẩu (thực tế nên mã hóa mật khẩu admin)
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Username hoặc mật khẩu không đúng' });
    }

    // Cập nhật lần đăng nhập cuối
    admin.lastLoginAt = new Date().toISOString();
    writeJsonFile('admins.json', admins);

    // Sinh token JWT
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role,
        permissions: admin.permissions,
        type: 'admin' 
      }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    // Xóa mật khẩu khỏi dữ liệu trả về
    const { password: _, ...adminData } = admin;

    res.json({
      message: 'Đăng nhập thành công',
      admin: adminData,
      token
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Xác thực token
router.post('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });

  } catch (error) {
    res.status(401).json({ error: 'Token không hợp lệ', valid: false });
  }
});

// Đăng xuất (client tự xóa token, server có thể triển khai blacklist token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Đăng xuất thành công' });
});

// Middleware xác thực request
export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Cần đăng nhập để truy cập' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// Middleware kiểm tra quyền admin
export const requireAdmin = (req, res, next) => {
  if (req.user.type !== 'admin') {
    return res.status(403).json({ error: 'Cần quyền admin để truy cập' });
  }
  next();
};

export default router;