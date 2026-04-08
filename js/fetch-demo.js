// =====================================================
// 🟩 Fetch（瀏覽器原生 API）
// -----------------------------------------------------
// 學習重點：
//   ✓ 原生 Promise，不需引入任何套件
//   ⚠️ 陷阱 1：4xx / 5xx **不會 reject**，要自己判斷 res.ok
//   ⚠️ 陷阱 2：JSON 要自己 stringify body、自己呼叫 res.json()
//   ⚠️ 陷阱 3：要自己加 'Content-Type' header
// =====================================================
(() => {
  const BOOKS = `${app.BASE}/books`;
  const JSON_HEADERS = { 'Content-Type': 'application/json' };

  // ---------- 共用回應處理 ----------
  // 把陷阱 1 + 陷阱 2 包成一個小工具，避免每個呼叫都重複寫
  const handle = async (res) => {
    if (!res.ok) {
      // ⚠️ Fetch 預設 4xx/5xx 不會自動丟錯，必須手動判斷
      throw new Error(`HTTP ${res.status}`);
    }
    // 204 No Content 沒 body，避免 .json() 噴錯
    return res.status === 204 ? null : res.json();
  };

  app.register('fetch', {

    // ---------- GET ----------
    get: () => fetch(BOOKS).then(handle),

    // ---------- POST ----------
    post: (data) => fetch(BOOKS, {
      method: 'POST',
      headers: JSON_HEADERS,           // ⚠️ 要自己加
      body: JSON.stringify(data),      // ⚠️ 要自己 stringify
    }).then(handle),

    // ---------- PATCH ----------
    patch: (id, data) => fetch(`${BOOKS}/${id}`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }).then(handle),

    // ---------- DELETE ----------
    del: (id) => fetch(`${BOOKS}/${id}`, {
      method: 'DELETE',
    }).then(handle),

  });
})();
