// Product Detail page JavaScript
let currentProduct = null;
let currentImageIndex = 0;
let productImages = [];
let relatedSlider = null;
let selectedRating = 0;

// Initialize product detail page
document.addEventListener('DOMContentLoaded', function() {
    if (typeof SpaApp !== 'undefined') {
        initializeProductDetail();
    } else {
        // Wait for main.js to load
        setTimeout(initializeProductDetail, 500);
    }
});

async function initializeProductDetail() {
    try {
        // Initialize AOS
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });

        // Get product ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));

        if (!productId) {
            window.location.href = 'services.html';
            return;
        }

        // Load product data if not available
        if (!window.SpaApp || !window.SpaApp.products) {
            await loadProductData();
        }

        // Find current product
        currentProduct = window.SpaApp.products.find(p => p.id === productId);
        
        if (!currentProduct) {
            window.location.href = 'services.html';
            return;
        }

        // Initialize components
        setupEventListeners();
        renderProduct();
        initializeImageZoom();
        loadRelatedProducts();
        loadComboProducts();
        
        console.log('Product detail page initialized');
    } catch (error) {
        console.error('Error initializing product detail page:', error);
    }
}

async function loadProductData() {
    try {
        // Try to load from API
        const response = await fetch('http://localhost:3000/api/products');
        if (response.ok) {
            const products = await response.json();
            if (window.SpaApp) {
                window.SpaApp.products = products;
            }
        }
    } catch (error) {
        console.error('Error loading product data:', error);
        // Use sample data as fallback
        loadSampleProductData();
    }
}

function loadSampleProductData() {
    const sampleProducts = [
        {
            id: 1,
            name: "Massage Thư Giãn Toàn Thân",
            price: 300000,
            originalPrice: 350000,
            discount: 14,
            images: [
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop"
            ],
            rating: 4.8,
            reviewCount: 127,
            viewCount: 1524,
            trending: true,
            bestseller: true,
            featured: true,
            duration: 60,
            categoryId: 1,
            category: "Massage & Spa",
            description: "Liệu trình massage toàn thân giúp giảm stress, thư giãn cơ bắp và phục hồi năng lượng. Sử dụng các kỹ thuật massage chuyên nghiệp kết hợp với tinh dầu thiên nhiên cao cấp để mang lại cảm giác thư giãn tuyệt đối. Phù hợp cho những ai thường xuyên căng thẳng, làm việc nhiều hoặc muốn tận hưởng khoảnh khắc thư giãn sau những ngày dài mệt mỏi.",
            benefits: [
                "Giảm căng thẳng và stress hiệu quả",
                "Thư giãn cơ bắp, giảm đau nhức",
                "Cải thiện tuần hoàn máu và limph",
                "Tăng cường sức khỏe tổng thể",
                "Cải thiện chất lượng giấc ngủ",
                "Tăng cường hệ miễn dịch tự nhiên"
            ],
            procedures: [
                "Tư vấn và kiểm tra tình trạng sức khỏe",
                "Chuẩn bị không gian thư giãn với nhạc nhẹ",
                "Massage toàn thân với tinh dầu thiên nhiên",
                "Xoa bóp các huyệt đạo quan trọng",
                "Thư giãn và nghỉ ngơi sau liệu trình",
                "Tư vấn chế độ chăm sóc tại nhà"
            ],
            tags: ["massage", "thư giãn", "giảm stress", "chăm sóc sức khỏe"]
        }
    ];

    if (window.SpaApp) {
        window.SpaApp.products = sampleProducts;
    } else {
        window.SpaApp = { products: sampleProducts };
    }
}

