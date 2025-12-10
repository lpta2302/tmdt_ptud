import express from 'express';
import Promotion from '../models/Promotion.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /promotions - Lấy tất cả khuyến mãi
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      active, 
      page = 1, 
      limit = 10,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Xây dựng bộ lọc
    let filter = {};

    if (status) {
      filter.status = status;
    }

    // Lọc khuyến mãi còn hiệu lực
    if (active === 'true') {
      const now = new Date();
      filter = {
        ...filter,
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
        $expr: { $lt: ['$usedCount', '$usageLimit'] }
      };
    }

    // Tìm kiếm theo tên hoặc mã
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Truy vấn promotions
    const promotions = await Promotion.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    // Đếm tổng số promotions
    const total = await Promotion.countDocuments(filter);

    res.json({
      promotions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách khuyến mãi:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách khuyến mãi' });
  }
});

// GET /promotions/:id - Lấy thông tin chi tiết khuyến mãi
router.get('/:id', async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    res.json(promotion);
  } catch (error) {
    console.error('Lỗi lấy chi tiết khuyến mãi:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy chi tiết khuyến mãi' });
  }
});

// POST /promotions - Tạo khuyến mãi mới
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      code,
      type,
      value,
      minOrderValue,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      applicableProducts,
      applicableCategories
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !code || !type || !value || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Vui lòng điền đầy đủ thông tin: tên, mã, loại, giá trị, ngày bắt đầu và kết thúc' 
      });
    }

    // Kiểm tra mã khuyến mãi có trùng không
    const existingPromotion = await Promotion.findOne({ code });
    if (existingPromotion) {
      return res.status(400).json({ error: 'Mã khuyến mãi đã tồn tại' });
    }

    // Validate type
    const validTypes = ['percentage', 'fixed_amount'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Loại khuyến mãi không hợp lệ. Chỉ chấp nhận: ' + validTypes.join(', ') 
      });
    }

    // Validate ngày
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ error: 'Ngày bắt đầu phải trước ngày kết thúc' });
    }

    // Tạo khuyến mãi mới
    const newPromotion = new Promotion({
      name,
      description: description || '',
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      usedCount: 0,
      status: 'active',
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      createdAt: new Date()
    });

    await newPromotion.save();

    res.status(201).json({
      message: 'Tạo khuyến mãi thành công',
      promotion: newPromotion
    });
  } catch (error) {
    console.error('Lỗi tạo khuyến mãi:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo khuyến mãi' });
  }
});

// PUT /promotions/:id - Cập nhật khuyến mãi
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      value,
      minOrderValue,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      status,
      applicableProducts,
      applicableCategories
    } = req.body;

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    // Cập nhật các trường
    if (name) promotion.name = name;
    if (description !== undefined) promotion.description = description;
    if (type) {
      const validTypes = ['percentage', 'fixed_amount'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          error: 'Loại khuyến mãi không hợp lệ. Chỉ chấp nhận: ' + validTypes.join(', ') 
        });
      }
      promotion.type = type;
    }
    if (value) promotion.value = parseFloat(value);
    if (minOrderValue !== undefined) promotion.minOrderValue = parseFloat(minOrderValue) || 0;
    if (maxDiscountAmount !== undefined) promotion.maxDiscountAmount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : null;
    if (startDate) promotion.startDate = new Date(startDate);
    if (endDate) promotion.endDate = new Date(endDate);
    if (usageLimit !== undefined) promotion.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (status) {
      const validStatuses = ['active', 'inactive', 'expired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Trạng thái không hợp lệ. Chỉ chấp nhận: ' + validStatuses.join(', ') 
        });
      }
      promotion.status = status;
    }
    if (applicableProducts !== undefined) promotion.applicableProducts = applicableProducts;
    if (applicableCategories !== undefined) promotion.applicableCategories = applicableCategories;

    // Validate ngày sau khi cập nhật
    if (promotion.startDate >= promotion.endDate) {
      return res.status(400).json({ error: 'Ngày bắt đầu phải trước ngày kết thúc' });
    }

    promotion.updatedAt = new Date();
    await promotion.save();

    res.json({
      message: 'Cập nhật khuyến mãi thành công',
      promotion
    });
  } catch (error) {
    console.error('Lỗi cập nhật khuyến mãi:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật khuyến mãi' });
  }
});

// DELETE /promotions/:id - Xóa khuyến mãi
router.delete('/:id', async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    res.json({ message: 'Xóa khuyến mãi thành công' });
  } catch (error) {
    console.error('Lỗi xóa khuyến mãi:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa khuyến mãi' });
  }
});

