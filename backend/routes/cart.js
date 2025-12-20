import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
// Bỏ authentication - tất cả API public

const router = express.Router();

// GET /cart/:customerId - Lấy giỏ hàng của khách hàng
router.get('/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;

    // Tìm giỏ hàng của khách hàng
    let cart = await Cart.findOne({ customerId })
      .populate('items.productId', 'name price images category');

    // Nếu chưa có giỏ hàng, tạo mới
    if (!cart) {
      cart = new Cart({
        customerId,
        items: [],
        subtotal: 0,
        itemCount: 0
      });
      await cart.save();
    }

    res.json({
      cart: {
        _id: cart._id,
        customerId: cart.customerId,
        items: cart.items,
        subtotal: cart.subtotal,
        itemCount: cart.itemCount,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Lỗi lấy giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy giỏ hàng' });
  }
});

// POST /cart/:customerId/add - Thêm sản phẩm vào giỏ hàng
router.post('/:customerId/add', async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Vui lòng cung cấp ID sản phẩm' });
    }

    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }



    // Tìm hoặc tạo giỏ hàng
    let cart = await Cart.findOne({ customerId });
    if (!cart) {
      cart = new Cart({
        customerId,
        items: [],
        subtotal: 0,
        itemCount: 0
      });
    }

    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex >= 0) {
      // Cập nhật số lượng sản phẩm đã có
      const newQuantity = cart.items[existingItemIndex].quantity + parseInt(quantity);
      
      if (product.stock < newQuantity) {
        return res.status(400).json({ 
          error: `Không đủ hàng trong kho. Chỉ còn ${product.stock} sản phẩm` 
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].subtotal = newQuantity * product.price;
    } else {
      // Thêm sản phẩm mới vào giỏ hàng
      cart.items.push({
        productId,
        quantity: parseInt(quantity),
        price: product.price,
        subtotal: parseInt(quantity) * product.price
      });
    }

    // Tính lại tổng tiền và số lượng
    cart.subtotal = cart.items.reduce((total, item) => total + item.subtotal, 0);
    cart.itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.updatedAt = new Date();

    await cart.save();

    // Populate thông tin sản phẩm để trả về
    await cart.populate('items.productId', 'name price images');

    res.status(201).json({
      message: 'Thêm vào giỏ hàng thành công',
      cart
    });
  } catch (error) {
    console.error('Lỗi thêm vào giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi thêm vào giỏ hàng' });
  }
});

// PUT /cart/:customerId/update/:itemId - Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/:customerId/update/:itemId', async (req, res) => {
  try {
    const { customerId, itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Số lượng phải lớn hơn 0' });
    }

    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    // Kiểm tra tồn kho
    const product = await Product.findById(cart.items[itemIndex].productId);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không còn tồn tại' });
    }

    if (product.stock < parseInt(quantity)) {
      return res.status(400).json({ 
        error: `Không đủ hàng trong kho. Chỉ còn ${product.stock} sản phẩm` 
      });
    }

    // Cập nhật số lượng và tính lại subtotal
    cart.items[itemIndex].quantity = parseInt(quantity);
    cart.items[itemIndex].subtotal = parseInt(quantity) * cart.items[itemIndex].price;

    // Tính lại tổng tiền và số lượng
    cart.subtotal = cart.items.reduce((total, item) => total + item.subtotal, 0);
    cart.itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.updatedAt = new Date();

    await cart.save();
    await cart.populate('items.productId', 'name price images');

    res.json({
      message: 'Cập nhật giỏ hàng thành công',
      cart
    });
  } catch (error) {
    console.error('Lỗi cập nhật giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật giỏ hàng' });
  }
});

// DELETE /cart/:customerId/remove/:itemId - Xóa sản phẩm khỏi giỏ hàng
router.delete('/:customerId/remove/:itemId', async (req, res) => {
  try {
    const { customerId, itemId } = req.params;

    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    // Xóa sản phẩm khỏi giỏ hàng
    cart.items.splice(itemIndex, 1);

    // Tính lại tổng tiền và số lượng
    cart.subtotal = cart.items.reduce((total, item) => total + item.subtotal, 0);
    cart.itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.updatedAt = new Date();

    await cart.save();
    await cart.populate('items.productId', 'name price images');

    res.json({
      message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
      cart
    });
  } catch (error) {
    console.error('Lỗi xóa sản phẩm khỏi giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa sản phẩm khỏi giỏ hàng' });
  }
});

// DELETE /cart/:customerId/clear - Xóa tất cả sản phẩm trong giỏ hàng
router.delete('/:customerId/clear', async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
    }

    // Xóa tất cả sản phẩm
    cart.items = [];
    cart.subtotal = 0;
    cart.itemCount = 0;
    cart.updatedAt = new Date();

    await cart.save();

    res.json({
      message: 'Đã xóa tất cả sản phẩm trong giỏ hàng',
      cart
    });
  } catch (error) {
    console.error('Lỗi xóa giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa giỏ hàng' });
  }
});

// POST /cart/:customerId/merge - Hợp nhất giỏ hàng (khi khách hàng đăng nhập)
router.post('/:customerId/merge', async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const { tempCartItems } = req.body; // Giỏ hàng tạm từ local storage

    if (!tempCartItems || !Array.isArray(tempCartItems)) {
      return res.status(400).json({ error: 'Dữ liệu giỏ hàng tạm không hợp lệ' });
    }

    // Tìm hoặc tạo giỏ hàng của khách hàng
    let cart = await Cart.findOne({ customerId });
    if (!cart) {
      cart = new Cart({
        customerId,
        items: [],
        subtotal: 0,
        itemCount: 0
      });
    }

    // Hợp nhất các sản phẩm từ giỏ hàng tạm
    for (const tempItem of tempCartItems) {
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === tempItem.productId
      );

      // Kiểm tra sản phẩm có tồn tại không
      const product = await Product.findById(tempItem.productId);
      if (!product) continue;

      if (existingItemIndex >= 0) {
        // Cộng dồn số lượng
        const newQuantity = cart.items[existingItemIndex].quantity + tempItem.quantity;
        if (product.stock >= newQuantity) {
          cart.items[existingItemIndex].quantity = newQuantity;
          cart.items[existingItemIndex].subtotal = newQuantity * product.price;
        }
      } else {
        // Thêm sản phẩm mới
        if (product.stock >= tempItem.quantity) {
          cart.items.push({
            productId: tempItem.productId,
            quantity: tempItem.quantity,
            price: product.price,
            subtotal: tempItem.quantity * product.price
          });
        }
      }
    }

    // Tính lại tổng tiền và số lượng
    cart.subtotal = cart.items.reduce((total, item) => total + item.subtotal, 0);
    cart.itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.updatedAt = new Date();

    await cart.save();
    await cart.populate('items.productId', 'name price images');

    res.json({
      message: 'Hợp nhất giỏ hàng thành công',
      cart
    });
  } catch (error) {
    console.error('Lỗi hợp nhất giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi hợp nhất giỏ hàng' });
  }
});

export default router;