function setupEventListeners() {
    // Quantity controls
    const decreaseBtn = document.getElementById('decrease-qty');
    const increaseBtn = document.getElementById('increase-qty');
    const quantityInput = document.getElementById('quantity');

    if (decreaseBtn && increaseBtn && quantityInput) {
        decreaseBtn.addEventListener('click', () => updateQuantity(-1));
        increaseBtn.addEventListener('click', () => updateQuantity(1));
        quantityInput.addEventListener('change', validateQuantity);
    }

    // Action buttons
    const addToCartBtn = document.getElementById('add-to-cart');
    const addToWishlistBtn = document.getElementById('add-to-wishlist');
    const shareBtn = document.getElementById('share-product');
    const quickBookBtn = document.getElementById('quick-book');

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }
    if (addToWishlistBtn) {
        addToWishlistBtn.addEventListener('click', handleAddToWishlist);
    }
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShare);
    }
    if (quickBookBtn) {
        quickBookBtn.addEventListener('click', handleQuickBook);
    }

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Image navigation
    const prevImageBtn = document.getElementById('prev-image');
    const nextImageBtn = document.getElementById('next-image');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    if (prevImageBtn) prevImageBtn.addEventListener('click', () => changeImage(-1));
    if (nextImageBtn) nextImageBtn.addEventListener('click', () => changeImage(1));
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', openImageModal);

    // Modal controls
    const closeModal = document.getElementById('close-modal');
    const modalPrev = document.getElementById('modal-prev');
    const modalNext = document.getElementById('modal-next');

    if (closeModal) closeModal.addEventListener('click', closeImageModal);
    if (modalPrev) modalPrev.addEventListener('click', () => changeModalImage(-1));
    if (modalNext) modalNext.addEventListener('click', () => changeModalImage(1));

    // Review modal
    const writeReviewBtn = document.getElementById('write-review-btn');
    const closeReviewModalBtns = document.querySelectorAll('.close-review-modal');
    const reviewForm = document.getElementById('review-form');

    if (writeReviewBtn) {
        writeReviewBtn.addEventListener('click', openReviewModal);
    }
    closeReviewModalBtns.forEach(btn => {
        btn.addEventListener('click', closeReviewModal);
    });
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }

    // Star rating
    document.querySelectorAll('.star-rating').forEach(star => {
        star.addEventListener('click', function() {
            setRating(parseInt(this.dataset.rating));
        });
        star.addEventListener('mouseenter', function() {
            highlightStars(parseInt(this.dataset.rating));
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyDown);
}

function renderProduct() {
    if (!currentProduct) return;

    // Update document title
    document.title = `${currentProduct.name} - Edora`;

    // Update breadcrumb
    const breadcrumbCategory = document.getElementById('breadcrumb-category');
    const breadcrumbProduct = document.getElementById('breadcrumb-product');
    if (breadcrumbCategory) breadcrumbCategory.textContent = currentProduct.category || 'Dịch vụ';
    if (breadcrumbProduct) breadcrumbProduct.textContent = currentProduct.name;

    // Update product info
    updateProductInfo();
    updateProductImages();
    updateProductTabs();
    updatePricing();
    updateReviews();
}

function updateProductInfo() {
    const elements = {
        category: document.getElementById('product-category'),
        name: document.getElementById('product-name'),
        rating: document.getElementById('product-rating'),
        ratingValue: document.getElementById('rating-value'),
        reviewCount: document.getElementById('review-count'),
        viewCount: document.getElementById('view-count'),
        duration: document.getElementById('product-duration'),
        durationInfo: document.getElementById('duration-info'),
        bookingCount: document.getElementById('booking-count'),
        tags: document.getElementById('product-tags')
    };

    if (elements.category) elements.category.textContent = currentProduct.category || 'Dịch vụ';
    if (elements.name) elements.name.textContent = currentProduct.name;
    if (elements.rating) elements.rating.innerHTML = generateStarRating(currentProduct.rating || 0);
    if (elements.ratingValue) elements.ratingValue.textContent = (currentProduct.rating || 0).toFixed(1);
    if (elements.reviewCount) {
        elements.reviewCount.textContent = `${currentProduct.reviewCount || 0} đánh giá`;
        elements.reviewCount.href = '#reviews';
    }
    if (elements.viewCount) elements.viewCount.textContent = `${(currentProduct.viewCount || 0).toLocaleString('vi-VN')} lượt xem`;
    if (elements.duration) elements.duration.textContent = currentProduct.duration || 60;
    if (elements.durationInfo) elements.durationInfo.textContent = `${currentProduct.duration || 60} phút`;
    if (elements.bookingCount) elements.bookingCount.textContent = '2.340+';

    // Update tags
    if (elements.tags && currentProduct.tags) {
        elements.tags.innerHTML = currentProduct.tags.map(tag => 
            `<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">#${tag}</span>`
        ).join('');
    }
}

function updateProductImages() {
    productImages = currentProduct.images || [currentProduct.image || "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop"];
    currentImageIndex = 0;

    // Update main image
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = productImages[0];
        mainImage.alt = currentProduct.name;
    }

    // Update thumbnails
    const thumbnailContainer = document.getElementById('thumbnail-container');
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = productImages.map((img, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''} cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-300 transition-all" data-index="${index}">
                <img src="${img}" alt="${currentProduct.name}" class="w-full h-20 object-cover">
            </div>
        `).join('');

        // Add thumbnail click handlers
        thumbnailContainer.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                setActiveImage(index);
            });
        });
    }
}

function updatePricing() {
    const currentPriceEl = document.getElementById('current-price');
    const originalPriceEl = document.getElementById('original-price');
    const discountBadgeEl = document.getElementById('discount-badge');

    if (currentPriceEl) {
        currentPriceEl.textContent = formatPrice(currentProduct.price);
    }

    if (currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price) {
        const discountPercent = Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100);
        
        if (originalPriceEl) {
            originalPriceEl.textContent = formatPrice(currentProduct.originalPrice);
            originalPriceEl.style.display = 'inline';
        }
        
        if (discountBadgeEl) {
            discountBadgeEl.textContent = `-${discountPercent}%`;
            discountBadgeEl.style.display = 'inline-block';
        }
    } else {
        if (originalPriceEl) originalPriceEl.style.display = 'none';
        if (discountBadgeEl) discountBadgeEl.style.display = 'none';
    }
}

function updateProductTabs() {
    // Description
    const descriptionEl = document.getElementById('product-description');
    if (descriptionEl) {
        descriptionEl.innerHTML = `
            <p class="text-lg text-gray-700 leading-relaxed mb-6">${currentProduct.description || 'Thông tin chi tiết sẽ được cập nhật sớm.'}</p>
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Thông Tin Dịch Vụ</h4>
                    <ul class="space-y-2 text-gray-600">
                        <li><i class="fas fa-clock text-primary-300 mr-2"></i>Thời gian: ${currentProduct.duration || 60} phút</li>
                        <li><i class="fas fa-users text-primary-300 mr-2"></i>Phù hợp: Mọi lứa tuổi</li>
                        <li><i class="fas fa-certificate text-primary-300 mr-2"></i>Chứng nhận: An toàn & Hiệu quả</li>
                        <li><i class="fas fa-award text-primary-300 mr-2"></i>Đánh giá: ${(currentProduct.rating || 0).toFixed(1)}/5 sao</li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Cam Kết Chất Lượng</h4>
                    <ul class="space-y-2 text-gray-600">
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Sản phẩm thiên nhiên 100%</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Kỹ thuật viên chuyên nghiệp</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Không gian thư giãn tuyệt đối</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Đảm bảo vệ sinh an toàn</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // Benefits
    const benefitsEl = document.getElementById('product-benefits');
    if (benefitsEl && currentProduct.benefits) {
        benefitsEl.innerHTML = currentProduct.benefits.map(benefit => `
            <li class="flex items-start space-x-3">
                <i class="fas fa-star text-yellow-500 mt-1 flex-shrink-0"></i>
                <span class="text-gray-700">${benefit}</span>
            </li>
        `).join('');
    }

    // Procedures
    const proceduresEl = document.getElementById('product-procedures');
    if (proceduresEl && currentProduct.procedures) {
        proceduresEl.innerHTML = currentProduct.procedures.map((procedure, index) => `
            <div class="flex space-x-4">
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-400 text-white rounded-full flex items-center justify-center font-semibold">
                    ${index + 1}
                </div>
                <div class="flex-1">
                    <p class="text-gray-700">${procedure}</p>
                </div>
            </div>
        `).join('');
    }
}

function updateReviews() {
    // Update review count in tab
    const tabReviewCount = document.getElementById('tab-review-count');
    if (tabReviewCount) {
        tabReviewCount.textContent = currentProduct.reviewCount || 0;
    }

    // Update average rating
    const averageRating = document.getElementById('average-rating');
    const averageRatingStars = document.getElementById('average-rating-stars');
    const totalReviews = document.getElementById('total-reviews');

    if (averageRating) averageRating.textContent = (currentProduct.rating || 0).toFixed(1);
    if (averageRatingStars) averageRatingStars.innerHTML = generateStarRating(currentProduct.rating || 0);
    if (totalReviews) totalReviews.textContent = `Dựa trên ${currentProduct.reviewCount || 0} đánh giá`;

    // Generate rating breakdown
    const ratingBreakdown = document.getElementById('rating-breakdown');
    if (ratingBreakdown) {
        const breakdown = generateRatingBreakdown();
        ratingBreakdown.innerHTML = breakdown.map(item => `
            <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-600 w-8">${item.stars} sao</span>
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-primary-500 to-secondary-400 h-2 rounded-full" style="width: ${item.percentage}%"></div>
                </div>
                <span class="text-sm text-gray-600 w-12">${item.percentage}%</span>
            </div>
        `).join('');
    }

    // Generate sample reviews
    loadSampleReviews();
}

function generateRatingBreakdown() {
    // Generate sample rating distribution
    return [
        { stars: 5, percentage: 68 },
        { stars: 4, percentage: 22 },
        { stars: 3, percentage: 7 },
        { stars: 2, percentage: 2 },
        { stars: 1, percentage: 1 }
    ];
}

function loadSampleReviews() {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    const sampleReviews = [
        {
            id: 1,
            author: "Nguyễn Thị Lan",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
            rating: 5,
            title: "Dịch vụ tuyệt vời!",
            content: "Tôi đã trải nghiệm dịch vụ massage tại đây và cảm thấy rất hài lòng. Nhân viên chuyên nghiệp, không gian thư giãn và kỹ thuật massage rất tốt. Chắc chắn sẽ quay lại lần sau!",
            date: "2024-12-01",
            helpful: 15
        },
        {
            id: 2,
            author: "Trần Minh Anh",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
            rating: 5,
            title: "Thư giãn tuyệt đối",
            content: "Sau những ngày làm việc căng thẳng, tôi đã tìm được nơi thư giãn lý tưởng. Dịch vụ massage rất chuyên nghiệp, giúp tôi giảm stress và cảm thấy thoải mái hơn rất nhiều.",
            date: "2024-11-28",
            helpful: 12
        },
        {
            id: 3,
            author: "Lê Văn Đức",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
            rating: 4,
            title: "Giá cả hợp lý",
            content: "Chất lượng dịch vụ tốt với mức giá khá hợp lý. Nhân viên thân thiện và tận tâm. Không gian spa sạch sẽ và thoáng mát. Sẽ giới thiệu cho bạn bè.",
            date: "2024-11-25",
            helpful: 8
        }
    ];

    reviewsList.innerHTML = sampleReviews.map(review => `
        <div class="review-item bg-gray-50 rounded-2xl p-6">
            <div class="flex items-start space-x-4 mb-4">
                <img src="${review.avatar}" alt="${review.author}" class="w-12 h-12 rounded-full object-cover">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-gray-800">${review.author}</h4>
                        <span class="text-sm text-gray-500">${formatDate(review.date)}</span>
                    </div>
                    <div class="flex items-center space-x-2 mb-2">
                        <div class="rating-stars">
                            ${generateStarRating(review.rating)}
                        </div>
                        <span class="text-sm text-gray-600">${review.rating}/5</span>
                    </div>
                    ${review.title ? `<h5 class="font-medium text-gray-800 mb-2">${review.title}</h5>` : ''}
                </div>
            </div>
            <p class="text-gray-700 mb-4">${review.content}</p>
            <div class="flex items-center justify-between">
                <button class="flex items-center space-x-2 text-gray-500 hover:text-primary-300 transition-colors">
                    <i class="fas fa-thumbs-up"></i>
                    <span>Hữu ích (${review.helpful})</span>
                </button>
                <button class="text-gray-500 hover:text-primary-300 transition-colors">
                    <i class="fas fa-reply mr-1"></i>
                    Trả lời
                </button>
            </div>
        </div>
    `).join('');
}

function initializeImageZoom() {
    const mainImage = document.getElementById('main-image');
    const zoomLens = document.querySelector('.zoom-lens');
    const zoomResult = document.querySelector('.zoom-result');

    if (!mainImage || !zoomLens || !zoomResult) return;

    mainImage.addEventListener('mouseenter', function() {
        zoomLens.classList.remove('hidden');
        zoomResult.classList.remove('hidden');
        
        // Create zoomed image
        const zoomedImg = document.createElement('img');
        zoomedImg.src = this.src;
        zoomedImg.style.width = '800px';
        zoomedImg.style.height = '600px';
        zoomedImg.style.objectFit = 'cover';
        
        zoomResult.innerHTML = '';
        zoomResult.appendChild(zoomedImg);
    });

    mainImage.addEventListener('mouseleave', function() {
        zoomLens.classList.add('hidden');
        zoomResult.classList.add('hidden');
    });

    mainImage.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update lens position
        const lensSize = 100;
        zoomLens.style.left = (x - lensSize/2) + 'px';
        zoomLens.style.top = (y - lensSize/2) + 'px';
        zoomLens.style.width = lensSize + 'px';
        zoomLens.style.height = lensSize + 'px';
        
        // Update zoom result
        const zoomedImg = zoomResult.querySelector('img');
        if (zoomedImg) {
            const fx = 800 / rect.width;
            const fy = 600 / rect.height;
            zoomedImg.style.marginLeft = (-x * fx) + 'px';
            zoomedImg.style.marginTop = (-y * fy) + 'px';
        }
    });
}

