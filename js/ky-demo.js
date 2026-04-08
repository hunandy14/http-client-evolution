// =====================================================
// 🟦 ky —— Axios 的精神繼承者，但體積只有 1/5
// -----------------------------------------------------
// 學習重點：
//   ✓ 體積 ~2.5 KB（vs Axios ~13 KB）
//   ✓ 4xx/5xx 自動丟錯（沒有 Fetch 的雷）
//   ✓ JSON 自動處理：傳 { json: data }、回傳呼叫 .json()
//   ✓ hooks 提供類似 Axios interceptors 的功能
//   ✓ 內建 retry / timeout
//   ✓ Edge runtime 完整支援（Cloudflare Workers / Deno）
// =====================================================

import ky from 'https://cdn.jsdelivr.net/npm/ky@1.7.5/+esm';

// ---------- 建立 instance（類似 axios.create） ----------
const api = ky.create({
  prefixUrl: app.BASE,   // 注意：用 prefixUrl 不是 baseURL
  timeout: 5000,
  hooks: {
    // 請求前 hook：自動帶 token（等同 Axios interceptor）
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('token');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    // 回應後 hook：統一錯誤處理
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          console.warn('Token 失效，請重新登入');
        }
      },
    ],
  },
});

// ⚠️ 注意：ky 用 prefixUrl 時，path 不能以 / 開頭
app.register('ky', {

  get: () =>
    api.get('books').json(),

  post: (data) =>
    api.post('books', { json: data }).json(),

  patch: (id, data) =>
    api.patch(`books/${id}`, { json: data }).json(),

  del: (id) =>
    api.delete(`books/${id}`).json(),

});
