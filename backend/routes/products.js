import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
// Bỏ authentication - tất cả API public
import { upload, uploadToGridFS } from '../middleware/upload.js';

const router = express.Router();

// GET /products - Lấy tất cả sản phẩm với bộ lọc và phân trang
router.get('/', async (req, res) => {
  try {
    // Tham số lọc
    const { 
      category, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
      minPrice,
      maxPrice,
      featured,
      trending
    } = req.query;

    // Xây dựng query filter
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Xây dựng sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Thực hiện query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Thêm URL cho hình ảnh
    const productsWithImages = products.map(product => ({
      ...product,
      images: product.images?.map(img => ({
        ...img,
        url: img.gridfsId ? `/api/files/${img.gridfsId}` : null
      })) || []
    }));

    res.json({
      success: true,
      data: productsWithImages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('❌ Lỗi lấy danh sách sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sản phẩm'
    });
  }
});

// GET /products/:id - Lấy chi tiết sản phẩm
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Thêm URL cho hình ảnh
    const productWithImages = {
      ...product,
      images: product.images?.map(img => ({
        ...img,
        url: img.gridfsId ? `/api/files/${img.gridfsId}` : null
      })) || []
    };

    res.json({
      success: true,
      data: productWithImages
    });

  } catch (error) {
    console.error('❌ Lỗi lấy chi tiết sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết sản phẩm'
    });
  }
});

// POST /products - Tạo sản phẩm mới (Admin only)
router.post('/', upload.array('images', 5), uploadToGridFS, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      duration,
      benefits,
      suitableFor,
      ingredients
    } = req.body;

    // Xử lý hình ảnh đã upload
    const images = [];
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      req.uploadedFiles.forEach(file => {
        images.push({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          gridfsId: file.id
        });
      });
    }

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      category,
      duration: duration ? parseInt(duration) : 60,
      benefits: benefits ? JSON.parse(benefits) : [],
      suitableFor: suitableFor ? JSON.parse(suitableFor) : [],
      ingredients: ingredients ? JSON.parse(ingredients) : [],
      images
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: product
    });

  } catch (error) {
    console.error('❌ Lỗi tạo sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo sản phẩm',
      error: error.message
    });
  }
});

// PUT /products/:id - Cập nhật sản phẩm (Admin only)
router.put('/:id', upload.array('images', 5), uploadToGridFS, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      duration,
      benefits,
      suitableFor,
      ingredients
    } = req.body;

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Cập nhật thông tin cơ bản
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = parseFloat(price);
    if (originalPrice) product.originalPrice = parseFloat(originalPrice);
    if (category) product.category = category;
    if (duration) product.duration = parseInt(duration);
    if (benefits) product.benefits = JSON.parse(benefits);
    if (suitableFor) product.suitableFor = JSON.parse(suitableFor);
    if (ingredients) product.ingredients = JSON.parse(ingredients);

    // Xử lý hình ảnh mới (nếu có)
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      const newImages = req.uploadedFiles.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        gridfsId: file.id
      }));

      // Thêm hình ảnh mới vào danh sách hiện tại
      product.images = [...(product.images || []), ...newImages];
    }

    await product.save();

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: product
    });

  } catch (error) {
    console.error('❌ Lỗi cập nhật sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sản phẩm',
      error: error.message
    });
  }
});

// DELETE /products/:id - Xóa sản phẩm (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Soft delete - chỉ đánh dấu isActive = false
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });

  } catch (error) {
    console.error('❌ Lỗi xóa sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sản phẩm'
    });
  }
});

// GET /products/categories/list - Lấy danh sách categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name description icon')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('❌ Lỗi lấy danh sách categories:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách categories'
    });
  }
});

export default router;
