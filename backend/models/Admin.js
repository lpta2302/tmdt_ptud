import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Schema cho admin/nhân viên
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'staff', 'therapist'],
    default: 'staff'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_products', 
      'manage_bookings', 
      'manage_customers', 
      'manage_promotions',
      'manage_staff',
      'view_reports',
      'manage_comments'
    ]
  }],
  avatar: {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    gridfsId: mongoose.Schema.Types.ObjectId
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Mã hóa mật khẩu trước khi lưu
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.updatedAt = Date.now();
  next();
});

// So sánh mật khẩu
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Kiểm tra quyền
adminSchema.methods.hasPermission = function(permission) {
  return this.role === 'super_admin' || this.permissions.includes(permission);
};

adminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Admin', adminSchema);