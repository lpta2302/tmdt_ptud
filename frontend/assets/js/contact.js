AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false
});
// Xử lý gửi biểu mẫu
document.getElementById('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();

    // Mô phỏng gửi tin nhắn
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang gửi...';
    submitBtn.disabled = true;

    setTimeout(() => {
        // Hiển thị modal thành công
        document.getElementById('success-modal').classList.remove('hidden');
        document.querySelector('#success-modal .transform').classList.add('scale-100');
        document.querySelector('#success-modal .transform').classList.remove('scale-95');

        // Đặt lại biểu mẫu
        this.reset();
        submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Gửi Tin Nhắn';
        submitBtn.disabled = false;
    }, 2000);
});

// Các hàm xử lý modal
function closeModal() {
    document.getElementById('success-modal').classList.add('hidden');
}

// Đóng modal khi click vào overlay
document.getElementById('success-modal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal();
    }
});