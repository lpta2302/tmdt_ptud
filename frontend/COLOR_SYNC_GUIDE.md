# Hướng Dẫn Đồng Bộ Màu Sắc và Component

## 1. CSS Variables Đã Tạo

Đã thêm các CSS variables cho gradient trong `/frontend/assets/css/style.css`:

```css
/* Gradients */
--gradient-primary: linear-gradient(to right, var(--color-primary-500), var(--color-secondary-400));
--gradient-primary-light: linear-gradient(to right, var(--color-primary-300), var(--color-secondary-300));
--gradient-primary-br: linear-gradient(to bottom right, var(--color-primary-50), var(--color-secondary-50));
```

## 2. Màu Chủ Đạo

Hệ thống màu đã được chuẩn hóa:
- **Primary (Màu chính)**: Purple - `#a855f7` (primary-500)
- **Secondary (Màu phụ)**: Sky Blue - `#38bdf8` (secondary-400)
- **Gradient chính**: Purple → Sky Blue

## 3. Components Đã Tạo

### Header Component (`/frontend/assets/js/header.js`)
- Header responsive với logo, navigation, search, cart, user menu
- Tự động highlight trang đang active
- Mobile menu responsive

### Footer Component (`/frontend/assets/js/footer.js`)
- Footer thống nhất với thông tin công ty, links, contact
- Cart sidebar component
- Back to top button

## 4. Cách Sử Dụng Components

### Trong file HTML, thêm:

```html
<!-- Trong <head> -->
<script src="assets/js/header.js"></script>
<script src="assets/js/footer.js"></script>

<!-- Trong <body> -->
<body data-page="home"> <!-- Đổi 'home' thành: services, booking, about, contact -->
    <div id="app-header"></div>
    
    <!-- Nội dung trang của bạn -->
    
    <div id="app-footer"></div>
</body>
```

## 5. Danh Sách Thay Đổi Cần Áp Dụng Trong HTML

### Thay đổi tất cả Tailwind classes gradient thành CSS variables:

❌ **Cũ:**
```html
class="bg-gradient-to-r from-primary-300 to-secondary-400"
```

✅ **Mới:**
```html
style="background: var(--gradient-primary);"
```

### Các class cần thay đổi:

1. **Logo Icon:**
   ```html
   <!-- Cũ -->
   <div class="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-400 rounded-full">
   
   <!-- Mới -->
   <div class="logo-icon">
   ```

2. **Logo Text:**
   ```html
   <!-- Cũ -->
   <h1 class="text-2xl font-display font-bold bg-gradient-to-r from-primary-500 to-secondary-400 bg-clip-text text-transparent">
   
   <!-- Mới -->
   <a href="index.html" class="logo-text">Elora</a>
   ```

3. **Button với gradient:**
   ```html
   <!-- Cũ -->
   <button class="bg-gradient-to-r from-primary-300 to-secondary-400 text-white ...">
   
   <!-- Mới -->
   <button class="btn-primary">
   <!-- HOẶC -->
   <button style="background: var(--gradient-primary);" class="text-white ...">
   ```

4. **Text gradient:**
   ```html
   <!-- Cũ -->
   <span class="bg-gradient-to-r from-primary-500 to-secondary-400 bg-clip-text text-transparent">
   
   <!-- Mới - Thêm inline style -->
   <span style="background: var(--gradient-primary); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">
   ```

5. **Background gradient:**
   ```html
   <!-- Cũ -->
   <body class="bg-gradient-to-br from-primary-50 to-secondary-50">
   
   <!-- Mới -->
   <body style="background: var(--gradient-primary-br);">
   ```

6. **Hover states - Đổi màu từ primary-300 sang primary-500:**
   ```html
   <!-- Cũ -->
   hover:text-primary-300
   text-primary-300
   bg-primary-300
   
   <!-- Mới -->
   hover:text-primary-500
   text-primary-500
   bg-primary-500
   ```

## 6. Files Cần Cập Nhật

Các file HTML sau cần được cập nhật theo hướng dẫn trên:

1. ✅ `/frontend/index.html`
2. `/frontend/services.html`
3. `/frontend/booking.html`
4. `/frontend/cart.html`
5. `/frontend/checkout.html`
6. `/frontend/login.html`
7. `/frontend/register.html`
8. `/frontend/contact.html`
9. `/frontend/about.html`
10. `/frontend/product-detail.html`
11. `/frontend/order-success.html`

## 7. CSS Updates Đã Hoàn Thành

✅ Đã cập nhật các class CSS sau để sử dụng variables:
- `.btn-primary` - Sử dụng `var(--gradient-primary)`
- `.nav-link::after` - Sử dụng `var(--gradient-primary)`
- `.hero-overlay` - Cập nhật màu purple và sky
- `.product-badge.trending` - Sử dụng `var(--gradient-primary)`
- `.product-action-btn:hover` - Đổi sang `primary-500`
- `.price-section .current-price` - Đổi sang `primary-500`
- `.splide__arrow:hover` - Đổi box-shadow sang purple
- `.progress-fill` - Sử dụng `var(--gradient-primary)`
- `::-webkit-scrollbar-thumb` - Sử dụng `var(--gradient-primary)`
- `.filter-option:hover` - Đổi sang `primary-500`
- `.filter-checkbox` - Đổi accent-color sang `primary-500`
- `.sort-dropdown:focus` - Đổi border sang `primary-500`
- `.zoom-lens` - Đổi border sang `primary-500`
- `.btn-outline:hover` - Đổi sang `primary-500`
- `@keyframes glow` - Đổi box-shadow sang purple

## 8. Lưu Ý Quan Trọng

1. **Ưu tiên sử dụng CSS variables** thay vì Tailwind utility classes cho màu sắc
2. **Màu chủ đạo primary-500** (`#a855f7` - purple) nên được sử dụng nhiều hơn primary-300
3. **Gradient chuẩn**: Luôn là purple → sky blue (`var(--gradient-primary)`)
4. **Header và Footer**: Sử dụng components để đồng bộ trên tất cả các trang

## 9. Kiểm Tra Sau Khi Cập Nhật

- [ ] Logo hiển thị đúng gradient purple → sky blue
- [ ] Navigation links có underline gradient khi hover
- [ ] Buttons có gradient background đồng nhất
- [ ] Màu hover là primary-500 (purple)
- [ ] Cart badge là primary-500
- [ ] Tất cả text gradient là purple → sky blue
- [ ] Mobile menu hoạt động bình thường
- [ ] Footer hiển thị đồng nhất trên mọi trang
