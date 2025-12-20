import express from 'express';
import { readJsonFile, writeJsonFile } from '../helpers/fileHelper.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /cart/:customerId - Lấy giỏ hàng của khách
router.get('/:customerId', (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    
    // Kiểm tra quyền truy cập giỏ hàng
    if (req.user.type === 'customer' && req.user.id !== customerId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const carts = readJsonFile('carts.json') || [];
    const products = readJsonFile('products.json') || [];
    
    let cart = carts.find(c => c.customerId === customerId);
    
    if (!cart) {
      // Tạo giỏ hàng rỗng nếu chưa có
      cart = {
        id: carts.length + 1,
        customerId,
        items: [],
        subtotal: 0,
        itemCount: 0,
        updatedAt: new Date().toISOString()
      };
      carts.push(cart);
      writeJsonFile('carts.json', carts);
    }

    // Cập nhật thông tin sản phẩm trong giỏ
    cart.items = cart.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        return {
          ...item,
          productName: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          thumbnail: product.thumbnail,
          status: product.status
        };
      }
      return item;
    }).filter(item => item.status === 'active'); // Bỏ sản phẩm không còn hoạt động

    // Tính lại tổng tiền và số lượng
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json(cart);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /cart/:customerId/add - Thêm sản phẩm vào giỏ
router.post('/:customerId/add', (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const { productId, quantity = 1 } = req.body;

    // Kiểm tra quyền truy cập giỏ hàng
    if (req.user.type === 'customer' && req.user.id !== customerId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    if (!productId || quantity < 1) {
      return res.status(400).json({ error: 'Thông tin không hợp lệ' });
    }

    const carts = readJsonFile('carts.json') || [];
    const products = readJsonFile('products.json') || [];

    // Kiểm tra sản phẩm tồn tại và còn hoạt động
    const product = products.find(p => p.id === parseInt(productId) && p.status === 'active');
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    let cart = carts.find(c => c.customerId === customerId);
    if (!cart) {
      cart = {
        id: carts.length + 1,
        customerId,
        items: [],
        subtotal: 0,
        itemCount: 0,
        updatedAt: new Date().toISOString()
      };
      carts.push(cart);
    }

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const existingItemIndex = cart.items.findIndex(item => item.productId === parseInt(productId));
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item
      const newItem = {
        id: cart.items.length + 1,
        productId: parseInt(productId),
        productName: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        thumbnail: product.thumbnail,
        quantity: parseInt(quantity),
        addedAt: new Date().toISOString()
      };
      cart.items.push(newItem);
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date().toISOString();

    writeJsonFile('carts.json', carts);

    res.json({
      message: 'Đã thêm vào giỏ hàng',
      cart
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /cart/:customerId/update/:itemId - Update cart item quantity
router.put('/:customerId/update/:itemId', (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const itemId = parseInt(req.params.itemId);
    const { quantity } = req.body;

    // Check if user can access this cart
    if (req.user.type === 'customer' && req.user.id !== customerId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Số lượng không hợp lệ' });
    }

    const carts = readJsonFile('carts.json') || [];
    const cart = carts.find(c => c.customerId === customerId);

    if (!cart) {
      return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
    }

    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    // Update quantity
    cart.items[itemIndex].quantity = parseInt(quantity);

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date().toISOString();

    writeJsonFile('carts.json', carts);

    res.json({
      message: 'Cập nhật giỏ hàng thành công',
      cart
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /cart/:customerId/remove/:itemId - Remove item from cart
router.delete('/:customerId/remove/:itemId', (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const itemId = parseInt(req.params.itemId);

    // Check if user can access this cart
    if (req.user.type === 'customer' && req.user.id !== customerId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const carts = readJsonFile('carts.json') || [];
    const cart = carts.find(c => c.customerId === customerId);

    if (!cart) {
      return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
    }

    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date().toISOString();

    writeJsonFile('carts.json', carts);

    res.json({
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      cart
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /cart/:customerId/clear - Clear entire cart
router.delete('/:customerId/clear', (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);

    // Check if user can access this cart
    if (req.user.type === 'customer' && req.user.id !== customerId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const carts = readJsonFile('carts.json') || [];
    const cart = carts.find(c => c.customerId === customerId);

    if (cart) {
      cart.items = [];
      cart.subtotal = 0;
      cart.itemCount = 0;
      cart.updatedAt = new Date().toISOString();
      
      writeJsonFile('carts.json', carts);
    }

    res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /cart/:customerId/apply-coupon - Apply coupon to cart
router.post('/:customerId/apply-coupon', (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const { couponCode } = req.body;

    // Check if user can access this cart
    if (req.user.type === 'customer' && req.user.id !== customerId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    if (!couponCode) {
      return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá' });
    }

    const carts = readJsonFile('carts.json') || [];
    const promotions = readJsonFile('promotions.json') || [];

    const cart = carts.find(c => c.customerId === customerId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }

    // Find valid promotion
    const promotion = promotions.find(p => 
      p.code === couponCode && 
      p.status === 'active' &&
      new Date(p.startDate) <= new Date() &&
      new Date(p.endDate) >= new Date() &&
      p.usedCount < p.usageLimit
    );

    if (!promotion) {
      return res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
    }

    // Check minimum order value
    if (cart.subtotal < promotion.minOrderValue) {
      return res.status(400).json({ 
        error: `Đơn hàng tối thiểu ${promotion.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promotion.type === 'percentage') {
      discountAmount = Math.min(
        cart.subtotal * (promotion.value / 100), 
        promotion.maxDiscount
      );
    } else if (promotion.type === 'fixed') {
      discountAmount = Math.min(promotion.value, cart.subtotal);
    }

    res.json({
      message: 'Áp dụng mã giảm giá thành công',
      promotion: {
        code: promotion.code,
        name: promotion.name,
        type: promotion.type,
        value: promotion.value,
        discountAmount
      },
      cart: {
        ...cart,
        discountAmount,
        total: cart.subtotal - discountAmount
      }
    });

  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;