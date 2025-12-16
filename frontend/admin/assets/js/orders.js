/* orders.js - orders listing + simple stats */
function renderOrdersTable(){
  const db = getDB();
  const table = document.getElementById('orders-table');
  if(!table) return;
  const rows = db.orders.map(o=>`<tr>
    <td>${o.id}</td>
    <td>${new Date(o.createdAt).toLocaleString()}</td>
    <td>₫${o.total.toLocaleString()}</td>
    <td>${o.status}</td>
    <td>
      ${o.status === 'pending' ? `<button class="btn" onclick="markDelivered('${o.id}')">Đã giao</button>` : ''}
      <button class="btn muted" onclick="deleteOrder('${o.id}')">Xóa</button>
    </td>
  </tr>`).join('');
  table.innerHTML = `<thead><tr><th>ID</th><th>Ngày</th><th>Tổng</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>${rows}</tbody>`;
}

function markDelivered(id){
  if(!confirm('Đánh dấu là đã giao?')) return;
  const db = getDB();
  const o = db.orders.find(x=>x.id===id);
  if(o) o.status = 'delivered';
  saveDB(db);
  renderOrdersTable();
  renderOrdersStats();
  alert('Đã cập nhật');
}

function deleteOrder(id){
  if(!confirm('Xóa đơn?')) return;
  const db = getDB();
  db.orders = db.orders.filter(x=>x.id!==id);
  saveDB(db);
  renderOrdersTable();
  renderOrdersStats();
  alert('Đã xóa');
}

function renderOrdersStats(){
  const db = getDB();
  const el = document.getElementById('orders-stats');
  if(!el) return;
  const pending = db.orders.filter(o=>o.status === 'pending').length;
  const delivered = db.orders.filter(o=>o.status === 'delivered').length;
  const total = db.orders.reduce((s,o)=>s+o.total,0);
  el.innerHTML = `<div class="row"><div class="card">Chờ giao: <strong>${pending}</strong></div><div class="card">Đã giao: <strong>${delivered}</strong></div><div class="card">Tổng doanh thu: <strong>₫${total.toLocaleString()}</strong></div></div>`;
}