function loadRelatedProducts() {
    if (!window.SpaApp?.products || !currentProduct) return;

    // Find related products (same category, excluding current)
    const relatedProducts = window.SpaApp.products
        .filter(p => p.id !== currentProduct.id && p.categoryId === currentProduct.categoryId)
        .slice(0, 6);

    const relatedContainer = document.getElementById('related-products');
    if (!relatedContainer) return;

    if (relatedProducts.length === 0) {
        document.querySelector('.related-products-slider').closest('section').style.display = 'none';
        return;
    }

    relatedContainer.innerHTML = relatedProducts.map(product => `
        <li class="splide__slide">
            <div class="product-card mx-2" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image || product.images?.[0]}" alt="${product.name}" loading="lazy">
                    ${product.trending ? '<span class="product-badge trending">Xu Hướng</span>' : ''}
                    ${product.bestseller ? '<span class="product-badge bestseller">Bán Chạy</span>' : ''}
                </div>
                <div class="p-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">${product.name}</h3>
                    <div class="flex items-center mb-3">
                        <div class="rating-stars">
                            ${generateStarRating(product.rating || 0)}
                        </div>
                        <span class="text-sm text-gray-500 ml-2">(${product.reviewCount || 0})</span>
                    </div>
                    <div class="price-section mb-4">
                        <div class="flex items-center space-x-2">
                            <span class="current-price">${formatPrice(product.price)}</span>
                            ${product.originalPrice ? `<span class="original-price text-sm">${formatPrice(product.originalPrice)}</span>` : ''}
                        </div>
                    </div>
                    <button class="add-to-cart-btn w-full btn-primary text-sm py-2" data-product-id="${product.id}">
                        <i class="fas fa-calendar-plus mr-2"></i>
                        Đặt Lịch
                    </button>
                </div>
            </div>
        </li>
    `).join('');

    // Initialize related products slider
    relatedSlider = new Splide('#related-slider', {
        type: 'loop',
        perPage: 3,
        perMove: 1,
        gap: '1rem',
        autoplay: true,
        interval: 3000,
        pauseOnHover: true,
        pagination: false,
        breakpoints: {
            768: {
                perPage: 2,
            },
            640: {
                perPage: 1,
            }
        }
    });

    relatedSlider.mount();

    // Add event listeners to related products
    addProductEventListeners(relatedContainer);
}

