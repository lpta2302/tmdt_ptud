import express from 'express';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /bookings - Lấy tất cả đơn đặt lịch
router.get('/', async (req, res) => {
    try {
        const {
            status,
            customerId,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Xây dựng bộ lọc
        let filter = {};
        if (status) filter.status = status;
        if (customerId) filter.customerId = customerId;

        // Tính toán phân trang
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        // Truy vấn bookings với populate customer info
        const bookings = await Booking.find(filter)
            .populate('customerId', 'firstName lastName email phone')
            .populate('services.product', 'name price duration')
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(parseInt(limit));

        // Đếm tổng số bookings
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
        console.error('Lỗi lấy danh sách booking:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách booking' });
    }
});

// GET /bookings/:id - Lấy thông tin một đặt lịch cụ thể
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('customerId', 'name email phone address');

        if (!booking) {
            return res.status(404).json({ error: 'Không tìm thấy đặt lịch' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Lỗi lấy booking:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy thông tin booking' });
    }
});

// POST /bookings - Tạo đơn đặt lịch mới
router.post('/', async (req, res) => {
    try {
        const {
            customerId,
            fullname,
            phone,
            email,
            services,
            appointmentDate,
            appointmentTime,
            notes,
            finalAmount
        } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!fullname || !phone || !email || !services || !appointmentDate || !appointmentTime) {
            return res.status(400).json({
                error: 'Vui lòng điền đầy đủ thông tin: khách hàng, dịch vụ, ngày và giờ'
            });
        }
        
        // Tạo booking mới
        const newBooking = new Booking({
            customerId: customerId,
            fullname,
            phone,
            email,
            services,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            notes: notes || '',
            finalAmount: finalAmount || 0,
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date()
        });
        
        console.log(newBooking);
        await newBooking.save();

        // Lấy booking với thông tin customer để trả về
        const bookingWithCustomer = await Booking.findById(newBooking._id)
            .populate('customerId', 'firstName lastName email phone');

        res.status(201).json({
            message: 'Tạo đặt lịch thành công',
            booking: bookingWithCustomer
        });
    } catch (error) {
        console.error('Lỗi tạo booking:', error);
        res.status(500).json({ error: 'Lỗi server khi tạo đặt lịch' });
    }
});

// PUT /bookings/:id/status - Cập nhật trạng thái đặt lịch
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Vui lòng cung cấp trạng thái' });
        }

        const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Trạng thái không hợp lệ. Các trạng thái hợp lệ: ' + validStatuses.join(', ')
            });
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: new Date() },
            { new: true }
        ).populate('customerId', 'name email phone');

        if (!booking) {
            return res.status(404).json({ error: 'Không tìm thấy đặt lịch' });
        }

        res.json({
            message: 'Cập nhật trạng thái thành công',
            booking
        });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái booking:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật trạng thái' });
    }
});

// PUT /bookings/:id/payment - Cập nhật trạng thái thanh toán
router.put('/:id/payment', async (req, res) => {
    try {
        const { paymentStatus, paymentMethod } = req.body;

        if (!paymentStatus) {
            return res.status(400).json({ error: 'Vui lòng cung cấp trạng thái thanh toán' });
        }

        const validPaymentStatuses = ['unpaid', 'paid', 'refunded'];
        if (!validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                error: 'Trạng thái thanh toán không hợp lệ. Các trạng thái hợp lệ: ' + validPaymentStatuses.join(', ')
            });
        }

        const updateData = {
            paymentStatus,
            updatedAt: new Date()
        };

        if (paymentMethod) {
            updateData.paymentMethod = paymentMethod;
        }

        if (paymentStatus === 'paid') {
            updateData.paidAt = new Date();
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('customerId', 'name email phone');

        if (!booking) {
            return res.status(404).json({ error: 'Không tìm thấy đặt lịch' });
        }

        res.json({
            message: 'Cập nhật thanh toán thành công',
            booking
        });
    } catch (error) {
        console.error('Lỗi cập nhật thanh toán booking:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật thanh toán' });
    }
});

// DELETE /bookings/:id - Xóa đặt lịch
router.delete('/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Không tìm thấy đặt lịch' });
        }

        res.json({ message: 'Xóa đặt lịch thành công' });
    } catch (error) {
        console.error('Lỗi xóa booking:', error);
        res.status(500).json({ error: 'Lỗi server khi xóa đặt lịch' });
    }
});

// GET /bookings/stats/overview - Thống kê tổng quan đặt lịch
router.get('/stats/overview', async (req, res) => {
    try {
        // Thống kê theo trạng thái
        const statusStats = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Thống kê theo trạng thái thanh toán
        const paymentStats = await Booking.aggregate([
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
        ]);

        // Tổng doanh thu
        const revenueStats = await Booking.aggregate([
            {
                $match: { paymentStatus: 'paid' }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalPaidBookings: { $sum: 1 }
                }
            }
        ]);

        // Thống kê theo tháng (6 tháng gần nhất)
        const monthlyStats = await Booking.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $cond: [
                                { $eq: ['$paymentStatus', 'paid'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            statusDistribution: statusStats,
            paymentDistribution: paymentStats,
            revenue: revenueStats[0] || { totalRevenue: 0, totalPaidBookings: 0 },
            monthlyTrends: monthlyStats
        });
    } catch (error) {
        console.error('Lỗi thống kê booking:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy thống kê' });
    }
});

export default router;