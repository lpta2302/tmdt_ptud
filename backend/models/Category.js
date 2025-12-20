import mongoose from 'mongoose';

// Schema cho danh mục
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  icon: {
    type: String, // CSS class cho icon
    default: 'fas fa-spa'
  },
  image: {
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
  sortOrder: {
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

categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Category', categorySchema);