function loadComboProducts() {
    const comboContainer = document.getElementById('combo-products');
    if (!comboContainer) return;

    // Generate sample combo offers
    const combos = [
        {
            id: 'combo1',
            name: 'Combo Thư Giãn Hoàn Hảo',
            description: 'Massage + Chăm sóc da mặt',
            services: ['Massage Thư Giãn Toàn Thân', 'Chăm Sóc Da Mặt Cơ Bản'],
            originalPrice: 550000,
            comboPrice: 450000,
            discount: 18,
            image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop'
        },
        {
            id: 'combo2',
            name: 'Combo Làm Đẹp Tổng Thể',
            description: 'Chăm sóc da + Tẩy tế bào chết',
            services: ['Chăm Sóc Da Mặt Cơ Bản', 'Tẩy Tế Bào Chết Toàn Thân'],
            originalPrice: 650000,
            comboPrice: 520000,
            discount: 20,
            image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop'
        },
        {
            id: 'combo3',
            name: 'Combo Spa Cao Cấp',
            description: 'Massage đá nóng + Liệu trình trị mụn',
            services: ['Massage Đá Nóng', 'Liệu Trình Trị Mụn'],
            originalPrice: 800000,
            comboPrice: 650000,
            discount: 19,
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop'
        }
    ];

    comboContainer.innerHTML = combos.map(combo => `
        <div class="combo-card bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2" data-aos="fade-up">
            <div class="relative">
                <img src="${combo.image}" alt="${combo.name}" class="w-full h-48 object-cover">
                <span class="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Tiết kiệm ${combo.discount}%
                </span>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-2">${combo.name}</h3>
                <p class="text-gray-600 mb-4">${combo.description}</p>
                
                <div class="space-y-2 mb-4">
                    ${combo.services.map(service => `
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            <span>${service}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="border-t border-gray-200 pt-4">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <div class="text-sm text-gray-500 line-through">${formatPrice(combo.originalPrice)}</div>
                            <div class="text-xl font-bold text-primary-300">${formatPrice(combo.comboPrice)}</div>
                        </div>
                        <div class="text-green-600 font-medium">
                            -${formatPrice(combo.originalPrice - combo.comboPrice)}
                        </div>
                    </div>
                    
                    <button class="w-full btn-primary" data-combo-id="${combo.id}">
                        <i class="fas fa-shopping-cart mr-2"></i>
                        Chọn Combo
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners to combo cards
    comboContainer.querySelectorAll('button[data-combo-id]').forEach(btn => {
        btn.addEventListener('click', function() {
            const comboId = this.dataset.comboId;
            handleComboSelection(comboId);
        });
    });
}

// Event handlers
function updateQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) return;

    let currentQty = parseInt(quantityInput.value) || 1;
    const newQty = Math.max(1, Math.min(10, currentQty + change));
    
    quantityInput.value = newQty;
}

