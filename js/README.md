# `js/` 目錄速覽

每個 `*-demo.js` 都只裝**那個工具獨有的特點**，DOM / 事件 / log 樣板集中在 [`shared.js`](shared.js)。

## 各檔案的個別特點

### [shared.js](shared.js) —— 共用樣板
所有 demo 共用的 DOM 渲染、事件綁定、log 輸出、auto-sync 開關、上方共用新增表單的派發邏輯都在這裡。三個 demo 只要呼叫 `app.register(name, api)` 就會自動接管。

### [jquery-demo.js](jquery-demo.js) —— 🟦 jQuery AJAX
```js
$.ajax({ url: '/books', success: (data) => console.log(data) });
```
- **設定物件式 API**：所有參數塞在一個 object 裡
- **自動 JSON parse**（dataType 可省略）
- **4xx/5xx 會進 error callback**，與 Fetch 的最大差異
- `$.ajax` 回傳的 jqXHR 是 thenable，**可以直接 `await`**
- ⚠️ 送 JSON 時要自己 `JSON.stringify` 並設 `contentType`，否則預設用 form-urlencoded

### [fetch-demo.js](fetch-demo.js) —— 🟩 原生 Fetch
```js
const data = await fetch('/books').then((r) => r.json());
```
- **零依賴**，瀏覽器原生
- ⚠️ **陷阱 1**：4xx/5xx **不會 reject**，要自己判斷 `res.ok`
- ⚠️ **陷阱 2**：JSON 要自己 `JSON.stringify` body、自己 `res.json()` parse 回傳
- ⚠️ **陷阱 3**：要自己加 `Content-Type` header
- 檔案內示範一個 `handle()` 工具一次解決上面三個雷

### [axios-demo.js](axios-demo.js) —— 🟪 Axios
```js
const { data } = await axios.get('/books');
```
- **`axios.create`** 建 instance，統一 baseURL / timeout
- **請求 interceptor**：自動帶 `Authorization` header，不用每次手動塞
- **回應 interceptor**：統一處理 401（殺手鐧）
- **JSON 完全自動**：傳物件、回傳從 `r.data` 拿
- **4xx/5xx 自動 reject**，沒有 Fetch 的雷

### [ky-demo.js](ky-demo.js) —— 🟦 ky（modern Fetch wrapper）
```js
const data = await ky.get('/books').json();
```
- **體積 ~2.5 KB**（vs Axios ~13 KB）
- **`ky.create({ hooks })`** 等同 Axios interceptors
  - `beforeRequest` → 自動帶 token
  - `afterResponse` → 統一錯誤處理
- 使用 `prefixUrl`（不是 baseURL），且 path **不能以 `/` 開頭**
- 內建 retry / timeout / 自動丟錯
- ESM-only，用 `<script type="module">` 從 CDN 載入

### [ofetch-demo.js](ofetch-demo.js) —— 🟧 ofetch（最小的 Fetch wrapper）
```js
const data = await ofetch('/books');
```
- **體積 ~1.2 KB**（最小）
- **Nuxt 內建的 `$fetch`** 就是它
- **`ofetch.create({ onRequest, onResponseError })`** 設定 hooks
- 直接回傳 parsed body，**不用 `.data` 也不用 `.json()`**
- ESM-only，從 CDN 載入

## 設計慣例

每個 demo 檔只需要做一件事：

```js
app.register('工具名', {
  get:          () => /* ... */,
  post:       (data) => /* ... */,
  patch: (id, data) => /* ... */,
  del:        (id) => /* ... */,
});
```

`shared.js` 會自動接管渲染、事件、log、auto-sync 與共用表單。所以打開任一個 demo 檔，看到的就是**純粹的工具語法差異**，沒有任何 DOM 雜訊。

## 想了解整篇文章脈絡？

回專案根目錄看 [README.md](../README.md)。
