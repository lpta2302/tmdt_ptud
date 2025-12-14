// Import các thư viện
import { API_BASE } from './config.js';
import { getCurrentUser, isAuthenticated } from './auth-helper.js';

// Chức năng trang Giỏ hàng
let currentTab = 'cart';
let bookings = {
    pending: [],
    confirmed: [],
    completed: []
};
let availablePromos = [
    { code: 'WELCOME10', discount: 10, type: 'percent', description: 'Giảm 10% cho khách hàng mới' },
    { code: 'SUMMER50', discount: 50000, type: 'fixed', description: 'Giảm 50.000đ cho đơn từ 500.000đ' },
    { code: 'VIP20', discount: 20, type: 'percent', description: 'Giảm 20% cho thành viên VIP' },
    { code: 'FREESHIP', discount: 30000, type: 'fixed', description: 'Miễn phí dịch vụ (30.000đ)' }
];
let appliedPromo = null;
let selectedItems = []; // Danh sách ID của items được chọn để thanh toán

function bindEvents() {
    // Xóa giỏ hàng
    document.getElementById('clear-cart')?.addEventListener('click', () => {
        clearCart();
    });

    // Checkbox chọn tất cảả
    document.getElementById('select-all-cart')?.addEventListener('change', (e) => {
        toggleSelectAll(e.target.checked);
    });

    // Áp dụng mã khuyến mãin mãi
    document.getElementById('apply-promo')?.addEventListener('click', () => {
        applyPromoCode();
    });

    // Nhấn Enter trong ô nhập mã khuyến mãi khuyến mãi
    document.getElementById('promo-code')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyPromoCode();
        }
    });

    // Nút thanh toán
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
        proceedToCheckout();
    });

    // Sự kiện modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('cancel-remove') || e.target.classList.contains('modal-overlay')) {
            closeRemoveModal();
        }
        if (e.target.classList.contains('confirm-remove')) {
            confirmRemoveItem();
        }
    });

    // Các nút tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchTab(tab);
        });
    });
}
function initTabs() {
    // Thiết lập tab ban đầu
    switchTab('cart');
}

function switchTab(tabName) {
    currentTab = tabName;

    // Cập nhật các nút tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Cập nhật nội dung tab
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.dataset.tabContent === tabName) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    // Hiển/ẩn sản phẩm gợi ý (chỉ ở tab giỏ hàng)
    const suggestedSection = document.querySelector('.suggested-products-section');
    if (suggestedSection) {
        suggestedSection.style.display = tabName === 'cart' ? 'block' : 'none';
    }

    // Hiển/ẩn tóm tắt đơn hàng dựa vào tab
    const orderSummary = document.querySelector('.lg\\:w-1\\/3');
    if (orderSummary) {
        orderSummary.style.display = tabName === 'cart' ? 'block' : 'none';
    }
}

async function loadBookings() {
    if (!isAuthenticated()) {
        // Hide booking tabs if not logged in
        document.querySelectorAll('.tab-btn:5not([data-tab="cart"])').forEach(btn => {
            btn.style.display = 'none';
        });
        return;
    }

    try {
        const user = getCurrentUser();
        const response = await fetch(`${API_BASE}/bookings?customerId=${user._id}`);

        if (!response.ok) {
            throw new Error('Failed to load bookings');
        }

        const data = await response.json();
        const bookingsResponse = data.bookings || [];
        // Group bookings by status
        bookings = {
            pending: bookingsResponse.filter(b => b.status === 'pending'),
            confirmed: bookingsResponse.filter(b => b.status === 'confirmed' || b.status === 'in_progress'),
            completed: bookingsResponse.filter(b => b.status === 'completed')
        };

        // Update counts
        document.getElementById('pending-count').textContent = bookings.pending.length;
        document.getElementById('confirmed-count').textContent = bookings.confirmed.length;
        document.getElementById('completed-count').textContent = bookings.completed.length;

        // Render bookings
        renderBookings('pending');
        renderBookings('confirmed');
        renderBookings('completed');

    } catch (error) {
    }
}

function renderBookings(status) {
    const container = document.getElementById(`${status}-bookings-container`);
    if (!container) return;

    const bookingsForStatus = bookings[status];

    if (bookingsForStatus.length === 0) {
        container.innerHTML = `
            <div class="p-12 text-center">
                <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Chưa có lịch đặt nào</p>
            </div>
        `;
        return;
    }

    container.innerHTML = bookingsForStatus.map(booking => {
        return createBookingHTML(booking);
    }).join('');
}