function validateQuantity() {
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) return;

    let qty = parseInt(quantityInput.value) || 1;
    qty = Math.max(1, Math.min(10, qty));
    quantityInput.value = qty;
}

function handleAddToCart() {
    if (!currentProduct) return;

    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    if (window.SpaApp && window.SpaApp.addToCart) {
        for (let i = 0; i < quantity; i++) {
            window.SpaApp.addToCart(currentProduct.id);
        }
    }
}

function handleAddToWishlist() {
    if (!currentProduct) return;

    if (window.SpaApp && window.SpaApp.toggleWishlist) {
        window.SpaApp.toggleWishlist(currentProduct.id);
    }

    // Update button state
    const btn = document.getElementById('add-to-wishlist');
    if (btn) {
        btn.classList.toggle('text-primary-300');
        btn.classList.toggle('border-primary-300');
        btn.classList.toggle('bg-primary-50');
    }
}

function handleShare() {
    if (navigator.share) {
        navigator.share({
            title: currentProduct.name,
            text: currentProduct.description,
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            if (window.SpaApp && window.SpaApp.showNotification) {
                window.SpaApp.showNotification('Đã sao chép liên kết vào clipboard!', 'success');
            }
        });
    }
}

function handleQuickBook() {
    // Simulate phone call or redirect to booking
    window.location.href = 'booking.html?service=' + encodeURIComponent(currentProduct.name);
}

