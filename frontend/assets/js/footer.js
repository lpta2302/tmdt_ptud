// Footer Component - Sử dụng cho tất cả các trang
function createFooter() {
    return `
    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-16">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                <!-- Company Info -->
                <div data-aos="fade-up">
                    <div class="flex items-center space-x-3 mb-6">
                        <div class="logo-icon">
                            <i class="fas fa-spa text-white"></i>
                        </div>
                        <h3 class="text-xl font-display font-bold">Elora</h3>
                    </div>
                    <p class="text-gray-400 mb-6">
                        Không gian thư giãn lý tưởng với các dịch vụ spa và massage chuyên nghiệp,
                        mang đến trải nghiệm chăm sóc sức khỏe và sắc đẹp hoàn hảo.
                    </p>
                    <div class="flex space-x-4">
                        <a href="#" class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="#" class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                            <i class="fab fa-youtube"></i>
                        </a>
                        <a href="#" class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                            <i class="fab fa-tiktok"></i>
                        </a>
                    </div>
                </div>

                <!-- Quick Links -->
                <div data-aos="fade-up" data-aos-delay="100">
                    <h4 class="text-lg font-semibold mb-6">Liên Kết Nhanh</h4>
                    <ul class="space-y-3">
                        <li><a href="index.html" class="text-gray-400 hover:text-white transition-colors">Trang Chủ</a></li>
                        <li><a href="services.html" class="text-gray-400 hover:text-white transition-colors">Dịch Vụ</a></li>
                        <li><a href="booking.html" class="text-gray-400 hover:text-white transition-colors">Đặt Lịch</a></li>
                        <li><a href="about.html" class="text-gray-400 hover:text-white transition-colors">Giới Thiệu</a></li>
                        <li><a href="contact.html" class="text-gray-400 hover:text-white transition-colors">Liên Hệ</a></li>
                    </ul>
                </div>

                <!-- Featured Services -->
                <div data-aos="fade-up" data-aos-delay="200">
                    <h4 class="text-lg font-semibold mb-6">Dịch Vụ Nổi Bật</h4>
                    <ul class="space-y-3">
                        <li><a href="services.html" class="text-gray-400 hover:text-white transition-colors">Massage Thư Giãn</a></li>
                        <li><a href="services.html" class="text-gray-400 hover:text-white transition-colors">Chăm Sóc Da Mặt</a></li>
                        <li><a href="services.html" class="text-gray-400 hover:text-white transition-colors">Tẩy Tế Bào Chết</a></li>
                        <li><a href="services.html" class="text-gray-400 hover:text-white transition-colors">Liệu Trình Trị Mụn</a></li>
                        <li><a href="services.html" class="text-gray-400 hover:text-white transition-colors">Chăm Sóc Tóc</a></li>
                    </ul>
                </div>

                <!-- Contact Info -->
                <div data-aos="fade-up" data-aos-delay="300">
                    <h4 class="text-lg font-semibold mb-6">Thông Tin Liên Hệ</h4>
                    <div class="space-y-4">
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-map-marker-alt text-primary-500 mt-1"></i>
                            <span class="text-gray-400">123 Nguyễn Văn Linh, Q.7, TP.HCM</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-phone text-primary-500"></i>
                            <span class="text-gray-400">0123 456 789</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-envelope text-primary-500"></i>
                            <span class="text-gray-400">info@elora.vn</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-clock text-primary-500"></i>
                            <span class="text-gray-400">8:00 - 22:00 hàng ngày</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Section -->
            <div class="border-t border-gray-800 pt-8">
                <div class="flex flex-col md:flex-row justify-between items-center">
                    <p class="text-gray-400 text-sm mb-4 md:mb-0">
                        © 2024 Elora. Tất cả quyền được bảo lưu.
                    </p>
                    <div class="flex space-x-6 text-sm">
                        <a href="#" class="text-gray-400 hover:text-white transition-colors">Chính Sách Bảo Mật</a>
                        <a href="#" class="text-gray-400 hover:text-white transition-colors">Điều Khoản Sử Dụng</a>
                        <a href="#" class="text-gray-400 hover:text-white transition-colors">Hỗ Trợ</a>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <!-- Cart Sidebar -->
    <div class="cart-sidebar fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 z-50">
        <div class="p-6 border-b">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Giỏ Hàng</h3>
                <button class="cart-close text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>

        <div class="cart-items flex-1 overflow-y-auto p-6">
            <div class="empty-cart text-center py-12">
                <i class="fas fa-shopping-bag text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Giỏ hàng của bạn đang trống</p>
                <a href="services.html" style="background: var(--gradient-primary);"
                    class="inline-block mt-4 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all">
                    Khám Phá Dịch Vụ
                </a>
            </div>
        </div>

        <div class="cart-footer p-6 border-t">
            <div class="flex justify-between items-center mb-4">
                <span class="font-semibold">Tổng cộng:</span>
                <span class="cart-total font-bold text-lg text-primary-500">0đ</span>
            </div>
            <button style="background: var(--gradient-primary);"
                class="w-full text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all">
                Thanh Toán
            </button>
        </div>
    </div>

    <!-- Cart Overlay -->
    <div class="cart-overlay fixed inset-0 bg-black bg-opacity-50 hidden z-40"></div>

    <!-- Back to Top Button -->
    <button style="background: var(--gradient-primary);"
        class="back-to-top fixed bottom-8 right-8 w-12 h-12 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all opacity-0 pointer-events-none z-30">
        <i class="fas fa-arrow-up"></i>
    </button>
    `;
}

// Tự động load footer khi trang load
document.addEventListener('DOMContentLoaded', function() {
    const footerContainer = document.getElementById('app-footer');
    if (footerContainer) {
        footerContainer.innerHTML = createFooter();
    }
});
