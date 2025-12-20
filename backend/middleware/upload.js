import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Cấu hình GridFS Storage
class GridFSStorage {
  constructor() {
    this.bucket = null;
  }

  // Khởi tạo GridFS bucket
  init() {
    if (mongoose.connection.readyState === 1) {
      this.bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });
      console.log('✅ GridFS bucket đã được khởi tạo');
    } else {
      console.log('⏳ Đang chờ kết nối MongoDB...');
    }
  }

  // Lưu file vào GridFS
  async uploadFile(file, filename) {
    if (!this.bucket) {
      this.init();
    }

    if (!this.bucket) {
      throw new Error('GridFS bucket chưa được khởi tạo');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = this.bucket.openUploadStream(filename, {
        metadata: {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          uploadDate: new Date()
        }
      });

      uploadStream.end(file.buffer);

      uploadStream.on('finish', () => {
        console.log(`✅ File đã upload: ${filename} (ID: ${uploadStream.id})`);
        resolve({
          id: uploadStream.id,
          filename: filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      });

      uploadStream.on('error', (error) => {
        console.error('❌ Lỗi upload file:', error);
        reject(error);
      });
    });
  }

  // Xóa file từ GridFS
  async deleteFile(fileId) {
    if (!this.bucket) {
      this.init();
    }

    if (!this.bucket) {
      return false;
    }

    try {
      await this.bucket.delete(new mongoose.Types.ObjectId(fileId));
      console.log(`🗑️ File đã xóa: ${fileId}`);
      return true;
    } catch (error) {
      console.error('❌ Lỗi khi xóa file:', error);
      return false;
    }
  }

  // Lấy file stream từ GridFS
  getFileStream(fileId) {
    if (!this.bucket) {
      this.init();
    }

    if (!this.bucket) {
      throw new Error('GridFS bucket chưa được khởi tạo');
    }

    return this.bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
  }

  // Lấy thông tin file từ GridFS
  async getFileInfo(fileId) {
    if (!this.bucket) {
      this.init();
    }

    if (!this.bucket) {
      return null;
    }

    try {
      const files = await this.bucket.find({ 
        _id: new mongoose.Types.ObjectId(fileId) 
      }).toArray();
      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('❌ Lỗi khi lấy thông tin file:', error);
      return null;
    }
  }
}

// Tạo instance duy nhất
const gridFSStorage = new GridFSStorage();

// Cấu hình multer để sử dụng memory storage
const storage = multer.memoryStorage();

// File filter để kiểm tra loại file
const fileFilter = (req, file, cb) => {
  // Chỉ cho phép ảnh
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh!'), false);
  }
};

// Tạo multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
  }
});

// Middleware để xử lý upload và lưu vào GridFS
const uploadToGridFS = async (req, res, next) => {    
  try {
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const filename = `${uuidv4()}-${file.originalname}`;
        return await gridFSStorage.uploadFile(file, filename);
      });
      
      req.uploadedFiles = await Promise.all(uploadPromises);
    } else if (req.file) {
      const filename = `${uuidv4()}-${req.file.originalname}`;
      req.uploadedFile = await gridFSStorage.uploadFile(req.file, filename);
    }

    next();
  } catch (error) {
    console.error('Lỗi khi upload file:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload file',
      error: error.message
    });
  }
};

export {
  gridFSStorage,
  upload,
  uploadToGridFS
};