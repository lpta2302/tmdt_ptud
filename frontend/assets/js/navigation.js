// Quản lý điều hướng - Quản lý các liên kết điều hướng
class NavigationManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page;
    }

    init() {
        this.updateActiveNavigation();
        this.updateUserMenu();
        this.checkLoginStatus();
    }

    updateActiveNavigation() {
        // Cập nhật trạng thái active cho các liên kết điều hướng
        const navLinks = document.querySelectorAll('nav a, .nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === this.currentPage || 
                (this.currentPage === 'index.html' && href === '#') ||
                (this.currentPage === '' && href === 'index.html')) {
                link.classList.add('active', 'text-primary-300', 'font-semibold');
                link.classList.remove('text-gray-600');
            } else {
                link.classList.remove('active', 'text-primary-300', 'font-semibold');
                if (!link.classList.contains('text-primary-300')) {
                    link.classList.add('text-gray-600');
                }
            }
        });
    }

    updateUserMenu() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        
        const userMenus = document.querySelectorAll('.user-menu');
        const userToggles = document.querySelectorAll('.user-toggle');

        if (isLoggedIn && userInfo.name) {
            // Người dùng đã đăng nhập - Hiển thị thông tin
            userToggles.forEach(toggle => {
                if (toggle.querySelector('.user-name')) return; // Đã cập nhật rồi
                
                toggle.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-user text-xl"></i>
                        <span class="user-name hidden md:block text-sm">${userInfo.name}</span>
                    </div>
                `;
            });

            userMenus.forEach(menu => {
                if (menu) {
                    menu.innerHTML = `
                        <a href="profile.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
                            <i class="fas fa-user mr-2"></i>Thông Tin
                        </a>
                        <a href="booking.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
                            <i class="fas fa-calendar mr-2"></i>Lịch Hẹn
                        </a>
                        <a href="#" onclick="logout()" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
                            <i class="fas fa-sign-out-alt mr-2"></i>Đăng Xuất
                        </a>
                    `;
                }
            });
        } else {
            // Người dùng chưa đăng nhập
            userMenus.forEach(menu => {
                if (menu) {
                    menu.innerHTML = `
                        <a href="login.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
                            <i class="fas fa-sign-in-alt mr-2"></i>Đăng Nhập
                        </a>
                        <a href="register.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
                            <i class="fas fa-user-plus mr-2"></i>Đăng Ký
                        </a>
                        <a href="booking.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
                            <i class="fas fa-calendar mr-2"></i>Đặt Lịch
                        </a>
                    `;
                }
            });
        }
    }

    checkLoginStatus() {
        // Kiểm tra và cập nhật trạng thái đăng nhập
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const loginTime = localStorage.getItem('loginTime');
        
        if (isLoggedIn && loginTime) {
            const loginDate = new Date(loginTime);
            const now = new Date();
            const diffHours = (now - loginDate) / (1000 * 60 * 60);
            
            // Tự động đăng xuất sau 24 giờ
            if (diffHours > 24) {
                this.logout();
            }
        }
    }

    logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('loginTime');
        window.location.reload();
    }
}

// Hàm đăng xuất toàn cục
function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('loginTime');
        window.location.href = 'index.html';
    }
}

// Navigation links data
const navigationLinks = {
    'index.html': 'Trang Chủ',
    'services.html': 'Dịch Vụ',
    'booking.html': 'Đặt Lịch',
    'contact.html': 'Liên Hệ',
    'cart.html': 'Giỏ Hàng',
    'checkout.html': 'Thanh Toán',
    'login.html': 'Đăng Nhập',
    'register.html': 'Đăng Ký'
};

// Khởi tạo Navigation Manager khi DOM được tải
document.addEventListener('DOMContentLoaded', function() {
    new NavigationManager();
    
    // Thêm event listener cho mobile menu toggle
    const mobileMenuToggles = document.querySelectorAll('.mobile-menu-toggle');
    const mobileMenus = document.querySelectorAll('.mobile-menu');
    
    mobileMenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            mobileMenus.forEach(menu => {
                menu.classList.toggle('hidden');
            });
        });
    });

    // Thêm event listener cho user menu toggle
    const userToggles = document.querySelectorAll('.user-toggle');
    userToggles.forEach(toggle => {
        if (toggle.tagName.toLowerCase() === 'button') {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                const menu = this.parentElement.querySelector('.user-menu');
                if (menu) {
                    menu.classList.toggle('hidden');
                }
            });
        }
    });

    // Đóng user menu khi click bên ngoài
    document.addEventListener('click', function(e) {
        const userMenus = document.querySelectorAll('.user-menu');
        const userToggles = document.querySelectorAll('.user-toggle');
        
        let clickedInside = false;
        userToggles.forEach(toggle => {
            if (toggle.contains(e.target)) {
                clickedInside = true;
            }
        });

        if (!clickedInside) {
            userMenus.forEach(menu => {
                menu.classList.add('hidden');
            });
        }
    });
});

// Export cho sử dụng ở các file khác
window.NavigationManager = NavigationManager;
window.logout = logout;