import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';
import Admin from '../models/Admin.js';

// Middleware xác thực token cho khách hàng
export const authenticateCustomer = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elora_spa_secret_key_2024');
    
    // Kiểm tra xem đây có phải token của customer không
    if (decoded.type !== 'customer') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const customer = await Customer.findById(decoded.id).select('-password');
    
    if (!customer || !customer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa'
      });
    }

    req.customer = customer;
    next();
  } catch (error) {
    console.error('Lỗi xác thực customer:', error);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

// Middleware xác thực token cho admin
export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elora_spa_secret_key_2024');
    
    // Kiểm tra xem đây có phải token của admin không
    if (decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản admin không tồn tại hoặc đã bị vô hiệu hóa'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Lỗi xác thực admin:', error);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

// Middleware kiểm tra quyền admin
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Cần đăng nhập với quyền admin'
      });
    }

    if (!req.admin.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Không có quyền ${permission}`
      });
    }

    next();
  };
};

// Middleware xác thực token tùy chọn (không bắt buộc)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elora_spa_secret_key_2024');
      
      if (decoded.type === 'customer') {
        const customer = await Customer.findById(decoded.id).select('-password');
        if (customer && customer.isActive) {
          req.customer = customer;
        }
      } else if (decoded.type === 'admin') {
        const admin = await Admin.findById(decoded.id).select('-password');
        if (admin && admin.isActive) {
          req.admin = admin;
        }
      }
    }
    
    next();
  } catch (error) {
    // Nếu có lỗi token, vẫn cho phép tiếp tục nhưng không có thông tin user
    next();
  }
};