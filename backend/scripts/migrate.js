import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import database connection
import { connectDB } from '../config/database.js';

// Import models
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Customer from '../models/Customer.js';
import Admin from '../models/Admin.js';
import Booking from '../models/Booking.js';
import Comment from '../models/Comment.js';
import Cart from '../models/Cart.js';
import Promotion from '../models/Promotion.js';
import Banner from '../models/Banner.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc dữ liệu từ file JSON
const readJSONFile = (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Lỗi đọc file ${filename}:`, error.message);
    return [];
  }
};

// Chuyển đổi dữ liệu categories
const migrateCategories = async () => {
  try {
    console.log('📂 Đang migrate categories...');
    const categories = readJSONFile('categories.json');
    
    for (const cat of categories) {
      const category = new Category({
        name: cat.name,
        description: cat.description || '',
        icon: cat.icon || 'fas fa-spa',
        isActive: cat.active !== false,
        sortOrder: cat.id || 0
      });
      
      await category.save();
      console.log(`✅ Đã tạo category: ${category.name}`);
    }
    
  } catch (error) {
    console.error('❌ Lỗi migrate categories:', error.message);
  }
};

// Chuyển đổi dữ liệu products
const migrateProducts = async () => {
  try {
    console.log('🛍️ Đang migrate products...');
    const products = readJSONFile('products.json');
    
    for (const prod of products) {
      const product = new Product({
        name: prod.name,
        description: prod.description,
        price: parseFloat(prod.price?.toString().replace(/[^\d]/g, '') || 0),
        originalPrice: parseFloat(prod.originalPrice?.toString().replace(/[^\d]/g, '') || 0),
        category: prod.category,
        duration: prod.duration || 60,
        rating: parseFloat(prod.rating) || 0,
        reviewCount: parseInt(prod.reviewCount) || 0,
        benefits: prod.benefits || [],
        suitableFor: prod.suitableFor || ['Mọi lứa tuổi'],
        ingredients: prod.ingredients || [],
        isActive: prod.active !== false
      });
      
      await product.save();
      console.log(`✅ Đã tạo product: ${product.name}`);
    }
    
  } catch (error) {
    console.error('❌ Lỗi migrate products:', error.message);
  }
};

// Chuyển đổi dữ liệu customers
const migrateCustomers = async () => {
  try {
    console.log('👥 Đang migrate customers...');
    const customers = readJSONFile('customers.json');
    
    for (const cust of customers) {
      const customer = new Customer({
        firstName: cust.firstName || 'Khách',
        lastName: cust.lastName || 'Hàng',
        email: cust.email,
        password: cust.password || '123456', // Sẽ được hash tự động
        phone: cust.phone || '',
        dateOfBirth: cust.dateOfBirth ? new Date(cust.dateOfBirth) : null,
        gender: cust.gender || 'other',
        address: {
          street: cust.address?.street || '',
          city: cust.address?.city || '',
          district: cust.address?.district || '',
          zipCode: cust.address?.zipCode || ''
        },
        isActive: cust.active !== false,
        isVerified: cust.verified || false,
        loyaltyPoints: parseInt(cust.loyaltyPoints) || 0,
        totalSpent: parseFloat(cust.totalSpent?.toString().replace(/[^\d]/g, '') || 0)
      });
      
      await customer.save();
      console.log(`✅ Đã tạo customer: ${customer.email}`);
    }
    
  } catch (error) {
    console.error('❌ Lỗi migrate customers:', error.message);
  }
};

// Chuyển đổi dữ liệu admins
const migrateAdmins = async () => {
  try {
    console.log('👨‍💼 Đang migrate admins...');
    const admins = readJSONFile('admins.json');
    
    for (const adm of admins) {
      const admin = new Admin({
        username: adm.username,
        email: adm.email,
        password: adm.password || '123456', // Sẽ được hash tự động
        firstName: adm.firstName || 'Admin',
        lastName: adm.lastName || 'User',
        phone: adm.phone || '',
        role: adm.role || 'staff',
        permissions: adm.permissions || [],
        isActive: adm.active !== false
      });
      
      await admin.save();
      console.log(`✅ Đã tạo admin: ${admin.username}`);
    }
    
  } catch (error) {
    console.error('❌ Lỗi migrate admins:', error.message);
  }
};

// Chuyển đổi dữ liệu promotions
const migratePromotions = async () => {
  try {
    console.log('🎁 Đang migrate promotions...');
    const promotions = readJSONFile('promotions.json');
    
    for (const promo of promotions) {
      const promotion = new Promotion({
        name: promo.name,
        description: promo.description,
        code: promo.code?.toUpperCase(),
        type: promo.type || 'percentage',
        value: parseFloat(promo.value) || 0,
        minimumAmount: parseFloat(promo.minimumAmount?.toString().replace(/[^\d]/g, '') || 0),
        maximumDiscount: parseFloat(promo.maximumDiscount?.toString().replace(/[^\d]/g, '') || null),
        startDate: new Date(promo.startDate),
        endDate: new Date(promo.endDate),
        usageLimit: promo.usageLimit ? parseInt(promo.usageLimit) : null,
        usedCount: parseInt(promo.usedCount) || 0,
        isActive: promo.active !== false
      });
      
      await promotion.save();
      console.log(`✅ Đã tạo promotion: ${promotion.code}`);
    }
    
  } catch (error) {
    console.error('❌ Lỗi migrate promotions:', error.message);
  }
};

// Tạo admin mặc định
const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const admin = new Admin({
        username: 'admin',
        email: 'admin@elora.vn',
        password: 'admin123',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        permissions: [
          'manage_products',
          'manage_bookings', 
          'manage_customers',
          'manage_promotions',
          'manage_staff',
          'view_reports',
          'manage_comments'
        ],
        isActive: true
      });
      
      await admin.save();
      console.log('✅ Đã tạo tài khoản admin mặc định:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }
  } catch (error) {
    console.error('❌ Lỗi tạo admin mặc định:', error.message);
  }
};

// Hàm chính để migrate tất cả dữ liệu
const migrateAll = async () => {
  try {
    console.log('🚀 Bắt đầu migrate dữ liệu từ JSON sang MongoDB...');
    
    // Kết nối database
    await connectDB();
    
    // Xóa dữ liệu cũ
    console.log('🧹 Đang xóa dữ liệu cũ...');
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Customer.deleteMany({}),
      Admin.deleteMany({}),
      Booking.deleteMany({}),
      Comment.deleteMany({}),
      Cart.deleteMany({}),
      Promotion.deleteMany({}),
      Banner.deleteMany({})
    ]);
    
    // Migrate từng loại dữ liệu
    await migrateCategories();
    await migrateProducts();
    await migrateCustomers();
    await migrateAdmins();
    await migratePromotions();
    await createDefaultAdmin();
    
    console.log('✅ Migration hoàn thành thành công!');
    console.log('📊 Thống kê:');
    console.log(`   - Categories: ${await Category.countDocuments()}`);
    console.log(`   - Products: ${await Product.countDocuments()}`);
    console.log(`   - Customers: ${await Customer.countDocuments()}`);
    console.log(`   - Admins: ${await Admin.countDocuments()}`);
    console.log(`   - Promotions: ${await Promotion.countDocuments()}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Lỗi migration:', error.message);
    process.exit(1);
  }
};

// Chạy migration
if (process.argv.includes('--run')) {
  migrateAll();
} else {
  console.log('💡 Để chạy migration, sử dụng: node migrate.js --run');
}

export { migrateAll };