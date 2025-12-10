import express from 'express';
import { readJsonFile, writeJsonFile } from '../helpers/fileHelper.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /promotions - Lấy tất cả khuyến mãi
router.get('/', (req, res) => {
  try {
    const { status, active, page = 1, limit = 10 } = req.query;
    
    let promotions = readJsonFile('promotions.json') || [];

    // Lọc theo trạng thái
    if (status) {
      promotions = promotions.filter(p => p.status === status);
    }

    // Lọc khuyến mãi còn hiệu lực (trong khoảng ngày)
    if (active === 'true') {
      const now = new Date();
      promotions = promotions.filter(p => 
        p.status === 'active' &&
        new Date(p.startDate) <= now &&
        new Date(p.endDate) >= now &&
        p.usedCount < p.usageLimit
      );
    }

    // Sắp xếp theo ngày tạo (mới nhất trước)
    promotions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Phân trang
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedPromotions = promotions.slice(startIndex, endIndex);

    res.json({
      promotions: paginatedPromotions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(promotions.length / limitNum),
        totalItems: promotions.length,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /promotions/:id - Lấy chi tiết khuyến mãi
router.get('/:id', (req, res) => {
  try {
    const promotionId = parseInt(req.params.id);
    const promotions = readJsonFile('promotions.json') || [];
    
    const promotion = promotions.find(p => p.id === promotionId);
    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });
    }

    res.json(promotion);

  } catch (error) {
    console.error('Get promotion error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /promotions/code/:code - Lấy khuyến mãi theo mã
router.get('/code/:code', (req, res) => {
  try {
    const promotionCode = req.params.code.toUpperCase();
    const promotions = readJsonFile('promotions.json') || [];
    
    const promotion = promotions.find(p => 
      p.code === promotionCode && p.status === 'active'
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Mã giảm giá không tồn tại' });
    }

    // Kiểm tra khuyến mãi còn hiệu lực (trong ngày và số lượt)
    const now = new Date();
    const isValid = new Date(promotion.startDate) <= now &&
                   new Date(promotion.endDate) >= now &&
                   promotion.usedCount < promotion.usageLimit;

    res.json({
      ...promotion,
      isValid,
      remainingUses: promotion.usageLimit - promotion.usedCount
    });

  } catch (error) {
    console.error('Get promotion by code error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /promotions/validate - Validate promotion code for order
router.post('/validate', (req, res) => {
  try {
    const { code, orderValue, customerId } = req.body;

    if (!code || !orderValue) {
      return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá và giá trị đơn hàng' });
    }

    const promotions = readJsonFile('promotions.json') || [];
    const promotion = promotions.find(p => 
      p.code === code.toUpperCase() && p.status === 'active'
    );

    if (!promotion) {
      return res.status(400).json({ error: 'Mã giảm giá không hợp lệ' });
    }

    // Check date validity
    const now = new Date();
    if (new Date(promotion.startDate) > now || new Date(promotion.endDate) < now) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết hạn' });
    }

    // Check usage limit
    if (promotion.usedCount >= promotion.usageLimit) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    // Check minimum order value
    if (orderValue < promotion.minOrderValue) {
      return res.status(400).json({ 
        error: `Đơn hàng tối thiểu ${promotion.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này` 
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (promotion.type === 'percentage') {
      discountAmount = Math.min(
        orderValue * (promotion.value / 100), 
        promotion.maxDiscount
      );
    } else if (promotion.type === 'fixed') {
      discountAmount = Math.min(promotion.value, orderValue);
    } else if (promotion.type === 'shipping') {
      discountAmount = 0; // Free shipping
    }

    res.json({
      valid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        name: promotion.name,
        type: promotion.type,
        value: promotion.value,
        discountAmount,
        maxDiscount: promotion.maxDiscount
      },
      message: 'Mã giảm giá hợp lệ'
    });

  } catch (error) {
    console.error('Validate promotion error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /promotions - Create new promotion (Admin only)
router.post('/', (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      customerLimit,
      startDate,
      endDate,
      status
    } = req.body;

    if (!code || !name || !type || !value || !startDate || !endDate) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    if (!['percentage', 'fixed', 'shipping'].includes(type)) {
      return res.status(400).json({ error: 'Loại giảm giá không hợp lệ' });
    }

    const promotions = readJsonFile('promotions.json') || [];

    // Check if promotion code already exists
    const existingPromotion = promotions.find(p => 
      p.code === code.toUpperCase()
    );
    if (existingPromotion) {
      return res.status(400).json({ error: 'Mã giảm giá đã tồn tại' });
    }

    const newPromotion = {
      id: promotions.length > 0 ? Math.max(...promotions.map(p => p.id)) + 1 : 1,
      code: code.toUpperCase(),
      name,
      description: description || '',
      type,
      value: parseFloat(value),
      minOrderValue: parseFloat(minOrderValue) || 0,
      maxDiscount: parseFloat(maxDiscount) || 0,
      usageLimit: parseInt(usageLimit) || 1000,
      usedCount: 0,
      customerLimit: parseInt(customerLimit) || 1,
      status: status || 'active',
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    promotions.push(newPromotion);
    writeJsonFile('promotions.json', promotions);

    res.status(201).json(newPromotion);

  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /promotions/:id - Update promotion (Admin only)
router.put('/:id', (req, res) => {
  try {
    const promotionId = parseInt(req.params.id);
    const promotions = readJsonFile('promotions.json') || [];
    
    const promotionIndex = promotions.findIndex(p => p.id === promotionId);
    if (promotionIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });
    }

    // Don't allow updating code if it already exists elsewhere
    if (req.body.code) {
      const existingPromotion = promotions.find(p => 
        p.code === req.body.code.toUpperCase() && p.id !== promotionId
      );
      if (existingPromotion) {
        return res.status(400).json({ error: 'Mã giảm giá đã tồn tại' });
      }
    }

    const updatedPromotion = {
      ...promotions[promotionIndex],
      ...req.body,
      id: promotionId,
      code: req.body.code ? req.body.code.toUpperCase() : promotions[promotionIndex].code,
      updatedAt: new Date().toISOString()
    };

    promotions[promotionIndex] = updatedPromotion;
    writeJsonFile('promotions.json', promotions);

    res.json(updatedPromotion);

  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /promotions/:id - Delete promotion (Admin only)
router.delete('/:id', (req, res) => {
  try {
    const promotionId = parseInt(req.params.id);
    const promotions = readJsonFile('promotions.json') || [];
    
    const promotionIndex = promotions.findIndex(p => p.id === promotionId);
    if (promotionIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });
    }

    promotions.splice(promotionIndex, 1);
    writeJsonFile('promotions.json', promotions);

    res.json({ message: 'Xóa mã giảm giá thành công' });

  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /promotions/:id/status - Update promotion status (Admin only)
router.put('/:id/status', (req, res) => {
  try {
    const promotionId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const promotions = readJsonFile('promotions.json') || [];
    const promotionIndex = promotions.findIndex(p => p.id === promotionId);

    if (promotionIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });
    }

    promotions[promotionIndex].status = status;
    promotions[promotionIndex].updatedAt = new Date().toISOString();

    writeJsonFile('promotions.json', promotions);

    res.json({
      message: 'Cập nhật trạng thái thành công',
      promotion: promotions[promotionIndex]
    });

  } catch (error) {
    console.error('Update promotion status error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;
