import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Kết nối MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elora_spa', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`✅ MongoDB kết nối thành công: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Khởi tạo GridFS storage sau khi kết nối thành công
    setTimeout(async () => {
      const { gridFSStorage } = await import('../middleware/upload.js');
      gridFSStorage.init();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

// Xử lý khi ngắt kết nối
mongoose.connection.on('disconnected', () => {
  console.log('📡 MongoDB đã ngắt kết nối');
});

// Xử lý khi có lỗi
mongoose.connection.on('error', (err) => {
  console.error('❌ Lỗi MongoDB:', err);
});

// Đóng kết nối một cách graceful
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB đã đóng kết nối');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi đóng kết nối MongoDB:', error);
    process.exit(1);
  }
});

// Getter cho GridFS
const getGFS = () => {
  if (!gfs) {
    throw new Error('GridFS chưa được khởi tạo. Vui lòng gọi connectDB() trước.');
  }
  return gfs;
};

export { connectDB, getGFS };