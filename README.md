# Axios 出事了。2026 我們該用什麼發 HTTP 請求？

> **9 天前**（2026/03/31），axios 被北韓駭客攻陷，惡意版本 `1.14.1` 和 `0.30.4` 在 npm 上掛了 3 小時，影響每週 1 億+ 下載量。
>
> 這篇要回答：**事件來龍去脈、你的專案中招了沒、之後該選什麼工具**。
>
> 文末有一個 [可以 clone 跑的 demo](#動手玩這個-repo)，三種傳統寫法（jQuery / Fetch / Axios）並排對比，幫你理解差異。

---

## 一、9 天前發生了什麼

### 時間線（UTC）

| 時間 | 事件 |
|---|---|
| 03/31 00:21 | 攻擊者發布 `axios@1.14.1` |
| 03/31 01:00 | 攻擊者發布 `axios@0.30.4`（針對舊版用戶） |
| 03/31 ~03:20 | 惡意版本從 npm 移除 |
| 04/01 | Google Threat Intelligence 正式歸因到 **UNC1069**（北韓） |

**3 小時的暴露窗口**。聽起來短，但 axios 每週下載上億次，這 3 小時裡有多少 CI/CD 自動更新、多少新專案 `npm install`，沒人知道。

### 攻擊者怎麼進來的

維護者 Jason Saayman 的 npm 帳號被**社交工程**攻破。他事後說攻擊「極度精準、看起來完全合法、執行得非常專業」。攻擊者改了帳號 email、偷了發布權限，然後手動發布惡意版本（繞過 axios 正常的 GitHub Actions OIDC 流程）。

### 惡意 code 做了什麼

整個 1.14.1 對比 1.14.0，**只改了 1 個檔案** —— `package.json`，新增一個 dependency：

```
plain-crypto-js@4.2.1
```

注意這是個 **typosquat**（仿冒 `crypto-js` 的釣魚包）。axios 自己的程式碼**完全沒引用它**，這個依賴的唯一目的就是當投毒載具。

`plain-crypto-js` 安裝時的 postinstall script 是個叫 **SILKBELL** 的多階段 RAT（remote access trojan）：

1. **跨平台投放** —— Windows / macOS / Linux 各有對應 payload
2. **偷憑證** —— cloud access keys、資料庫密碼、API token
3. **植入後門** —— `WAVESHAPER.V2`，UNC1069 的看家武器
4. **自我清理** —— 把自己刪掉、把 package.json 還原成乾淨版本逃避偵測
5. **C2 連線** —— `sfrclak[.]com`，網址路徑 `/6202033`（攻擊日期 03/30/26 倒著寫，駭客的彩蛋）

> 💡 如果你的 CI / 開發機在那 3 小時內裝過 axios，請當作**整台環境已被入侵**處理 —— 旋轉所有雲端密鑰、CI/CD secrets。

---

## 二、檢查你的專案有沒有中標

### 立即執行（30 秒）

```bash
# 1. 在 lockfile 裡搜尋惡意依賴
grep "plain-crypto-js" package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null

# 2. 檢查是否有受影響的 axios 版本
npm ls axios
```

**有任何 `plain-crypto-js` 相關字串 → 你中標了**。

### 確認你的 axios 版本

| 版本 | 狀態 |
|---|---|
| `< 1.14.1` | ✅ 安全 |
| `1.14.1` | 🚨 **惡意版本** |
| `0.30.4` | 🚨 **惡意版本** |
| `1.40.0+` | ✅ 安全（已修復、改善發布流程） |

**建議**：升到 `1.40.0+`，並加入 lockfile 嚴格鎖版。

### 中招後怎麼辦

1. 停掉受影響的開發機與 CI runner
2. 旋轉所有 secrets：cloud keys、DB 密碼、API token、SSH key、git token
3. 檢查 DNS 記錄是否有連線到 `sfrclak[.]com`
4. 從乾淨環境重建 `node_modules`
5. 看 [Tenable FAQ](https://www.tenable.com/blog/faq-about-the-axios-npm-supply-chain-attack-by-north-korea-nexus-threat-actor-unc1069) 完整應對指南

---

## 三、那 2026 該用什麼？

這事件給我們三個教訓：

1. **「下載量大 = 安全」是假象**。axios 每週 1 億+ 下載一樣會被攻破
2. **單點故障的維護者很危險**。一個帳號被釣，整個 ecosystem 中招
3. **依賴越少、攻擊面越小**

### 從證據出發的比較表

下表整理各工具**可驗證的客觀屬性**（bundle size、edge 支援、是否原生丟錯等），不是「該選哪個」的建議。最終選擇仍取決於你的專案脈絡。

| 工具 | Bundle (gzip) | 4xx/5xx 自動丟錯 | Edge runtime | Interceptors / Hooks | npm 週下載 |
|---|---|---|---|---|---|
| native Fetch | 0 KB | ❌ 需自己判斷 `res.ok` | ✅ 完整 | ❌ 需自己包 wrapper | — |
| Axios 1.40+ | ~13 KB | ✅ | ⚠️ 部分 edge runtime 不相容（多個來源證實） | ✅ | ~1 億 |
| `ky` | ~2.5 KB | ✅ | ✅ | ✅（`hooks` / `extend`） | ~120 萬 |
| `ofetch` | ~1.2 KB | ✅ | ✅（Nuxt 內建 `$fetch`） | ✅（`onRequest` / `onResponse`） | ~350 萬 |
| `wretch` | ~4.8 KB | ✅（細粒度，如 `.notFound()`） | ✅ | ✅（`.middlewares()`） | ~25 萬 |
| jQuery AJAX | ~30 KB（整包 jQuery） | ✅ | ❌ | 無（`$.ajaxSetup` 是全域副作用） | — |

> 來源：bundlephobia、各套件 README、Tenable / Datadog / Elastic 安全報告（見文末參考資料）。

### 從這些證據可以說的話

只列**有事實基礎**的觀察，不下「應該選 X」的斷言：

- **bundle size 敏感的場景**（landing page、Edge function、行銷頁），native Fetch 的 0 KB 與 `ofetch` 的 1.2 KB 是有意義的差距
- **Edge / Cloudflare Workers / Deno** 環境裡，已有多個案例（如 SendGrid SDK）因 axios 依賴 Node API 而失敗 —— 在這類環境**axios 不是無腦可用的選項**
- **想要 axios 那種 interceptor 體驗但不想引入 axios 的人**，`ky` 與 `ofetch` 都提供同等功能、體積小一個數量級
- **Fetch 的 4xx/5xx 不會 reject** 是規格行為（不是 bug），這也是 `ky` / `ofetch` / `wretch` 都選擇覆寫此行為的原因
- **axios 1.40.0+ 經過事件後修復**，目前沒有公開資料顯示這些版本不安全 —— 已部署的 axios 專案沒有立即遷移的技術迫切性

### 不能只憑這些證據說的話

以下是常見但**證據不足**的論點，請保留判斷：

- 「2026 大家都在離開 axios」—— 部分安全廠商與技術部落格如此描述，但 npm 下載量截至撰文時仍維持週 1 億級別，**沒有實際的大規模遷移數據**
- 「`ky` 是 axios 的最佳替代品」—— 取決於你的需求；`ofetch` 在 Nuxt 生態下載量更高
- 「新專案不該選 axios」—— 取決於團隊熟悉度、生態系、既有 code 共用程度

---

## 四、Axios 替代品速覽

### `ky`

```js
import ky from 'ky';   // npm install ky
const data = await ky.get('https://api.example.com/books').json();
```

- **2.5 KB** gzipped（vs Axios 13 KB）
- 自動丟錯（4xx/5xx 直接 throw，沒有 Fetch 的雷）
- 內建 retry、timeout、JSON 處理
- 透過 `ky.create({ hooks })` 提供類似 Axios interceptors 的功能
- TypeScript first、Edge runtime 完整支援
- 每週 ~120 萬下載

### `ofetch`

```js
import { ofetch } from 'ofetch';   // npm install ofetch
const data = await ofetch('https://api.example.com/books');
```

- **1.2 KB** gzipped（最小）
- Nuxt 內建的 `$fetch` 就是它
- 自動丟錯、自動 JSON、自動 retry
- 透過 `ofetch.create({ onRequest, onResponseError })` 設定 hooks
- 適合 SSR / Edge / Workers
- 每週 ~350 萬下載

### `wretch`

```js
import wretch from 'wretch';   // npm install wretch
const data = await wretch('https://api.example.com/books').get().json();
```

- **4.8 KB** gzipped
- 鏈式 API，錯誤分流細膩（`.notFound()` / `.badRequest()` / `.unauthorized()`...）
- 每週 ~25 萬下載

---

## 五、回望：jQuery / Fetch / Axios 各自解決了什麼問題

理解一個工具的最好方式，是搞懂它**誕生時要解決什麼問題**。三個工具不是同時出現的，每一個都是當時痛點的解藥 —— 看懂這條時間線，你會更清楚為什麼今天的選擇會是這樣。

### 🟦 jQuery AJAX（2006）—— 把瀏覽器的差異藏起來

**那個年代的痛**：寫一個 XHR 請求，IE6 / IE7 / Firefox / Safari 各有各的寫法。

```js
// 2005 年的真實情況（簡化版）
let xhr;
if (window.XMLHttpRequest) {
  xhr = new XMLHttpRequest();           // 標準瀏覽器
} else if (window.ActiveXObject) {
  xhr = new ActiveXObject('Msxml2.XMLHTTP');   // IE
}
xhr.onreadystatechange = function () {
  if (xhr.readyState === 4 && xhr.status === 200) {
    const data = JSON.parse(xhr.responseText);
    // ...
  }
};
xhr.open('GET', '/api/data', true);
xhr.send();
```

**jQuery 帶來的解放**：

```js
// 引入 jQuery 後（CDN 一行就能用）
$.ajax({
  url: '/api/data',
  success: (data) => console.log(data),
  error: (xhr) => console.error(xhr.status),
});
```

從十幾行 XHR 變幾行設定物件，更重要的是**不用管哪個瀏覽器** —— 上面這段 code 在 IE6 跟 Chrome 都跑得起來。在那個 IE6 還有 30% 市佔率的年代，這是革命性的。

「AJAX」這個詞甚至是因為 jQuery 的普及才走進大眾視野（雖然詞本身 2005 年由 Jesse James Garrett 提出）。

> 💡 **它解決的問題今天還在嗎？** 不在了。瀏覽器之間 XHR / Fetch 早已標準化，jQuery 的這個價值消失了 —— 這是它在新專案被淘汰的根本原因。

### 🟪 Axios（2014）—— Promise 還沒普及、Fetch 還沒生出來的中間期

**那個年代的痛**：
- ES6 Promise 規格才剛出（2015 才正式進 ES6）
- 原生 Fetch 草案還在制定（2015 才有第一版規格、2017 才在主流瀏覽器穩定）
- jQuery 已經太肥（30 KB 只為了發請求太浪費）
- Node.js 後端也要發 HTTP 請求，但 jQuery 不能在 Node 用

**Axios 的解答**：

```js
import axios from 'axios';

axios.get('/api/data')
  .then((res) => console.log(res.data))   // 注意要從 res.data 取
  .catch((err) => console.error(err.response?.status));
```

它做對了三件事：

1. **Promise-based** —— 還在 callback hell 的年代，這是巨大進步
2. **同構（isomorphic）** —— 瀏覽器和 Node.js 同一套 API，後端也能用
3. **interceptors** —— 統一處理 token、錯誤、loading state，這是 jQuery `$.ajaxSetup` 做不到的

加上後來的 React / Vue 生態崛起、SPA 大流行，axios 成了那 5~6 年的事實標準。**在 2018~2024 之間，新專案問「該用什麼發 HTTP」，答案幾乎都是 Axios**。

> 💡 **它解決的問題今天還在嗎？** 大部分被原生 Fetch 解決了（Promise、同構、現代語法）。剩下的（interceptors、簡潔語法）被 `ky` / `ofetch` 用更小的體積接手。加上 2026/03 的供應鏈事件，axios 的時代正在結束。

### 🟩 Fetch（2015 規格，2017 主流瀏覽器穩定）—— 終於成為 web 標準

**那個年代的痛**：所有人都在用第三方套件（jQuery、Axios、SuperAgent...）只為了發一個 HTTP 請求。**這件事不應該需要套件**。

W3C 與 WHATWG 在 2015 年推出 Fetch API 規格，目標就是讓「發請求」成為**瀏覽器原生能力**，跟 `setTimeout` 一樣不需要任何 import。

```js
// 瀏覽器原生，不用 import 任何東西
fetch('/api/data')
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);   // ⚠️ 要自己判斷
    return res.json();                                    // ⚠️ 要自己 parse
  })
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

它做對的事：

1. **零依賴** —— 瀏覽器原生
2. **Promise-based** —— 跟現代 JS 一致
3. **可串流（streaming）** —— ReadableStream，支援大檔案下載逐塊處理（這是 Axios 一直做不好的事）
4. **Web 標準** —— Service Worker、Cloudflare Workers、Deno、Bun、Node 18+ 全部支援

**Fetch 的代價**：規格設計上刻意保持「低階」，所以：
- 4xx/5xx 不會自動丟錯（規格說「請求成功送達就算 resolve」）
- 沒有 interceptors、retry、timeout（要靠 AbortController 自己組）
- JSON 處理要手動

這些「不便」反而成就了 `ky` / `ofetch` 這類「Fetch + 一點甜頭」的薄封裝套件 —— 它們不是要取代 Fetch，是**站在 Fetch 標準之上補完便利性**。

> 💡 **它的時代來了嗎？** 來了。Node 18+ 內建、Edge runtime 預設、瀏覽器全支援。「發 HTTP 請求需要套件」這件事，2026 年已經不再成立。

---

### 一張圖看懂三者的歷史定位

```
2006 ────────── 2014 ──────── 2015 ─────── 2017 ─────── 2022 ──────── 2026
  │              │             │            │             │            │
jQuery        Axios        Fetch 規格    Fetch 在主流  Node 18+    axios 供應
誕生          誕生         發布         瀏覽器穩定   內建 fetch  鏈攻擊
  │              │             │            │             │            │
解決          解決          目標：       終於可以      連 Node    社群開始
瀏覽器        callback     讓 HTTP      不靠套件     都不用      尋找輕量
差異          地獄          回歸原生     發請求        Axios       替代品
```

每一個工具都是它那個時代的對的選擇。**問題不在工具好不好，而在你今天面對的痛點是什麼**。

---

## 六、親手把五種工具跑過一遍

光看程式碼跟表格不夠，把它們**並排跑在同一個後端上**才會有體感。

這個 repo 的 demo 已經把上面提到的工具全部接起來：

- 🟦 **jQuery AJAX** —— 老牌但仍在無數舊專案裡
- 🟩 **Fetch** —— 原生標準，但要你親自踩 4xx/5xx 的雷
- 🟪 **Axios** —— 過去十年的事實標準（事件後請務必鎖在 1.40.0+）
- 🟦 **ky** —— Axios 的精神繼承者，2.5 KB
- 🟧 **ofetch** —— Nuxt 內建 `$fetch`，1.2 KB

打開 [`js/`](js/) 下任一個 demo 檔，**每個都是純粹的學習內容**（樣板都搬到 `shared.js` 了），一眼就能對照五種寫法的差異。

### 啟動方式

```bash
git clone https://github.com/hunandy14/http-client-evolution.git
cd ajax
npm install
npm run dev
```

瀏覽器打開後你可以：

- 五欄並排，對同一個 json-server 後端做 CRUD
- 切換「自動整理」開關，對比同步 vs 各自獨立的行為
- 故意把 `db.json` 拔掉、或改個不存在的 ID，比較五者的錯誤訊息差多少
- 在 Console 執行 `localStorage.setItem('token', 'fake-jwt-123')`，看 Axios / ky / ofetch 的 interceptor 怎麼自動把 token 塞進 header

啟動細節看 [SETUP.md](SETUP.md)。

---

## 七、新手三點記憶

如果文章太長，記住這三件事就好：

1. **2026/03 axios 出過供應鏈事件**，但 1.40.0+ 已修復、發布流程也補強了 —— 真正要記住的不是「axios 不能用」，而是**任何套件都要鎖版號、定期 audit**。
2. **Fetch 最大的雷是 4xx/5xx 不會 reject**，要自己 `if (!res.ok) throw`。`ky` / `ofetch` 都解決了這個問題。
3. **依賴越少越安全**。下次選套件前先問：「我真的需要這個嗎？native API 能做嗎？」

---

## 參考資料

- [Tenable: FAQ about the axios npm supply chain attack](https://www.tenable.com/blog/faq-about-the-axios-npm-supply-chain-attack-by-north-korea-nexus-threat-actor-unc1069)
- [StepSecurity: How we detected the largest npm supply chain attack](https://www.stepsecurity.io/blog/behind-the-scenes-how-stepsecurity-detected-and-helped-remediate-the-largest-npm-supply-chain-attack)
- [Elastic Security Labs: How we caught the axios supply chain attack](https://www.elastic.co/security-labs/how-we-caught-the-axios-supply-chain-attack)
- [Datadog: axios npm supply chain compromise](https://securitylabs.datadoghq.com/articles/axios-npm-supply-chain-compromise/)
- [The Hacker News: UNC1069 social engineering of axios maintainer](https://thehackernews.com/2026/04/unc1069-social-engineering-of-axios.html)

---

**有錯誤、補充或不同意見歡迎開 issue 討論 🙌**
