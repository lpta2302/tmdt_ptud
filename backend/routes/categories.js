import express from 'express';
import Category from '../models/Category.js';
// Bỏ authentication - tất cả API public
import { upload, uploadToGridFS } from '../middleware/upload.js';

const router = express.Router();

// GET /categories - Lấy tất cả danh mục
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Thêm URL cho hình ảnh
    const categoriesWithImages = categories.map(category => ({
      ...category,
      imageUrl: category.image?.gridfsId ? `/api/files/${category.image.gridfsId}` : null
    }));

    res.json({
      success: true,
      data: categoriesWithImages
    });

  } catch (error) {
    console.error('❌ Lỗi lấy danh sách danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách danh mục'
    });
  }
});

// GET /categories/:id - Lấy chi tiết danh mục
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Thêm URL cho hình ảnh
    const categoryWithImage = {
      ...category,
      imageUrl: category.image?.gridfsId ? `/api/files/${category.image.gridfsId}` : null
    };

    res.json({
      success: true,
      data: categoryWithImage
    });

  } catch (error) {
    console.error('❌ Lỗi lấy chi tiết danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết danh mục'
    });
  }
});

// POST /categories - Tạo danh mục mới (Admin only)
router.post('/', upload.single('image'), uploadToGridFS, async (req, res) => {
  try {
    const { name, description, icon, sortOrder } = req.body;

    // Kiểm tra tên danh mục đã tồn tại chưa
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục đã tồn tại'
      });
    }

    // Xử lý hình ảnh đã upload
    let image = null;
    if (req.uploadedFile) {
      image = {
        filename: req.uploadedFile.filename,
        originalname: req.uploadedFile.originalname,
        mimetype: req.uploadedFile.mimetype,
        size: req.uploadedFile.size,
        gridfsId: req.uploadedFile.id
      };
    }

    const category = new Category({
      name,
      description: description || '',
      icon: icon || 'fas fa-spa',
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      image
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: category
    });

  } catch (error) {
    console.error('❌ Lỗi tạo danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo danh mục',
      error: error.message
    });
  }
});

// PUT /categories/:id - Cập nhật danh mục (Admin only)
router.put('/:id', upload.single('image'), uploadToGridFS, async (req, res) => {
  try {
    const { name, description, icon, sortOrder } = req.body;

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Kiểm tra tên danh mục trùng (trừ chính nó)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục đã tồn tại'
        });
      }
    }

    // Cập nhật thông tin
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon) category.icon = icon;
    if (sortOrder !== undefined) category.sortOrder = parseInt(sortOrder);

    // Xử lý hình ảnh mới (nếu có)
    if (req.uploadedFile) {
      category.image = {
        filename: req.uploadedFile.filename,
        originalname: req.uploadedFile.originalname,
        mimetype: req.uploadedFile.mimetype,
        size: req.uploadedFile.size,
        gridfsId: req.uploadedFile.id
      };
    }

    await category.save();

    res.json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: category
    });

  } catch (error) {
    console.error('❌ Lỗi cập nhật danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật danh mục',
      error: error.message
    });
  }
});

// DELETE /categories/:id - Xóa danh mục (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Soft delete - chỉ đánh dấu isActive = false
    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: 'Xóa danh mục thành công'
    });

  } catch (error) {
    console.error('❌ Lỗi xóa danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa danh mục'
    });
  }
});

export default router;