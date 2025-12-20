import express from 'express';
import { readJsonFile, writeJsonFile } from '../helpers/fileHelper.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /banners - Lấy banner cho trang chủ
router.get('/', (req, res) => {
  try {
    const { type, active, page = 1, limit = 10 } = req.query;
    
    let banners = readJsonFile('banners.json') || [];

    // Lọc theo loại
    if (type) {
      banners = banners.filter(b => b.type === type);
    }

    // Lọc theo trạng thái hoạt động
    if (active !== undefined) {
      banners = banners.filter(b => b.isActive === (active === 'true'));
    }

    // Sắp xếp theo thứ tự và ngày tạo
    banners.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Phân trang
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedBanners = banners.slice(startIndex, endIndex);

    res.json({
      banners: paginatedBanners,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(banners.length / limitNum),
        totalItems: banners.length,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /banners/:id - Lấy chi tiết banner
router.get('/:id', (req, res) => {
  try {
    const bannerId = parseInt(req.params.id);
    const banners = readJsonFile('banners.json') || [];
    
    const banner = banners.find(b => b.id === bannerId);
    if (!banner) {
      return res.status(404).json({ error: 'Không tìm thấy banner' });
    }

    res.json(banner);

  } catch (error) {
    console.error('Get banner error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /banners - Tạo banner mới (chỉ Admin)
router.post('/', (req, res) => {
  try {
    const {
      title,
      description,
      imageUrl,
      linkUrl,
      type,
      isActive,
      order,
      startDate,
      endDate
    } = req.body;

    if (!title || !imageUrl || !type) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    if (!['hero', 'promotion', 'category', 'service'].includes(type)) {
      return res.status(400).json({ error: 'Loại banner không hợp lệ' });
    }

    const banners = readJsonFile('banners.json') || [];

    const newBanner = {
      id: banners.length > 0 ? Math.max(...banners.map(b => b.id)) + 1 : 1,
      title,
      description: description || '',
      imageUrl,
      linkUrl: linkUrl || '',
      type,
      isActive: isActive !== undefined ? isActive : true,
      order: parseInt(order) || 0,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      clickCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    banners.push(newBanner);
    writeJsonFile('banners.json', banners);

    res.status(201).json(newBanner);

  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /banners/:id - Update banner (Admin only)
router.put('/:id', (req, res) => {
  try {
    const bannerId = parseInt(req.params.id);
    const banners = readJsonFile('banners.json') || [];
    
    const bannerIndex = banners.findIndex(b => b.id === bannerId);
    if (bannerIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy banner' });
    }

    const updatedBanner = {
      ...banners[bannerIndex],
      ...req.body,
      id: bannerId,
      updatedAt: new Date().toISOString()
    };

    banners[bannerIndex] = updatedBanner;
    writeJsonFile('banners.json', banners);

    res.json(updatedBanner);

  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /banners/:id - Delete banner (Admin only)
router.delete('/:id', (req, res) => {
  try {
    const bannerId = parseInt(req.params.id);
    const banners = readJsonFile('banners.json') || [];
    
    const bannerIndex = banners.findIndex(b => b.id === bannerId);
    if (bannerIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy banner' });
    }

    banners.splice(bannerIndex, 1);
    writeJsonFile('banners.json', banners);

    res.json({ message: 'Xóa banner thành công' });

  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /banners/:id/status - Toggle banner status (Admin only)
router.put('/:id/status', (req, res) => {
  try {
    const bannerId = parseInt(req.params.id);
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ error: 'Vui lòng cung cấp trạng thái' });
    }

    const banners = readJsonFile('banners.json') || [];
    const bannerIndex = banners.findIndex(b => b.id === bannerId);

    if (bannerIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy banner' });
    }

    banners[bannerIndex].isActive = isActive;
    banners[bannerIndex].updatedAt = new Date().toISOString();

    writeJsonFile('banners.json', banners);

    res.json({
      message: 'Cập nhật trạng thái thành công',
      banner: banners[bannerIndex]
    });

  } catch (error) {
    console.error('Update banner status error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /banners/:id/click - Track banner click
router.put('/:id/click', (req, res) => {
  try {
    const bannerId = parseInt(req.params.id);
    const banners = readJsonFile('banners.json') || [];
    
    const bannerIndex = banners.findIndex(b => b.id === bannerId);
    if (bannerIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy banner' });
    }

    banners[bannerIndex].clickCount = (banners[bannerIndex].clickCount || 0) + 1;
    banners[bannerIndex].updatedAt = new Date().toISOString();

    writeJsonFile('banners.json', banners);

    res.json({ message: 'Tracked click successfully' });

  } catch (error) {
    console.error('Track banner click error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;