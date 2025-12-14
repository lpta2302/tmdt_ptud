# Chức năng Đặt Lịch (Booking) - Hướng Dẫn

## Tổng Quan

Chức năng đặt lịch đã được hoàn thiện với các tính năng:

✅ **Tích hợp Backend API** - Kết nối với API `/api/bookings`
✅ **Pre-select Service** - Chọn sẵn dịch vụ từ URL parameters
✅ **Authentication** - Yêu cầu đăng nhập để đặt lịch
✅ **Auto-fill User Info** - Tự động điền thông tin nếu đã đăng nhập
✅ **Validation** - Kiểm tra dữ liệu đầy đủ trước khi submit
✅ **Dynamic Service Loading** - Tải danh sách dịch vụ từ API

## Cách Sử Dụng

### 1. Đặt lịch trực tiếp
Truy cập: `booking.html`
- Khách hàng chọn dịch vụ từ dropdown
- Điền thông tin cá nhân
- Chọn ngày và giờ hẹn
- Submit form

### 2. Đặt lịch với service được chọn sẵn
Truy cập: `booking.html?service=massage-toan-than`
- Dịch vụ sẽ được chọn sẵn
- Hiển thị thông tin dịch vụ ngay lập tức
- Khách hàng chỉ cần điền thông tin và xác nhận

### 3. Thêm nút "Đặt Lịch" vào trang khác

```html
<!-- Nút đặt lịch với service cụ thể -->
<a href="booking.html?service=massage-toan-than" 
   class="btn-primary">
   Đặt Lịch Ngay
</a>

<!-- Hoặc dùng data attribute -->
<button data-booking-service="massage-toan-than">
   Đặt Lịch
</button>

<script type="module">
import { initializeServiceBooking } from './assets/js/booking-helper.js';
initializeServiceBooking();
</script>
```

## Cấu Trúc Files

```
frontend/
├── booking.html                      # Trang đặt lịch
└── assets/
    └── js/
        ├── booking.js               # Logic chính đặt lịch
        ├── booking-helper.js        # Helper functions
        └── config.js                # API configuration
```

## API Endpoints Sử Dụng

### 1. Load Services
```
GET /api/products?category=services
```

### 2. Create Booking
```
POST /api/bookings
Body: {
  customerId: string,
  services: [{
    product: string,
    quantity: number,
    price: number
  }],
  appointmentDate: string,
  appointmentTime: string,
  notes: string,
  totalAmount: number
}
```

## Flow Đặt Lịch

### Flow 1: User đã đăng nhập
```
1. User truy cập booking.html
2. System load services từ API
3. System pre-fill user info
4. User chọn service (hoặc đã được chọn từ URL)
5. User điền ngày/giờ và notes
6. Submit → API creates booking
7. Show success modal
```

### Flow 2: User chưa đăng nhập
```
1. User truy cập booking.html
2. System load services từ API
3. User điền form và submit
4. System lưu pending booking vào localStorage
5. Redirect to login.html?redirect=booking.html
6. User đăng nhập thành công
7. Redirect về booking.html với service đã chọn
8. Auto-submit booking
```

## Validation Rules

### Personal Info
- **Họ tên**: Bắt buộc
- **Email**: Bắt buộc, định dạng email hợp lệ
- **Số điện thoại**: Bắt buộc, định dạng VN (0xxxxxxxxx hoặc +84xxxxxxxxx)

### Booking Info
- **Dịch vụ**: Bắt buộc
- **Ngày hẹn**: Bắt buộc, không được trong quá khứ
- **Giờ hẹn**: Bắt buộc
- **Ghi chú**: Không bắt buộc

## Customization

### Thay đổi API Base URL
File: `frontend/assets/js/config.js`
```javascript
export const API_BASE = 'http://localhost:3000/api';
```

### Thêm service mới
Services được load tự động từ API `/api/products?category=services`

Nếu API không hoạt động, system sẽ fallback về sample data trong `booking.js`:
```javascript
function loadSampleServices() {
    services = {
        'service-id': {
            id: 'service-id',
            name: 'Tên Dịch Vụ',
            price: '850.000đ',
            priceValue: 850000,
            duration: '90 phút',
            description: 'Mô tả',
            image: 'url'
        }
    };
}
```

### Custom Error Messages
File: `frontend/assets/js/booking.js`
```javascript
function showError(message) {
    // Implement custom error modal
    alert(message); // Default implementation
}
```

## Testing

### Test Cases
1. ✅ Load trang booking.html trực tiếp
2. ✅ Load với URL parameter: booking.html?service=massage-toan-than
3. ✅ Submit form khi đã đăng nhập
4. ✅ Submit form khi chưa đăng nhập (redirect to login)
5. ✅ Validation các trường bắt buộc
6. ✅ Validation format email và phone
7. ✅ Validation date không trong quá khứ

### Test với Backend
```bash
# Start backend server
cd backend
npm start

# Backend should be running on http://localhost:3000
```

### Test không có Backend
- System sẽ tự động fallback về sample services
- Không thể submit booking thực tế

## Troubleshooting

### Problem: Trang trắng khi load booking.html
**Solution:**
- Kiểm tra console có lỗi JavaScript không
- Đảm bảo tất cả file JS được load đúng
- Kiểm tra `booking.js` được import với `type="module"`

### Problem: Services không hiển thị
**Solution:**
- Kiểm tra API `/api/products` có hoạt động không
- Kiểm tra response data có đúng format không
- System sẽ fallback về sample data nếu API fail

### Problem: Submit booking không hoạt động
**Solution:**
- Kiểm tra user đã đăng nhập chưa (localStorage `user`)
- Kiểm tra API endpoint `/api/bookings`
- Check console log để xem error message

### Problem: Modal không hiển thị đúng
**Solution:**
- Modal đã được fix CSS: remove conflict giữa `hidden` và `flex`
- Đảm bảo modal có inline style `align-items` và `justify-content`

## Tích hợp với Pages khác

### Trang Services (services.html)
```javascript
import { createBookingLink } from './assets/js/booking-helper.js';

// Thêm vào service cards
serviceCard.innerHTML = `
    ...
    <a href="${createBookingLink(service.id)}" class="btn-primary">
        Đặt Lịch Ngay
    </a>
`;
```

### Trang Product Detail (product-detail.html)
```javascript
// Nút booking trong chi tiết sản phẩm
<a href="booking.html?service=${productId}" class="btn-primary">
    Đặt Lịch Dịch Vụ Này
</a>
```

### Sau khi Login (login.js)
```javascript
import { processPendingBooking } from './booking-helper.js';

// Sau khi login thành công
async function handleLoginSuccess() {
    // ... save user to localStorage
    
    // Check và xử lý pending booking
    processPendingBooking();
}
```

## Roadmap / Cải tiến tương lai

- [ ] Real-time slot availability check
- [ ] Multiple services selection
- [ ] Promo code / discount
- [ ] Booking history page
- [ ] Cancel/reschedule booking
- [ ] Email/SMS confirmation
- [ ] Calendar view for slot selection
- [ ] Staff selection
- [ ] Recurring appointments

## Support

Nếu có vấn đề, vui lòng:
1. Check console logs
2. Check Network tab trong DevTools
3. Verify API endpoints
4. Check authentication status
