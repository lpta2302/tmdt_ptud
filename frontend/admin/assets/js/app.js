/* app.js
   Core: fake data seed + helpers to read/write localStorage + common render functions.
   All other page-specific modules import (use) these functions.
*/

// STORAGE KEY
const STORAGE_KEY = 'spa_admin_data_v1';

// generate unique id
function uid(prefix='id'){
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

// seed fake data (run once)
function seedData(){
  const now = Date.now();
  const data = {
    categories: [
      { id: 'c1', name: 'Skincare' },
      { id: 'c2', name: 'Body' },
      { id: 'c3', name: 'Haircare' }
    ],
    promotions: [
      { id: 'p1', name: 'Tết Sale', code: 'TET20', discount: 20 },
      { id: 'p2', name: 'Summer Offer', code: 'SUM10', discount: 10 }
    ],
    products: [
      { id: 'prd1', name: 'Serum A', price: 199000, categoryId: 'c1', promoId: 'p1', stock: 50 },
      { id: 'prd2', name: 'Shampoo B', price: 129000, categoryId: 'c3', promoId: null, stock: 80 },
      { id: 'prd3', name: 'Body Oil C', price: 249000, categoryId: 'c2', promoId: 'p2', stock: 30 }
    ],
    orders: [
      { id: 'o1', createdAt: now - 86400000*1, total: 328000, status: 'pending' },
      { id: 'o2', createdAt: now - 86400000*2, total: 129000, status: 'delivered' },
      { id: 'o3', createdAt: now - 86400000*3, total: 499000, status: 'pending' }
    ],
    // simplistic sales sample per day (for chart)
    sales: [
      { date: now - 86400000*6, total: 120000 },
      { date: now - 86400000*5, total: 240000 },
      { date: now - 86400000*4, total: 180000 },
      { date: now - 86400000*3, total: 300000 },
      { date: now - 86400000*2, total: 220000 },
      { date: now - 86400000*1, total: 150000 },
      { date: now, total: 400000 }
    ]
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

// get DB (read)
function getDB(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return seedData();
  try {
    return JSON.parse(raw);
  } catch (e) {
    return seedData();
  }
}

// save DB (write)
function saveDB(db){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

/* utility renders used across pages */

// render sales chart (selector can be '#id' or element). If large true => bigger bars
function renderSalesChart(selector, large=false){
  const el = (typeof selector === 'string') ? document.querySelector(selector) : selector;
  if(!el) return;
  const db = getDB();
  const arr = db.sales.slice(-7);
  const max = Math.max(...arr.map(s=>s.total), 1);
  el.innerHTML = arr.map(s=>{
    const h = (s.total / max) * 100;
    const label = new Date(s.date).toLocaleDateString();
    return `<div class="bar" style="height:${h}%" title="${label} — ${s.total.toLocaleString()}">${s.total?Number(s.total).toLocaleString():''}</div>`;
  }).join('');
}

// render pending orders list
function renderPendingOrders(selector){
  const el = document.querySelector(selector);
  if(!el) return;
  const db = getDB();
  const pending = db.orders.filter(o=>o.status === 'pending');
  if(pending.length === 0){ el.innerHTML = '<div class="muted">Không có đơn chờ giao.</div>'; return; }
  el.innerHTML = pending.map(o=>`<div class="card"><strong>${o.id}</strong> — ${new Date(o.createdAt).toLocaleString()} — ₫${o.total.toLocaleString()}</div>`).join('');
}

// helper: reset seed (for convenience)
function seedReset(){
  if(confirm('Reset dữ liệu mẫu?')){ seedData(); location.reload(); }
}

/* Expose functions globally for page scripts */
window.getDB = getDB;
window.saveDB = saveDB;
window.uid = uid;
window.renderSalesChart = renderSalesChart;
window.renderPendingOrders = renderPendingOrders;
window.seedReset = seedReset;
