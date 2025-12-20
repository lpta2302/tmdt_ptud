// Header Component - Sử dụng cho tất cả các trang
function createHeader(activePage = 'home') {
    return `
    <!-- Header -->
    <header id="header">
        <nav class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <!-- Logo -->
                <div class="flex items-center space-x-3">
                    <div class="logo-icon">
                        <i class="fas fa-spa text-white text-lg"></i>
                    </div>
                    <a href="index.html" class="logo-text">Elora</a>
                </div>

                <!-- Navigation -->
                <ul class="hidden lg:flex items-center space-x-8">
                    <li><a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Trang Chủ</a></li>
                    <li><a href="services.html" class="nav-link ${activePage === 'services' ? 'active' : ''}">Dịch Vụ</a></li>
                    <li><a href="booking.html" class="nav-link ${activePage === 'booking' ? 'active' : ''}">Đặt Lịch</a></li>
                    <li><a href="about.html" class="nav-link ${activePage === 'about' ? 'active' : ''}">Giới Thiệu</a></li>
                    <li><a href="contact.html" class="nav-link ${activePage === 'contact' ? 'active' : ''}">Liên Hệ</a></li>
                </ul>

                <!-- User Actions -->
                <div class="flex items-center space-x-4">
                    <!-- Search -->
                    <button class="search-toggle p-2 text-gray-600 hover:text-primary-500 transition-colors">
                        <i class="fas fa-search"></i>
                    </button>

                    <!-- Cart -->
                    <button onClick="openCart()" class="relative p-2 text-gray-600 hover:text-primary-500 transition-colors">
                        <i class="fas fa-shopping-bag"></i>
                        <span class="cart-count absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
                    </button>

                    <!-- User -->
                    <div class="relative user-dropdown">
                        <button class="user-toggle p-2 text-gray-600 hover:text-primary-500 transition-colors">
                            <i class="fas fa-user text-xl"></i>
                        </button>
                        <div id="user-menu-content" class="user-menu absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl w-48 py-2 hidden">
                            <!-- Menu sẽ được render động -->
                        </div>
                    </div>

                    <!-- Mobile Menu Toggle -->
                    <button class="lg:hidden mobile-menu-toggle p-2 text-gray-600">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
            </div>

        </nav>
        <!-- Mobile Navigation -->
        <div class="mobile-menu bg-white w-full lg:hidden hidden mt-4 pb-4 px-4 border-t border-gray-200">
            <ul class="space-y-2 mt-4">
                <li><a href="index.html" class="block py-2 ${activePage === 'home' ? 'text-primary-500 font-semibold' : 'text-gray-700 hover:text-primary-500'}">Trang Chủ</a></li>
                <li><a href="services.html" class="block py-2 ${activePage === 'services' ? 'text-primary-500 font-semibold' : 'text-gray-700 hover:text-primary-500'}">Dịch Vụ</a></li>
                <li><a href="booking.html" class="block py-2 ${activePage === 'bookings' ? 'text-primary-500 font-semibold' : 'text-gray-700 hover:text-primary-500'}">Đặt Lịch</a></li>
                <li><a href="about.html" class="block py-2 ${activePage === 'about' ? 'text-primary-500 font-semibold' : 'text-gray-700 hover:text-primary-500'}">Giới Thiệu</a></li>
                <li><a href="contact.html" class="block py-2 ${activePage === 'contact' ? 'text-primary-500 font-semibold' : 'text-gray-700 hover:text-primary-500'}">Liên Hệ</a></li>
            </ul>
        </div>

        <!-- Search Bar -->
        <div class="search-bar hidden bg-white border-t border-gray-200">
            <div class="container mx-auto px-4 py-4">
                <form id="header-search-form" class="relative max-w-md mx-auto">
                    <input type="text" id="header-search-input" placeholder="Tìm kiếm dịch vụ..."
                        class="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-primary-500">
                    <button type="submit" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500">
                        <i class="fas fa-search"></i>
                    </button>
                </form>
            </div>
        </div>
    </header>
    `;
}