function createBookingHTML(booking) {
    const date = new Date(booking.appointmentDate);
    const formattedDate = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const statusText = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        in_progress: 'Đang thực hiện',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy'
    };

    const statusClass = `status-${booking.status}`;

    // Render services list với scroll nếu nhiều dịch vụ
    const servicesHTML = booking.services && booking.services.length > 0 ? `
        <div class="mb-3">
            <p class="text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-spa mr-1 text-primary-500"></i>
                Dịch vụ (${booking.services.length}):
            </p>
            <div class="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                ${booking.services.map(service => `
                    <div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        ${service.product?.images?.[0]?.gridfsId ? `
                            <img src="${API_BASE}/files/${service.product.images[0].gridfsId}" 
                                 alt="${service.product?.name || 'Dịch vụ'}" 
                                 class="w-12 h-12 object-cover rounded-lg flex-shrink-0">
                        ` : ''}
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-800 truncate">${service.product?.name || 'Dịch vụ'}</p>
                            <p class="text-xs text-primary-500">${formatPrice(service.price || 0)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    return `
        <div class="booking-card p-6" data-booking-id="${booking._id}">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-start justify-between mb-3">
                        <h3 class="font-semibold text-gray-800 text-lg">
                            Booking #${booking._id.slice(-6).toUpperCase()}
                        </h3>
                        <span class="status-badge ${statusClass}">
                            ${statusText[booking.status] || booking.status}
                        </span>
                    </div>
                    
                    ${servicesHTML}
                    
                    <div class="space-y-2 text-sm text-gray-600">
                        <div class="flex items-center">
                            <i class="fas fa-calendar mr-2 text-primary-500 w-4"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-clock mr-2 text-primary-500 w-4"></i>
                            <span>${booking.appointmentTime}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-user mr-2 text-primary-500 w-4"></i>
                            <span>${booking.fullname}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-phone mr-2 text-primary-500 w-4"></i>
                            <span>${booking.phone}</span>
                        </div>
                        ${booking.specialRequests ? `
                            <div class="flex items-start">
                                <i class="fas fa-comment mr-2 text-primary-500 w-4 mt-1"></i>
                                <span class="flex-1">${booking.specialRequests}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="flex flex-col items-end space-y-2">
                    <div class="text-right">
                        <div class="text-2xl font-bold text-primary-500">
                            ${formatPrice(booking.finalAmount || 0)}
                        </div>
                        <div class="text-xs text-gray-500">
                            Mã: #${booking._id.slice(-6).toUpperCase()}
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        ${booking.status === 'pending' ? `
                            <button onclick="cartManager.cancelBooking('${booking._id}')" 
                                    class="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                <i class="fas fa-times mr-1"></i>
                                Hủy lịch
                            </button>
                        ` : ''}
                        ${booking.status === 'completed' ? `
                            <button onclick="cartManager.reviewBooking('${booking._id}')" 
                                    class="px-4 py-2 text-sm bg-gradient-to-r from-primary-500 to-secondary-400 text-white rounded-lg hover:from-primary-600 hover:to-secondary-500 transition-colors">
                                <i class="fas fa-star mr-1"></i>
                                Đánh giá
                            </button>
                        ` : ''}
                        <button onclick="cartManager.viewBookingDetail('${booking._id}')" 
                                class="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            <i class="fas fa-eye mr-1"></i>
                            Chi tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function cancelBooking(bookingId) {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch đặt này?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'cancelled' })
        });

        if (!response.ok) {
            throw new Error('Failed to cancel booking');
        }

        showNotification('Đã hủy lịch đặt thành công', 'success');
        loadBookings();

    } catch (error) {
        showNotification('Không thể hủy lịch đặt. Vui lòng thử lại!', 'error');
    }
}

function reviewBooking(bookingId) {
    // TODO: Implement review functionality
    showNotification('Tính năng đánh giá đang được phát triển', 'info');
}

function viewBookingDetail(bookingId) {
    // TODO: Implement booking detail view
    showNotification('Chi tiết lịch đặt đang được phát triển', 'info');
}

