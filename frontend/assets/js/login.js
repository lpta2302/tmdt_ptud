// Import cấu hình
import { API_BASE } from './config.js';
import { processPendingBooking } from './booking-helper.js';

// Khởi tạo AOS
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
});

// Tự động nhận diện và thay đổi icon dựa trên input
document.addEventListener('DOMContentLoaded', function() {
    const identifierInput = document.getElementById('identifier');
    const inputIcon = document.getElementById('input-icon');
    
    if (identifierInput && inputIcon) {
        identifierInput.addEventListener('input', function() {
            const value = this.value.trim();
            
            // Kiểm tra xem input có giống email không
            if (value.includes('@')) {
                inputIcon.className = 'fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400';
            } else {
                inputIcon.className = 'fas fa-phone absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400';
            }
        });
    }
});

// Bật/tắt hiển thị mật khẩu
window.togglePassword = function() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

// Hiển thị thông báo lỗi
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-down';
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle mr-3"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-down';
    successDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-3"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Get redirect URL from query parameters
function getRedirectUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('redirect') || 'index.html';
}

// Login form handler
document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;

    // Validate input
    if (!identifier || !password) {
        showError('Vui lòng nhập số điện thoại/email và mật khẩu!');
        return;
    }

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang đăng nhập...';
    submitBtn.disabled = true;

    try {
        // Call login API
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Login successful
            showSuccess('Đăng nhập thành công!');
            
            // Save token and user data
            if (data.data.token) {
                localStorage.setItem('token', data.data.token);
            }
            if (data.data.customer) {
                localStorage.setItem('user', JSON.stringify(data.data.customer));
            }
            
            // Check for pending booking
            const hasPendingBooking = localStorage.getItem('pendingBooking');
            
            // Get redirect URL
            const redirectUrl = getRedirectUrl();
            
            // Redirect after 1 second
            setTimeout(() => {
                if (hasPendingBooking) {
                    // Process pending booking
                    processPendingBooking();
                } else {
                    // Normal redirect
                    window.location.href = redirectUrl;
                }
            }, 1000);
        } else {
            // Login failed
            showError(data.message || 'Email hoặc mật khẩu không đúng!');
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Không thể kết nối đến server. Vui lòng thử lại!');
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});

// Social login handlers (placeholder)
function loginWithGoogle() {
    showError('Chức năng đăng nhập bằng Google đang được phát triển!');
}

function loginWithFacebook() {
    showError('Chức năng đăng nhập bằng Facebook đang được phát triển!');
}

// Make functions available globally
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;
