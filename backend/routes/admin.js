import express from 'express';
import Admin from '../models/Admin.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Booking from '../models/Booking.js';
import Comment from '../models/Comment.js';
import Banner from '../models/Banner.js';
import Promotion from '../models/Promotion.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /admin/dashboard - Thống kê tổng quan dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Thống kê cơ bản
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalComments = await Comment.countDocuments();

    // Thống kê tháng hiện tại
    const currentMonthBookings = await Booking.countDocuments({
      createdAt: { $gte: thisMonth }
    });

    const lastMonthBookings = await Booking.countDocuments({
      createdAt: { $gte: lastMonth, $lt: thisMonth }
    });

    // Doanh thu tháng hiện tại
    const currentMonthRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Doanh thu tháng trước
    const lastMonthRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth, $lt: thisMonth },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Khách hàng mới tháng này
    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: { $gte: thisMonth }
    });

    // Sản phẩm bán chạy nhất
    const topProducts = await Booking.aggregate([
      { $unwind: '$services' },
      {
        $group: {
          _id: '$services.name',
          count: { $sum: 1 },
          revenue: { $sum: '$services.price' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Thống kê booking theo trạng thái
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Biểu đồ doanh thu 7 ngày qua
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dailyRevenue = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: date, $lt: nextDate },
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalAmount' },
            bookings: { $sum: 1 }
          }
        }
      ]);

      last7Days.push({
        date: date.toISOString().split('T')[0],
        revenue: dailyRevenue[0]?.revenue || 0,
        bookings: dailyRevenue[0]?.bookings || 0
      });
    }

    // Tính tốc độ tăng trưởng
    const bookingGrowth = lastMonthBookings > 0 
      ? ((currentMonthBookings - lastMonthBookings) / lastMonthBookings * 100) 
      : 0;

    const revenueGrowth = (lastMonthRevenue[0]?.total || 0) > 0 
      ? (((currentMonthRevenue[0]?.total || 0) - (lastMonthRevenue[0]?.total || 0)) / (lastMonthRevenue[0]?.total || 0) * 100)
      : 0;

    res.json({
      overview: {
        totalProducts,
        totalCustomers,
        totalBookings,
        totalComments,
        currentMonthBookings,
        currentMonthRevenue: currentMonthRevenue[0]?.total || 0,
        newCustomersThisMonth,
        bookingGrowth: parseFloat(bookingGrowth.toFixed(2)),
        revenueGrowth: parseFloat(revenueGrowth.toFixed(2))
      },
      charts: {
        dailyRevenue: last7Days,
        bookingsByStatus,
        topProducts
      }
    });
  } catch (error) {
    console.error('Lỗi lấy dashboard:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thống kê dashboard' });
  }
});

// GET /admin/products - Quản lý sản phẩm
router.get('/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category,
      status,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Xây dựng bộ lọc
    let filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (status) {
      filter.status = status;
    }

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Truy vấn sản phẩm
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Lỗi quản lý sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi server khi quản lý sản phẩm' });
  }
});

// GET /admin/customers - Quản lý khách hàng
router.get('/customers', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Xây dựng bộ lọc
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Truy vấn khách hàng (không lấy password)
    const customers = await Customer.find(filter)
      .select('-password')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(filter);

    res.json({
      customers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Lỗi quản lý khách hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi quản lý khách hàng' });
  }
});

// GET /admin/bookings - Quản lý đặt lịch
router.get('/bookings', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      paymentStatus,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Xây dựng bộ lọc
    let filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Truy vấn booking
    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Lỗi quản lý booking:', error);
    res.status(500).json({ error: 'Lỗi server khi quản lý booking' });
  }
});

// GET /admin/comments - Quản lý bình luận
router.get('/comments', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      productId,
      rating,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Xây dựng bộ lọc
    let filter = {};
    if (productId) filter.productId = productId;
    if (rating) filter.rating = parseInt(rating);

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Truy vấn comments
    const comments = await Comment.find(filter)
      .populate('customerId', 'name email')
      .populate('productId', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

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
    console.error('Lỗi quản lý bình luận:', error);
    res.status(500).json({ error: 'Lỗi server khi quản lý bình luận' });
  }
});

// GET /admin/statistics - Thống kê chi tiết
router.get('/statistics', async (req, res) => {
  try {
    const { type = 'revenue', period = 'month' } = req.query;

    let result = {};

    if (type === 'revenue') {
      // Thống kê doanh thu
      if (period === 'month') {
        // Doanh thu 12 tháng gần nhất
        const monthlyRevenue = await Booking.aggregate([
          {
            $match: {
              paymentStatus: 'paid',
              createdAt: {
                $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
              }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              revenue: { $sum: '$totalAmount' },
              bookings: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        result = { monthlyRevenue };
      }
    } else if (type === 'customers') {
      // Thống kê khách hàng mới theo tháng
      const monthlyCustomers = await Customer.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            newCustomers: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      result = { monthlyCustomers };
    }

    res.json(result);
  } catch (error) {
    console.error('Lỗi thống kê chi tiết:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thống kê chi tiết' });
  }
});

// GET /admin/reports/export - Export báo cáo
router.get('/reports/export', async (req, res) => {
  try {
    const { type = 'bookings', format = 'json', startDate, endDate } = req.query;

    // Xây dựng bộ lọc thời gian
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let data = [];

    switch (type) {
      case 'bookings':
        data = await Booking.find(dateFilter)
          .populate('customerId', 'name email phone')
          .select('customerId services appointmentDate appointmentTime totalAmount status paymentStatus createdAt');
        break;
      
      case 'customers':
        data = await Customer.find(dateFilter)
          .select('name email phone gender createdAt -_id');
        break;
      
      case 'revenue':
        data = await Booking.aggregate([
          { $match: { ...dateFilter, paymentStatus: 'paid' } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              revenue: { $sum: '$totalAmount' },
              bookings: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        break;
    }

    if (format === 'csv') {
      // Chuyển đổi sang CSV (đơn giản)
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
      
      if (data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(item => Object.values(item).join(',')).join('\n');
        res.send(headers + '\n' + rows);
      } else {
        res.send('No data available');
      }
    } else {
      res.json({
        type,
        period: { startDate, endDate },
        totalRecords: data.length,
        data
      });
    }
  } catch (error) {
    console.error('Lỗi export báo cáo:', error);
    res.status(500).json({ error: 'Lỗi server khi export báo cáo' });
  }
});

export default router;