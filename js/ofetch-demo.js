// =====================================================
// 🟧 ofetch —— Nuxt 內建的 $fetch，體積最小
// -----------------------------------------------------
// 學習重點：
//   ✓ 體積 ~1.2 KB（最小的 fetch wrapper）
//   ✓ 4xx/5xx 自動丟錯
//   ✓ JSON 自動 stringify + parse（直接傳物件、直接拿物件）
//   ✓ onRequest / onResponse hooks 處理 token 與錯誤
//   ✓ Nuxt / Vite / Edge / Workers 完整支援
//   ✓ 內建 retry / timeout
// =====================================================

import { ofetch } from 'https://cdn.jsdelivr.net/npm/ofetch@1.4.1/+esm';

// ---------- 建立 instance ----------
const api = ofetch.create({
  baseURL: app.BASE,
  timeout: 5000,

  // 請求前 hook：自動帶 token
  onRequest({ options }) {
    const token = localStorage.getItem('token');
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  },

  // 回應錯誤 hook：統一處理
  onResponseError({ response }) {
    if (response.status === 401) {
      console.warn('Token 失效，請重新登入');
    }
  },
});

// 注意：ofetch 直接回傳 parsed body（不像 axios 要 .data）
app.register('ofetch', {

  get: () =>
    api('/books'),

  post: (data) =>
    api('/books', { method: 'POST', body: data }),

  patch: (id, data) =>
    api(`/books/${id}`, { method: 'PATCH', body: data }),

  del: (id) =>
    api(`/books/${id}`, { method: 'DELETE' }),

});
