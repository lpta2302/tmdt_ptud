// Khởi tạo quản lý thanh toán
let checkoutManager;

function init() {
    loadCheckoutData();
    bindEvents();
    setMinDate();
    loadOrderSummary();
    setupPaymentMethods();
    
    // Khởi tạo AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });
}

function loadCheckoutData() {
    checkoutData = JSON.parse(localStorage.getItem('checkoutData') || '{}');
    
    // Nếu không có dữ liệu, chuyển về giỏ hàng
    if (!checkoutData.items || checkoutData.items.length === 0) {
        showNotification('Không có sản phẩm trong giỏ hàng', 'warning');
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 2000);
        return;
    }
}

function bindEvents() {
    // Gửi biểu mẫu
    document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        processOrder();
    });

    // Thay đổi phương thức thanh toán
    document.querySelectorAll('.payment-radio').forEach(radio => {
        radio.addEventListener('change', (e) => {
            handlePaymentMethodChange(e.target.value);
        });
    });

    // Định dạng số điện thoại
    document.getElementById('phone')?.addEventListener('input', (e) => {
        formatPhoneNumber(e.target);
    });

    // Kiểm tra email
    document.getElementById('email')?.addEventListener('blur', (e) => {
        validateEmail(e.target);
    });

    // Tự động điền thông tin nếu đã đăng nhập
    loadUserData();
}

function setMinDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.min = tomorrow.toISOString().split('T')[0];
        // Đặt mặc định là ngày mai
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
}

function loadOrderSummary() {
    if (!checkoutData) return;

    // Hiển thị các mục trong khu vực chính
    renderCheckoutItems();
    
    // Cập nhật tổng tiền trong sidebar
    const subtotalEl = document.getElementById('checkout-subtotal');
    const serviceFeeEl = document.getElementById('checkout-service-fee');
    const discountEl = document.getElementById('checkout-discount');
    const discountRow = document.getElementById('checkout-discount-row');
    const totalEl = document.getElementById('checkout-total');

    // Cập nhật các tổng tiền
    subtotalEl.textContent = formatPrice(checkoutData.subtotal);
    serviceFeeEl.textContent = formatPrice(0);
    
    if (checkoutData.discount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = '-' + formatPrice(checkoutData.discount);
    } else {
        discountRow.style.display = 'none';
    }
    
    totalEl.textContent = formatPrice(checkoutData.total);
}

function renderCheckoutItems() {
    const container = document.getElementById('checkout-items-display');
    if (!container) return;
    
    container.innerHTML = checkoutData.items.map(item => {
        // Kiểm tra nếu là booking item
        if (item.type === 'booking' && item.services && item.services.length > 0) {
            const date = new Date(item.appointmentDate);
            const formattedDate = date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            return `
                <div class="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="fas fa-calendar-alt text-primary-500"></i>
                        <h3 class="font-semibold text-gray-800">Đặt lịch dịch vụ</h3>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span><i class="fas fa-calendar mr-1"></i>${formattedDate}</span>
                        <span><i class="fas fa-clock mr-1"></i>${item.appointmentTime}</span>
                    </div>
                    
                    <div class="space-y-2 mb-3">
                        <p class="text-sm font-medium text-gray-700">
                            <i class="fas fa-spa mr-1"></i>
                            Dịch vụ (${item.services.length}):
                        </p>
                        <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            ${item.services.map(service => `
                                <div class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                    ${service.image ? `
                                        <img src="${getImageUrl(service.image)}" 
                                             alt="${service.name}" 
                                             class="w-12 h-12 object-cover rounded-lg flex-shrink-0">
                                    ` : ''}
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-gray-800 truncate">${service.name}</p>
                                        <p class="text-xs text-primary-500">${formatPrice(service.price)}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    ${item.notes ? `
                        <div class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p class="text-xs text-gray-700">
                                <i class="fas fa-comment mr-1 text-yellow-600"></i>
                                <span class="font-medium">Ghi chú:</span> ${item.notes}
                            </p>
                        </div>
                    ` : ''}
                    
                    <div class="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span class="text-sm text-gray-600">Tổng cộng:</span>
                        <span class="text-lg font-bold text-primary-500">${formatPrice(item.totalAmount)}</span>
                    </div>
                </div>
            `;
        }
        
        // Regular product item
        return `
            <div class="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                <img src="${item.image || 'https://via.placeholder.com/80x80/f472b6/ffffff?text=Spa'}" 
                     alt="${item.name}" 
                     class="w-20 h-20 rounded-lg object-cover flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-gray-800 mb-1 truncate">${item.name}</h4>
                    <p class="text-sm text-gray-600 mb-2">${item.category || 'Dịch vụ spa'}</p>
                    <div class="flex items-center gap-4">
                        <span class="text-lg font-bold text-primary-500">${formatPrice(item.price)}</span>
                        ${item.quantity > 1 ? `<span class="text-sm text-gray-500">x ${item.quantity}</span>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xl font-bold text-gray-800">
                        ${formatPrice(item.price * (item.quantity || 1))}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getImageUrl(image) {
    // Helper function to construct image URL
    if (image.startsWith('http')) return image;
    return `http://localhost:3000/api/files/${image}`;
}

function setupPaymentMethods() {
    // Handle payment method selection styling
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            document.querySelectorAll('.payment-card').forEach(card => {
                card.classList.remove('border-primary-300', 'bg-primary-50');
                card.classList.add('border-gray-200');
            });
            
            // Add active class to selected option
            const card = option.querySelector('.payment-card');
            card.classList.add('border-primary-300', 'bg-primary-50');
            card.classList.remove('border-gray-200');
            
            // Check the radio button
            document.querySelector('input[type="radio"]').checked = false;
            
            // Trigger change event
            handlePaymentMethodChange(document.querySelector('input[type="radio"]').value);
        });
    });

    // Set default selection
    document.querySelector('.payment-option input[checked]')?.closest('.payment-option').click();
}