// Toggle chọn/bỏ chọn một item
function toggleItemSelection(id, isChecked) {
    if (isChecked) {
        if (!selectedItems.includes(id.toString())) {
            selectedItems.push(id.toString());
        }
    } else {
        selectedItems = selectedItems.filter(itemId => itemId !== id.toString());
    }

    updateCartDisplay();
    updateSelectAllCheckbox();
}

// Toggle select/deselect all items
function toggleSelectAll(isChecked) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    if (isChecked) {
        selectedItems = cart.map(item => item.id.toString());
    } else {
        selectedItems = [];
    }

    loadCart(isChecked);
    updateCartDisplay();
}

// Cập nhật trạng thái select all checkbox
function updateSelectAllCheckbox() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const selectAllCheckbox = document.getElementById('select-all-cart');

    if (selectAllCheckbox && cart.length > 0) {
        selectAllCheckbox.checked = selectedItems.length === cart.length;
        selectAllCheckbox.indeterminate = selectedItems.length > 0 && selectedItems.length < cart.length;
    }
}

function loadCart(selectedAll = false) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const container = document.getElementById('cart-items-container');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = container?.parentElement?.parentElement;

    // Update cart count in tab
    document.getElementById('cart-count').textContent = cart.length;

    // Khởi tạo selectedItems nếu chưa có (chọn tất cả mặc định)
    if (!selectedItems || selectedItems.length === 0 && cart.length > 0) {
        selectedItems = selectedAll ? cart.map(item => item.id.toString()) : [];
    }

    if (cart.length === 0) {
        selectedItems = [];
        if (container) {
            container.innerHTML = `
                <div class="p-12 text-center">
                    <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg mb-2">Giỏ hàng trống</p>
                    <p class="text-gray-400 text-sm mb-6">Hãy thêm dịch vụ yêu thích vào giỏ hàng!</p>
                    <a href="services.html" class="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-400 text-white rounded-lg hover:from-primary-600 hover:to-secondary-500 transition-colors">
                        <i class="fas fa-spa mr-2"></i>
                        Xem dịch vụ
                    </a>
                </div>
            `;
        }
        return;
    }

    if (container) {
        container.innerHTML = cart.map(item => createCartItemHTML(item)).join('');
    }

    // Update cart count
    document.getElementById('cart-items-count').textContent = cart.length;

    // Bind item events
    bindCartItemEvents();

    // Update select all checkbox state
    updateSelectAllCheckbox();
}

