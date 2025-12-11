/* products.js - page logic for products.html */
function renderProductsTable(filter = ''){
  const db = getDB();
  const table = document.getElementById('product-table');
  if(!table) return;
  const items = db.products.filter(p => !filter || p.name.toLowerCase().includes(filter.toLowerCase()));
  const rows = items.map(p=>{
    const cat = db.categories.find(c=>c.id===p.categoryId)?.name || '-';
    const promo = db.promotions.find(x=>x.id===p.promoId)?.name || '-';
    return `<tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${cat}</td>
      <td>₫${p.price.toLocaleString()}</td>
      <td>${p.stock}</td>
      <td>${promo}</td>
      <td>
        <button class="btn" onclick="editProduct('${p.id}')">Sửa</button>
        <button class="btn muted" onclick="deleteProduct('${p.id}')">Xóa</button>
      </td>
    </tr>`;
  }).join('');
  table.innerHTML = `<thead><tr><th>ID</th><th>Tên</th><th>Danh mục</th><th>Giá</th><th>Stock</th><th>Promo</th><th>Hành động</th></tr></thead><tbody>${rows}</tbody>`;
}

// modal controls
function openProductForm(id=null){
  const modal = document.getElementById('modal-product');
  modal.classList.remove('hidden');
  const db = getDB();

  // fill selects
  const catSel = document.getElementById('p-category');
  const promoSel = document.getElementById('p-promo');
  catSel.innerHTML = `<option value="">-- Không --</option>` + db.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  promoSel.innerHTML = `<option value="">-- Không --</option>` + db.promotions.map(p=>`<option value="${p.id}">${p.name} (${p.discount}%)</option>`).join('');

  // if edit
  if(id){
    const item = db.products.find(p=>p.id===id);
    document.getElementById('modal-product-title').innerText = 'Sửa sản phẩm';
    document.getElementById('p-name').value = item.name;
    document.getElementById('p-price').value = item.price;
    document.getElementById('p-category').value = item.categoryId || '';
    document.getElementById('p-promo').value = item.promoId || '';
    document.getElementById('p-stock').value = item.stock || 0;
    modal.dataset.editId = id;
  } else {
    document.getElementById('modal-product-title').innerText = 'Thêm sản phẩm';
    document.getElementById('p-name').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('p-category').value = '';
    document.getElementById('p-promo').value = '';
    document.getElementById('p-stock').value = 0;
    delete modal.dataset.editId;
  }
}

function closeProductForm(){
  document.getElementById('modal-product').classList.add('hidden');
  delete document.getElementById('modal-product').dataset.editId;
}

function saveProduct(){
  const db = getDB();
  const modal = document.getElementById('modal-product');
  const id = modal.dataset.editId;
  const name = document.getElementById('p-name').value.trim();
  const price = Number(document.getElementById('p-price').value) || 0;
  const categoryId = document.getElementById('p-category').value || null;
  const promoId = document.getElementById('p-promo').value || null;
  const stock = Number(document.getElementById('p-stock').value) || 0;
  if(!name){ alert('Nhập tên sản phẩm'); return; }

  if(id){
    const item = db.products.find(p=>p.id===id);
    item.name = name; item.price = price; item.categoryId = categoryId; item.promoId = promoId; item.stock = stock;
  } else {
    db.products.unshift({ id: uid('prd'), name, price, categoryId, promoId, stock });
  }
  saveDB(db);
  closeProductForm();
  renderProductsTable();
}

function editProduct(id){
  openProductForm(id);
}

function deleteProduct(id){
  if(!confirm('Xóa sản phẩm?')) return;
  const db = getDB();
  db.products = db.products.filter(p=>p.id !== id);
  saveDB(db);
  renderProductsTable();
  alert('Đã xóa');
}
