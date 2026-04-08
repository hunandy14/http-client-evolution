// =========================================
// 共用模組（樣板程式碼集中地）
// 三個 demo 檔只需要實作純 CRUD 呼叫，然後呼叫 window.app.register(name, api)
// 這裡會自動幫他們：渲染清單、綁定編輯/刪除/重抓、寫 log、處理自動整理
// =========================================
window.app = {
  BASE: 'http://localhost:3000',
  autoSync: false,
  reloaders: {},
  adders: {},

  register(name, api) {
    initColumn(name, api);
  },

  reloadAll() {
    Object.values(this.reloaders).forEach((fn) => fn());
  },

  // 寫入操作成功後呼叫；自動整理開 → 三欄全部 refetch
  maybeSync() {
    if (this.autoSync) this.reloadAll();
  },
};

// ---------- 每欄初始化 ----------
function initColumn(name, api) {
  const col = document.querySelector(`[data-col="${name}"]`);
  const list = col.querySelector('.book-list');
  const logEl = col.querySelector('.log');

  const log = (method, url, status) => {
    logEl.textContent = `[${name}] ${method} ${url} → ${status}`;
  };

  const bookEl = (book) => {
    const li = document.createElement('li');
    li.dataset.id = book.id;
    li.innerHTML = `
      <div class="info">
        <div class="title"></div>
        <div class="author"></div>
      </div>
      <div class="actions">
        <button class="edit">✏️</button>
        <button class="del">🗑️</button>
      </div>
    `;
    li.querySelector('.title').textContent = book.title;
    li.querySelector('.author').textContent = `作者：${book.author}`;
    return li;
  };

  // ---- 對 demo 暴露的高階操作 ----
  async function reload() {
    try {
      const books = await api.get();
      list.innerHTML = '';
      books.forEach((b) => list.appendChild(bookEl(b)));
      log('GET', '/books', 'OK');
    } catch (err) {
      log('GET', '/books', err.message || 'Error');
    }
  }

  async function add(title, author) {
    try {
      const newBook = await api.post({ title, author });
      list.appendChild(bookEl(newBook)); // partial update
      log('POST', '/books', 'Created');
      window.app.maybeSync();
    } catch (err) {
      log('POST', '/books', err.message || 'Error');
    }
  }

  // ---- 事件委派：編輯 / 刪除 ----
  list.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = li.dataset.id;

    if (e.target.classList.contains('edit')) {
      const oldTitle = li.querySelector('.title').textContent;
      const newTitle = prompt('新書名：', oldTitle);
      if (!newTitle || newTitle === oldTitle) return;
      try {
        const updated = await api.patch(id, { title: newTitle });
        li.querySelector('.title').textContent = updated.title;
        log('PATCH', `/books/${id}`, 'OK');
        window.app.maybeSync();
      } catch (err) {
        log('PATCH', `/books/${id}`, err.message || 'Error');
      }
    }

    if (e.target.classList.contains('del')) {
      if (!confirm('確定刪除？')) return;
      try {
        await api.del(id);
        li.remove();
        log('DELETE', `/books/${id}`, 'OK');
        window.app.maybeSync();
      } catch (err) {
        log('DELETE', `/books/${id}`, err.message || 'Error');
      }
    }
  });

  col.querySelector('.reload').addEventListener('click', reload);

  window.app.reloaders[name] = reload;
  window.app.adders[name] = add;

  reload();
}

// ---------- 自動整理開關 ----------
document.getElementById('auto-sync-toggle').addEventListener('change', (e) => {
  window.app.autoSync = e.target.checked;
});

// ---------- 上方共用新增表單 ----------
document.querySelectorAll('#add-form button[data-method]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const form = document.getElementById('add-form');
    const title = form.title.value.trim();
    const author = form.author.value.trim();
    if (!title || !author) {
      alert('書名與作者必填');
      return;
    }
    const adder = window.app.adders[btn.dataset.method];
    if (adder) {
      adder(title, author);
      form.reset();
    }
  });
});
