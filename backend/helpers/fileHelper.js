import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Hàm đọc file JSON
 * @param {string} filename - Tên file trong thư mục data
 * @returns {Array|Object} Dữ liệu JSON đã parse
 */
export const readJsonFile = (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error);
    return null;
  }
};

/**
 * Hàm ghi file JSON
 * @param {string} filename - Tên file trong thư mục data
 * @param {Array|Object} data - Dữ liệu cần ghi
 * @returns {boolean} Trạng thái thành công
 */
export const writeJsonFile = (filename, data) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filename}:`, error);
    return false;
  }
};

/**
 * Sinh ID duy nhất
 * @returns {string} ID duy nhất
 */
export const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

/**
 * Định dạng tiền tệ (VND)
 * @param {number} amount - Số tiền VND
 * @returns {string} Tiền đã định dạng
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

/**
 * Kiểm tra email hợp lệ
 * @param {string} email - Email cần kiểm tra
 * @returns {boolean} Email hợp lệ
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Kiểm tra số điện thoại Việt Nam hợp lệ
 * @param {string} phone - Số điện thoại cần kiểm tra
 * @returns {boolean} Số điện thoại hợp lệ
 */
export const validatePhone = (phone) => {
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  return phoneRegex.test(phone);
};

/**
 * Sinh chuỗi ngẫu nhiên
 * @param {number} length - Độ dài chuỗi
 * @returns {string} Chuỗi ngẫu nhiên
 */
export const generateRandomString = (length = 8) => {
  return Math.random().toString(36).substring(2, length + 2);
};