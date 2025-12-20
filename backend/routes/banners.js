import express from 'express';
import Banner from '../models/Banner.js';
import { upload, uploadToGridFS } from '../middleware/upload.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /banners - Lấy danh sách banner
router.get('/', async (req, res) => {
    try {
        const {
            type,
            active,
            page = 1,
            limit = 10,
            sortBy = 'order',
            order = 'asc'
        } = req.query;

        // Xây dựng bộ lọc
        let filter = {};
        if (type) filter.type = type;
        if (active !== undefined) filter.isActive = active === 'true';

        // Tính toán phân trang
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'asc' ? 1 : -1;

        // Truy vấn banners
        const banners = await Banner.find(filter)
            .sort({ [sortBy]: sortOrder, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Đếm tổng số banners
        const total = await Banner.countDocuments(filter);

        res.json({
            banners,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách banner:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách banner' });
    }
});

// GET /banners/:id - Lấy chi tiết banner
router.get('/:id', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }

        res.json(banner);
    } catch (error) {
        console.error('Lỗi lấy chi tiết banner:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy chi tiết banner' });
    }
});

// POST /banners - Tạo banner mới
router.post('/', upload.single('image'), uploadToGridFS, async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            linkUrl,
            buttonText,
            order,
            isActive
        } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!title || !type) {
            return res.status(400).json({
                error: 'Vui lòng điền đầy đủ thông tin: tiêu đề và loại banner'
            });
        }

        // Validate type
        const validTypes = ['main_slider', 'side_banner', 'promotional', 'category'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                error: 'Loại banner không hợp lệ. Chỉ chấp nhận: ' + validTypes.join(', ')
            });
        }

        console.log("🚀 ~ req.uploadedFile:", req.uploadedFile.id)
        // Tạo banner mới
        const newBanner = new Banner({
            title,
            description: description || '',
            type,
            image: {
                filename: req.uploadedFile.filename,
                originalname: req.uploadedFile.originalname,
                mimetype: req.uploadedFile.mimetype,
                size: req.uploadedFile.size,
                gridfsId: req.uploadedFile.id
            } || '',
            link: "#" || '',
            buttonText: buttonText || '',
            order: order ? parseInt(order) : 0,
            isActive: isActive === 'true' || isActive === true,
            createdAt: new Date()
        });

        await newBanner.save();

        res.status(201).json({
            message: 'Tạo banner thành công',
            banner: newBanner
        });
    } catch (error) {
        console.error('Lỗi tạo banner:', error);
        res.status(500).json({ error: 'Lỗi server khi tạo banner' });
    }
});

// PUT /banners/:id - Cập nhật banner
router.put('/:id', upload.single('image'), uploadToGridFS, async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            linkUrl,
            buttonText,
            order,
            isActive
        } = req.body;

        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }

        // Cập nhật các trường
        if (title) banner.title = title;
        if (description !== undefined) banner.description = description;
        if (type) {
            const validTypes = ['main_slider', 'side_banner', 'promotional', 'category'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    error: 'Loại banner không hợp lệ. Chỉ chấp nhận: ' + validTypes.join(', ')
                });
            }
            banner.type = type;
        }
        if (linkUrl !== undefined) banner.linkUrl = linkUrl;
        if (buttonText !== undefined) banner.buttonText = buttonText;
        if (order !== undefined) banner.order = parseInt(order) || 0;
        if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;

        // Cập nhật ảnh nếu có
        if (req.uploadedFileId) {
            banner.imageUrl = req.uploadedFileId;
        }

        banner.updatedAt = new Date();
        await banner.save();

        res.json({
            message: 'Cập nhật banner thành công',
            banner
        });
    } catch (error) {
        console.error('Lỗi cập nhật banner:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật banner' });
    }
});

// DELETE /banners/:id - Xóa banner
router.delete('/:id', async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);

        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }

        res.json({ message: 'Xóa banner thành công' });
    } catch (error) {
        console.error('Lỗi xóa banner:', error);
        res.status(500).json({ error: 'Lỗi server khi xóa banner' });
    }
});

// PUT /banners/:id/status - Cập nhật trạng thái banner
router.put('/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({ error: 'Vui lòng cung cấp trạng thái' });
        }

        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            {
                isActive: isActive === 'true' || isActive === true,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }

        res.json({
            message: 'Cập nhật trạng thái banner thành công',
            banner
        });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái banner:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật trạng thái banner' });
    }
});

// GET /banners/active/homepage - Lấy banner cho trang chủ (chỉ banner active)
router.get('/active/homepage', async (req, res) => {
    try {
        const banners = await Banner.find({
            isActive: true,
            type: { $in: ['main_slider', 'side_banner', 'promotional'] }
        }).sort({ order: 1, createdAt: -1 });

        // Nhóm banner theo loại
        const groupedBanners = {
            main_slider: banners.filter(b => b.type === 'main_slider'),
            side_banner: banners.filter(b => b.type === 'side_banner'),
            promotional: banners.filter(b => b.type === 'promotional')
        };

        res.json(groupedBanners);
    } catch (error) {
        console.error('Lỗi lấy banner trang chủ:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy banner trang chủ' });
    }
});

// PUT /banners/:id/order - Cập nhật thứ tự hiển thị
router.put('/:id/order', async (req, res) => {
    try {
        const { order } = req.body;

        if (order === undefined || order < 0) {
            return res.status(400).json({ error: 'Thứ tự phải là số không âm' });
        }

        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            {
                order: parseInt(order),
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }

        res.json({
            message: 'Cập nhật thứ tự banner thành công',
            banner
        });
    } catch (error) {
        console.error('Lỗi cập nhật thứ tự banner:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật thứ tự banner' });
    }
});

export default router;