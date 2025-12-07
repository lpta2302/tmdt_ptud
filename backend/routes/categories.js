import express from 'express';
import { readJsonFile, writeJsonFile } from '../helpers/fileHelper.js';
import { authenticateToken, requireAdmin } from './auth.js';

const router = express.Router();

// GET /categories - Get all categories
router.get('/', (req, res) => {
  try {
    const { status = 'active', includeCount = false } = req.query;
    
    let categories = readJsonFile('categories.json') || [];
    
    // Filter by status
    if (status) {
      categories = categories.filter(c => c.status === status);
    }

    // Include product count if requested
    if (includeCount === 'true') {
      const products = readJsonFile('products.json') || [];
      categories = categories.map(category => ({
        ...category,
        productCount: products.filter(p => p.categoryId === category.id && p.status === 'active').length
      }));
    }

    // Sort by sortOrder
    categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    res.json(categories);

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /categories/:id - Get single category
router.get('/:id', (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const categories = readJsonFile('categories.json') || [];
    const products = readJsonFile('products.json') || [];
    
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    }

    // Get category products
    const categoryProducts = products.filter(p => 
      p.categoryId === categoryId && p.status === 'active'
    );

    const categoryWithProducts = {
      ...category,
      products: categoryProducts,
      productCount: categoryProducts.length
    };

    res.json(categoryWithProducts);

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /categories - Create new category (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, slug, description, sortOrder, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Vui lòng nhập tên danh mục' });
    }

    const categories = readJsonFile('categories.json') || [];

    // Check if category name already exists
    const existingCategory = categories.find(c => 
      c.name.toLowerCase() === name.toLowerCase()
    );
    if (existingCategory) {
      return res.status(400).json({ error: 'Tên danh mục đã tồn tại' });
    }

    const newCategory = {
      id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      description: description || '',
      image: '',
      status: status || 'active',
      sortOrder: sortOrder || 0,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    categories.push(newCategory);
    writeJsonFile('categories.json', categories);

    res.status(201).json(newCategory);

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /categories/:id - Update category (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const categories = readJsonFile('categories.json') || [];
    
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    }

    const updatedCategory = {
      ...categories[categoryIndex],
      ...req.body,
      id: categoryId,
      updatedAt: new Date().toISOString()
    };

    categories[categoryIndex] = updatedCategory;
    writeJsonFile('categories.json', categories);

    res.json(updatedCategory);

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /categories/:id - Delete category (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const categories = readJsonFile('categories.json') || [];
    const products = readJsonFile('products.json') || [];
    
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    }

    // Check if category has products
    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    if (categoryProducts.length > 0) {
      return res.status(400).json({ 
        error: 'Không thể xóa danh mục có sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm sang danh mục khác trước.' 
      });
    }

    categories.splice(categoryIndex, 1);
    writeJsonFile('categories.json', categories);

    res.json({ message: 'Xóa danh mục thành công' });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;
