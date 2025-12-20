// Các hàm hỗ trợ đặt lịch

/**
 * Kiểm tra và xử lý đơn đặt lịch chờ sau khi đăng nhập
 * Gọi hàm này trong login.js sau khi đăng nhập thành công
 */
export function processPendingBooking() {
    const pendingBooking = localStorage.getItem('pendingBooking');
    
    if (pendingBooking) {
        try {
            const bookingData = JSON.parse(pendingBooking);
            
            // Xây dựng URL quay lại với tham số dịch vụ nếu có
            let returnUrl = 'booking.html';
            if (bookingData.service) {
                returnUrl += `?service=${bookingData.service}`;
            }
            
            // Chuyển hướng đến trang đặt lịch
            window.location.href = returnUrl;
            
        } catch (error) {
            console.error('Lỗi khi xử lý đơn đặt lịch chờ:', error);
            localStorage.removeItem('pendingBooking');
        }
    }
}

/**
 * Tạo liên kết đặt lịch với dịch vụ được chọn trước
 * @param {string} serviceId - ID hoặc slug của dịch vụ
 * @returns {string} URL đặt lịch với tham số dịch vụ
 */
export function createBookingLink(serviceId) {
    return `booking.html?service=${serviceId}`;
}

/**
 * Thêm chức năng "Đặt lịch ngay" cho các thẻ dịch vụ
 * Gọi hàm này ở các trang hiển thị dịch vụ (ví dụ: services.html, index.html)
 */
export function initializeServiceBooking() {
    // Tìm tất cả các nút đặt lịch
    const bookingButtons = document.querySelectorAll('[data-booking-service]');
    
    bookingButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const serviceId = this.getAttribute('data-booking-service');
            
            if (serviceId) {
                window.location.href = createBookingLink(serviceId);
            } else {
                window.location.href = 'booking.html';
            }
        });
    });
}

/**
 * Format booking data for display
 * @param {Object} booking - Booking object from API
 * @returns {Object} Formatted booking data
 */
export function formatBookingDisplay(booking) {
    return {
        id: booking._id || booking.id,
        date: new Date(booking.appointmentDate).toLocaleDateString('vi-VN'),
        time: booking.appointmentTime,
        serviceName: booking.services?.[0]?.product?.name || 'Dịch vụ',
        totalAmount: new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(booking.totalAmount || 0),
        status: getStatusText(booking.status),
        statusClass: getStatusClass(booking.status),
        paymentStatus: getPaymentStatusText(booking.paymentStatus),
        paymentStatusClass: getPaymentStatusClass(booking.paymentStatus)
    };
}

/**
 * Get status text in Vietnamese
 */
function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'in_progress': 'Đang thực hiện',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
}

/**
 * Get status CSS class
 */
function getStatusClass(status) {
    const classMap = {
        'pending': 'text-yellow-600 bg-yellow-50',
        'confirmed': 'text-blue-600 bg-blue-50',
        'in_progress': 'text-purple-600 bg-purple-50',
        'completed': 'text-green-600 bg-green-50',
        'cancelled': 'text-red-600 bg-red-50'
    };
    return classMap[status] || 'text-gray-600 bg-gray-50';
}

/**
 * Get payment status text in Vietnamese
 */
function getPaymentStatusText(status) {
    const statusMap = {
        'pending': 'Chưa thanh toán',
        'paid': 'Đã thanh toán',
        'refunded': 'Đã hoàn tiền'
    };
    return statusMap[status] || status;
}

/**
 * Get payment status CSS class
 */
function getPaymentStatusClass(status) {
    const classMap = {
        'pending': 'text-orange-600 bg-orange-50',
        'paid': 'text-green-600 bg-green-50',
        'refunded': 'text-blue-600 bg-blue-50'
    };
    return classMap[status] || 'text-gray-600 bg-gray-50';
}

/**
 * Validate booking time slot availability
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format
 * @returns {boolean} True if slot is available
 */
export async function checkTimeSlotAvailability(date, time) {
    // This would normally check with the backend
    // For now, return true (all slots available)
    return true;
}
