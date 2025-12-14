import { loadSampleProductCard } from "./sample-data.js";
// JavaScript chính cho ứng dụng Elora

// Biến toàn cục
let cartItems = [];
let wishlistItems = [];
let products = [];
let categories = [];
let banners = [];

// Cấu hình đường dẫn API
const API_BASE = 'http://localhost:3000/api';

// Các phần tử DOM
const elements = {
    heroSlider: null,
    testimonialSlider: null,
    cartSidebar: document.querySelector('.cart-sidebar'),
    cartOverlay: document.querySelector('.cart-overlay'),
    cartCount: document.querySelector('.cart-count'),
    cartTotal: document.querySelector('.cart-total'),
    backToTop: document.querySelector('.back-to-top'),
    header: document.querySelector('#header'),
    searchBar: document.querySelector('.search-bar'),
    mobileMenu: document.querySelector('.mobile-menu')
};

// Khởi tạo ứng dụng khi trang đã tải
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

async function initializeApp() {
    try {
        // Khởi tạo thư viện hiệu ứng AOS
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });

        // Tải dữ liệu từ API
        await loadData();

        // Khởi tạo các thành phần giao diện
        initializeSliders();
        initializeEventListeners();
        initializeScrollEffects();

        // Hiển thị nội dung trang
        renderHeroSlider();
        renderProducts();
        renderTestimonials();

        // Cập nhật số lượng giỏ hàng
        updateCartDisplay();

        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Có lỗi xảy ra khi tải trang', 'error');
    }
}

// Tải dữ liệu từ API hoặc localStorage
async function loadData() {
    try {
        const [productsRes, categoriesRes, bannersRes] = await Promise.all([
            fetch(`${API_BASE}/products`),
            fetch(`${API_BASE}/categories`),
            fetch(`${API_BASE}/banners`)
        ]);

        if (!productsRes.ok || !categoriesRes.ok || !bannersRes.ok) {
            throw new Error('Failed to fetch data from API');
        }

        products = await productsRes.json();
        categories = await categoriesRes.json();
        banners = await bannersRes.json();

        // Khôi phục giỏ hàng từ localStorage
        const savedCart = localStorage.getItem('spa_cart');
        if (savedCart) {
            cartItems = JSON.parse(savedCart);
        }

        // Khôi phục danh sách yêu thích từ localStorage
        const savedWishlist = localStorage.getItem('spa_wishlist');
        if (savedWishlist) {
            wishlistItems = JSON.parse(savedWishlist);
        }

    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        // Sử dụng dữ liệu mẫu khi API thất bại
        const sampleData = loadSampleProductCard();
        banners = sampleData.banners;
        products = sampleData.products;
    }
}

// Khởi tạo slider
function initializeSliders() {
    // Slider hero
    elements.heroSlider = new Splide('#hero-slider', {
        type: 'loop',
        perPage: 1,
        autoplay: true,
        interval: 5000,
        pauseOnHover: true,
        pauseOnFocus: false,
        arrows: true,
        pagination: true,
        speed: 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    });

    // Slider đánh giá
    elements.testimonialSlider = new Splide('#testimonial-slider', {
        type: 'loop',
        perPage: 1,
        autoplay: true,
        interval: 4000,
        arrows: false,
        pagination: true,
        speed: 800,
        breakpoints: {
            768: {
                perPage: 1,
            }
        }
    });
}

// Khởi tạo các sự kiện
function initializeEventListeners() {
    // Hiệu ứng cuộn cho header
    window.addEventListener('scroll', handleScroll);

    // Bật/tắt thanh tìm kiếm
    const searchToggle = document.querySelector('.search-toggle');
    if (searchToggle) {
        searchToggle.addEventListener('click', toggleSearch);
    }

    // Bật/tắt giỏ hàng
    const cartToggle = document.querySelector('.cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', toggleCart);
    }

    // Bật/tắt menu người dùng
    const userToggle = document.querySelector('.user-toggle');
    if (userToggle) {
        userToggle.addEventListener('click', toggleUserMenu);
    }

    // Bật/tắt menu di động
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Nút lên đầu trang
    if (elements.backToTop) {
        elements.backToTop.addEventListener('click', scrollToTop);
    }

    // Sự kiện click vào thẻ danh mục
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function () {
            const categoryName = this.querySelector('h3').textContent;
            window.location.href = `services.html?category=${encodeURIComponent(categoryName)}`;
        });
    });
}

// Khởi tạo hiệu ứng cuộn
function initializeScrollEffects() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-slide-up');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Theo dõi phần tử để chạy animation
    document.querySelectorAll('.product-card, .category-card').forEach(el => {
        observer.observe(el);
    });
}

