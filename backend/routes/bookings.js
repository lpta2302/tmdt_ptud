import express from 'express';
import { readJsonFile, writeJsonFile, generateId } from '../helpers/fileHelper.js';
import { authenticateToken, requireAdmin } from './auth.js';

const router = express.Router();

// GET /bookings - Get all bookings (Admin) or user's bookings
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, customerId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let bookings = readJsonFile('bookings.json') || [];

    // Filter by customer for non-admin users
    if (req.user.type === 'customer') {
      bookings = bookings.filter(b => b.customerId === req.user.id);
    } else if (customerId && req.user.type === 'admin') {
      bookings = bookings.filter(b => b.customerId === parseInt(customerId));
    }

    // Filter by status
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }

    // Sort bookings
    bookings.sort((a, b) => {
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
    
    const paginatedBookings = bookings.slice(startIndex, endIndex);

    res.json({
      bookings: paginatedBookings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(bookings.length / limitNum),
        totalItems: bookings.length,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /bookings/:id - Get booking details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const bookings = readJsonFile('bookings.json') || [];
    
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Không tìm thấy đơn đặt lịch' });
    }

    // Check if user can access this booking
    if (req.user.type === 'customer' && booking.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    res.json(booking);

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /bookings - Create new booking
router.post('/', authenticateToken, (req, res) => {
  try {
    const {
      items,
      customerInfo,
      paymentMethod = 'cash',
      notes = '',
      discountCode
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Vui lòng chọn ít nhất một dịch vụ' });
    }

    if (!customerInfo || !customerInfo.name || !customerInfo.phone) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin khách hàng' });
    }

    const products = readJsonFile('products.json') || [];
    const promotions = readJsonFile('promotions.json') || [];
    const bookings = readJsonFile('bookings.json') || [];

    // Validate and calculate order
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId && p.status === 'active');
      if (!product) {
        return res.status(400).json({ error: `Sản phẩm ID ${item.productId} không tồn tại` });
      }

      if (!item.appointmentDate || !item.appointmentTime) {
        return res.status(400).json({ error: `Vui lòng chọn ngày giờ cho dịch vụ ${product.name}` });
      }

      const validatedItem = {
        id: validatedItems.length + 1,
        productId: product.id,
        productName: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: item.quantity || 1,
        total: product.price * (item.quantity || 1),
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime
      };

      validatedItems.push(validatedItem);
      subtotal += validatedItem.total;
    }

    // Apply discount if provided
    let discount = 0;
    let discountAmount = 0;
    let appliedPromotion = null;

    if (discountCode) {
      const promotion = promotions.find(p => 
        p.code === discountCode && 
        p.status === 'active' &&
        new Date(p.startDate) <= new Date() &&
        new Date(p.endDate) >= new Date() &&
        p.usedCount < p.usageLimit
      );

      if (promotion && subtotal >= promotion.minOrderValue) {
        if (promotion.type === 'percentage') {
          discountAmount = Math.min(
            subtotal * (promotion.value / 100), 
            promotion.maxDiscount
          );
        } else if (promotion.type === 'fixed') {
          discountAmount = Math.min(promotion.value, subtotal);
        }
        
        appliedPromotion = promotion;
        
        // Update promotion usage count
        promotion.usedCount += 1;
        writeJsonFile('promotions.json', promotions);
      }
    }

    const total = subtotal - discountAmount;
    const orderNumber = `ORD${String(bookings.length + 1).padStart(3, '0')}`;

    // Create new booking
    const newBooking = {
      id: bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1,
      orderNumber,
      customerId: req.user.type === 'customer' ? req.user.id : null,
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email || ''
      },
      items: validatedItems,
      subtotal,
      discount: discountAmount,
      discountCode: appliedPromotion ? appliedPromotion.code : null,
      shippingFee: 0,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
      status: 'confirmed',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    writeJsonFile('bookings.json', bookings);

    // Update customer order count and total spent if customer is logged in
    if (req.user.type === 'customer') {
      const customers = readJsonFile('customers.json') || [];
      const customerIndex = customers.findIndex(c => c.id === req.user.id);
      if (customerIndex >= 0) {
        customers[customerIndex].orderCount += 1;
        customers[customerIndex].totalSpent += total;
        customers[customerIndex].updatedAt = new Date().toISOString();
        writeJsonFile('customers.json', customers);
      }
    }

    res.status(201).json({
      message: 'Đặt lịch thành công',
      booking: newBooking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /bookings/:id/status - Update booking status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Vui lòng chọn trạng thái' });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const bookings = readJsonFile('bookings.json') || [];
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy đơn đặt lịch' });
    }

    const booking = bookings[bookingIndex];
    booking.status = status;
    booking.updatedAt = new Date().toISOString();

    if (notes) {
      booking.adminNotes = notes;
    }

    if (status === 'completed') {
      booking.completedAt = new Date().toISOString();
      booking.paymentStatus = 'paid';
    }

    writeJsonFile('bookings.json', bookings);

    res.json({
      message: 'Cập nhật trạng thái thành công',
      booking
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /bookings/:id/payment - Update payment status (Admin only)
router.put('/:id/payment', authenticateToken, requireAdmin, (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { paymentStatus, paymentMethod } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ error: 'Vui lòng chọn trạng thái thanh toán' });
    }

    const validPaymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Trạng thái thanh toán không hợp lệ' });
    }

    const bookings = readJsonFile('bookings.json') || [];
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy đơn đặt lịch' });
    }

    const booking = bookings[bookingIndex];
    booking.paymentStatus = paymentStatus;
    booking.updatedAt = new Date().toISOString();

    if (paymentMethod) {
      booking.paymentMethod = paymentMethod;
    }

    if (paymentStatus === 'paid') {
      booking.paidAt = new Date().toISOString();
    }

    writeJsonFile('bookings.json', bookings);

    res.json({
      message: 'Cập nhật thanh toán thành công',
      booking
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /bookings/:id - Cancel booking
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const bookings = readJsonFile('bookings.json') || [];
    
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy đơn đặt lịch' });
    }

    const booking = bookings[bookingIndex];

    // Check permissions
    if (req.user.type === 'customer' && booking.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    // Only allow cancellation if booking is not completed
    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Không thể hủy đơn đã hoàn thành' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date().toISOString();
    booking.updatedAt = new Date().toISOString();

    writeJsonFile('bookings.json', bookings);

    res.json({
      message: 'Hủy đơn đặt lịch thành công',
      booking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /bookings/stats - Get booking statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, (req, res) => {
  try {
    const bookings = readJsonFile('bookings.json') || [];
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodBookings = bookings.filter(b => 
      new Date(b.createdAt) >= startDate && new Date(b.createdAt) <= now
    );

    const stats = {
      totalBookings: periodBookings.length,
      totalRevenue: periodBookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + b.total, 0),
      completedBookings: periodBookings.filter(b => b.status === 'completed').length,
      pendingBookings: periodBookings.filter(b => b.status === 'pending').length,
      cancelledBookings: periodBookings.filter(b => b.status === 'cancelled').length,
      averageOrderValue: periodBookings.length > 0 ? 
        periodBookings.reduce((sum, b) => sum + b.total, 0) / periodBookings.length : 0
    };

    res.json(stats);

  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;