function handleComboSelection(comboId) {
    // Add combo to cart or navigate to combo page
    if (window.SpaApp && window.SpaApp.showNotification) {
        window.SpaApp.showNotification('Combo đã được thêm vào giỏ hàng!', 'success');
    }
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'text-primary-300', 'border-primary-300');
        btn.classList.add('text-gray-600', 'border-transparent');
    });

    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'text-primary-300', 'border-primary-300');
        activeBtn.classList.remove('text-gray-600', 'border-transparent');
    }

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.add('hidden');
        pane.classList.remove('active');
    });

    const activePane = document.getElementById(`${tabName}-pane`);
    if (activePane) {
        activePane.classList.remove('hidden');
        activePane.classList.add('active');

        // Trigger AOS animation for the active pane
        AOS.refresh();
    }

    // Smooth scroll to tab content
    const tabContent = document.querySelector('.tab-content');
    if (tabContent) {
        tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Image handling
function setActiveImage(index) {
    if (index < 0 || index >= productImages.length) return;

    currentImageIndex = index;
    
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = productImages[index];
    }

    // Update thumbnail states
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
        thumb.classList.toggle('border-primary-300', i === index);
        thumb.classList.toggle('border-transparent', i !== index);
    });
}

function changeImage(direction) {
    const newIndex = currentImageIndex + direction;
    if (newIndex >= 0 && newIndex < productImages.length) {
        setActiveImage(newIndex);
    }
}