// Tự động load header khi trang load
document.addEventListener('DOMContentLoaded', function () {
    // Kiểm tra xem có element #header không
    const headerContainer = document.getElementById('header');
    if (headerContainer) {
        // Xác định trang hiện tại
        const currentPage = document.body.dataset.page || 'home';
        headerContainer.innerHTML = createHeader(currentPage);
        
        // Setup event listeners sau khi header được render
        setupHeaderEventListeners();
        
        // Render user menu dựa trên trạng thái đăng nhập
        renderUserMenu();
    }

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.length;
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
});

// Render menu người dùng dựa trên trạng thái đăng nhập
function renderUserMenu() {
    const userMenuContent = document.getElementById('user-menu-content');
    if (!userMenuContent) return;
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        // Đã đăng nhập - hiển thị menu đã đăng nhập
        try {
            const userData = JSON.parse(user);
            userMenuContent.innerHTML = `
                <div class="px-4 py-3 border-b border-gray-200">
                    <p class="text-sm text-gray-500">Xin chào</p>
                    <p class="font-semibold text-gray-800 truncate">${`${userData.firstName} ${userData.lastName}` || 'Người dùng'}</p>
                </div>
                <a href="profile.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
                    <i class="fas fa-user-circle mr-2"></i>Hồ Sơ
                </a>
                <a href="cart.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
                    <i class="fas fa-calendar-alt mr-2"></i>Lịch Đặt
                </a>
                <a href="booking.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
                    <i class="fas fa-calendar-plus mr-2"></i>Đặt Lịch Mới
                </a>
                <div class="border-t border-gray-200 my-2"></div>
                <button onclick="handleLogout()" class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors">
                    <i class="fas fa-sign-out-alt mr-2"></i>Đăng Xuất
                </button>
            `;
        } catch (error) {
            console.error('Lỗi parse user data:', error);
            renderGuestMenu(userMenuContent);
        }
    } else {
        // Chưa đăng nhập - hiển thị menu guest
        renderGuestMenu(userMenuContent);
    }
}

// Render menu cho khách (chưa đăng nhập)
function renderGuestMenu(menuElement) {
    menuElement.innerHTML = `
        <a href="login.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
            <i class="fas fa-sign-in-alt mr-2"></i>Đăng Nhập
        </a>
        <a href="register.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
            <i class="fas fa-user-plus mr-2"></i>Đăng Ký
        </a>
        <a href="booking.html" class="block px-4 py-2 text-gray-700 hover:bg-primary-50 transition-colors">
            <i class="fas fa-calendar-plus mr-2"></i>Đặt Lịch
        </a>
    `;
}

// Xử lý đăng xuất
window.handleLogout = function() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('pendingBooking');
        window.location.href = 'index.html';
    }
};

// Setup event listeners cho header
function setupHeaderEventListeners() {
    // Search toggle button
    const searchToggle = document.querySelector('.search-toggle');
    if (searchToggle) {
        searchToggle.addEventListener('click', toggleSearch);
    }
    
    // Search form submit
    const searchForm = document.getElementById('header-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleHeaderSearch);
    }
    
    // User menu toggle
    const userToggle = document.querySelector('.user-toggle');
    if (userToggle) {
        userToggle.addEventListener('click', toggleUserMenu);
    }
    
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Close user menu when clicking outside
    document.addEventListener('click', function(e) {
        const userDropdown = document.querySelector('.user-dropdown');
        if (userDropdown && !userDropdown.contains(e.target)) {
            const userMenu = document.querySelector('.user-menu');
            if (userMenu && !userMenu.classList.contains('hidden')) {
                userMenu.classList.add('hidden');
            }
        }
    });
}

// Bật/tắt thanh tìm kiếm
function toggleSearch() {
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.classList.toggle('hidden');
        if (!searchBar.classList.contains('hidden')) {
            const searchInput = searchBar.querySelector('#header-search-input');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        }
    }
}

// Xử lý submit search form
function handleHeaderSearch(e) {
    e.preventDefault();
    const searchInput = document.getElementById('header-search-input');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    if (searchTerm) {
        // Chuyển đến trang services với search query
        window.location.href = `services.html?search=${encodeURIComponent(searchTerm)}`;
    }
}

// Chuyển sang trang cart
function openCart() {
    window.location.href = 'cart.html';
}

// Bật/tắt menu người dùng
function toggleUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.classList.toggle('hidden');
    }
}

// Bật/tắt menu di động
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}