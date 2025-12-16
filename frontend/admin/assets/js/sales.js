/* sales.js - render monthly or daily sales */
function renderSalesMonthly(){
  const db = getDB();
  const el = document.getElementById('sales-monthly');
  if(!el) return;
  // aggregate by month (very simple sample)
  const map = {};
  db.sales.forEach(s=>{
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${d.getMonth()+1}`;
    map[key] = (map[key]||0) + s.total;
  });
  const rows = Object.entries(map).map(([k,v])=>`<div class="card"><strong>${k}</strong> — ₫${v.toLocaleString()}</div>`).join('');
  el.innerHTML = `<div class="grid">${rows}</div>`;
}
