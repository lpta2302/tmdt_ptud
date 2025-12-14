// Các hàm hỗ trợ xác thực
import { API_BASE } from './config.js';

/**
 * Kiểm tra người dùng đã đăng nhập chưa
 * @returns {boolean}
 */
export function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
}

/**
 * Lấy thông tin người dùng hiện tại
 * @returns {Object|null}
 */
export function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

/**
 * Lấy token xác thực
 * @returns {string|null}
 */
export function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Đăng xuất người dùng
 */
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingBooking');
    window.location.href = 'index.html';
}

/**
 * Yêu cầu xác thực - chuyển hướng đến trang đăng nhập nếu chưa xác thực
 * @param {string} returnUrl - URL để quay lại sau khi đăng nhập
 */
export function requireAuth(returnUrl = null) {
    if (!isAuthenticated()) {
        const redirect = returnUrl || window.location.pathname + window.location.search;
        window.location.href = `login.html?redirect=${encodeURIComponent(redirect)}`;
        return false;
    }
    return true;
}

/**
 * Update user profile in localStorage
 * @param {Object} updates - Updated user data
 */
export function updateUserProfile(updates) {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    }
    return null;
}

/**
 * Verify token validity with backend
 * @returns {Promise<boolean>}
 */
export async function verifyToken() {
    const token = getAuthToken();
    if (!token) return false;

    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Token invalid, clear auth data
            logout();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

/**
 * Make authenticated API request
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
        ...options,
        headers
    });
}

/**
 * Initialize authentication UI updates
 * Updates header/nav based on auth status
 */
export function initAuthUI() {
    const user = getCurrentUser();
    const authButtons = document.querySelectorAll('[data-auth-required]');
    const loginButtons = document.querySelectorAll('[data-login-btn]');
    const userMenus = document.querySelectorAll('[data-user-menu]');

    if (user) {
        // User is logged in
        authButtons.forEach(btn => {
            btn.style.display = 'block';
        });

        loginButtons.forEach(btn => {
            btn.style.display = 'none';
        });

        userMenus.forEach(menu => {
            menu.style.display = 'block';
            const userName = menu.querySelector('[data-user-name]');
            if (userName) {
                userName.textContent = user.firstName || user.name || user.email;
            }
        });
    } else {
        // User is not logged in
        authButtons.forEach(btn => {
            btn.style.display = 'none';
        });

        loginButtons.forEach(btn => {
            btn.style.display = 'block';
        });

        userMenus.forEach(menu => {
            menu.style.display = 'none';
        });
    }
}

/**
 * Setup logout buttons
 */
export function setupLogoutButtons() {
    const logoutButtons = document.querySelectorAll('[data-logout-btn]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                logout();
            }
        });
    });
}

/**
 * Format user display name
 * @param {Object} user - User object
 * @returns {string}
 */
export function getUserDisplayName(user) {
    if (!user) return 'Guest';
    
    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    if (user.name) return user.name;
    
    return user.email.split('@')[0];
}

/**
 * Check if user has specific role
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

/**
 * Initialize authentication on page load
 */
export function initAuth() {
    // Check if user is on login/register page
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html' || currentPage === 'register.html') {
        // If already logged in, redirect to home
        if (isAuthenticated()) {
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || 'index.html';
            window.location.href = redirect;
            return;
        }
    }

    // Update UI based on auth status
    initAuthUI();
    setupLogoutButtons();
}

// Auto-initialize on DOM load
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
}