function openImageModal() {
    const modal = document.querySelector('.image-modal');
    const modalImage = document.getElementById('modal-image');
    
    if (modal && modalImage) {
        modalImage.src = productImages[currentImageIndex];
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeImageModal() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function changeModalImage(direction) {
    const newIndex = currentImageIndex + direction;
    if (newIndex >= 0 && newIndex < productImages.length) {
        currentImageIndex = newIndex;
        const modalImage = document.getElementById('modal-image');
        if (modalImage) {
            modalImage.src = productImages[currentImageIndex];
        }
    }
}

// Review modal
function openReviewModal() {
    const modal = document.querySelector('.review-modal');
    if (modal) {
        modal.classList.remove('hidden');
        selectedRating = 0;
        updateStarDisplay();
    }
}

function closeReviewModal() {
    const modal = document.querySelector('.review-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('review-form').reset();
        selectedRating = 0;
        updateStarDisplay();
    }
}

function setRating(rating) {
    selectedRating = rating;
    updateStarDisplay();
}

function highlightStars(rating) {
    document.querySelectorAll('.star-rating').forEach((star, index) => {
        const starIcon = star.querySelector('i');
        if (index < rating) {
            starIcon.className = 'fas fa-star text-yellow-400 text-2xl';
        } else {
            starIcon.className = 'far fa-star text-gray-300 text-2xl';
        }
    });
}

function updateStarDisplay() {
    highlightStars(selectedRating);
}

function handleReviewSubmit(e) {
    e.preventDefault();
    
    if (selectedRating === 0) {
        alert('Vui lòng chọn số sao đánh giá');
        return;
    }

    // Simulate review submission
    if (window.SpaApp && window.SpaApp.showNotification) {
        window.SpaApp.showNotification('Cảm ơn bạn đã đánh giá! Đánh giá của bạn đang được xem xét.', 'success');
    }
    
    closeReviewModal();
}

// Keyboard navigation
function handleKeyDown(e) {
    const modal = document.querySelector('.image-modal');
    
    if (!modal.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') {
            changeModalImage(-1);
        } else if (e.key === 'ArrowRight') {
            changeModalImage(1);
        } else if (e.key === 'Escape') {
            closeImageModal();
        }
    }
}

// Utility functions
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star text-yellow-400"></i>';
    }
    
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star text-gray-300"></i>';
    }
    
    return starsHTML;
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function addProductEventListeners(container) {
    // Add to cart buttons
    container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = parseInt(this.dataset.productId);
            if (window.SpaApp && window.SpaApp.addToCart) {
                window.SpaApp.addToCart(productId);
            }
        });
    });
    
    // Product card clicks
    container.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('button')) {
                const productId = this.dataset.productId;
                if (productId) {
                    window.location.href = `product-detail.html?id=${productId}`;
                }
            }
        });
    });
}