// Xử lý sự kiện cuộn trang
function handleScroll() {
    const scrollY = window.scrollY;

    // Đổi nền header khi cuộn
    if (elements.header) {
        if (scrollY > 100) {
            elements.header.classList.add('backdrop-blur-md', 'bg-white/95');
        } else {
            elements.header.classList.remove('backdrop-blur-md', 'bg-white/95');
        }
    }

    // Hiển thị nút lên đầu trang
    if (elements.backToTop) {
        if (scrollY > 500) {
            elements.backToTop.classList.add('show');
        } else {
            elements.backToTop.classList.remove('show');
        }
    }
}

// Cuộn lên đầu trang
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Hiển thị slider hero
function renderHeroSlider() {
    const heroSlides = document.getElementById('hero-slides');
    if (!heroSlides || !banners?.banners.length) return;

    const slidesHTML = banners.banners.map(banner => {
        const thumbnail = banner?.image ? `${API_BASE}/files/${banner.image.gridfsId}` : banner.image;

        return `
        <li class="splide__slide">
            <div class="hero-slide" style="background-image: url('${thumbnail}')">
                <div class="hero-content relative z-10">
                    <div class="hero-content-overlay"></div>
                    <h1 class="text-2xl lg:text-4xl font-display font-bold mb-4 animate-slide-up">
                        ${banner.title}
                    </h1>
                    ${
                        banner.subtitle ?
                        `<p class="text-xl lg:text-2xl font-light mb-6 animate-slide-up" style="animation-delay: 0.2s">
                            ${banner.subtitle}
                        </p>` : ''
                    }
                    <p class="text-lg mb-8 opacity-90 animate-slide-up" style="animation-delay: 0.4s">
                        ${banner.description}
                    </p>
                    <div class="space-x-4 animate-slide-up" style="animation-delay: 0.6s">
                        <a href="${banner.buttonLink}" class="btn-primary inline-block hover-glow">
                            ${banner.buttonText ? `${banner.buttonText}` : "Khám Phá Ngay"}
                        </a>
                        <a href="services.html" class="btn-secondary inline-block">
                            Xem Dịch Vụ
                        </a>
                    </div>
                </div>
            </div>
        </li>
    `;
    }).join('');

    heroSlides.innerHTML = slidesHTML;

    // Khởi động slider
    if (elements.heroSlider) {
        elements.heroSlider.mount();
    }
}

// Hiển thị sản phẩm
function renderProducts() {
    renderTrendingProducts();
    renderBestsellerProducts();
}

// Hiển thị sản phẩm xu hướng
function renderTrendingProducts() {
    const container = document.getElementById('trending-products');

    const trendingProducts = Array.from(products.data).sort((a, b) => b.trending - a.trending).slice(0, 6);
    container.innerHTML = trendingProducts.map(product => createProductCard(product, 'trending')).join('');

    // Thêm sự kiện cho sản phẩm
    addProductEventListeners(container);
}

// Hiển thị sản phẩm bán chạy
function renderBestsellerProducts() {
    const container = document.getElementById('bestseller-products');
    if (!container) return;

    const bestsellerProducts = Array.from(products.data).sort((a, b) => b.boughtCount - a.boughtCount).slice(0, 6);
    container.innerHTML = bestsellerProducts.map(product => createProductCard(product, 'bestseller')).join('');

    // Thêm sự kiện cho sản phẩm
    addProductEventListeners(container);
}

