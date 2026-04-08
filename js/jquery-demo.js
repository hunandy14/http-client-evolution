// =====================================================
// 🟦 jQuery AJAX
// -----------------------------------------------------
// 學習重點：
//   ✓ 設定物件式 API：所有參數塞在一個 object
//   ✓ 自動處理 JSON 回應（dataType 可省略，會自動偵測）
//   ✓ 4xx/5xx 會進 error callback（與 Fetch 不同）
//   ✓ $.ajax 回傳 jqXHR 物件，是 thenable，可以用 await
// =====================================================
(() => {
  const BOOKS = `${app.BASE}/books`;

  app.register('jquery', {

    // ---------- GET：讀取清單 ----------
    get: () => $.ajax({
      url: BOOKS,
      method: 'GET',
    }),

    // ---------- POST：新增 ----------
    // ⚠️ 傳 JSON 要自己設 contentType + 自己 stringify
    //    （不設的話 jQuery 預設用 form-urlencoded）
    post: (data) => $.ajax({
      url: BOOKS,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
    }),

    // ---------- PATCH：部分更新 ----------
    patch: (id, data) => $.ajax({
      url: `${BOOKS}/${id}`,
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(data),
    }),

    // ---------- DELETE：刪除 ----------
    del: (id) => $.ajax({
      url: `${BOOKS}/${id}`,
      method: 'DELETE',
    }),

  });
})();
