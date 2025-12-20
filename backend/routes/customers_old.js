import express from 'express';
import { readJsonFile, writeJsonFile } from '../helpers/fileHelper.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /customers - Lấy tất cả khách hàng (public, không trả về password)
router.get('/', (req, res) => {
    try {
        const customers = readJsonFile('customers.json') || [];
        const customersWithoutPasswords = customers.map(({ password, ...rest }) => rest);
        res.json(customersWithoutPasswords);
    } catch (error) {
        console.error('Get all customers error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// GET /customers/:id - Lấy chi tiết khách hàng theo id (public, không trả về password)
router.get('/:id', (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        const customers = readJsonFile('customers.json') || [];
        const customer = customers.find(c => c.id === customerId);
        if (!customer) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }
        const { password, ...customerInfo } = customer;
        res.json(customerInfo);
    } catch (error) {
        console.error('Get customer by id error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// GET /customers/:id/profile - Lấy thông tin hồ sơ khách hàng
router.get('/:id/profile', (req, res) => {
    try {
        const customerId = parseInt(req.params.id);

        // Kiểm tra quyền truy cập hồ sơ
        if (req.user.type === 'customer' && req.user.id !== customerId) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }

        const customers = readJsonFile('customers.json') || [];
        const customer = customers.find(c => c.id === customerId);

        if (!customer) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }

        // Xóa dữ liệu nhạy cảm
        const { password, ...customerProfile } = customer;

        res.json(customerProfile);
    } catch (error) {
        console.error('Get customer profile error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// PUT /customers/:id/profile - Cập nhật hồ sơ khách hàng
router.put('/:id/profile', (req, res) => {
    try {
        const customerId = parseInt(req.params.id);

        // Kiểm tra quyền truy cập hồ sơ
        if (req.user.type === 'customer' && req.user.id !== customerId) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }

        const customers = readJsonFile('customers.json') || [];
        const customerIndex = customers.findIndex(c => c.id === customerId);

        if (customerIndex === -1) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }

        const { firstName, lastName, phone, dateOfBirth, gender, preferences } = req.body;

        // Cập nhật dữ liệu khách hàng
        const updatedCustomer = {
            ...customers[customerIndex],
            firstName: firstName || customers[customerIndex].firstName,
            lastName: lastName || customers[customerIndex].lastName,
            fullName: `${firstName || customers[customerIndex].firstName} ${lastName || customers[customerIndex].lastName}`,
            phone: phone || customers[customerIndex].phone,
            dateOfBirth: dateOfBirth || customers[customerIndex].dateOfBirth,
            gender: gender || customers[customerIndex].gender,
            preferences: { ...customers[customerIndex].preferences, ...preferences },
            updatedAt: new Date().toISOString()
        };

        customers[customerIndex] = updatedCustomer;
        writeJsonFile('customers.json', customers);

        // Xóa mật khẩu khỏi dữ liệu trả về
        const { password, ...customerProfile } = updatedCustomer;

        res.json({
            message: 'Cập nhật thông tin thành công',
            customer: customerProfile
        });

    } catch (error) {
        console.error('Update customer profile error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// GET /customers/:id/orders - Lấy danh sách đơn hàng của khách
router.get('/:id/orders', (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        const { status, page = 1, limit = 10 } = req.query;

        // Kiểm tra quyền truy cập đơn hàng
        if (req.user.type === 'customer' && req.user.id !== customerId) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }

        const bookings = readJsonFile('bookings.json') || [];

        let customerOrders = bookings.filter(b => b.customerId === customerId);

        // Lọc theo trạng thái nếu có
        if (status) {
            customerOrders = customerOrders.filter(o => o.status === status);
        }

        // Sắp xếp theo ngày tạo (mới nhất trước)
        customerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Phân trang
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;

        const paginatedOrders = customerOrders.slice(startIndex, endIndex);

        res.json({
            orders: paginatedOrders,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(customerOrders.length / limitNum),
                totalItems: customerOrders.length,
                itemsPerPage: limitNum
            }
        });

    } catch (error) {
        console.error('Get customer orders error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// GET /customers/:id/wishlist - Lấy danh sách yêu thích của khách
router.get('/:id/wishlist', (req, res) => {
    try {
        const customerId = parseInt(req.params.id);

        // Kiểm tra quyền truy cập wishlist
        if (req.user.type === 'customer' && req.user.id !== customerId) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }

        const customers = readJsonFile('customers.json') || [];
        const products = readJsonFile('products.json') || [];

        const customer = customers.find(c => c.id === customerId);
        if (!customer) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }

        // Lấy chi tiết sản phẩm trong wishlist
        const wishlistProducts = (customer.wishlist || [])
            .map(productId => products.find(p => p.id === productId && p.status === 'active'))
            .filter(product => product !== undefined);

        res.json(wishlistProducts);

    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// POST /customers/:id/wishlist/:productId - Thêm vào danh sách yêu thích
router.post('/:id/wishlist/:productId', (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        const productId = parseInt(req.params.productId);

        // Kiểm tra quyền truy cập wishlist
        if (req.user.type === 'customer' && req.user.id !== customerId) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }

        const customers = readJsonFile('customers.json') || [];
        const products = readJsonFile('products.json') || [];

        const customerIndex = customers.findIndex(c => c.id === customerId);
        if (customerIndex === -1) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }

        const product = products.find(p => p.id === productId && p.status === 'active');
        if (!product) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }

        const customer = customers[customerIndex];
        customer.wishlist = customer.wishlist || [];

        if (customer.wishlist.includes(productId)) {
            return res.status(400).json({ error: 'Sản phẩm đã có trong danh sách yêu thích' });
        }

        customer.wishlist.push(productId);
        customer.updatedAt = new Date().toISOString();

        writeJsonFile('customers.json', customers);

        res.json({
            message: 'Đã thêm vào danh sách yêu thích',
            wishlist: customer.wishlist
        });

    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// DELETE /customers/:id/wishlist/:productId - Xóa khỏi danh sách yêu thích
router.delete('/:id/wishlist/:productId', (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        const productId = parseInt(req.params.productId);

        // Kiểm tra quyền truy cập wishlist
        if (req.user.type === 'customer' && req.user.id !== customerId) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }

        const customers = readJsonFile('customers.json') || [];

        const customerIndex = customers.findIndex(c => c.id === customerId);
        if (customerIndex === -1) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }

        const customer = customers[customerIndex];
        customer.wishlist = customer.wishlist || [];

        const productIndex = customer.wishlist.indexOf(productId);
        if (productIndex === -1) {
            return res.status(400).json({ error: 'Sản phẩm không có trong danh sách yêu thích' });
        }

        customer.wishlist.splice(productIndex, 1);
        customer.updatedAt = new Date().toISOString();

        writeJsonFile('customers.json', customers);

        res.json({
            message: 'Đã xóa khỏi danh sách yêu thích',
            wishlist: customer.wishlist
        });

    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// GET /customers/:id/viewed-products - Lấy sản phẩm đã xem gần đây
router.get('/:id/viewed-products', (req, res) => {
    try {
        const customerId = parseInt(req.params.id);

        // Kiểm tra quyền truy cập dữ liệu
        if (req.user.type === 'customer' && req.user.id !== customerId) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }

        const customers = readJsonFile('customers.json') || [];
        const products = readJsonFile('products.json') || [];

        const customer = customers.find(c => c.id === customerId);
        if (!customer) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }

        // Lấy chi tiết sản phẩm đã xem gần đây
        const viewedProducts = (customer.viewedProducts || [])
            .map(productId => products.find(p => p.id === productId && p.status === 'active'))
            .filter(product => product !== undefined)
            .slice(0, 10); // Giới hạn 10 sản phẩm gần nhất

        res.json(viewedProducts);

    } catch (error) {
        console.error('Get viewed products error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// POST /customers/:id/addresses - Thêm địa chỉ mới
router.post('/:id/addresses', (req, res) => {
    try {
        const customerId = parseInt(req.params.id);

        // Kiểm tra quyền truy cập hồ sơ
        if (req.user.type === 'customer' && req.user.id !== customerId) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }

        const { recipientName, recipientPhone, address, ward, district, city, postalCode, type, isDefault } = req.body;

        if (!recipientName || !recipientPhone || !address || !ward || !district || !city) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin địa chỉ' });
        }

        const customers = readJsonFile('customers.json') || [];
        const customerIndex = customers.findIndex(c => c.id === customerId);

        if (customerIndex === -1) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }

        const customer = customers[customerIndex];
        customer.addresses = customer.addresses || [];

        // Nếu đặt là mặc định thì các địa chỉ khác không mặc định
        if (isDefault) {
            customer.addresses.forEach(addr => addr.isDefault = false);
        }

        const newAddress = {
            id: customer.addresses.length + 1,
            type: type || 'home',
            isDefault: isDefault || customer.addresses.length === 0,
            recipientName,
            recipientPhone,
            address,
            ward,
            district,
            city,
            postalCode: postalCode || ''
        };

        customer.addresses.push(newAddress);
        customer.updatedAt = new Date().toISOString();

        writeJsonFile('customers.json', customers);

        res.json({
            message: 'Thêm địa chỉ thành công',
            address: newAddress
        });

    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

export default router;