import express from 'express';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';
import Admin from '../models/Admin.js';
// Bỏ authentication - tất cả API public

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'elora_spa_secret_key_2025';

// Đăng ký khách hàng mới
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      dateOfBirth, 
      gender 
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc' 
      });
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return res.status(400).json({ 
        success: false,
        message: 'Email đã được sử dụng' 
      });
    }

    // Kiểm tra phone đã tồn tại chưa (nếu có)
    const existingPhone = await Customer.findOne({ phone: phone });
    if (existingPhone) {
      return res.status(400).json({ 
        success: false,
        message: 'Số điện thoại đã được sử dụng' 
      });
    }

    // Tạo khách hàng mới
    const customer = new Customer({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone: phone || '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || 'other'
    });

    await customer.save();

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: customer._id, 
        email: customer.email,
        type: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Không trả về password
    const customerData = customer.toObject();
    delete customerData.password;

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        customer: customerData,
        token
      }
    });

  } catch (error) {
    console.error('❌ Lỗi đăng ký:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký'
    });
  }
});

// Đăng nhập khách hàng
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier có thể là email hoặc phone

    // Kiểm tra dữ liệu đầu vào
    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng nhập số điện thoại/email và mật khẩu' 
      });
    }

    // Kiểm tra xem identifier là email hay phone
    const isEmail = identifier.includes('@');
    const searchQuery = isEmail 
      ? { email: identifier.toLowerCase(), isActive: true }
      : { phone: identifier, isActive: true };
    console.log("🚀 ~ searchQuery:", searchQuery)

    // Tìm khách hàng
    const customer = await Customer.findOne(searchQuery);
    console.log("🚀 ~ customer:", customer)
    console.log("test");
    
    if (!customer) {
      return res.status(401).json({ 
        success: false,
        message: 'Số điện thoại/Email hoặc mật khẩu không đúng' 
      });
    }

    // Kiểm tra mật khẩu
    const isValidPassword = await customer.comparePassword(password);
    console.log("🚀 ~ isValidPassword:", isValidPassword)
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Số điện thoại/Email hoặc mật khẩu không đúng' 
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: customer._id, 
        email: customer.email,
        type: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Không trả về password
    const customerData = customer.toObject();
    delete customerData.password;

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        customer: customerData,
        token
      }
    });

  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error);
    console.log(error);
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập'
    });
  }
});

// Đăng nhập admin
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng nhập username và mật khẩu' 
      });
    }

    // Tìm admin
    const admin = await Admin.findOne({ 
      $or: [
        { username: username },
        { email: username }
      ],
      isActive: true
    });

    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: 'Username hoặc mật khẩu không đúng' 
      });
    }

    // Kiểm tra mật khẩu
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Username hoặc mật khẩu không đúng' 
      });
    }

    // Cập nhật last login
    admin.lastLogin = new Date();
    await admin.save();

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username,
        role: admin.role,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Không trả về password
    const adminData = admin.toObject();
    delete adminData.password;

    res.json({
      success: true,
      message: 'Đăng nhập admin thành công',
      data: {
        admin: adminData,
        token
      }
    });

  } catch (error) {
    console.error('❌ Lỗi đăng nhập admin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập admin'
    });
  }
});

// Lấy thông tin profile khách hàng
router.get('/profile/:id', async (req, res) => {
  try {
    // Lấy thông tin khách hàng theo ID
    const customer = await Customer.findById(req.params.id).select('-password');
    
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    res.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('❌ Lỗi lấy profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin profile'
    });
  }
});

// Cập nhật profile khách hàng
router.put('/profile/:id', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address
    } = req.body;

    const customer = req.customer;

    // Cập nhật thông tin
    if (firstName) customer.firstName = firstName;
    if (lastName) customer.lastName = lastName;
    if (phone) customer.phone = phone;
    if (dateOfBirth) customer.dateOfBirth = new Date(dateOfBirth);
    if (gender) customer.gender = gender;
    if (address) customer.address = address;

    await customer.save();

    // Không trả về password
    const customerData = customer.toObject();
    delete customerData.password;

    res.json({
      success: true,
      message: 'Cập nhật profile thành công',
      data: customerData
    });

  } catch (error) {
    console.error('❌ Lỗi cập nhật profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật profile'
    });
  }
});

// Đổi mật khẩu khách hàng
router.put('/change-password/:id', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    const customer = req.customer;

    // Kiểm tra mật khẩu hiện tại
    const isValidPassword = await customer.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Cập nhật mật khẩu mới
    customer.password = newPassword; // Sẽ được hash tự động bởi pre-save middleware
    await customer.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('❌ Lỗi đổi mật khẩu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token'
      });
    }

    // Verify token (cho phép expired)
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });

    let user, newToken;

    if (decoded.type === 'customer') {
      user = await Customer.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa'
        });
      }

      newToken = jwt.sign(
        { 
          id: user._id, 
          email: user.email,
          type: 'customer'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

    } else if (decoded.type === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản admin không tồn tại hoặc đã bị vô hiệu hóa'
        });
      }

      newToken = jwt.sign(
        { 
          id: user._id, 
          username: user.username,
          role: user.role,
          type: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    res.json({
      success: true,
      message: 'Refresh token thành công',
      data: {
        user,
        token: newToken
      }
    });

  } catch (error) {
    console.error('❌ Lỗi refresh token:', error);
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
});

export default router;