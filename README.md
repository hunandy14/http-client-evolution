# jQuery AJAX / Fetch / Axios 對照練習

三欄並排，對同一個 `json-server` 後端用三種方式做 GET / POST / PATCH / DELETE，操作後**只更新對應 DOM**（部分更新），讓三者語法差異一目了然。

## 啟動

```bash
# 1. 安裝依賴（一次性）
npm install

# 2. 同時啟動後端 (port 3000) 與前端 static server (port 5500)
npm run dev
```

瀏覽器會自動開啟 <http://localhost:5500>。後端 API 在 <http://localhost:3000/books>。

## 所有 npm scripts

| 指令 | 作用 |
|---|---|
| `npm run dev` | **常用** — 同時起 API + 網頁 |
| `npm start` | 等同 `npm run dev` |
| `npm run dev:api` | 只起 json-server (port 3000) |
| `npm run dev:web` | 只起 Vite dev server (port 5500，含 HMR) |
| `npm run reset` | 還原 `db.json` 到初始狀態（需 git） |
| `npm run clean` | 刪除 `node_modules` |

## ⚠️ Axios 安全提醒

Axios 曾傳出供應鏈安全事件。本專案的 CDN **已鎖定特定版本**（`axios@1.7.9`），請：

1. 使用前到 <https://github.com/axios/axios/releases> 確認目前最新穩定版
2. 更新 [`index.html`](index.html) 內 `axios@x.y.z` 的版號
3. 強烈建議加上 SRI integrity hash：<https://www.srihash.org/>
4. **永遠不要**用 `axios@latest` 或不指定版號的 CDN URL

同樣原則適用於所有第三方 CDN。

## 三者差異對照

| 項目 | jQuery AJAX | Fetch | Axios |
|---|---|---|---|
| 基本語法 | `$.ajax({ url, method, data, success, error })` | `fetch(url, { method, headers, body })` | `axios({ url, method, data })` |
| JSON 自動處理 | ✓ | ✗ 需 `r.json()` + 手動 `JSON.stringify` | ✓ |
| 4xx/5xx | 進 error callback | **不會 reject**（要判斷 `res.ok`）⚠️ | 自動 reject |
| 簡寫 | `$.get` / `$.post` | 無 | `axios.get` / `axios.post` |
| 取消請求 | `xhr.abort()` | `AbortController` | `AbortController` |
| 體積 | 大（整個 jQuery） | 0（原生） | 中 |

### Axios 的殺手鐧：interceptors + Token

| 需求 | jQuery | Fetch | Axios |
|---|---|---|---|
| 全域帶 Token | 每次手動 / `$.ajaxSetup` | 每次手動 / 自己包 wrapper | **interceptors 設一次全部生效** ✓ |
| 統一錯誤處理（401 自動登出等） | 勉強 | 自己包 | **interceptors** ✓ |
| baseURL | 無 | 無 | `axios.create({ baseURL })` ✓ |

開瀏覽器 DevTools → Network → 在 Axios 欄按「🔑 設定假 Token」，再做任何操作，都會看到 `Authorization: Bearer ...` 自動附上。

## 驗證

1. `http://localhost:3000/books` 應回傳初始 3 本書
2. 在 jQuery 欄新增 → 該欄立刻出現新卡片，其他兩欄按 🔄 後也會出現
3. 在 Fetch 欄編輯 → 該卡片標題即時改變
4. 在 Axios 欄刪除 → 該卡片即時消失
5. 打開 `db.json`，會看到資料真的被寫入/修改/刪除
6. 刻意把某個 ID 改成不存在來測 404，比較三者錯誤行為（特別是 Fetch 不會 reject 的雷）
