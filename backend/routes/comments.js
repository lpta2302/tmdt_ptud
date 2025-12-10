import express from 'express';
import Comment from '../models/Comment.js';
import Product from '../models/Product.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /comments - Lấy tất cả bình luận với bộ lọc
router.get('/', async (req, res) => {
  try {
    const { 
      productId, 
      customerId, 
      rating, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Xây dựng bộ lọc
    let filter = {};
    if (productId) filter.productId = productId;
    if (customerId) filter.customerId = customerId;
    if (rating) filter.rating = parseInt(rating);

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Truy vấn bình luận với populate để lấy thông tin khách hàng và sản phẩm
    const comments = await Comment.find(filter)
      .populate('customerId', 'name email')
      .populate('productId', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    // Đếm tổng số bình luận
    const total = await Comment.countDocuments(filter);

    res.json({
      comments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Lỗi lấy bình luận:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy bình luận' });
  }
});

// GET /comments/:id - Lấy thông tin một bình luận cụ thể
router.get('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('productId', 'name');

    if (!comment) {
      return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    }

    res.json(comment);
  } catch (error) {
    console.error('Lỗi lấy bình luận:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy bình luận' });
  }
});

// POST /comments - Tạo bình luận mới (public)
router.post('/', async (req, res) => {
  try {
    const { productId, customerId, rating, comment } = req.body;

    if (!productId || !customerId || !rating || !comment) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Đánh giá từ 1 đến 5 sao' });
    }

    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    // Kiểm tra xem khách hàng đã bình luận cho sản phẩm này chưa
    const existingComment = await Comment.findOne({
      productId,
      customerId
    });

    if (existingComment) {
      return res.status(400).json({ error: 'Bạn đã bình luận cho sản phẩm này rồi' });
    }

    // Tạo bình luận mới
    const newComment = new Comment({
      productId,
      customerId,
      rating: parseInt(rating),
      comment,
      createdAt: new Date()
    });

    await newComment.save();

    // Cập nhật rating trung bình của sản phẩm
    const allComments = await Comment.find({ productId });
    const averageRating = allComments.reduce((sum, c) => sum + c.rating, 0) / allComments.length;
    
    await Product.findByIdAndUpdate(productId, { 
      rating: Math.round(averageRating * 10) / 10 // Làm tròn 1 chữ số thập phân
    });

    // Lấy bình luận với thông tin đầy đủ để trả về
    const populatedComment = await Comment.findById(newComment._id)
      .populate('customerId', 'name email')
      .populate('productId', 'name');

    res.status(201).json({
      message: 'Tạo bình luận thành công',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Lỗi tạo bình luận:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo bình luận' });
  }
});

// PUT /comments/:id - Cập nhật bình luận (chỉ chủ sở hữu)
router.put('/:id', async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const existingComment = await Comment.findById(req.params.id);
    if (!existingComment) {
      return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    }

    // Chỉ chủ sở hữu mới được sửa
    if (existingComment.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa bình luận này' });
    }

    // Cập nhật thông tin
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Đánh giá từ 1 đến 5 sao' });
      }
      existingComment.rating = parseInt(rating);
    }

    if (comment !== undefined) {
      existingComment.comment = comment;
    }

    existingComment.updatedAt = new Date();

    await existingComment.save();

    // Cập nhật lại rating trung bình của sản phẩm
    const allComments = await Comment.find({ productId: existingComment.productId });
    const averageRating = allComments.reduce((sum, c) => sum + c.rating, 0) / allComments.length;
    
    await Product.findByIdAndUpdate(existingComment.productId, { 
      rating: Math.round(averageRating * 10) / 10
    });

    // Lấy bình luận với thông tin đầy đủ để trả về
    const updatedComment = await Comment.findById(existingComment._id)
      .populate('customerId', 'name email')
      .populate('productId', 'name');

    res.json({
      message: 'Cập nhật bình luận thành công',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Lỗi cập nhật bình luận:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật bình luận' });
  }
});

// DELETE /comments/:id - Xóa bình luận (chủ sở hữu hoặc admin)
router.delete('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    }

    // Chỉ chủ sở hữu hoặc admin mới được xóa
    const isOwner = comment.customerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bình luận này' });
    }

    const productId = comment.productId;
    await Comment.findByIdAndDelete(req.params.id);

    // Cập nhật lại rating trung bình của sản phẩm
    const allComments = await Comment.find({ productId });
    if (allComments.length > 0) {
      const averageRating = allComments.reduce((sum, c) => sum + c.rating, 0) / allComments.length;
      await Product.findByIdAndUpdate(productId, { 
        rating: Math.round(averageRating * 10) / 10
      });
    } else {
      // Nếu không còn bình luận nào, đặt rating về 0
      await Product.findByIdAndUpdate(productId, { rating: 0 });
    }

    res.json({ message: 'Xóa bình luận thành công' });
  } catch (error) {
    console.error('Lỗi xóa bình luận:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa bình luận' });
  }
});

// GET /comments/product/:productId/stats - Thống kê bình luận theo sản phẩm
router.get('/product/:productId/stats', async (req, res) => {
  try {
    const productId = req.params.productId;

    // Thống kê số lượng theo rating
    const ratingStats = await Comment.aggregate([
      { $match: { productId: productId } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Tổng số bình luận
    const totalComments = await Comment.countDocuments({ productId });

    // Rating trung bình
    const avgResult = await Comment.aggregate([
      { $match: { productId: productId } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);

    const averageRating = avgResult.length > 0 ? 
      Math.round(avgResult[0].averageRating * 10) / 10 : 0;

    res.json({
      productId,
      totalComments,
      averageRating,
      ratingDistribution: ratingStats
    });
  } catch (error) {
    console.error('Lỗi thống kê bình luận:', error);
    res.status(500).json({ error: 'Lỗi server khi thống kê bình luận' });
  }
});

export default router;
