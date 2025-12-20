// Import các module cần thiết
import { API_BASE } from './config.js';
import { getCurrentUser, isAuthenticated, requireAuth } from './auth-helper.js';

// Biến toàn cục
let currentUser = null;
let isEditMode = false;
let originalFormData = {};

// Khởi tạo trang
document.addEventListener('DOMContentLoaded', async function () {
    // Yêu cầu đăng nhập
    if (!isAuthenticated()) {
        requireAuth('profile.html');
        return;
    }

    // Khởi tạo AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100
    });

    // Lấy thông tin người dùng
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Load dữ liệu
    await loadUserProfile();
    loadFavorites();
    loadRecentlyViewed();
    loadBookings();

    // Setup event listeners
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
}

// Load thông tin người dùng
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/customers/${currentUser._id}/profile`);
        
        if (!response.ok) {
            throw new Error('Không thể tải thông tin người dùng');
        }

        const data = await response.json();
        const user = data.customer || data;

        // Cập nhật sidebar
        document.getElementById('sidebar-user-name').textContent = `${user.firstName} ${user.lastName}` || 'Người dùng';
        document.getElementById('sidebar-user-email').textContent = user.email || '';

        // Cập nhật form
        document.getElementById('name').value = `${user.firstName} ${user.lastName}` || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('address').value = user.address || '';
        document.getElementById('gender').value = user.gender || '';
        
        if (user.dateOfBirth) {
            const date = new Date(user.dateOfBirth);
            document.getElementById('dateOfBirth').value = date.toISOString().split('T')[0];
        }

        // Lưu dữ liệu gốc
        saveOriginalFormData();

    } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
        showNotification('Không thể tải thông tin người dùng', 'error');
    }
}

// Lưu dữ liệu form gốc
function saveOriginalFormData() {
    originalFormData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        gender: document.getElementById('gender').value,
        dateOfBirth: document.getElementById('dateOfBirth').value
    };
}

// Chuyển đổi chế độ chỉnh sửa
window.toggleEditMode = function () {
    isEditMode = !isEditMode;
    const inputs = ['name', 'phone', 'address', 'dateOfBirth'];
    const gender = document.getElementById('gender');
    const formActions = document.getElementById('form-actions');
    const editBtn = document.getElementById('edit-profile-btn');

    if (isEditMode) {
        // Bật chế độ chỉnh sửa
        inputs.forEach(id => {
            document.getElementById(id).removeAttribute('readonly');
        });
        gender.removeAttribute('disabled');
        formActions.classList.remove('hidden');
        editBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Hủy';
    } else {
        // Tắt chế độ chỉnh sửa
        cancelEdit();
    }
};

// Hủy chỉnh sửa
window.cancelEdit = function () {
    isEditMode = false;
    const inputs = ['name', 'phone', 'address', 'dateOfBirth'];
    const gender = document.getElementById('gender');
    const formActions = document.getElementById('form-actions');
    const editBtn = document.getElementById('edit-profile-btn');

    // Khôi phục dữ liệu gốc
    document.getElementById('name').value = originalFormData.name;
    document.getElementById('phone').value = originalFormData.phone;
    document.getElementById('address').value = originalFormData.address;
    document.getElementById('gender').value = originalFormData.gender;
    document.getElementById('dateOfBirth').value = originalFormData.dateOfBirth;

    // Disable inputs
    inputs.forEach(id => {
        document.getElementById(id).setAttribute('readonly', true);
    });
    gender.setAttribute('disabled', true);
    formActions.classList.add('hidden');
    editBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Chỉnh Sửa';
};

// Xử lý cập nhật profile
async function handleProfileUpdate(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        gender: document.getElementById('gender').value,
        dateOfBirth: document.getElementById('dateOfBirth').value
    };

    // Validation
    if (!formData.name) {
        showNotification('Vui lòng nhập họ tên', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/customers/${currentUser._id}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật thông tin');
        }

        const data = await response.json();

        // Cập nhật localStorage
        const updatedUser = { ...currentUser, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        currentUser = updatedUser;

        // Cập nhật lại form
        saveOriginalFormData();
        cancelEdit();

        showNotification('Cập nhật thông tin thành công!', 'success');

    } catch (error) {
        console.error('Lỗi khi cập nhật profile:', error);
        showNotification('Không thể cập nhật thông tin', 'error');
    }
}

// Load danh sách yêu thích
function loadFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="col-span-2 text-center py-12">
                <i class="fas fa-heart text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Bạn chưa có dịch vụ yêu thích nào</p>
                <a href="services.html" class="inline-block mt-4 px-6 py-3 text-white rounded-lg" style="background: var(--gradient-primary);">
                    Khám Phá Dịch Vụ
                </a>
            </div>
        `;
        return;
    }

    // Render danh sách yêu thích
    favoritesList.innerHTML = favorites.map(service => `
        <div class="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all">
            <div class="flex items-start space-x-4">
                <img src="${service.image || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100&h=100&fit=crop'}" 
                    alt="${service.name}" class="w-20 h-20 object-cover rounded-lg">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800 mb-1">${service.name}</h3>
                    <p class="text-primary-500 font-semibold mb-2">${formatPrice(service.price)}</p>
                    <div class="flex gap-2">
                        <button onclick="viewService('${service._id}')" class="text-sm px-3 py-1 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors">
                            <i class="fas fa-eye mr-1"></i>Xem
                        </button>
                        <button onclick="removeFavorite('${service._id}')" class="text-sm px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                            <i class="fas fa-heart-broken mr-1"></i>Bỏ Thích
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load danh sách đã xem
function loadRecentlyViewed() {
    const viewedList = document.getElementById('viewed-list');
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

    if (viewed.length === 0) {
        viewedList.innerHTML = `
            <div class="col-span-2 text-center py-12">
                <i class="fas fa-history text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Bạn chưa xem dịch vụ nào gần đây</p>
                <a href="services.html" class="inline-block mt-4 px-6 py-3 text-white rounded-lg" style="background: var(--gradient-primary);">
                    Khám Phá Dịch Vụ
                </a>
            </div>
        `;
        return;
    }

    // Render danh sách đã xem (giới hạn 10 items mới nhất)
    viewedList.innerHTML = viewed.slice(0, 10).map(service => `
        <div class="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all">
            <div class="flex items-start space-x-4">
                <img src="${service.image || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100&h=100&fit=crop'}" 
                    alt="${service.name}" class="w-20 h-20 object-cover rounded-lg">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800 mb-1">${service.name}</h3>
                    <p class="text-primary-500 font-semibold mb-2">${formatPrice(service.price)}</p>
                    <p class="text-xs text-gray-500 mb-2">
                        <i class="far fa-clock mr-1"></i>${formatTimeAgo(service.viewedAt)}
                    </p>
                    <button onclick="viewService('${service._id}')" class="text-sm px-3 py-1 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors">
                        <i class="fas fa-eye mr-1"></i>Xem Lại
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load danh sách lịch đặt
async function loadBookings() {
    const bookingsList = document.getElementById('bookings-list');
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Lọc các booking items
    const bookings = cart.filter(item => item.type === 'booking');

    if (bookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Bạn chưa có lịch đặt nào</p>
                <a href="booking.html" class="inline-block mt-4 px-6 py-3 text-white rounded-lg" style="background: var(--gradient-primary);">
                    Đặt Lịch Ngay
                </a>
            </div>
        `;
        return;
    }

    bookingsList.innerHTML = bookings.map(booking => {
        console.log("🚀 ~ loadBookings ~ booking:", booking)
        return `
        <div class="border border-gray-200 rounded-xl p-6 mb-4 hover:shadow-lg transition-all">
            <div class="flex items-start justify-between mb-4">
                <div>
                    <h3 class="font-semibold text-gray-800 text-lg mb-2">Đặt lịch #${booking.id}</h3>
                    <p class="text-sm text-gray-500">
                        <i class="far fa-calendar mr-1"></i>${booking.appointmentDate || 'Chưa xác định'}
                        <span class="mx-2">•</span>
                        <i class="far fa-clock mr-1"></i>${booking.appointmentTime || 'Chưa xác định'}
                    </p>
                </div>
                <span class="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">Chờ xác nhận</span>
            </div>
            
            <div class="space-y-2 mb-4">
                ${booking.services.map(service => `
                    <div class="flex items-center justify-between py-2 border-b border-gray-100">
                        <span class="text-gray-700">${service.name}</span>
                        <span class="text-primary-500 font-semibold">${formatPrice(service.price)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                <span class="font-semibold text-gray-800">Tổng cộng:</span>
                <span class="text-xl font-bold text-primary-500">${formatPrice(booking.totalAmount)}</span>
            </div>
        </div>
    `;
    }).join('');
}

// Chuyển tab
window.switchTab = function (tabName) {
    // Ẩn tất cả tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('active');
    });

    // Bỏ active tất cả nav buttons
    document.querySelectorAll('.tab-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('bg-primary-50', 'text-primary-600', 'font-semibold');
        btn.classList.add('text-gray-600');
    });

    // Hiển thị tab được chọn
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Active nav button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'bg-primary-50', 'text-primary-600', 'font-semibold');
        activeBtn.classList.remove('text-gray-600');
    }
};

// Xem chi tiết dịch vụ
window.viewService = function (serviceId) {
    window.location.href = `product-detail.html?id=${serviceId}`;
};

// Xóa khỏi yêu thích
window.removeFavorite = function (serviceId) {
    if (confirm('Bạn có chắc muốn bỏ dịch vụ này khỏi danh sách yêu thích?')) {
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        favorites = favorites.filter(item => item._id !== serviceId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        loadFavorites();
        showNotification('Đã xóa khỏi danh sách yêu thích', 'success');
    }
};

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-down ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    } text-white`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Format giá
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Format thời gian đã xem
function formatTimeAgo(timestamp) {
    const now = new Date();
    const viewed = new Date(timestamp);
    const diffInSeconds = Math.floor((now - viewed) / 1000);

    if (diffInSeconds < 60) return 'Vừa xem';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return viewed.toLocaleDateString('vi-VN');
}
