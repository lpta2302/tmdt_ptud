import mongoose from 'mongoose';

// Schema cho banner/slide quảng cáo
const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: String,
  description: String,
  image: {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    gridfsId: mongoose.Schema.Types.ObjectId // ID của file trong GridFS
  },
  link: {
    url: String,
    type: {
      type: String,
      enum: ['internal', 'external', 'product', 'category'],
      default: 'internal'
    },
    target: String // ID sản phẩm hoặc category nếu type là 'product' hoặc 'category'
  },
  position: {
    type: String,
    enum: ['hero', 'sidebar', 'footer', 'popup'],
    default: 'hero'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  startDate: Date,
  endDate: Date,
  clickCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Kiểm tra banner có đang hiển thị không
bannerSchema.methods.isVisible = function() {
  const now = new Date();
  return this.isActive &&
         (!this.startDate || now >= this.startDate) &&
         (!this.endDate || now <= this.endDate);
};

bannerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Banner', bannerSchema);