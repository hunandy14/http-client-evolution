# `js/` 目錄速覽

每個 `*-demo.js` 都只裝**那個工具獨有的學習重點**，所有 DOM / 事件 / log 樣板都集中在 [`shared.js`](shared.js)。

## 檔案一覽

| 檔案 | 工具 | 學習重點 |
|---|---|---|
| [shared.js](shared.js) | 共用模組 | 註冊機制、auto-sync、共用表單、DOM 渲染 |
| [jquery-demo.js](jquery-demo.js) | 🟦 jQuery AJAX | 設定物件式 API、自動 JSON、4xx/5xx 進 error callback |
| [fetch-demo.js](fetch-demo.js) | 🟩 原生 Fetch | 三個陷阱：4xx/5xx 不 reject、要自己 stringify body、要自己 `res.json()` |
| [axios-demo.js](axios-demo.js) | 🟪 Axios | `axios.create` instance、interceptors 自動帶 token / 統一錯誤處理 |
| [ky-demo.js](ky-demo.js) | 🟦 ky | Fetch 的薄封裝，2.5 KB；用 `ky.create({ hooks })` 取代 interceptors |
| [ofetch-demo.js](ofetch-demo.js) | 🟧 ofetch | Nuxt 內建的 `$fetch`，1.2 KB；用 `onRequest` / `onResponseError` 處理 |

## 載入方式

- `jquery / fetch / axios` —— 經典 `<script>` 標籤載入（jQuery / Axios 從 CDN）
- `ky / ofetch` —— ESM-only，用 `<script type="module">` 從 jsDelivr CDN 載入（已鎖版）

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

`shared.js` 收到註冊後會自動：
- 渲染清單、綁定編輯/刪除/重抓按鈕
- 寫 log 到該欄位下方
- 處理「自動整理」開關
- 串接上方共用新增表單的對應送出按鈕

所以打開任一個 demo 檔，看到的就是**純粹的工具語法差異**，沒有任何 DOM 雜訊。

## 想了解整篇文章脈絡？

回專案根目錄看 [README.md](../README.md)。
