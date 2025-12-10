// Cart Page Functionality
class CartManager {
    constructor() {
        this.init();
        this.availablePromos = [
            { code: 'WELCOME10', discount: 10, type: 'percent', description: 'Giảm 10% cho khách hàng mới' },
            { code: 'SUMMER50', discount: 50000, type: 'fixed', description: 'Giảm 50.000đ cho đơn từ 500.000đ' },
            { code: 'VIP20', discount: 20, type: 'percent', description: 'Giảm 20% cho thành viên VIP' },
            { code: 'FREESHIP', discount: 30000, type: 'fixed', description: 'Miễn phí dịch vụ (30.000đ)' }
        ];
        this.appliedPromo = null;
        this.serviceFee = 30000; // Fixed service fee
    }

    init() {
        this.bindEvents();
        this.loadCart();
        this.loadSuggestedProducts();
        this.loadRecentlyViewed();
        this.loadAvailablePromos();
        this.updateCartDisplay();
    }

    bindEvents() {
        // Clear cart
        document.getElementById('clear-cart')?.addEventListener('click', () => {
            this.clearCart();
        });

        // Apply promo code
        document.getElementById('apply-promo')?.addEventListener('click', () => {
            this.applyPromoCode();
        });

        // Promo code input enter key
        document.getElementById('promo-code')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyPromoCode();
            }
        });

        // Checkout button
        document.getElementById('checkout-btn')?.addEventListener('click', () => {
            this.proceedToCheckout();
        });

        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cancel-remove') || e.target.classList.contains('modal-overlay')) {
                this.closeRemoveModal();
            }
            if (e.target.classList.contains('confirm-remove')) {
                this.confirmRemoveItem();
            }
        });
    }

    loadCart() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const container = document.getElementById('cart-items-container');
        const emptyCart = document.getElementById('empty-cart');
        const cartContent = container?.parentElement?.parentElement;

        if (cart.length === 0) {
            if (cartContent) cartContent.style.display = 'none';
            if (emptyCart) emptyCart.classList.remove('hidden');
            return;
        }

        if (cartContent) cartContent.style.display = 'block';
        if (emptyCart) emptyCart.classList.add('hidden');

        container.innerHTML = cart.map(item => this.createCartItemHTML(item)).join('');
        
        // Update cart count
        document.getElementById('cart-items-count').textContent = cart.length;

        // Bind item events
        this.bindCartItemEvents();
    }

    createCartItemHTML(item) {
        return `
            <div class="cart-item p-6 border-b border-gray-200 hover:bg-gray-50 transition-colors" data-id="${item.id}">
                <div class="flex items-center space-x-4">
                    <!-- Product Image -->
                    <div class="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100 flex-shrink-0">
                        <img src="${item.image || 'https://via.placeholder.com/80x80/f472b6/ffffff?text=Spa'}" 
                             alt="${item.name}" 
                             class="w-full h-full object-cover">
                    </div>

                    <!-- Product Info -->
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-gray-800 mb-1 truncate">${item.name}</h3>
                        <p class="text-sm text-gray-600 mb-2">${item.category || 'Dịch vụ spa'}</p>
                        <div class="flex items-center space-x-4">
                            <span class="text-lg font-bold text-primary-300">
                                ${this.formatPrice(item.price)}
                            </span>
                            ${item.originalPrice && item.originalPrice > item.price ? 
                                `<span class="text-sm text-gray-400 line-through">
                                    ${this.formatPrice(item.originalPrice)}
                                </span>` : ''
                            }
                        </div>
                    </div>

                    <!-- Quantity Controls -->
                    <div class="flex items-center space-x-3">
                        <button class="quantity-btn minus w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors" 
                                data-id="${item.id}">
                            <i class="fas fa-minus text-xs"></i>
                        </button>
                        <span class="quantity w-12 text-center font-semibold">${item.quantity}</span>
                        <button class="quantity-btn plus w-8 h-8 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-300 flex items-center justify-center transition-colors" 
                                data-id="${item.id}">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                    </div>

                    <!-- Item Total -->
                    <div class="text-right">
                        <div class="font-bold text-lg text-gray-800">
                            ${this.formatPrice(item.price * item.quantity)}
                        </div>
                        <button class="remove-item text-sm text-red-500 hover:text-red-700 transition-colors mt-1" 
                                data-id="${item.id}">
                            <i class="fas fa-trash mr-1"></i>
                            Xóa
                        </button>
                    </div>
                </div>

                <!-- Special Options -->
                ${item.options ? `
                    <div class="mt-4 pl-24">
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">Tùy chọn:</span> ${item.options}
                        </p>
                    </div>
                ` : ''}

                <!-- Duration -->
                ${item.duration ? `
                    <div class="mt-2 pl-24">
                        <p class="text-sm text-gray-600">
                            <i class="fas fa-clock mr-1"></i>
                            Thời gian: ${item.duration}
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    bindCartItemEvents() {
        // Quantity buttons
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const action = e.currentTarget.classList.contains('plus') ? 'increase' : 'decrease';
                this.updateQuantity(id, action);
            });
        });

        // Remove item buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.showRemoveModal(id);
            });
        });
    }

    updateQuantity(id, action) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const itemIndex = cart.findIndex(item => item.id === id);
        
        if (itemIndex !== -1) {
            if (action === 'increase') {
                cart[itemIndex].quantity += 1;
            } else if (action === 'decrease' && cart[itemIndex].quantity > 1) {
                cart[itemIndex].quantity -= 1;
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            this.loadCart();
            this.updateCartDisplay();
            
            // Show notification
            showNotification('Đã cập nhật số lượng', 'success');
        }
    }

    showRemoveModal(id) {
        this.itemToRemove = id;
        document.querySelector('.remove-modal').classList.remove('hidden');
    }

    closeRemoveModal() {
        document.querySelector('.remove-modal').classList.add('hidden');
        this.itemToRemove = null;
    }

    confirmRemoveItem() {
        if (this.itemToRemove) {
            this.removeItem(this.itemToRemove);
            this.closeRemoveModal();
        }
    }

    removeItem(id) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const updatedCart = cart.filter(item => item.id !== id);
        
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        this.loadCart();
        this.updateCartDisplay();
        
        // Update global cart count
        updateCartCount();
        
        showNotification('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
    }

    clearCart() {
        if (confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
            localStorage.removeItem('cart');
            this.appliedPromo = null;
            this.loadCart();
            this.updateCartDisplay();
            updateCartCount();
            showNotification('Đã xóa tất cả sản phẩm', 'success');
        }
    }

    updateCartDisplay() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Calculate discount
        let discount = 0;
        if (this.appliedPromo) {
            if (this.appliedPromo.type === 'percent') {
                discount = subtotal * (this.appliedPromo.discount / 100);
            } else {
                discount = this.appliedPromo.discount;
            }
        }

        const total = subtotal + this.serviceFee - discount;

        // Update display
        document.getElementById('subtotal').textContent = this.formatPrice(subtotal);
        document.getElementById('service-fee').textContent = this.formatPrice(this.serviceFee);
        document.getElementById('total-amount').textContent = this.formatPrice(Math.max(0, total));

        // Show/hide discount row
        const discountRow = document.getElementById('discount-row');
        if (discount > 0) {
            discountRow.style.display = 'flex';
            document.getElementById('discount-amount').textContent = '-' + this.formatPrice(discount);
        } else {
            discountRow.style.display = 'none';
        }

        // Enable/disable checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (cart.length > 0) {
            checkoutBtn.disabled = false;
            checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    loadAvailablePromos() {
        const promoList = document.getElementById('promo-list');
        if (!promoList) return;

        promoList.innerHTML = this.availablePromos.map(promo => `
            <div class="promo-item bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-3 cursor-pointer hover:from-primary-100 hover:to-secondary-100 transition-colors"
                 onclick="cartManager.quickApplyPromo('${promo.code}')">
                <div class="flex items-center justify-between">
                    <div>
                        <span class="font-semibold text-primary-300">${promo.code}</span>
                        <p class="text-xs text-gray-600 mt-1">${promo.description}</p>
                    </div>
                    <button class="text-primary-300 hover:text-primary-300">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    quickApplyPromo(code) {
        document.getElementById('promo-code').value = code;
        this.applyPromoCode();
    }

    applyPromoCode() {
        const promoCode = document.getElementById('promo-code').value.trim().toUpperCase();
        const messageEl = document.getElementById('promo-message');
        
        if (!promoCode) {
            this.showPromoMessage('Vui lòng nhập mã giảm giá', 'error');
            return;
        }

        const promo = this.availablePromos.find(p => p.code === promoCode);
        
        if (!promo) {
            this.showPromoMessage('Mã giảm giá không hợp lệ', 'error');
            return;
        }

        // Check minimum order for SUMMER50
        if (promo.code === 'SUMMER50') {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            if (subtotal < 500000) {
                this.showPromoMessage('Đơn hàng tối thiểu 500.000đ cho mã này', 'error');
                return;
            }
        }

        this.appliedPromo = promo;
        this.updateCartDisplay();
        this.showPromoMessage(`Đã áp dụng mã giảm giá ${promo.code}`, 'success');
        
        // Hide applied promo from available list
        const promoItems = document.querySelectorAll('.promo-item');
        promoItems.forEach(item => {
            if (item.textContent.includes(promo.code)) {
                item.style.display = 'none';
            }
        });
    }

    showPromoMessage(message, type) {
        const messageEl = document.getElementById('promo-message');
        messageEl.textContent = message;
        messageEl.className = `mt-2 text-sm ${type === 'success' ? 'text-green-600' : 'text-red-600'}`;
        messageEl.classList.remove('hidden');
        
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 3000);
    }

    async loadSuggestedProducts() {
        try {
            const response = await fetch('/api/products');
            let products = await response.json();
            
            if (!Array.isArray(products)) {
                // Fallback data
                products = [
                    {
                        id: 101,
                        name: 'Tinh Dầu Massage Lavender',
                        price: 199000,
                        originalPrice: 250000,
                        image: 'https://via.placeholder.com/300x300/f472b6/ffffff?text=Lavender+Oil',
                        category: 'Sản phẩm chăm sóc'
                    },
                    {
                        id: 102,
                        name: 'Kem Dưỡng Da Premium',
                        price: 399000,
                        originalPrice: 499000,
                        image: 'https://via.placeholder.com/300x300/a855f7/ffffff?text=Premium+Cream',
                        category: 'Sản phẩm chăm sóc'
                    },
                    {
                        id: 103,
                        name: 'Set Chăm Sóc Da Cơ Bản',
                        price: 599000,
                        originalPrice: 799000,
                        image: 'https://via.placeholder.com/300x300/ec4899/ffffff?text=Skincare+Set',
                        category: 'Combo sản phẩm'
                    }
                ];
            }

            // Get random products for suggestions
            const suggested = products.sort(() => Math.random() - 0.5).slice(0, 3);
            this.renderSuggestedProducts(suggested);
        } catch (error) {
            console.error('Error loading suggested products:', error);
            // Load fallback data
            this.loadSuggestedProducts();
        }
    }

    renderSuggestedProducts(products) {
        const container = document.getElementById('suggested-products');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="product-card bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div class="relative">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-32 object-cover">
                    ${product.originalPrice && product.originalPrice > product.price ? 
                        `<div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            -${Math.round((1 - product.price / product.originalPrice) * 100)}%
                        </div>` : ''
                    }
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-gray-800 mb-2 text-sm line-clamp-2">${product.name}</h3>
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <span class="text-primary-300 font-bold">${this.formatPrice(product.price)}</span>
                            ${product.originalPrice && product.originalPrice > product.price ? 
                                `<span class="text-xs text-gray-400 line-through ml-2">${this.formatPrice(product.originalPrice)}</span>` : ''
                            }
                        </div>
                    </div>
                    <button class="w-full bg-gradient-to-r from-primary-500 to-secondary-400 text-white py-2 px-4 rounded-lg hover:from-primary-400 hover:to-secondary-500 transition-colors text-sm"
                            onclick="addToCart({id: ${product.id}, name: '${product.name}', price: ${product.price}, image: '${product.image}', category: '${product.category}'})">
                        <i class="fas fa-plus mr-1"></i>
                        Thêm Vào Giỏ
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadRecentlyViewed() {
        const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const section = document.getElementById('recently-viewed-section');
        
        if (recentlyViewed.length === 0) {
            section.style.display = 'none';
            return;
        }

        try {
            const response = await fetch('/api/products');
            let allProducts = await response.json();
            
            if (!Array.isArray(allProducts)) {
                // Fallback data
                allProducts = [
                    {
                        id: 1,
                        name: 'Massage Thư Giãn Toàn Thân',
                        price: 850000,
                        image: 'https://via.placeholder.com/300x300/f472b6/ffffff?text=Full+Body+Massage',
                        category: 'Massage'
                    },
                    {
                        id: 2,
                        name: 'Chăm Sóc Da Mặt Cao Cấp',
                        price: 650000,
                        image: 'https://via.placeholder.com/300x300/a855f7/ffffff?text=Premium+Facial',
                        category: 'Chăm sóc da'
                    }
                ];
            }

            const products = allProducts.filter(product => 
                recentlyViewed.includes(product.id)
            ).slice(0, 4);

            this.renderRecentlyViewed(products);
        } catch (error) {
            console.error('Error loading recently viewed:', error);
        }
    }

    renderRecentlyViewed(products) {
        const container = document.getElementById('recently-viewed-products');
        if (!container || products.length === 0) return;

        container.innerHTML = products.map(product => `
            <div class="product-card group" data-aos="fade-up">
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                    <div class="relative overflow-hidden">
                        <img src="${product.image}" alt="${product.name}" 
                             class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div class="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                            <button class="w-full bg-white/90 backdrop-blur-sm text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-white transition-colors"
                                    onclick="location.href='product-detail.html?id=${product.id}'">
                                Xem Chi Tiết
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <span class="text-primary-300 text-sm font-medium">${product.category}</span>
                        <h3 class="font-semibold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-300 transition-colors">
                            ${product.name}
                        </h3>
                        <div class="flex items-center justify-between">
                            <span class="text-2xl font-bold text-primary-300">${this.formatPrice(product.price)}</span>
                            <button class="bg-gradient-to-r from-primary-500 to-secondary-400 text-white p-3 rounded-full hover:from-primary-400 hover:to-secondary-500 transition-colors hover-glow"
                                    onclick="addToCart({id: ${product.id}, name: '${product.name}', price: ${product.price}, image: '${product.image}', category: '${product.category}'})">
                                <i class="fas fa-shopping-bag"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    proceedToCheckout() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            showNotification('Giỏ hàng trống. Vui lòng thêm sản phẩm!', 'warning');
            return;
        }

        // Save checkout data
        const checkoutData = {
            items: cart,
            subtotal: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
            serviceFee: this.serviceFee,
            appliedPromo: this.appliedPromo,
            discount: this.calculateDiscount(),
            total: this.calculateTotal()
        };

        localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
        
        // Redirect to checkout
        window.location.href = 'checkout.html';
    }

    calculateDiscount() {
        if (!this.appliedPromo) return 0;
        
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        if (this.appliedPromo.type === 'percent') {
            return subtotal * (this.appliedPromo.discount / 100);
        } else {
            return this.appliedPromo.discount;
        }
    }

    calculateTotal() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const discount = this.calculateDiscount();
        return Math.max(0, subtotal + this.serviceFee - discount);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price).replace('₫', 'đ');
    }
}

// Initialize cart manager when DOM is loaded
let cartManager;

document.addEventListener('DOMContentLoaded', function() {
    cartManager = new CartManager();
    
    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });
});

// Global functions for compatibility
function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already exists
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1,
            addedAt: new Date().toISOString()
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update displays
    cartManager.loadCart();
    cartManager.updateCartDisplay();
    updateCartCount();
    
    showNotification(`Đã thêm "${product.name}" vào giỏ hàng`, 'success');
}

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-4 z-50 px-6 py-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-black' :
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-${
                type === 'success' ? 'check-circle' :
                type === 'error' ? 'exclamation-circle' :
                type === 'warning' ? 'exclamation-triangle' :
                'info-circle'
            }"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}