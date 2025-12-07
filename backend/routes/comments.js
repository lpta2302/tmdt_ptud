import express from 'express';
import { readJsonFile, writeJsonFile } from '../helpers/fileHelper.js';
import { authenticateToken, requireAdmin } from './auth.js';

const router = express.Router();

// GET /comments - Get all comments with filters
router.get('/', (req, res) => {
  try {
    const { 
      productId, 
      status = 'approved', 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let comments = readJsonFile('comments.json') || [];

    // Filter by product ID
    if (productId) {
      comments = comments.filter(c => c.productId === parseInt(productId));
    }

    // Filter by status
    if (status) {
      comments = comments.filter(c => c.status === status);
    }

    // Sort comments
    comments.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedComments = comments.slice(startIndex, endIndex);

    res.json({
      comments: paginatedComments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(comments.length / limitNum),
        totalItems: comments.length,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /comments/:id - Get single comment
router.get('/:id', (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const comments = readJsonFile('comments.json') || [];
    
    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    }

    res.json(comment);

  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /comments - Create new comment (Customer only)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Đánh giá từ 1 đến 5 sao' });
    }

    // Only allow customers to comment
    if (req.user.type !== 'customer') {
      return res.status(403).json({ error: 'Chỉ khách hàng mới có thể bình luận' });
    }

    const products = readJsonFile('products.json') || [];
    const customers = readJsonFile('customers.json') || [];
    const comments = readJsonFile('comments.json') || [];

    // Check if product exists
    const product = products.find(p => p.id === parseInt(productId) && p.status === 'active');
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    // Get customer info
    const customer = customers.find(c => c.id === req.user.id);
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin khách hàng' });
    }

    // Check if customer already commented on this product
    const existingComment = comments.find(c => 
      c.productId === parseInt(productId) && c.customerId === req.user.id
    );
    if (existingComment) {
      return res.status(400).json({ error: 'Bạn đã đánh giá sản phẩm này rồi' });
    }

    const newComment = {
      id: comments.length > 0 ? Math.max(...comments.map(c => c.id)) + 1 : 1,
      productId: parseInt(productId),
      customerId: req.user.id,
      customerName: customer.fullName,
      customerAvatar: customer.avatar || '',
      rating: parseInt(rating),
      comment: comment.trim(),
      status: 'pending', // Need admin approval
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    comments.push(newComment);
    writeJsonFile('comments.json', comments);

    res.status(201).json({
      message: 'Gửi đánh giá thành công. Đánh giá của bạn sẽ được hiển thị sau khi được duyệt.',
      comment: newComment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /comments/:id/status - Update comment status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const comments = readJsonFile('comments.json') || [];
    const commentIndex = comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    }

    comments[commentIndex].status = status;
    comments[commentIndex].updatedAt = new Date().toISOString();

    // If approved, update product rating
    if (status === 'approved') {
      updateProductRating(comments[commentIndex].productId);
    }

    writeJsonFile('comments.json', comments);

    res.json({
      message: 'Cập nhật trạng thái bình luận thành công',
      comment: comments[commentIndex]
    });

  } catch (error) {
    console.error('Update comment status error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /comments/:id - Delete comment (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const comments = readJsonFile('comments.json') || [];
    
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    }

    const deletedComment = comments[commentIndex];
    comments.splice(commentIndex, 1);
    writeJsonFile('comments.json', comments);

    // Update product rating after deletion
    updateProductRating(deletedComment.productId);

    res.json({ message: 'Xóa bình luận thành công' });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /comments/product/:productId - Get comments for a specific product
router.get('/product/:productId', (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const { page = 1, limit = 5, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const comments = readJsonFile('comments.json') || [];
    
    let productComments = comments.filter(c => 
      c.productId === productId && c.status === 'approved'
    );

    // Sort comments
    productComments.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Calculate rating statistics
    const ratings = productComments.map(c => c.rating);
    const avgRating = ratings.length > 0 ? 
      (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : 0;
    
    const ratingStats = {
      1: ratings.filter(r => r === 1).length,
      2: ratings.filter(r => r === 2).length,
      3: ratings.filter(r => r === 3).length,
      4: ratings.filter(r => r === 4).length,
      5: ratings.filter(r => r === 5).length
    };

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedComments = productComments.slice(startIndex, endIndex);

    res.json({
      comments: paginatedComments,
      statistics: {
        totalComments: productComments.length,
        averageRating: parseFloat(avgRating),
        ratingDistribution: ratingStats
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(productComments.length / limitNum),
        totalItems: productComments.length,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Get product comments error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Helper function to update product rating
function updateProductRating(productId) {
  try {
    const products = readJsonFile('products.json') || [];
    const comments = readJsonFile('comments.json') || [];
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const approvedComments = comments.filter(c => 
      c.productId === productId && c.status === 'approved'
    );

    if (approvedComments.length > 0) {
      const totalRating = approvedComments.reduce((sum, c) => sum + c.rating, 0);
      const avgRating = totalRating / approvedComments.length;
      
      products[productIndex].rating = Math.round(avgRating * 10) / 10;
      products[productIndex].reviewCount = approvedComments.length;
    } else {
      products[productIndex].rating = 0;
      products[productIndex].reviewCount = 0;
    }

    products[productIndex].updatedAt = new Date().toISOString();
    writeJsonFile('products.json', products);
    
  } catch (error) {
    console.error('Update product rating error:', error);
  }
}

export default router;