function createCartItemHTML(item) {
    // Kiểm tra nếu là booking item (có nhiều dịch vụ)
    if (item.type === 'booking' && item.services && item.services.length > 0) {
        const date = new Date(item.appointmentDate);
        const formattedDate = date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const isSelected = selectedItems.includes(item.id.toString());

        return `
            <div class="cart-item p-6 border-b border-gray-200 hover:bg-gray-50 transition-colors" data-id="${item.id}">
                <div class="flex items-start gap-4 mb-4">
                    <input type="checkbox" class="item-checkbox w-5 h-5 mt-1 rounded border-gray-300 text-primary-500 focus:ring-primary-300 cursor-pointer" 
                           data-id="${item.id}" ${isSelected ? 'checked' : ''}>
                    <div class="flex-1">
                        <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-calendar-alt text-primary-500"></i>
                            <h3 class="font-semibold text-gray-800">Đặt lịch dịch vụ</h3>
                        </div>
                        <div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span><i class="fas fa-calendar mr-1"></i>${formattedDate}</span>
                            <span><i class="fas fa-clock mr-1"></i>${item.appointmentTime}</span>
                        </div>
                    </div>
                    <button class="remove-item text-sm text-red-500 hover:text-red-700 transition-colors" 
                            data-id="${item.id}">
                        <i class="fas fa-trash mr-1"></i>
                        Xóa tất cả
                    </button>
                </div>

                <!-- Services List -->
                <div class="space-y-3 mb-4">
                    <p class="text-sm font-medium text-gray-700">
                        <i class="fas fa-spa mr-1"></i>
                        Dịch vụ (${item.services.length}):
                    </p>
                    <div class="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        ${item.services.map((service, index) => `
                            <div class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                ${service.image ? `
                                    <img src="${API_BASE}/files/${service.image}" 
                                         alt="${service.name}" 
                                         class="w-16 h-16 object-cover rounded-lg flex-shrink-0">
                                ` : ''}
                                <div class="flex-1 min-w-0">
                                    <h5 class="font-semibold text-gray-800 truncate">${service.name}</h5>
                                    <p class="text-sm text-primary-500 font-medium">${formatPrice(service.price)}</p>
                                    ${service.duration ? `<p class="text-xs text-gray-500">${service.duration}</p>` : ''}
                                </div>
                                <button class="remove-service-btn flex-shrink-0 w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                                        data-cart-id="${item.id}" 
                                        data-service-index="${index}">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${item.notes ? `
                    <div class="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p class="text-sm text-gray-700">
                            <i class="fas fa-comment mr-1 text-yellow-600"></i>
                            <span class="font-medium">Ghi chú:</span> ${item.notes}
                        </p>
                    </div>
                ` : ''}

                <!-- Total -->
                <div class="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span class="text-sm text-gray-600">Tổng cộng:</span>
                    <span class="text-xl font-bold text-primary-500">${formatPrice(item.totalAmount)}</span>
                </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Original cart item (single product)
    const isSelected = selectedItems.includes(item.id.toString());

    return `
        <div class="cart-item p-6 border-b border-gray-200 hover:bg-gray-50 transition-colors" data-id="${item.id}">
            <div class="flex items-center space-x-4">
                <input type="checkbox" class="item-checkbox w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-300 cursor-pointer" 
                       data-id="${item.id}" ${isSelected ? 'checked' : ''}>
                <!-- Product Image -->
                <div class="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100 flex-shrink-0">
                    <img src="${item.image || 'https://via.placeholder.com/80x80/f472b6/ffffff?text=Spa'}" 
                         alt="${item.name}" 
                         class="w-full h-full object-cover">
                </div>

                <!-- Product Info -->
                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-800 mb-1 truncate">${item.name}</h3>
                    <p class="text-sm text-gray-600 mb-2">${item.category || 'Dịch vụ spa'}</p>
                    <div class="flex items-center space-x-4">
                        <span class="text-lg font-bold text-primary-300">
                            ${formatPrice(item.price)}
                        </span>
                        ${item.originalPrice && item.originalPrice > item.price ?
            `<span class="text-sm text-gray-400 line-through">
                                ${formatPrice(item.originalPrice)}
                            </span>` : ''
        }
                    </div>
                </div>

                <!-- Quantity Controls -->
                <div class="flex items-center space-x-3">
                    <button class="quantity-btn minus w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors" 
                            data-id="${item.id}">
                        <i class="fas fa-minus text-xs"></i>
                    </button>
                    <span class="quantity w-12 text-center font-semibold">${item.quantity}</span>
                    <button class="quantity-btn plus w-8 h-8 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-300 flex items-center justify-center transition-colors" 
                            data-id="${item.id}">
                        <i class="fas fa-plus text-xs"></i>
                    </button>
                </div>

                <!-- Item Total -->
                <div class="text-right">
                    <div class="font-bold text-lg text-gray-800">
                        ${formatPrice(item.price * item.quantity)}
                    </div>
                    <button class="remove-item text-sm text-red-500 hover:text-red-700 transition-colors mt-1" 
                            data-id="${item.id}">
                        <i class="fas fa-trash mr-1"></i>
                        Xóa
                    </button>
                </div>
            </div>

            <!-- Special Options -->
            ${item.options ? `
                <div class="mt-4 pl-24">
                    <p class="text-sm text-gray-600">
                        <span class="font-medium">Tùy chọn:</span> ${item.options}
                    </p>
                </div>
            ` : ''}

            <!-- Duration -->
            ${item.duration ? `
                <div class="mt-2 pl-24">
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-clock mr-1"></i>
                        Thời gian: ${item.duration}
                    </p>
                </div>
            ` : ''}
        </div>
    `;
}

function bindCartItemEvents() {
    // Quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const action = e.currentTarget.classList.contains('plus') ? 'increase' : 'decrease';
            updateQuantity(id, action);
        });
    });

    // Remove item buttons
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            showRemoveModal(id);
        });
    });

    // Remove individual service from booking
    document.querySelectorAll('.remove-service-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cartId = e.currentTarget.dataset.cartId;
            const serviceIndex = parseInt(e.currentTarget.dataset.serviceIndex);
            removeServiceFromBooking(cartId, serviceIndex);
        });
    });

    // Item checkboxes
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.currentTarget.dataset.id;
            toggleItemSelection(id, e.target.checked);
        });
    });
}