function handlePaymentMethodChange(method) {
    const detailsContainer = document.getElementById('payment-details');
    
    switch (method) {
        case 'transfer':
            detailsContainer.innerHTML = getBankTransferDetails();
            detailsContainer.classList.remove('hidden');
            break;
        case 'credit':
            detailsContainer.innerHTML = getCreditCardDetails();
            detailsContainer.classList.remove('hidden');
            break;
        case 'ewallet':
            detailsContainer.innerHTML = getEWalletDetails();
            detailsContainer.classList.remove('hidden');
            break;
        default:
            detailsContainer.classList.add('hidden');
            break;
    }
}

function getBankTransferDetails() {
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

function getCreditCardDetails() {
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

function getEWalletDetails() {
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

function formatPhoneNumber(input) {
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

function validateEmail(input) {
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

function loadUserData() {
    // Check if user is logged in
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (userData.firstName && userData.lastName) {
        document.getElementById('fullName').value = `${userData.firstName} ${userData.lastName}`;
    }
    if (userData.email) {
        document.getElementById('email').value = userData.email;
    }
    if (userData.phone) {
        document.getElementById('phone').value = userData.phone;
    }
}

function validateForm() {
    const requiredFields = [
        'fullName',
        'phone', 
        'email',
    ];

    let isValid = true;
    const errors = [];

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field?.value?.trim()) {
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

async function processOrder() {
    if (!validateForm()) {
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
            notes: formData.get('notes'),
            
            // Booking info
            bookingDate: formData.get('bookingDate'),
            bookingTime: formData.get('bookingTime'),
            staff: formData.get('staff'),
            
            // Payment info
            paymentMethod: formData.get('paymentMethod'),
            
            // Order details
            items: checkoutData.items,
            subtotal: checkoutData.subtotal,
            serviceFee: checkoutData.serviceFee,
            discount: checkoutData.discount || 0,
            total: checkoutData.total,
            appliedPromo: checkoutData.appliedPromo,
            
            // Additional info
            newsletter: formData.get('newsletter') === 'on',
            createdAt: new Date().toISOString(),
            orderId: generateOrderId()
        };

        // Simulate API call
        await submitOrder(orderData);
        
        // Save order to localStorage for confirmation page
        localStorage.setItem('lastOrder', JSON.stringify(orderData));
        
        // Clear cart and checkout data
        const newCart = JSON.parse(localStorage.getItem('cart') || '[]').filter(cartItem => {
            return !checkoutData.items.some(checkedOutItem => checkedOutItem.id === cartItem.id);
        });
        localStorage.setItem('cart', JSON.stringify(newCart));
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

async function submitOrder(orderData) {
    console.log("🚀 ~ submitOrder ~ orderData:", orderData)
    
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

function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `SP${timestamp}${randomStr}`.toUpperCase();
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price).replace('₫', 'đ');
}

document.addEventListener('DOMContentLoaded', function() {
    init();
    // Update cart count in header
    updateCartCount();
});

// Helper functions
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.length;
    
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