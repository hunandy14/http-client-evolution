// =====================================================
// 🟪 Axios（第三方套件，現代專案最常用）
// -----------------------------------------------------
// 三大殺手鐧：
//   1️⃣ axios.create：建立 instance，統一 baseURL / timeout / headers
//   2️⃣ interceptors：請求前自動加 token、回應統一錯誤處理
//   3️⃣ JSON 自動處理（自動 stringify + 自動 parse）
//      4xx/5xx 自動 reject（不像 Fetch 要自己判斷）
// =====================================================
(() => {

  // ---------- 1️⃣ 建立 instance ----------
  // 設定一次，後面所有呼叫都套用
  const api = axios.create({
    baseURL: app.BASE,   // 之後寫 '/books' 即可，不用每次拼網址
    timeout: 5000,       // 超過 5 秒自動 abort
  });


  // ---------- 2️⃣ 請求攔截器 ----------
  // 每次發送請求前自動執行 → 適合用來自動帶 Authorization
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });


  // ---------- 2️⃣ 回應攔截器 ----------
  // 每次收到回應後執行 → 適合做統一錯誤處理（例如 401 自動登出）
  api.interceptors.response.use(
    (res) => res,                    // 成功直接放行
    (err) => {
      if (err.response?.status === 401) {
        console.warn('Token 失效，請重新登入');
        // 實務上這裡可以 redirect 到登入頁、清 localStorage 等
      }
      return Promise.reject(err);    // 把錯誤繼續往下丟
    }
  );


  // ---------- 3️⃣ CRUD ----------
  // 注意：data 直接傳 JS 物件（自動 stringify）
  //       回傳要從 response.data 拿資料（不像 jQuery / Fetch 直接給 data）
  app.register('axios', {

    get: () =>
      api.get('/books').then((r) => r.data),

    post: (data) =>
      api.post('/books', data).then((r) => r.data),

    patch: (id, data) =>
      api.patch(`/books/${id}`, data).then((r) => r.data),

    del: (id) =>
      api.delete(`/books/${id}`).then((r) => r.data),

  });

})();


// -----------------------------------------------------
// 💡 想驗證 interceptor 自動帶 token 的效果？
//    在瀏覽器 Console 執行：
//      localStorage.setItem('token', 'fake-jwt-123')
//    再操作 Axios 欄，打開 DevTools → Network → 點 /books 請求
//    Request Headers 會看到：Authorization: Bearer fake-jwt-123
//    清除：localStorage.removeItem('token')
// -----------------------------------------------------