function updateQuantity(id, action) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const itemIndex = cart.findIndex(item => item.id === id);

    if (itemIndex !== -1) {
        if (action === 'increase') {
            cart[itemIndex].quantity += 1;
        } else if (action === 'decrease' && cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
        updateCartDisplay();

        // Show notification
        showNotification('Đã cập nhật số lượng', 'success');
    }
}

function showRemoveModal(id) {
    itemToRemove = id;
    document.querySelector('.remove-modal').classList.remove('hidden');
}

function closeRemoveModal() {
    document.querySelector('.remove-modal').classList.add('hidden');
    itemToRemove = null;
}

function confirmRemoveItem() {
    if (itemToRemove) {
        removeItem(itemToRemove);
        closeRemoveModal();
    }
}

function removeItem(id) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const updatedCart = cart.filter(item => item.id.toString() !== id.toString());

    localStorage.setItem('cart', JSON.stringify(updatedCart));

    // Xóa khỏi selectedItems nếu có
    selectedItems = selectedItems.filter(itemId => itemId !== id.toString());

    loadCart();
    updateCartDisplay();

    // Update global cart count
    updateCartCount();

    showNotification('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
}

// Xóa một dịch vụ khỏi booking
function removeServiceFromBooking(cartId, serviceIndex) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const itemIndex = cart.findIndex(item => item.id.toString() === cartId.toString());

    if (itemIndex === -1) return;

    const item = cart[itemIndex];

    // Nếu chỉ còn 1 dịch vụ, xóa cả booking
    if (item.services.length <= 1) {
        if (confirm('Đây là dịch vụ cuối cùng. Bạn có muốn xóa cả lịch đặt này?')) {
            removeItem(cartId);
        }
        return;
    }

    // Xóa dịch vụ tại index
    item.services.splice(serviceIndex, 1);

    // Cập nhật lại tổng tiền
    item.totalAmount = item.services.reduce((sum, s) => sum + s.price, 0);

    // Lưu lại
    cart[itemIndex] = item;
    localStorage.setItem('cart', JSON.stringify(cart));

    // Reload
    loadCart();
    updateCartDisplay();

    showNotification('Đã xóa dịch vụ khỏi booking', 'success');
}