// Tạo HTML cho thẻ sản phẩm
function createProductCard(product, badgeType = '') {
    const discountPercent = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const thumbnail = product?.images?.length ? `${API_BASE}${product.images[0].url.substring(4)}` : product.image;
    console.log("🚀 ~ createProductCard ~ product:", product._id)

    return `
        <div class="product-card lg:min-w-[400px] min-w-full" data-product-id="${product._id}" data-aos="fade-up">
            <div class="product-image">
                <img src="${thumbnail}" alt="${product.name}" loading="lazy">
                <div class="product-badge-container">
                    ${badgeType ? `<span class="product-badge ${badgeType}">${badgeType === 'trending' ? 'Xu Hướng' : 'Bán Chạy'}</span>` : ''}
                    ${discountPercent > 0 ? `<span class="product-badge discount">-${discountPercent}%</span>` : ''}
                </div>
                <div class="product-actions flex space-x-2 mt-2">
                    <button class="product-action-btn wishlist-btn" title="Thêm vào yêu thích">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="product-action-btn quick-view-btn" title="Xem nhanh">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="product-action-btn compare-btn" title="So sánh">
                        <i class="fas fa-balance-scale"></i>
                    </button>
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2 hover:text-primary-300 transition-colors cursor-pointer">
                    ${product.name}
                </h3>
                <div class="flex items-center mb-3">
                    <div class="rating-stars">
                        ${generateStarRating(product.rating || 0)}
                    </div>
                    <span class="text-sm text-gray-500 ml-2">(${product.reviewCount || 0})</span>
                </div>
                <div class="flex items-center justify-between mb-4">
                    <div class="price-section">
                        <div class="flex items-center space-x-2">
                            <span class="current-price">${formatPrice(product.price)}</span>
                            ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                        </div>
                        ${discountPercent > 0 ? `<div class="discount-percent mt-1">Tiết kiệm ${discountPercent}%</div>` : ''}
                    </div>
                    ${product.duration ? `<span class="text-sm text-gray-500 ml-4">${product.duration} phút</span>` : ''}
                </div>
                <div class="flex space-x-2 mt-2">
                    <a href="booking.html?id=${product._id}">
                        <button class="flex-1 btn-primary text-sm py-2" data-product-id="${product._id}">
                            <i class="fas fa-calendar-plus mr-2"></i>
                            Đặt Lịch
                        </button>
                    </a>
                    <a href="product-detail.html?id=${product._id}">
                        <button class="btn-outline text-sm py-2 px-4" data-product-id="${product._id}">
                            Chi Tiết
                        </button>
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Tạo HTML cho đánh giá sao
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';

    // Sao đầy
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star star"></i>';
    }

    // Sao nửa
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt star"></i>';
    }

    // Sao rỗng
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star star empty"></i>';
    }

    return starsHTML;
}

// Thêm sự kiện cho sản phẩm
function addProductEventListeners(container) {
    // Nút thêm vào giỏ hàng
    container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = parseInt(this.dataset.productId);
            addToCart(productId);
        });
    });

    // Nút yêu thích
    container.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = parseInt(this.dataset.productId);
            toggleWishlist(productId);
        });
    });

    // Click vào thẻ sản phẩm
    container.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function (e) {
            if (!e.target.closest('button')) {
                const productId = this.dataset.productId;
                viewProductDetails(productId);
            }
        });
    });
}

// Thêm vào giỏ hàng
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cartItems.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cartItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity,
            duration: product.duration || 60
        });
    }

    saveCart();
    updateCartDisplay();
    showNotification(`${product.name} đã được thêm vào giỏ hàng`, 'success');

    // Hiệu ứng khi thêm sản phẩm
    const btn = document.querySelector(`[data-product-id="${productId}"]`);
    if (btn) {
        btn.classList.add('animate-pulse');
        setTimeout(() => btn.classList.remove('animate-pulse'), 1000);
    }
}

// Bật/tắt yêu thích
function toggleWishlist(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const index = wishlistItems.findIndex(item => item.id === productId);

    if (index > -1) {
        wishlistItems.splice(index, 1);
        showNotification(`${product.name} đã được xóa khỏi danh sách yêu thích`, 'info');
    } else {
        wishlistItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            addedAt: new Date().toISOString()
        });
        showNotification(`${product.name} đã được thêm vào danh sách yêu thích`, 'success');
    }

    saveWishlist();
    updateWishlistButton(productId);
}

// Cập nhật trạng thái nút yêu thích
function updateWishlistButton(productId) {
    const btn = document.querySelector(`[data-product-id="${productId}"] .wishlist-btn`);
    if (btn) {
        const isInWishlist = wishlistItems.some(item => item.id === productId);
        btn.classList.toggle('text-primary-300', isInWishlist);
        btn.classList.toggle('text-gray-400', !isInWishlist);
    }
}

// Xem chi tiết sản phẩm
function viewProductDetails(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Cập nhật hiển thị giỏ hàng
function updateCartDisplay() {
    if (elements.cartCount) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        elements.cartCount.textContent = totalItems;
        elements.cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    if (elements.cartTotal) {
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        elements.cartTotal.textContent = formatPrice(total);
    }

    renderCartItems();
}

// Hiển thị các sản phẩm trong giỏ hàng
function renderCartItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    if (!cartItemsContainer) return;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart text-center py-12">
                <i class="fas fa-shopping-bag text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Giỏ hàng của bạn đang trống</p>
                <a href="services.html" class="inline-block mt-4 bg-gradient-to-r from-primary-300 to-secondary-400 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all">
                    Khám Phá Dịch Vụ
                </a>
            </div>
        `;
    } else {
        cartItemsContainer.innerHTML = cartItems.map(item => `
            <div class="cart-item flex items-center space-x-4 py-4 border-b border-gray-100">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-800">${item.name}</h4>
                    <p class="text-sm text-gray-500">${item.duration} phút</p>
                    <div class="flex items-center justify-between mt-2">
                        <span class="font-semibold text-primary-300">${formatPrice(item.price)}</span>
                        <div class="flex items-center space-x-2">
                            <button class="quantity-btn decrease" data-id="${item.id}">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn increase" data-id="${item.id}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <button class="remove-item text-red-500 hover:text-red-700" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Thêm sự kiện cho các nút giỏ hàng
        addCartEventListeners();
    }
}

// Thêm sự kiện cho giỏ hàng
function addCartEventListeners() {
    // Nút tăng/giảm số lượng
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const itemId = parseInt(this.dataset.id);
            const isIncrease = this.classList.contains('increase');
            updateCartQuantity(itemId, isIncrease ? 1 : -1);
        });
    });

    // Nút xóa sản phẩm
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function () {
            const itemId = parseInt(this.dataset.id);
            removeFromCart(itemId);
        });
    });
}

// Cập nhật số lượng sản phẩm trong giỏ
function updateCartQuantity(itemId, change) {
    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else {
        saveCart();
        updateCartDisplay();
    }
}

// Xóa sản phẩm khỏi giỏ
function removeFromCart(itemId) {
    const itemIndex = cartItems.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        const item = cartItems[itemIndex];
        cartItems.splice(itemIndex, 1);
        saveCart();
        updateCartDisplay();
        showNotification(`${item.name} đã được xóa khỏi giỏ hàng`, 'info');
    }
}

// Hiển thị đánh giá khách hàng
function renderTestimonials() {
    const testimonialSlides = document.getElementById('testimonial-slides');
    if (!testimonialSlides) return;

    const testimonials = [
        {
            content: "Dịch vụ massage tại Elora thật tuyệt vời! Tôi cảm thấy rất thư giãn và thoải mái sau buổi trải nghiệm. Nhân viên chuyên nghiệp và thân thiện.",
            author: "Nguyễn Thị Lan",
            role: "Khách hàng VIP",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
            rating: 5
        },
        {
            content: "Spa có không gian rất đẹp và sang trọng. Các liệu trình chăm sóc da rất hiệu quả, da tôi trở nên mềm mại và rạng rỡ hơn hẳn.",
            author: "Trần Minh Anh",
            role: "Beauty Blogger",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
            rating: 5
        },
        {
            content: "Tôi đã thử nhiều spa khác nhưng Elora là nơi tôi cảm thấy hài lòng nhất. Dịch vụ chuyên nghiệp, giá cả hợp lý và hiệu quả rõ rệt.",
            author: "Lê Văn Đức",
            role: "Doanh nhân",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
            rating: 5
        }
    ];

    const slidesHTML = testimonials.map(testimonial => `
        <li class="splide__slide">
            <div class="testimonial-card">
                <div class="testimonial-content">
                    "${testimonial.content}"
                </div>
                <div class="testimonial-author">
                    <img src="${testimonial.avatar}" alt="${testimonial.author}" class="testimonial-avatar">
                    <div>
                        <div class="font-semibold text-gray-800">${testimonial.author}</div>
                        <div class="text-sm text-gray-500">${testimonial.role}</div>
                        <div class="rating-stars mt-1">
                            ${generateStarRating(testimonial.rating)}
                        </div>
                    </div>
                </div>
            </div>
        </li>
    `).join('');

    testimonialSlides.innerHTML = slidesHTML;

    // Khởi động slider đánh giá
    if (elements.testimonialSlider) {
        elements.testimonialSlider.mount();
    }
}

// Lưu giỏ hàng vào localStorage
function saveCart() {
    localStorage.setItem('spa_cart', JSON.stringify(cartItems));
}

// Lưu danh sách yêu thích vào localStorage
function saveWishlist() {
    localStorage.setItem('spa_wishlist', JSON.stringify(wishlistItems));
}

// Định dạng giá tiền
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} notification-enter`;

    notification.innerHTML = `
        <div class="p-4">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas ${getNotificationIcon(type)} text-lg"></i>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-gray-800">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button class="notification-close text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Hiệu ứng xuất hiện
    setTimeout(() => {
        notification.classList.remove('notification-enter');
        notification.classList.add('notification-enter-active');
    }, 10);

    // Nút đóng thông báo
    notification.querySelector('.notification-close').addEventListener('click', () => {
        removeNotification(notification);
    });

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle text-green-500';
        case 'error': return 'fa-exclamation-circle text-red-500';
        case 'info': return 'fa-info-circle text-blue-500';
        default: return 'fa-bell text-gray-500';
    }
}

function removeNotification(notification) {
    notification.classList.add('notification-enter');
    notification.classList.remove('notification-enter-active');

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Hàm tiện ích
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
