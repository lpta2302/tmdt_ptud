import mongoose from 'mongoose';

// Schema cho bình luận và đánh giá
const commentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking' // Liên kết với booking để xác minh khách hàng đã sử dụng dịch vụ
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    gridfsId: mongoose.Schema.Types.ObjectId
  }],
  isVerified: {
    type: Boolean,
    default: false // Admin duyệt bình luận
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  adminReply: {
    content: String,
    repliedAt: Date,
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  helpfulCount: {
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

commentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Comment', commentSchema);