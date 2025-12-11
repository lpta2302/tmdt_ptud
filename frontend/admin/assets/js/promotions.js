/* promotions.js - CRUD for promotions */
function renderPromotionsTable(filter=''){
  const db = getDB();
  const table = document.getElementById('promo-table');
  if(!table) return;
  const items = db.promotions.filter(p => !filter || p.name.toLowerCase().includes(filter.toLowerCase()) || (p.code||'').toLowerCase().includes(filter.toLowerCase()));
  const rows = items.map(p=>`<tr>
    <td>${p.id}</td>
    <td>${p.name}</td>
    <td>${p.code || '-'}</td>
    <td>${p.discount}%</td>
    <td>
      <button class="btn" onclick="editPromo('${p.id}')">Sửa</button>
      <button class="btn muted" onclick="deletePromo('${p.id}')">Xóa</button>
    </td>
  </tr>`).join('');
  table.innerHTML = `<thead><tr><th>ID</th><th>Tên</th><th>Code</th><th>Giảm</th><th>Hành động</th></tr></thead><tbody>${rows}</tbody>`;
}

function openPromoForm(id=null){
  const modal = document.getElementById('modal-promo');
  modal.classList.remove('hidden');
  if(id){
    const db = getDB();
    const p = db.promotions.find(x=>x.id===id);
    document.getElementById('modal-promo-title').innerText = 'Sửa khuyến mãi';
    document.getElementById('promo-name').value = p.name;
    document.getElementById('promo-code').value = p.code || '';
    document.getElementById('promo-discount').value = p.discount || 0;
    modal.dataset.editId = id;
  } else {
    document.getElementById('modal-promo-title').innerText = 'Thêm khuyến mãi';
    document.getElementById('promo-name').value = '';
    document.getElementById('promo-code').value = '';
    document.getElementById('promo-discount').value = 10;
    delete modal.dataset.editId;
  }
}

function closePromoForm(){ document.getElementById('modal-promo').classList.add('hidden'); delete document.getElementById('modal-promo').dataset.editId; }

function savePromo(){
  const db = getDB();
  const modal = document.getElementById('modal-promo');
  const id = modal.dataset.editId;
  const name = document.getElementById('promo-name').value.trim();
  const code = document.getElementById('promo-code').value.trim();
  const discount = Number(document.getElementById('promo-discount').value) || 0;
  if(!name){ alert('Nhập tên'); return; }
  if(id){
    const p = db.promotions.find(x=>x.id===id);
    p.name=name; p.code=code; p.discount=discount;
  } else {
    db.promotions.unshift({ id: uid('promo'), name, code, discount });
  }
  saveDB(db);
  closePromoForm();
  renderPromotionsTable();
}

function editPromo(id){ openPromoForm(id); }

function deletePromo(id){
  if(!confirm('Xóa khuyến mãi?')) return;
  const db = getDB();
  db.promotions = db.promotions.filter(p=>p.id!==id);
  // detach promo from products
  db.products.forEach(prod => { if(prod.promoId === id) prod.promoId = null; });
  saveDB(db);
  renderPromotionsTable();
  alert('Đã xóa');
}
