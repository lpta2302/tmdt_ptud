import express from 'express';
import { readJsonFile, writeJsonFile } from '../helpers/fileHelper.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// Tất cả route yêu cầu xác thực admin



// GET /admin/dashboard - Thống kê tổng quan dashboard
router.get('/dashboard', (req, res) => {
  try {
    const products = readJsonFile('products.json') || [];
    const customers = readJsonFile('customers.json') || [];
    const bookings = readJsonFile('bookings.json') || [];
    const comments = readJsonFile('comments.json') || [];

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Thống kê tháng hiện tại
    const currentMonthBookings = bookings.filter(b => 
      new Date(b.createdAt) >= thisMonth
    );

    const lastMonthBookings = bookings.filter(b => 
      new Date(b.createdAt) >= lastMonth && new Date(b.createdAt) < thisMonth
    );

    const currentMonthRevenue = currentMonthBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.total, 0);

    const lastMonthRevenue = lastMonthBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.total, 0);

    // Tính tỷ lệ tăng trưởng
    const bookingGrowth = lastMonthBookings.length > 0 ? 
      ((currentMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100 : 0;

    const revenueGrowth = lastMonthRevenue > 0 ? 
      ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    const stats = {
      overview: {
        totalProducts: products.filter(p => p.status === 'active').length,
        totalCustomers: customers.filter(c => c.status === 'active').length,
        totalBookings: bookings.length,
        totalRevenue: bookings
          .filter(b => b.paymentStatus === 'paid')
          .reduce((sum, b) => sum + b.total, 0)
      },
      currentMonth: {
        bookings: currentMonthBookings.length,
        revenue: currentMonthRevenue,
        completedBookings: currentMonthBookings.filter(b => b.status === 'completed').length,
        pendingBookings: currentMonthBookings.filter(b => b.status === 'pending').length
      },
      growth: {
        bookings: Math.round(bookingGrowth * 100) / 100,
        revenue: Math.round(revenueGrowth * 100) / 100
      },
      recentActivity: {
        newCustomers: customers
          .filter(c => new Date(c.createdAt) >= thisMonth)
          .length,
        newComments: comments
          .filter(c => new Date(c.createdAt) >= thisMonth)
          .length,
        pendingComments: comments
          .filter(c => c.status === 'pending')
          .length
      }
    };

    res.json(stats);

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /admin/sales-analytics - Phân tích doanh số với dữ liệu biểu đồ
router.get('/sales-analytics', (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;
    const bookings = readJsonFile('bookings.json') || [];

    const targetYear = parseInt(year);
    const yearlyBookings = bookings.filter(b => 
      new Date(b.createdAt).getFullYear() === targetYear &&
      b.paymentStatus === 'paid'
    );

    let chartData = [];
    let labels = [];

    if (period === 'month') {
      // Monthly data for the year
      labels = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];

      chartData = Array.from({ length: 12 }, (_, index) => {
        const monthBookings = yearlyBookings.filter(b => 
          new Date(b.createdAt).getMonth() === index
        );
        return {
          month: index + 1,
          revenue: monthBookings.reduce((sum, b) => sum + b.total, 0),
          orders: monthBookings.length,
          customers: new Set(monthBookings.map(b => b.customerId)).size
        };
      });
    } else if (period === 'quarter') {
      // Quarterly data
      labels = ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'];
      
      chartData = Array.from({ length: 4 }, (_, index) => {
        const quarterBookings = yearlyBookings.filter(b => {
          const month = new Date(b.createdAt).getMonth();
          return Math.floor(month / 3) === index;
        });
        return {
          quarter: index + 1,
          revenue: quarterBookings.reduce((sum, b) => sum + b.total, 0),
          orders: quarterBookings.length,
          customers: new Set(quarterBookings.map(b => b.customerId)).size
        };
      });
    }

    // Top services
    const serviceStats = {};
    yearlyBookings.forEach(booking => {
      booking.items.forEach(item => {
        if (!serviceStats[item.productId]) {
          serviceStats[item.productId] = {
            productName: item.productName,
            totalRevenue: 0,
            totalOrders: 0,
            totalQuantity: 0
          };
        }
        serviceStats[item.productId].totalRevenue += item.total;
        serviceStats[item.productId].totalOrders += 1;
        serviceStats[item.productId].totalQuantity += item.quantity;
      });
    });

    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    res.json({
      chartData,
      labels,
      topServices,
      totalRevenue: yearlyBookings.reduce((sum, b) => sum + b.total, 0),
      totalOrders: yearlyBookings.length,
      averageOrderValue: yearlyBookings.length > 0 ? 
        yearlyBookings.reduce((sum, b) => sum + b.total, 0) / yearlyBookings.length : 0
    });

  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /admin/customers - Get all customers with pagination and filters
router.get('/customers', (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    let customers = readJsonFile('customers.json') || [];

    // Apply filters
    if (status) {
      customers = customers.filter(c => c.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c => 
        c.fullName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone.includes(search)
      );
    }

    // Sort customers
    customers.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'totalSpent' || sortBy === 'orderCount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
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
    
    const paginatedCustomers = customers.slice(startIndex, endIndex);

    // Remove passwords from response
    const customersWithoutPasswords = paginatedCustomers.map(customer => {
      const { password, ...customerData } = customer;
      return customerData;
    });

    res.json({
      customers: customersWithoutPasswords,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(customers.length / limitNum),
        totalItems: customers.length,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /admin/customers/:id/status - Update customer status
router.put('/customers/:id/status', (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const customers = readJsonFile('customers.json') || [];
    const customerIndex = customers.findIndex(c => c.id === customerId);

    if (customerIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    customers[customerIndex].status = status;
    customers[customerIndex].updatedAt = new Date().toISOString();

    writeJsonFile('customers.json', customers);

    res.json({
      message: 'Cập nhật trạng thái khách hàng thành công',
      customer: customers[customerIndex]
    });

  } catch (error) {
    console.error('Update customer status error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /admin/orders/pending - Get orders waiting for processing
router.get('/orders/pending', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const bookings = readJsonFile('bookings.json') || [];
    
    const pendingBookings = bookings
      .filter(b => b.status === 'pending' || b.status === 'confirmed')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Oldest first

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedBookings = pendingBookings.slice(startIndex, endIndex);

    res.json({
      orders: paginatedBookings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(pendingBookings.length / limitNum),
        totalItems: pendingBookings.length,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /admin/upload-banner - Upload banner image
router.post('/upload-banner', (req, res) => {
  try {
    req.upload.single('banner')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Chưa chọn file ảnh' });
      }

      const imagePath = `/uploads/${req.file.filename}`;

      res.json({
        message: 'Upload ảnh thành công',
        imagePath
      });
    });
  } catch (error) {
    console.error('Upload banner error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /admin/system-info - Get system information
router.get('/system-info', (req, res) => {
  try {
    const products = readJsonFile('products.json') || [];
    const customers = readJsonFile('customers.json') || [];
    const bookings = readJsonFile('bookings.json') || [];
    const comments = readJsonFile('comments.json') || [];
    const categories = readJsonFile('categories.json') || [];
    const promotions = readJsonFile('promotions.json') || [];

    const systemInfo = {
      dataFiles: {
        products: products.length,
        customers: customers.length,
        bookings: bookings.length,
        comments: comments.length,
        categories: categories.length,
        promotions: promotions.length
      },
      status: {
        activeProducts: products.filter(p => p.status === 'active').length,
        activeCustomers: customers.filter(c => c.status === 'active').length,
        pendingComments: comments.filter(c => c.status === 'pending').length,
        activePromotions: promotions.filter(p => 
          p.status === 'active' && 
          new Date(p.startDate) <= new Date() &&
          new Date(p.endDate) >= new Date()
        ).length
      },
      lastUpdated: new Date().toISOString()
    };

    res.json(systemInfo);

  } catch (error) {
    console.error('Get system info error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;