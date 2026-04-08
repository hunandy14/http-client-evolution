# 安裝與啟動

這份文件只講「怎麼把這個 demo 跑起來」。想看文章內容請看 [README.md](README.md)。

## 環境需求

- Node.js 18+（[下載](https://nodejs.org)）
- 任一現代瀏覽器

## 啟動

```bash
# 1. 安裝依賴（一次性）
npm install

# 2. 同時啟動後端 (port 3000) 與前端 (port 5500)
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

## 專案結構

```
ajax/
├── index.html           # 三欄並排 UI
├── style.css
├── db.json              # json-server 的資料檔
├── js/
│   ├── shared.js        # 共用樣板（DOM、事件、auto-sync）
│   ├── jquery-demo.js   # 🟦 jQuery AJAX 學習重點
│   ├── fetch-demo.js    # 🟩 Fetch 學習重點
│   ├── axios-demo.js    # 🟪 Axios 學習重點
│   ├── ky-demo.js       # 🟦 ky（modern Axios 替代品，ESM）
│   └── ofetch-demo.js   # 🟧 ofetch（Nuxt 內建的 $fetch，ESM）
├── README.md            # 文章本體
└── SETUP.md             # 你正在看的這份
```

打開 `js/` 底下三個 demo 檔，是純粹的學習內容，沒有 DOM 樣板雜訊。

## ⚠️ Axios CDN 安全提醒

Axios 曾傳出供應鏈安全事件。本專案的 CDN **已鎖定特定版本**（`axios@1.7.9`）。使用前請：

1. 到 <https://github.com/axios/axios/releases> 確認目前最新穩定版
2. 更新 [`index.html`](index.html) 內 `axios@x.y.z` 的版號
3. 加上 SRI integrity hash：<https://www.srihash.org/>
4. **永遠不要**用 `axios@latest` 或不指定版號的 CDN URL

同樣原則適用於所有第三方 CDN。
