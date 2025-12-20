function init() {
    loadOrderData();
    displayOrderInfo();
    
    // Khởi tạo AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });
    
    // Cập nhật số lượng giỏ hàng
    updateCartCount();
    
    // Gửi email xác nhận (được mô phỏng)
    sendConfirmationEmail();
}

function loadOrderData() {
    orderData = JSON.parse(localStorage.getItem('lastOrder') || '{}');
    
    // Nếu không có dữ liệu đơn hàng, chuyển về trang chủ
    if (!orderData.orderId) {
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        return;
    }
}

function displayOrderInfo() {
    if (!orderData) return;

    // Chi tiết đơn hàng
    document.getElementById('order-id').textContent = orderData.orderId;
    document.getElementById('order-date').textContent = formatDate(new Date(orderData.createdAt));
    document.getElementById('order-total').textContent = formatPrice(orderData.total);
    document.getElementById('payment-method').textContent = getPaymentMethodText(orderData.paymentMethod);

    // Thông tin khách hàng
    document.getElementById('customer-name').textContent = orderData.fullName;
    document.getElementById('customer-phone').textContent = formatPhoneNumber(orderData.phone);
    document.getElementById('customer-email').textContent = orderData.email;

    // Thông tin đặt lịch
    document.getElementById('booking-date').textContent = formatDate(new Date(orderData.bookingDate));
    document.getElementById('booking-time').textContent = formatBookingTime(orderData.bookingTime);
    
    if (orderData.staff) {
        document.getElementById('booking-staff').textContent = getStaffName(orderData.staff);
    }

    // Services
    displayServices();
}

function displayServices() {
    const container = document.getElementById('ordered-services');
    if (!container || !orderData.items) return;

    container.innerHTML = orderData.items.map(item => `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center space-x-3">
                <img src="${item.image || 'https://via.placeholder.com/40x40/f472b6/ffffff?text=Spa'}" 
                     alt="${item.name}" 
                     class="w-10 h-10 rounded-lg object-cover">
                <div>
                    <h4 class="font-medium text-gray-800 text-sm">${item.name}</h4>
                    <p class="text-xs text-gray-500">Số lượng: ${item.quantity}</p>
                </div>
            </div>
            <span class="font-semibold text-primary-300">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');
}

function getPaymentMethodText(method) {
    const methods = {
        'cash': 'Tiền mặt',
        'transfer': 'Chuyển khoản',
        'credit': 'Thẻ tín dụng',
        'ewallet': 'Ví điện tử'
    };
    return methods[method] || 'Không xác định';
}

function getStaffName(staffId) {
    const staffNames = {
        'staff1': 'Chị Hương - Chuyên gia massage',
        'staff2': 'Chị Lan - Chuyên viên chăm sóc da',
        'staff3': 'Chị Phương - Chuyên gia trị liệu',
        'staff4': 'Chị Mai - Chuyên viên tóc'
    };
    return staffNames[staffId] || 'Tự động chọn';
}

function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('vi-VN', options);
}

function formatBookingTime(timeSlot) {
    const timeSlots = {
        '08:00': '08:00 - 10:00',
        '10:00': '10:00 - 12:00',
        '12:00': '12:00 - 14:00',
        '14:00': '14:00 - 16:00',
        '16:00': '16:00 - 18:00',
        '18:00': '18:00 - 20:00',
        '20:00': '20:00 - 22:00'
    };
    return timeSlots[timeSlot] || timeSlot;
}

function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digits
    const cleaned = phone.toString().replace(/\D/g, '');
    
    // Format as XXX XXX XXXX
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    
    return phone;
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price).replace('₫', 'đ');
}

function updateCartCount() {
    // Cart should be empty after successful order
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = '0';
    });
}

async function sendConfirmationEmail() {
    try {
        // Simulate sending confirmation email
        const emailData = {
            to: orderData.email,
            subject: `Xác nhận đặt lịch - ${orderData.orderId}`,
            orderData: orderData
        };

        // In real application, this would call an API
        console.log('Sending confirmation email:', emailData);
        
        // Show success message after delay
        setTimeout(() => {
            showEmailConfirmation();
        }, 3000);
        
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
}

function showEmailConfirmation() {
    // Create and show email confirmation notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-4 z-50 px-6 py-4 bg-blue-500 text-white rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300';
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-envelope"></i>
            <div>
                <p class="font-medium">Email xác nhận đã được gửi!</p>
                <p class="text-sm opacity-90">Vui lòng kiểm tra hộp thư của bạn</p>
            </div>
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
    }, 5000);
}

// Method to save order data for future reference
function saveOrderToHistory() {
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    orderHistory.unshift(orderData);
    
    // Keep only last 10 orders
    if (orderHistory.length > 10) {
        orderHistory.splice(10);
    }
    
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
}

// Initialize order success manager
let orderSuccessManager;

document.addEventListener('DOMContentLoaded', function() {
    init();    
    // Save order to history
    orderSuccessManager.saveOrderToHistory();
    
    // Add print styles for print button
    addPrintStyles();
    
    // Auto redirect after 5 minutes of inactivity
    setTimeout(() => {
        if (confirm('Bạn có muốn về trang chủ không?')) {
            window.location.href = 'index.html';
        }
    }, 300000); // 5 minutes
});

// Add print-specific styles
function addPrintStyles() {
    const printStyles = `
        <style>
            @media print {
                .no-print { display: none !important; }
                body { background: white !important; }
                .bg-gradient-to-br { background: white !important; }
                .bg-gradient-to-r { background: white !important; }
                .text-transparent { -webkit-text-fill-color: initial !important; }
                .shadow-lg { box-shadow: none !important; }
                header, footer { display: none !important; }
                .container { max-width: none !important; padding: 0 !important; }
                .back-to-top { display: none !important; }
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', printStyles);
}