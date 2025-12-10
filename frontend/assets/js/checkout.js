// Checkout Page Functionality
class CheckoutManager {
    constructor() {
        this.checkoutData = null;
        this.init();
    }

    init() {
        this.loadCheckoutData();
        this.bindEvents();
        this.setMinDate();
        this.loadOrderSummary();
        this.setupPaymentMethods();
        
        // Initialize AOS
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
    }

    loadCheckoutData() {
        this.checkoutData = JSON.parse(localStorage.getItem('checkoutData') || '{}');
        
        // If no checkout data, redirect to cart
        if (!this.checkoutData.items || this.checkoutData.items.length === 0) {
            showNotification('Không có sản phẩm trong giỏ hàng', 'warning');
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 2000);
            return;
        }
    }

    bindEvents() {
        // Form submission
        document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processOrder();
        });

        // Payment method changes
        document.querySelectorAll('.payment-radio').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handlePaymentMethodChange(e.target.value);
            });
        });

        // Phone number formatting
        document.getElementById('phone')?.addEventListener('input', (e) => {
            this.formatPhoneNumber(e.target);
        });

        // Email validation
        document.getElementById('email')?.addEventListener('blur', (e) => {
            this.validateEmail(e.target);
        });

        // Auto-fill user data if logged in
        this.loadUserData();
    }

    setMinDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateInput = document.getElementById('bookingDate');
        if (dateInput) {
            dateInput.min = tomorrow.toISOString().split('T')[0];
            // Set default to tomorrow
            dateInput.value = tomorrow.toISOString().split('T')[0];
        }
    }

    loadOrderSummary() {
        if (!this.checkoutData) return;

        const container = document.getElementById('checkout-items');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const serviceFeeEl = document.getElementById('checkout-service-fee');
        const discountEl = document.getElementById('checkout-discount');
        const discountRow = document.getElementById('checkout-discount-row');
        const totalEl = document.getElementById('checkout-total');

        // Render items
        container.innerHTML = this.checkoutData.items.map(item => `
            <div class="flex items-center space-x-3 pb-4 border-b border-gray-100">
                <img src="${item.image || 'https://via.placeholder.com/60x60/f472b6/ffffff?text=Spa'}" 
                     alt="${item.name}" 
                     class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-800 text-sm truncate">${item.name}</h4>
                    <p class="text-xs text-gray-500">SL: ${item.quantity}</p>
                </div>
                <div class="text-right">
                    <span class="font-semibold text-primary-300">${this.formatPrice(item.price * item.quantity)}</span>
                </div>
            </div>
        `).join('');

        // Update totals
        subtotalEl.textContent = this.formatPrice(this.checkoutData.subtotal);
        serviceFeeEl.textContent = this.formatPrice(this.checkoutData.serviceFee);
        
        if (this.checkoutData.discount > 0) {
            discountRow.style.display = 'flex';
            discountEl.textContent = '-' + this.formatPrice(this.checkoutData.discount);
        } else {
            discountRow.style.display = 'none';
        }
        
        totalEl.textContent = this.formatPrice(this.checkoutData.total);
    }

    setupPaymentMethods() {
        // Handle payment method selection styling
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', function() {
                // Remove active class from all options
                document.querySelectorAll('.payment-card').forEach(card => {
                    card.classList.remove('border-primary-300', 'bg-primary-50');
                    card.classList.add('border-gray-200');
                });
                
                // Add active class to selected option
                const card = this.querySelector('.payment-card');
                card.classList.add('border-primary-300', 'bg-primary-50');
                card.classList.remove('border-gray-200');
                
                // Check the radio button
                this.querySelector('input[type="radio"]').checked = true;
                
                // Trigger change event
                checkoutManager.handlePaymentMethodChange(this.querySelector('input[type="radio"]').value);
            });
        });

        // Set default selection
        document.querySelector('.payment-option input[checked]')?.closest('.payment-option').click();
    }

    handlePaymentMethodChange(method) {
        const detailsContainer = document.getElementById('payment-details');
        
        switch (method) {
            case 'transfer':
                detailsContainer.innerHTML = this.getBankTransferDetails();
                detailsContainer.classList.remove('hidden');
                break;
            case 'credit':
                detailsContainer.innerHTML = this.getCreditCardDetails();
                detailsContainer.classList.remove('hidden');
                break;
            case 'ewallet':
                detailsContainer.innerHTML = this.getEWalletDetails();
                detailsContainer.classList.remove('hidden');
                break;
            default:
                detailsContainer.classList.add('hidden');
                break;
        }
    }

    getBankTransferDetails() {
        return `
            <div class="bg-blue-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3">Thông Tin Chuyển Khoản</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Ngân hàng:</span>
                        <span class="font-medium">Vietcombank</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Số tài khoản:</span>
                        <span class="font-medium">1234567890</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Tên tài khoản:</span>
                        <span class="font-medium">EDORA</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Nội dung:</span>
                        <span class="font-medium">SPA [SỐ ĐIỆN THOẠI]</span>
                    </div>
                </div>
                <div class="mt-3 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    <p class="text-sm text-yellow-800">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Vui lòng chuyển khoản trong vòng 24h và giữ lại biên lai
                    </p>
                </div>
            </div>
        `;
    }

    getCreditCardDetails() {
        return `
            <div class="bg-secondary-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3">Thông Tin Thẻ</h4>
                <div class="space-y-4">
                    <div>
                        <label class="form-label">Số thẻ</label>
                        <input type="text" placeholder="1234 5678 9012 3456" 
                               class="form-input" maxlength="19">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Tháng/Năm</label>
                            <input type="text" placeholder="MM/YY" 
                                   class="form-input" maxlength="5">
                        </div>
                        <div>
                            <label class="form-label">CVV</label>
                            <input type="text" placeholder="123" 
                                   class="form-input" maxlength="3">
                        </div>
                    </div>
                    <div>
                        <label class="form-label">Tên trên thẻ</label>
                        <input type="text" placeholder="NGUYEN VAN A" 
                               class="form-input" style="text-transform: uppercase;">
                    </div>
                </div>
            </div>
        `;
    }

    getEWalletDetails() {
        return `
            <div class="bg-orange-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3">Chọn Ví Điện Tử</h4>
                <div class="grid grid-cols-3 gap-3">
                    <button class="ewallet-option p-3 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors" data-wallet="momo">
                        <div class="text-center">
                            <div class="w-8 h-8 bg-primary-500 rounded mx-auto mb-2 flex items-center justify-center">
                                <span class="text-white font-bold text-sm">M</span>
                            </div>
                            <span class="text-xs font-medium">MoMo</span>
                        </div>
                    </button>
                    <button class="ewallet-option p-3 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors" data-wallet="zalopay">
                        <div class="text-center">
                            <div class="w-8 h-8 bg-blue-500 rounded mx-auto mb-2 flex items-center justify-center">
                                <span class="text-white font-bold text-sm">Z</span>
                            </div>
                            <span class="text-xs font-medium">ZaloPay</span>
                        </div>
                    </button>
                    <button class="ewallet-option p-3 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors" data-wallet="vnpay">
                        <div class="text-center">
                            <div class="w-8 h-8 bg-red-500 rounded mx-auto mb-2 flex items-center justify-center">
                                <span class="text-white font-bold text-sm">V</span>
                            </div>
                            <span class="text-xs font-medium">VNPay</span>
                        </div>
                    </button>
                </div>
                <div class="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        Bạn sẽ được chuyển đến ứng dụng tương ứng để thanh toán
                    </p>
                </div>
            </div>
        `;
    }

    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        // Limit to 10 digits
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        
        // Format as XXX XXX XXXX
        if (value.length >= 6) {
            value = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6);
        } else if (value.length >= 3) {
            value = value.substring(0, 3) + ' ' + value.substring(3);
        }
        
        input.value = value;
    }

    validateEmail(input) {
        const email = input.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            input.setCustomValidity('Vui lòng nhập email hợp lệ');
            input.classList.add('border-red-500');
        } else {
            input.setCustomValidity('');
            input.classList.remove('border-red-500');
        }
    }

    loadUserData() {
        // Check if user is logged in
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (userData.fullName) {
            document.getElementById('fullName').value = userData.fullName;
        }
        if (userData.email) {
            document.getElementById('email').value = userData.email;
        }
        if (userData.phone) {
            document.getElementById('phone').value = userData.phone;
        }
        if (userData.address) {
            document.getElementById('address').value = userData.address;
        }
    }

    validateForm() {
        const requiredFields = [
            'fullName',
            'phone', 
            'email',
            'bookingDate',
            'bookingTime'
        ];

        let isValid = true;
        const errors = [];

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('border-red-500');
                errors.push(`${field.previousElementSibling.textContent.replace(' *', '')} là bắt buộc`);
            } else {
                field.classList.remove('border-red-500');
            }
        });

        // Validate phone number
        const phone = document.getElementById('phone').value.replace(/\s/g, '');
        if (phone && (phone.length !== 10 || !phone.startsWith('0'))) {
            isValid = false;
            document.getElementById('phone').classList.add('border-red-500');
            errors.push('Số điện thoại không hợp lệ');
        }

        // Validate email
        const email = document.getElementById('email').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            isValid = false;
            document.getElementById('email').classList.add('border-red-500');
            errors.push('Email không hợp lệ');
        }

        // Validate booking date
        const bookingDate = document.getElementById('bookingDate').value;
        if (bookingDate) {
            const selectedDate = new Date(bookingDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate <= today) {
                isValid = false;
                document.getElementById('bookingDate').classList.add('border-red-500');
                errors.push('Ngày hẹn phải từ ngày mai trở đi');
            }
        }

        // Validate terms agreement
        if (!document.getElementById('agreeTerms').checked) {
            isValid = false;
            errors.push('Vui lòng đồng ý với điều khoản dịch vụ');
        }

        if (!isValid) {
            showNotification(errors[0], 'error');
        }

        return isValid;
    }

    async processOrder() {
        if (!this.validateForm()) {
            return;
        }

        // Show loading
        document.querySelector('.loading-modal').classList.remove('hidden');
        
        try {
            // Collect form data
            const formData = new FormData(document.getElementById('checkout-form'));
            const orderData = {
                // Customer info
                fullName: formData.get('fullName'),
                phone: formData.get('phone').replace(/\s/g, ''),
                email: formData.get('email'),
                birthDate: formData.get('birthDate'),
                gender: formData.get('gender'),
                address: formData.get('address'),
                notes: formData.get('notes'),
                
                // Booking info
                bookingDate: formData.get('bookingDate'),
                bookingTime: formData.get('bookingTime'),
                staff: formData.get('staff'),
                
                // Payment info
                paymentMethod: formData.get('paymentMethod'),
                
                // Order details
                items: this.checkoutData.items,
                subtotal: this.checkoutData.subtotal,
                serviceFee: this.checkoutData.serviceFee,
                discount: this.checkoutData.discount || 0,
                total: this.checkoutData.total,
                appliedPromo: this.checkoutData.appliedPromo,
                
                // Additional info
                newsletter: formData.get('newsletter') === 'on',
                createdAt: new Date().toISOString(),
                orderId: this.generateOrderId()
            };

            // Simulate API call
            await this.submitOrder(orderData);
            
            // Save order to localStorage for confirmation page
            localStorage.setItem('lastOrder', JSON.stringify(orderData));
            
            // Clear cart and checkout data
            localStorage.removeItem('cart');
            localStorage.removeItem('checkoutData');
            
            // Hide loading
            document.querySelector('.loading-modal').classList.add('hidden');
            
            // Redirect to success page
            window.location.href = 'order-success.html';
            
        } catch (error) {
            console.error('Order submission error:', error);
            document.querySelector('.loading-modal').classList.add('hidden');
            showNotification('Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại!', 'error');
        }
    }

    async submitOrder(orderData) {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate success (95% success rate)
                if (Math.random() < 0.95) {
                    resolve(orderData);
                } else {
                    reject(new Error('Network error'));
                }
            }, 2000);
        });
    }

    generateOrderId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `SP${timestamp}${randomStr}`.toUpperCase();
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price).replace('₫', 'đ');
    }
}

// Initialize checkout manager
let checkoutManager;

document.addEventListener('DOMContentLoaded', function() {
    checkoutManager = new CheckoutManager();
    
    // Update cart count in header
    updateCartCount();
});

// Helper functions
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
}

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
    }, 4000);
}