// POST /promotions/:code/validate - Validate mã khuyến mãi
router.post('/:code/validate', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const { orderValue, productIds = [], categoryIds = [] } = req.body;

    // Tìm khuyến mãi theo mã
    const promotion = await Promotion.findOne({ code });
    if (!promotion) {
      return res.status(404).json({ error: 'Mã khuyến mãi không tồn tại' });
    }

    // Kiểm tra trạng thái
    if (promotion.status !== 'active') {
      return res.status(400).json({ error: 'Mã khuyến mãi không còn hiệu lực' });
    }

    // Kiểm tra thời gian
    const now = new Date();
    if (now < promotion.startDate) {
      return res.status(400).json({ error: 'Mã khuyến mãi chưa có hiệu lực' });
    }
    if (now > promotion.endDate) {
      return res.status(400).json({ error: 'Mã khuyến mãi đã hết hạn' });
    }

    // Kiểm tra số lần sử dụng
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return res.status(400).json({ error: 'Mã khuyến mãi đã hết lượt sử dụng' });
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (orderValue < promotion.minOrderValue) {
      return res.status(400).json({ 
        error: `Đơn hàng phải có giá trị tối thiểu ${promotion.minOrderValue.toLocaleString('vi-VN')}đ` 
      });
    }

    // Kiểm tra sản phẩm/danh mục áp dụng
    let isApplicable = true;
    if (promotion.applicableProducts.length > 0) {
      isApplicable = productIds.some(id => promotion.applicableProducts.includes(id));
    }
    if (!isApplicable && promotion.applicableCategories.length > 0) {
      isApplicable = categoryIds.some(id => promotion.applicableCategories.includes(id));
    }

    if (!isApplicable && (promotion.applicableProducts.length > 0 || promotion.applicableCategories.length > 0)) {
      return res.status(400).json({ error: 'Mã khuyến mãi không áp dụng cho sản phẩm này' });
    }

    // Tính toán số tiền giảm giá
    let discountAmount = 0;
    if (promotion.type === 'percentage') {
      discountAmount = (orderValue * promotion.value) / 100;
      if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
        discountAmount = promotion.maxDiscountAmount;
      }
    } else if (promotion.type === 'fixed_amount') {
      discountAmount = promotion.value;
    }

    res.json({
      valid: true,
      promotion: {
        _id: promotion._id,
        name: promotion.name,
        code: promotion.code,
        type: promotion.type,
        value: promotion.value
      },
      discountAmount,
      finalAmount: orderValue - discountAmount
    });
  } catch (error) {
    console.error('Lỗi validate khuyến mãi:', error);
    res.status(500).json({ error: 'Lỗi server khi validate mã khuyến mãi' });
  }
});

// POST /promotions/:code/apply - Áp dụng mã khuyến mãi (tăng usedCount)
router.post('/:code/apply', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    const promotion = await Promotion.findOne({ code });
    if (!promotion) {
      return res.status(404).json({ error: 'Mã khuyến mãi không tồn tại' });
    }

    // Tăng số lần sử dụng
    promotion.usedCount += 1;
    await promotion.save();

    res.json({ 
      message: 'Áp dụng mã khuyến mãi thành công',
      usedCount: promotion.usedCount 
    });
  } catch (error) {
    console.error('Lỗi áp dụng khuyến mãi:', error);
    res.status(500).json({ error: 'Lỗi server khi áp dụng mã khuyến mãi' });
  }
});

// GET /promotions/stats/overview - Thống kê khuyến mãi
router.get('/stats/overview', async (req, res) => {
  try {
    // Tổng số khuyến mãi
    const totalPromotions = await Promotion.countDocuments();

    // Khuyến mãi đang hoạt động
    const now = new Date();
    const activePromotions = await Promotion.countDocuments({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    // Khuyến mãi hết hạn
    const expiredPromotions = await Promotion.countDocuments({
      endDate: { $lt: now }
    });

    // Thống kê theo loại
    const typeStats = await Promotion.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Khuyến mãi được sử dụng nhiều nhất
    const mostUsedPromotions = await Promotion.find()
      .sort({ usedCount: -1 })
      .limit(5)
      .select('name code usedCount usageLimit');

    res.json({
      totalPromotions,
      activePromotions,
      expiredPromotions,
      typeDistribution: typeStats,
      mostUsedPromotions
    });
  } catch (error) {
    console.error('Lỗi thống kê khuyến mãi:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thống kê khuyến mãi' });
  }
});

export default router;