function clearCart() {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
        localStorage.removeItem('cart');
        selectedItems = [];
        appliedPromo = null;
        loadCart();
        updateCartDisplay();
        updateCartCount();
        showNotification('Đã xóa tất cả sản phẩm', 'success');
    }
}

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Chỉ tính các items đã được chọn
    const selectedCart = cart.filter(item => selectedItems.includes(item.id.toString()));

    // Calculate subtotal - handle both regular items and booking items
    const subtotal = selectedCart.reduce((total, item) => {
        if (item.type === 'booking' && item.totalAmount) {
            return total + item.totalAmount;
        }
        return total + (item.price * (item.quantity || 1));
    }, 0);

    // Calculate discount
    let discount = 0;
    if (appliedPromo) {
        if (appliedPromo.type === 'percent') {
            discount = subtotal * (appliedPromo.discount / 100);
        } else {
            discount = appliedPromo.discount;
        }
    }

    const total = subtotal - discount;

    // Update display
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('total-amount').textContent = formatPrice(Math.max(0, total));

    // Show/hide discount row
    const discountRow = document.getElementById('discount-row');
    if (discount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('discount-amount').textContent = '-' + formatPrice(discount);
    } else {
        discountRow.style.display = 'none';
    }

    // Enable/disable checkout button based on selected items
    const checkoutBtn = document.getElementById('checkout-btn');
    if (selectedItems.length > 0) {
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

function loadAvailablePromos() {
    const promoList = document.getElementById('promo-list');
    if (!promoList) return;

    promoList.innerHTML = availablePromos.map(promo => `
        <div class="promo-item bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-3 cursor-pointer hover:from-primary-100 hover:to-secondary-100 transition-colors"
             onclick="cartManager.quickApplyPromo('${promo.code}')">
            <div class="flex items-center justify-between">
                <div>
                    <span class="font-semibold text-primary-300">${promo.code}</span>
                    <p class="text-xs text-gray-600 mt-1">${promo.description}</p>
                </div>
                <button class="text-primary-300 hover:text-primary-300">
                    <i class="fas fa-plus-circle"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function quickApplyPromo(code) {
    document.getElementById('promo-code').value = code;
    applyPromoCode();
}

function applyPromoCode() {
    const promoCode = document.getElementById('promo-code').value.trim().toUpperCase();
    const messageEl = document.getElementById('promo-message');

    if (!promoCode) {
        showPromoMessage('Vui lòng nhập mã giảm giá', 'error');
        return;
    }

    const promo = availablePromos.find(p => p.code === promoCode);

    if (!promo) {
        showPromoMessage('Mã giảm giá không hợp lệ', 'error');
        return;
    }

    // Check minimum order for SUMMER50
    if (promo.code === 'SUMMER50') {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        if (subtotal < 500000) {
            showPromoMessage('Đơn hàng tối thiểu 500.000đ cho mã này', 'error');
            return;
        }
    }

    appliedPromo = promo;
    updateCartDisplay();
    showPromoMessage(`Đã áp dụng mã giảm giá ${promo.code}`, 'success');

    // Hide applied promo from available list
    const promoItems = document.querySelectorAll('.promo-item');
    promoItems.forEach(item => {
        if (item.textContent.includes(promo.code)) {
            item.style.display = 'none';
        }
    });
}

function showPromoMessage(message, type) {
    const messageEl = document.getElementById('promo-message');
    messageEl.textContent = message;
    messageEl.className = `mt-2 text-sm ${type === 'success' ? 'text-green-600' : 'text-red-600'}`;
    messageEl.classList.remove('hidden');

    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 3000);
}

async function loadSuggestedProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        let products = await response.json();

        if (!Array.isArray(products)) {
            // Fallback data
            products = [
                {
                    id: 101,
                    name: 'Tinh Dầu Massage Lavender',
                    price: 199000,
                    originalPrice: 250000,
                    image: 'https://via.placeholder.com/300x300/f472b6/ffffff?text=Lavender+Oil',
                    category: 'Sản phẩm chăm sóc'
                },
                {
                    id: 102,
                    name: 'Kem Dưỡng Da Premium',
                    price: 399000,
                    originalPrice: 499000,
                    image: 'https://via.placeholder.com/300x300/a855f7/ffffff?text=Premium+Cream',
                    category: 'Sản phẩm chăm sóc'
                },
                {
                    id: 103,
                    name: 'Set Chăm Sóc Da Cơ Bản',
                    price: 599000,
                    originalPrice: 799000,
                    image: 'https://via.placeholder.com/300x300/ec4899/ffffff?text=Skincare+Set',
                    category: 'Combo sản phẩm'
                }
            ];
        }

        // Get random products for suggestions
        const suggested = products.sort(() => Math.random() - 0.5).slice(0, 3);
        renderSuggestedProducts(suggested);
    } catch (error) {
        // Load fallback data
        loadSuggestedProducts();
    }
}

function renderSuggestedProducts(products) {
    const container = document.getElementById('suggested-products');
    if (!container) return;

    container.innerHTML = products.map(product => `
        <div class="product-card bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div class="relative">
                <img src="${product.image}" alt="${product.name}" class="w-full h-32 object-cover">
                ${product.originalPrice && product.originalPrice > product.price ?
            `<div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        -${Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </div>` : ''
        }
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-gray-800 mb-2 text-sm line-clamp-2">${product.name}</h3>
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <span class="text-primary-300 font-bold">${formatPrice(product.price)}</span>
                        ${product.originalPrice && product.originalPrice > product.price ?
            `<span class="text-xs text-gray-400 line-through ml-2">${formatPrice(product.originalPrice)}</span>` : ''
        }
                    </div>
                </div>
                <button class="w-full bg-gradient-to-r from-primary-500 to-secondary-400 text-white py-2 px-4 rounded-lg hover:from-primary-400 hover:to-secondary-500 transition-colors text-sm"
                        onclick="addToCart({id: ${product.id}, name: '${product.name}', price: ${product.price}, image: '${product.image}', category: '${product.category}'})">
                    <i class="fas fa-plus mr-1"></i>
                    Thêm Vào Giỏ
                </button>
            </div>
        </div>
    `).join('');
}

async function loadRecentlyViewed() {
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const section = document.getElementById('recently-viewed-section');

    if (recentlyViewed.length === 0) {
        section.style.display = 'none';
        return;
    }

    try {
        const response = await fetch('/api/products');
        let allProducts = await response.json();

        if (!Array.isArray(allProducts)) {
            // Fallback data
            allProducts = [
                {
                    id: 1,
                    name: 'Massage Thư Giãn Toàn Thân',
                    price: 850000,
                    image: 'https://via.placeholder.com/300x300/f472b6/ffffff?text=Full+Body+Massage',
                    category: 'Massage'
                },
                {
                    id: 2,
                    name: 'Chăm Sóc Da Mặt Cao Cấp',
                    price: 650000,
                    image: 'https://via.placeholder.com/300x300/a855f7/ffffff?text=Premium+Facial',
                    category: 'Chăm sóc da'
                }
            ];
        }

        const products = allProducts.filter(product =>
            recentlyViewed.includes(product.id)
        ).slice(0, 4);

        renderRecentlyViewed(products);
    } catch (error) {
    }
}

function renderRecentlyViewed(products) {
    const container = document.getElementById('recently-viewed-products');
    if (!container || products.length === 0) return;

    container.innerHTML = products.map(product => `
        <div class="product-card group" data-aos="fade-up">
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div class="relative overflow-hidden">
                    <img src="${product.image}" alt="${product.name}" 
                         class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div class="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                        <button class="w-full bg-white/90 backdrop-blur-sm text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-white transition-colors"
                                onclick="location.href='product-detail.html?id=${product.id}'">
                            Xem Chi Tiết
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <span class="text-primary-300 text-sm font-medium">${product.category}</span>
                    <h3 class="font-semibold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-300 transition-colors">
                        ${product.name}
                    </h3>
                    <div class="flex items-center justify-between">
                        <span class="text-2xl font-bold text-primary-300">${formatPrice(product.price)}</span>
                        <button class="bg-gradient-to-r from-primary-500 to-secondary-400 text-white p-3 rounded-full hover:from-primary-400 hover:to-secondary-500 transition-colors hover-glow"
                                onclick="addToCart({id: ${product.id}, name: '${product.name}', price: ${product.price}, image: '${product.image}', category: '${product.category}'})">
                            <i class="fas fa-shopping-bag"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function proceedToCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    if (cart.length === 0) {
        showNotification('Giỏ hàng trống. Vui lòng thêm sản phẩm!', 'warning');
        return;
    }

    if (selectedItems.length === 0) {
        showNotification('Vui lòng chọn ít nhất một sản phẩm để thanh toán!', 'warning');
        return;
    }

    // Chỉ lấy các items đã được chọn
    const selectedCart = cart.filter(item => selectedItems.includes(item.id.toString()));

    // Save checkout data với selected items
    const checkoutData = {
        items: selectedCart,
        subtotal: selectedCart.reduce((total, item) => {
            if (item.type === 'booking' && item.totalAmount) {
                return total + item.totalAmount;
            }
            return total + (item.price * item.quantity);
        }, 0),
        appliedPromo: appliedPromo,
        discount: calculateDiscount(),
        total: calculateTotal()
    };

    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

    // Redirect to checkout
    window.location.href = 'checkout.html';
}

function calculateDiscount() {
    if (!appliedPromo) return 0;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    if (appliedPromo.type === 'percent') {
        return subtotal * (appliedPromo.discount / 100);
    } else {
        return appliedPromo.discount;
    }
}

function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const subtotal = cart.reduce((total, item) => selectedItems.includes(item.id.toString()) ? total + item.totalAmount : total, 0);
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount);
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price).replace('₫', 'đ');
}

// Initialize cart manager when DOM is loaded
let cartManager;
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false
});

async function initializeApp() {
    bindEvents();
    await loadCart();
    await loadBookings();
    await loadSuggestedProducts();
    await loadRecentlyViewed();
    await loadAvailablePromos();
    updateCartDisplay();
    initTabs();
}

document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

// Global functions for compatibility
function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Check if product already exists
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1,
            addedAt: new Date().toISOString()
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    // Update displays
    cartManager.loadCart();
    cartManager.updateCartDisplay();
    updateCartCount();

    showNotification(`Đã thêm "${product.name}" vào giỏ hàng`, 'success');
}

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-4 z-50 px-6 py-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300 ${type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-black' :
                'bg-blue-500 text-white'
        }`;

    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' :
            type === 'error' ? 'exclamation-circle' :
                type === 'warning' ? 'exclamation-triangle' :
                    'info-circle'
        }"></i>
            <span>${message}</span>
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
    }, 3000);
}