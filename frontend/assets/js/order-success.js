// Order Success Page Functionality
class OrderSuccessManager {
    constructor() {
        this.orderData = null;
        this.init();
    }

    init() {
        this.loadOrderData();
        this.displayOrderInfo();
        
        // Initialize AOS
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
        
        // Update cart count
        this.updateCartCount();
        
        // Send confirmation email (simulated)
        this.sendConfirmationEmail();
    }

    loadOrderData() {
        this.orderData = JSON.parse(localStorage.getItem('lastOrder') || '{}');
        
        // If no order data, redirect to home
        if (!this.orderData.orderId) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
            return;
        }
    }

    displayOrderInfo() {
        if (!this.orderData) return;

        // Order details
        document.getElementById('order-id').textContent = this.orderData.orderId;
        document.getElementById('order-date').textContent = this.formatDate(new Date(this.orderData.createdAt));
        document.getElementById('order-total').textContent = this.formatPrice(this.orderData.total);
        document.getElementById('payment-method').textContent = this.getPaymentMethodText(this.orderData.paymentMethod);

        // Customer info
        document.getElementById('customer-name').textContent = this.orderData.fullName;
        document.getElementById('customer-phone').textContent = this.formatPhoneNumber(this.orderData.phone);
        document.getElementById('customer-email').textContent = this.orderData.email;

        // Booking info
        document.getElementById('booking-date').textContent = this.formatDate(new Date(this.orderData.bookingDate));
        document.getElementById('booking-time').textContent = this.formatBookingTime(this.orderData.bookingTime);
        
        if (this.orderData.staff) {
            document.getElementById('booking-staff').textContent = this.getStaffName(this.orderData.staff);
        }

        // Services
        this.displayServices();
    }

    displayServices() {
        const container = document.getElementById('ordered-services');
        if (!container || !this.orderData.items) return;

        container.innerHTML = this.orderData.items.map(item => `
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
                <span class="font-semibold text-primary-300">${this.formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join('');
    }

    getPaymentMethodText(method) {
        const methods = {
            'cash': 'Tiền mặt',
            'transfer': 'Chuyển khoản',
            'credit': 'Thẻ tín dụng',
            'ewallet': 'Ví điện tử'
        };
        return methods[method] || 'Không xác định';
    }

    getStaffName(staffId) {
        const staffNames = {
            'staff1': 'Chị Hương - Chuyên gia massage',
            'staff2': 'Chị Lan - Chuyên viên chăm sóc da',
            'staff3': 'Chị Phương - Chuyên gia trị liệu',
            'staff4': 'Chị Mai - Chuyên viên tóc'
        };
        return staffNames[staffId] || 'Tự động chọn';
    }

    formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        return date.toLocaleDateString('vi-VN', options);
    }

    formatBookingTime(timeSlot) {
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

    formatPhoneNumber(phone) {
        if (!phone) return '';
        
        // Remove all non-digits
        const cleaned = phone.toString().replace(/\D/g, '');
        
        // Format as XXX XXX XXXX
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        }
        
        return phone;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price).replace('₫', 'đ');
    }

    updateCartCount() {
        // Cart should be empty after successful order
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = '0';
        });
    }

    async sendConfirmationEmail() {
        try {
            // Simulate sending confirmation email
            const emailData = {
                to: this.orderData.email,
                subject: `Xác nhận đặt lịch - ${this.orderData.orderId}`,
                orderData: this.orderData
            };

            // In real application, this would call an API
            console.log('Sending confirmation email:', emailData);
            
            // Show success message after delay
            setTimeout(() => {
                this.showEmailConfirmation();
            }, 3000);
            
        } catch (error) {
            console.error('Error sending confirmation email:', error);
        }
    }

    showEmailConfirmation() {
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
    saveOrderToHistory() {
        const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        orderHistory.unshift(this.orderData);
        
        // Keep only last 10 orders
        if (orderHistory.length > 10) {
            orderHistory.splice(10);
        }
        
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    }
}

// Initialize order success manager
let orderSuccessManager;

document.addEventListener('DOMContentLoaded', function() {
    orderSuccessManager = new OrderSuccessManager();
    
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