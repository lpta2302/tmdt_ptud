import express from 'express';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /customers - Lấy tất cả khách hàng (không trả về password)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Xây dựng bộ lọc tìm kiếm
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
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

    // Đếm tổng số khách hàng
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
    console.error('Lỗi lấy danh sách khách hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách khách hàng' });
  }
});

// GET /customers/:id - Lấy chi tiết khách hàng theo id (không trả về password)
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Lỗi lấy thông tin khách hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin khách hàng' });
  }
});

// GET /customers/:id/profile - Lấy profile khách hàng
router.get('/:id/profile', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    res.json({
      message: 'Lấy thông tin profile thành công',
      customer
    });
  } catch (error) {
    console.error('Lỗi lấy profile:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin profile' });
  }
});

// PUT /customers/:id/profile - Cập nhật profile khách hàng
router.put('/:id/profile', async (req, res) => {
  try {
    const { name, phone, address, dateOfBirth, gender } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) updateData.gender = gender;
    updateData.updatedAt = new Date();

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    res.json({
      message: 'Cập nhật profile thành công',
      customer
    });
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật profile' });
  }
});

// GET /customers/:id/orders - Lấy danh sách đơn hàng của khách hàng
router.get('/:id/orders', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Xây dựng bộ lọc
    let filter = { customerId: req.params.id };
    if (status) filter.status = status;

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Truy vấn đơn hàng
    const orders = await Booking.find(filter)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Đếm tổng số đơn hàng
    const total = await Booking.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách đơn hàng' });
  }
});

// GET /customers/:id/wishlist - Lấy danh sách yêu thích của khách hàng
router.get('/:id/wishlist', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('wishlist', 'name price images category')
      .select('wishlist');

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    res.json({
      wishlist: customer.wishlist || []
    });
  } catch (error) {
    console.error('Lỗi lấy wishlist:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách yêu thích' });
  }
});

// POST /customers/:id/wishlist/:productId - Thêm sản phẩm vào wishlist
router.post('/:id/wishlist/:productId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    // Kiểm tra sản phẩm đã có trong wishlist chưa
    if (customer.wishlist && customer.wishlist.includes(req.params.productId)) {
      return res.status(400).json({ error: 'Sản phẩm đã có trong danh sách yêu thích' });
    }

    // Thêm sản phẩm vào wishlist
    await Customer.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { wishlist: req.params.productId } }
    );

    res.json({ message: 'Đã thêm sản phẩm vào danh sách yêu thích' });
  } catch (error) {
    console.error('Lỗi thêm vào wishlist:', error);
    res.status(500).json({ error: 'Lỗi server khi thêm vào danh sách yêu thích' });
  }
});

// DELETE /customers/:id/wishlist/:productId - Xóa sản phẩm khỏi wishlist
router.delete('/:id/wishlist/:productId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    // Xóa sản phẩm khỏi wishlist
    await Customer.findByIdAndUpdate(
      req.params.id,
      { $pull: { wishlist: req.params.productId } }
    );

    res.json({ message: 'Đã xóa sản phẩm khỏi danh sách yêu thích' });
  } catch (error) {
    console.error('Lỗi xóa khỏi wishlist:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa khỏi danh sách yêu thích' });
  }
});

// GET /customers/:id/viewed-products - Lấy danh sách sản phẩm đã xem
router.get('/:id/viewed-products', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('viewedProducts', 'name price images category')
      .select('viewedProducts');

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    res.json({
      viewedProducts: customer.viewedProducts || []
    });
  } catch (error) {
    console.error('Lỗi lấy sản phẩm đã xem:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy sản phẩm đã xem' });
  }
});

// POST /customers/:id/addresses - Thêm địa chỉ mới cho khách hàng
router.post('/:id/addresses', async (req, res) => {
  try {
    const { 
      street, 
      ward, 
      district, 
      city, 
      isDefault = false 
    } = req.body;

    if (!street || !ward || !district || !city) {
      return res.status(400).json({ 
        error: 'Vui lòng điền đầy đủ thông tin địa chỉ' 
      });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    const newAddress = {
      street,
      ward,
      district,
      city,
      isDefault
    };

    // Nếu địa chỉ mới là mặc định, bỏ default của các địa chỉ khác
    if (isDefault) {
      customer.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    customer.addresses.push(newAddress);
    await customer.save();

    res.status(201).json({
      message: 'Thêm địa chỉ thành công',
      addresses: customer.addresses
    });
  } catch (error) {
    console.error('Lỗi thêm địa chỉ:', error);
    res.status(500).json({ error: 'Lỗi server khi thêm địa chỉ' });
  }
});

// GET /customers/stats/overview - Thống kê khách hàng
router.get('/stats/overview', async (req, res) => {
  try {
    // Tổng số khách hàng
    const totalCustomers = await Customer.countDocuments();

    // Khách hàng mới trong tháng này
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Khách hàng theo giới tính
    const genderStats = await Customer.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Khách hàng theo tháng (12 tháng gần nhất)
    const monthlyStats = await Customer.aggregate([
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
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalCustomers,
      newCustomersThisMonth,
      genderDistribution: genderStats,
      monthlyTrends: monthlyStats
    });
  } catch (error) {
    console.error('Lỗi thống kê khách hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thống kê khách hàng' });
  }
});

export default router;