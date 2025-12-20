/* categories.js - CRUD for categories */
function renderCategoriesTable(filter=''){
  const db = getDB();
  const table = document.getElementById('cat-table');
  if(!table) return;
  const items = db.categories.filter(c => !filter || c.name.toLowerCase().includes(filter.toLowerCase()));
  const rows = items.map(c=>`<tr>
    <td>${c.id}</td>
    <td>${c.name}</td>
    <td>
      <button class="btn" onclick="editCategory('${c.id}')">Sửa</button>
      <button class="btn muted" onclick="deleteCategory('${c.id}')">Xóa</button>
    </td>
  </tr>`).join('');
  table.innerHTML = `<thead><tr><th>ID</th><th>Tên</th><th>Hành động</th></tr></thead><tbody>${rows}</tbody>`;
}

function openCategoryForm(id=null){
  const modal = document.getElementById('modal-cat');
  modal.classList.remove('hidden');
  if(id){
    const db = getDB();
    const cat = db.categories.find(x=>x.id===id);
    document.getElementById('modal-cat-title').innerText = 'Sửa danh mục';
    document.getElementById('cat-name').value = cat.name;
    modal.dataset.editId = id;
  } else {
    document.getElementById('modal-cat-title').innerText = 'Thêm danh mục';
    document.getElementById('cat-name').value = '';
    delete modal.dataset.editId;
  }
}

function closeCategoryForm(){ document.getElementById('modal-cat').classList.add('hidden'); delete document.getElementById('modal-cat').dataset.editId; }

function saveCategory(){
  const db = getDB();
  const modal = document.getElementById('modal-cat');
  const id = modal.dataset.editId;
  const name = document.getElementById('cat-name').value.trim();
  if(!name){ alert('Nhập tên'); return; }
  if(id){
    const c = db.categories.find(x=>x.id===id); c.name = name;
  } else {
    db.categories.unshift({ id: uid('cat'), name });
  }
  saveDB(db);
  closeCategoryForm();
  renderCategoriesTable();
}

function editCategory(id){ openCategoryForm(id); }

function deleteCategory(id){
  if(!confirm('Xóa danh mục?')) return;
  const db = getDB();
  db.categories = db.categories.filter(c=>c.id!==id);
  // detach category from products
  db.products.forEach(prod => { if(prod.categoryId === id) prod.categoryId = null; });
  saveDB(db);
  renderCategoriesTable();
  alert('Đã xóa');
}
