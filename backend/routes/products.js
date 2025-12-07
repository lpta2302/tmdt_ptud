import express from 'express';
import { readJsonFile, writeJsonFile, generateId } from '../helpers/fileHelper.js';
import { authenticateToken, requireAdmin } from './auth.js';

const router = express.Router();

// GET /products - Lấy tất cả sản phẩm với bộ lọc và phân trang
router.get('/', (req, res) => {
  try {
    let products = readJsonFile('products.json') || [];
    const categories = readJsonFile('categories.json') || [];
    
    // Tham số lọc
    const { 
      status = 'active', 
      category, 
      featured, 
      trending, 
      bestseller,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
      minPrice,
      maxPrice
    } = req.query;

    // Áp dụng bộ lọc
    if (status) {
      products = products.filter(p => p.status === status);
    }

    if (category) {
      products = products.filter(p => p.categoryId == category);
    }

    if (featured === 'true') {
      products = products.filter(p => p.featured === true);
    }

    if (trending === 'true') {
      products = products.filter(p => p.trending === true);
    }

    if (bestseller === 'true') {
      products = products.filter(p => p.bestseller === true);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (minPrice) {
      products = products.filter(p => p.price >= parseInt(minPrice));
    }

    if (maxPrice) {
      products = products.filter(p => p.price <= parseInt(maxPrice));
    }

    // Sắp xếp
    products.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'price' || sortBy === 'rating' || sortBy === 'viewCount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Phân trang
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedProducts = products.slice(startIndex, endIndex);

    // Thêm thông tin danh mục
    const productsWithCategory = paginatedProducts.map(product => {
      const categoryInfo = categories.find(c => c.id === product.categoryId);
      return {
        ...product,
        category: categoryInfo || null
      };
    });

    res.json({
      products: productsWithCategory,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(products.length / limitNum),
        totalItems: products.length,
        itemsPerPage: limitNum,
        hasNext: endIndex < products.length,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /products/:id - Lấy chi tiết một sản phẩm
router.get('/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const products = readJsonFile('products.json') || [];
    const categories = readJsonFile('categories.json') || [];
    const comments = readJsonFile('comments.json') || [];
    
    const product = products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    // Tăng số lượt xem
    product.viewCount = (product.viewCount || 0) + 1;
    product.updatedAt = new Date().toISOString();
    writeJsonFile('products.json', products);

    // Lấy thông tin danh mục
    const categoryInfo = categories.find(c => c.id === product.categoryId);
    
    // Lấy bình luận/đánh giá sản phẩm
    const productComments = comments
      .filter(c => c.productId === productId && c.status === 'approved')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const productWithDetails = {
      ...product,
      category: categoryInfo || null,
      comments: productComments
    };

    res.json(productWithDetails);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /products - Thêm sản phẩm mới (Chỉ Admin)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const products = readJsonFile('products.json') || [];
    
    const {
      name, slug, categoryId, price, originalPrice, description, 
      shortDescription, duration, benefits, procedures, tags, 
      featured, trending, bestseller, status
    } = req.body;

    if (!name || !categoryId || !price || !description) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    const newProduct = {
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      categoryId: parseInt(categoryId),
      price: parseInt(price),
      originalPrice: originalPrice ? parseInt(originalPrice) : parseInt(price),
      discount: originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0,
      description,
      shortDescription: shortDescription || '',
      duration: duration || 0,
      images: [],
      thumbnail: '',
      benefits: benefits || [],
      procedures: procedures || [],
      tags: tags || [],
      status: status || 'active',
      featured: featured || false,
      trending: trending || false,
      bestseller: bestseller || false,
      rating: 0,
      reviewCount: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    products.push(newProduct);
    writeJsonFile('products.json', products);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /products/:id - Cập nhật sản phẩm
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const products = readJsonFile('products.json') || [];
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    const updatedProduct = {
      ...products[productIndex],
      ...req.body,
      id: productId,
      updatedAt: new Date().toISOString()
    };

    products[productIndex] = updatedProduct;
    writeJsonFile('products.json', products);

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /products/:id - Xóa sản phẩm
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const products = readJsonFile('products.json') || [];
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    products.splice(productIndex, 1);
    writeJsonFile('products.json', products);

    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;
