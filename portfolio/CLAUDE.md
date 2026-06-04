# Portfolio — chi.dev

## Tổng quan
Web portfolio Next.js 14 (TypeScript + Tailwind CSS) cho dịch vụ Automation/Scraping của Chi Nguyen trên Upwork. Mục tiêu: chuyển đổi khách hàng tiềm năng qua demo tương tác thực tế.

## Cấu trúc
```
app/
  layout.tsx                  — Root layout + metadata SEO
  page.tsx                    — Single-page (hero+avatar, skills, projects+demo links, process, contact)
  demo/
    price-alert/page.tsx      — Demo 1: Price Alert Bot
    scraper/page.tsx          — Demo 2: E-commerce Scraper
    job-monitor/
      page.tsx                — Demo 3: Job Board Monitor
      mockJobs.ts             — 15 job entries mẫu
    chrome-extension/page.tsx — Demo 4: Chrome Extension Automator
    google-sheets/page.tsx    — Demo 5: Google Sheets Auto-Sync
    report-generator/page.tsx — Demo 6: Automated Report Generator
    discord-bot/page.tsx      — Demo 7: Discord Bot
    email-automator/page.tsx  — Demo 8: Email Inbox Automator
  api/demo/
    price/route.ts            — CoinGecko simple/price proxy (+ market_cap, vol)
    chart/route.ts            — CoinGecko market_chart 24h proxy
    ai/route.ts               — Gemini 1.5 Flash market analysis
    scrape/route.ts           — cheerio scraper cho books.toscrape.com
public/
  avatar.png                  — Ảnh cá nhân, hero section (next/image)
```

## Chạy local
```bash
npm run dev   # http://localhost:3000
npm run build # production check
```

## Stack
- Next.js 14.2.5 · TypeScript strict · Tailwind CSS 3.4
- `cheerio` — HTML parsing trong scraper API
- `next/image` — tối ưu avatar
- Google Gemini 1.5 Flash — AI market analysis (key trong `/api/demo/ai/route.ts`)

---

## Demo 1 — `/demo/price-alert` (Telegram Price Alert Bot)

### Ý tưởng bán hàng
Bot tự theo dõi giá 24/7, bắn Telegram ngay khi giá vượt mục tiêu — không cần ngồi nhìn màn hình.

### Tính năng v2
- **Stats row** — Current Price, 24h Change, Market Cap, 24h Volume (live từ CoinGecko)
- **24h Sparkline chart** — SVG tự vẽ từ `market_chart` API, màu xanh/đỏ tự động theo trend
- **AI Market Analysis** — Gọi Gemini 1.5 Flash với price data, trả 2 câu phân tích
- **Telegram window mock** — UI giống Telegram desktop thật (`#17212b` background, bubble tin nhắn từ bot, input bar)
- Polling mỗi 4s, dùng `useRef` để tránh double-fire

### Logic từng phần
**SparklineChart:** nhận `[timestamp, price][]` → tính min/max → normalize → vẽ SVG path + gradient area + dot cuối cùng + time labels

**TelegramWindow:** component riêng, nhận `TelegramMsg[]`, auto-scroll khi có tin mới, styled như Telegram dark theme

**AI Analysis (`/api/demo/ai/route.ts`):**
- Gửi coin name + currentPrice + change24h tới `gemini-1.5-flash`
- Nếu API fail → fallback text dựa vào sign của change24h
- Key: `AQ.Ab8RN6IJctQi_FtVIY7rV4ZRA0yShNiFxkpF0bJ9LpDLhE95qw` (Google AI Studio free tier)

**Chart API (`/api/demo/chart/route.ts`):**
- Fetch `coins/{id}/market_chart?days=1&interval=hourly`
- Fallback: generate 25 noise points xung quanh base price

### Câu hỏi khách hàng hay hỏi
- *"Bot chạy 24/7 không?"* → Có, deploy VPS/Raspberry Pi, asyncio infinite loop
- *"Hỗ trợ bao nhiêu coin?"* → CoinGecko 10,000+ coin, chỉ cần truyền coin ID
- *"Alert nhiều điều kiện cùng lúc?"* → Có, mỗi điều kiện 1 coroutine riêng

---

## Demo 2 — `/demo/scraper` (E-commerce Data Scraper)

### Ý tưởng bán hàng
Thu thập giá, tồn kho, rating hàng nghìn sản phẩm tự động, export CSV trong vài giây.

### Tính năng v2
- **Stats dashboard** — Products scraped, In Stock %, Avg Price (range), 5-star count
- **Filter/Sort** — Sort by price↑↓ / rating / title A-Z; filter by rating (1-5★); filter by availability
- **CSV Export** — Client-side, `Blob + URL.createObjectURL`, không cần backend
- **Scrape timing** — Hiển thị "X products in Y.Zs" sau khi xong
- **Animated log terminal** — 8 bước log hiện lần lượt (280ms/bước)

### Logic
**Filter/Sort (`useMemo`):** `processed` array được tính lại mỗi khi `sortKey`, `filterRating`, `filterStock` thay đổi — không re-fetch

**CSV Export (`downloadCSV`):**
- Build string với `header + rows`
- `Blob(['text/csv'])` → `URL.createObjectURL` → click `<a>` programmatically → revoke URL

**Scrape API (`/api/demo/scrape/route.ts`):**
- Fetch page HTML từ `books.toscrape.com` với User-Agent + 8s timeout
- `cheerio.load(html)` → select `article.product_pod` → extract 5 fields
- Fallback: 2 hardcoded products

**books.toscrape.com:** Trang tạo ra đặc biệt để luyện scraping, không block, dữ liệu ổn định 50 trang × 20 sản phẩm = 1000 products.

### Câu hỏi khách hàng hay hỏi
- *"Scraper có bị block không?"* → Tùy site. Giải pháp: rotate User-Agent, delay, proxy rotation
- *"Playwright vs BeautifulSoup?"* → JS động → Playwright; HTML tĩnh → BS4/cheerio (10x nhanh hơn)
- *"Lưu data ở đâu?"* → CSV, PostgreSQL, Google Sheets API, MongoDB — tùy yêu cầu

---

## Demo 3 — `/demo/job-monitor` (Job Board Auto-Monitor)

### Ý tưởng bán hàng
Thay vì F5 LinkedIn mỗi giờ, bot tự quét 3 nguồn và chỉ ping Telegram khi có job mới match keyword.

### Tính năng v2
- **Bộ lọc nâng cao** — Keywords + Job Type (Remote/Hybrid/On-site)
- **Source tabs** — Filter kết quả theo LinkedIn / Indeed / Upwork sau khi scan
- **Per-source count** — Hiện số job tìm được từng nguồn ngay khi scan xong
- **Telegram window** — Giống Demo 1, styled như Telegram dark app, hiện alert khi click "Notify via Telegram"
- **Monitor Schedule panel** — Countdown đếm ngược đến lần scan tiếp theo (30 min), last scan time, trạng thái Telegram active
- **`NextScanCountdown` component** — `useEffect` tick mỗi giây, reset về 1800 khi về 0

### Logic
**runScan:** Animate từng source với setTimeout 1.3s/source → sau đó filter MOCK_JOBS theo keywords + jobType → set sourceCounts → hiện kết quả

**Filter UI:** `displayed = useMemo()` filter theo `sourceFilter` state → re-render ngay không cần re-scan

**TelegramWindow:** Component riêng, nhận messages array, auto-scroll, Telegram dark theme

**Tại sao mock data?** LinkedIn/Indeed block scraping. Demo minh họa flow/UX, code Python thật vẫn hiển thị.

### Câu hỏi khách hàng hay hỏi
- *"Scrape LinkedIn thật không?"* → Khó, rủi ro ban. Thực tế: RSS feed, Apify actor, unofficial API
- *"Quét bao lâu 1 lần?"* → 15-30 phút để tránh rate limit
- *"Filter theo lương/location?"* → Có, thêm điều kiện filter vào code

---

## Demo 4 — `/demo/chrome-extension` (Chrome Extension Task Automator)

### Ý tưởng bán hàng
Extension tự điền form lặp lại hàng chục lần/ngày chỉ trong vài giây — nhân viên không cần rời trình duyệt.

### Tính năng v2
- **3 Workflow presets** — Vendor Order Form / Competitor Price Check / Lead Form Fill (mỗi cái có steps riêng)
- **Batch Mode** — Xử lý 5 records liên tiếp, hiện progress bar + bảng queue status (Queued → Processing → Done)
- **Extracted Data table** — Sau single run, hiện bảng dữ liệu đã extract từ page
- **Time Comparison bar chart** — So sánh manual time vs extension time với progress bars
- **Fake browser frame** — URL bar thay đổi theo workflow, extension icon pulse khi chạy

### Logic
**run (single):** `setTimeout` mỗi 900ms cho từng step → update `step` state → conditional render form fields

**runBatch:** Tính offset cho mỗi row (`rowStart = ri * steps.length * 400ms`) → nested setTimeout → `batchRow` + `step` cùng update → bảng hiện realtime status

**FormFields:** `fieldValues` computed từ `step` state — `step >= i` thì field có value, đồng thời highlight border cyan khi `step === i`

**3 Workflows typed với `as const`:** TypeScript suy ra type `WorkflowId` từ union, không cần enum

### Câu hỏi khách hàng hay hỏi
- *"Chạy trên mọi website không?"* → Có, cấp `"matches": ["<all_urls>"]` trong manifest
- *"Cài Chrome Web Store không?"* → Có thể; hoặc private install (unpacked) cho nội bộ công ty
- *"Lấy data từ trang về được không?"* → Có, `content.js` read DOM → `sendResponse` về popup

---

---

## Demo 5 — `/demo/google-sheets` (Google Sheets Auto-Sync)

### Ý tưởng bán hàng
Scraper/bot chạy xong → data tự vào Google Sheets, không cần copy-paste.

### Tính năng
- **Source selector** — Products / Crypto Prices / Job Listings, sheet name input, sync interval
- **Mock spreadsheet** — Grid giống Google Sheets thật, frozen header, row xuất hiện từng cái với cyan highlight fade khi sync
- **Live stats panel** — Rows Written, Cells Updated, Sync Speed (rows/s), Last Sync, Connection status
- **Animated log terminal** — Log từng bước: auth → fetch → open sheet → write rows
- **Python code snippet** — gspread + google-auth code thực tế

### Logic
**handleSync:** setTimeout chain để animate logs (320ms/step) + rows xuất hiện (140ms/row delay). Row status: `writing` (cyan highlight) → `done` (normal). Stats counter increment realtime. Không có API call thật — toàn bộ là mock + animation.

**Tags:** Python, Google Sheets API, gspread, OAuth2  
**Result:** "Eliminated 3h/day of manual copy-paste"

---

## Demo 6 — `/demo/report-generator` (Automated Report Generator)

### Ý tưởng bán hàng
Mỗi sáng 8h, báo cáo tổng hợp gửi thẳng email — không cần ai làm thủ công.

### Tính năng
- **Config bar** — Multi-select data sources, date range, format (HTML/PDF/Both), Generate button
- **5-step progress tracker** — Collecting → Aggregating → Building Charts → Formatting → Ready (sequential animate 700ms/step)
- **Report Preview** — Trang báo cáo thật: header dark gradient, 3 stats cards, SVG bar chart (grow animation) + SVG line chart (stroke-dashoffset draw animation), top-5 products table
- **Delivery config** — Email input, schedule select, "Set" toggle → marked as scheduled
- **Python code snippet** — pandas + jinja2 + smtplib + schedule

### Components
**BarChart:** Nhận `animate` prop, CSS transition `width` từ 0% lên với delay 120ms/bar.
**LineChart:** SVG với `strokeDashoffset` transition từ pathLen → 0, gradient fill, dots xuất hiện sau.
Report preview render trong light theme (white bg) giống báo cáo PDF thật.

**Tags:** Python, Pandas, Jinja2, SMTP, Matplotlib  
**Result:** "Daily reports auto-delivered at 8 AM, zero manual work"

---

## Demo 7 — `/demo/discord-bot` (Discord Bot)

### Ý tưởng bán hàng
Bot Discord tự trả lời commands, monitor kênh, gửi alert real-time cho toàn server.

### Tính năng
- **Mock Discord UI** — `#313338` bg, `#2b2d31` sidebar, channel list (4 kênh), member list, message area với rich embeds
- **5 Slash Commands** — `/price`, `/alert set`, `/status`, `/scrape`, `/help` — click → typing indicator 1.2s → rich embed response
- **Rich Embeds** — Colored left border, field grid 2 cột, footer, BOT badge, bold markdown support
- **Channel Monitor** — Toggle bật/tắt, fake messages stream mỗi 2.5s, bot detect keyword → embed alert
- **Python code snippet** — discord.py + slash commands + `@tasks.loop`

### Logic
**handleCommand:** Add user message → setIsTyping → 1200ms → add bot embed response.
**toggleMonitor:** `setInterval` 2500ms feed MONITOR_FEED → check keyword match → bot reply embed nếu match.
Escape `\${...}` trong Python f-strings để tránh JS template literal conflict.

**Tags:** Python, discord.py, Slash Commands, Rich Embeds, asyncio  
**Result:** "Automated support for 500+ member server"

---

## Demo 8 — `/demo/email-automator` (Email Inbox Automator)

### Ý tưởng bán hàng
Script tự đọc inbox, phân loại, auto-reply theo template — 80% email xử lý tự động.

### Tính năng
- **12 mock emails** — Mix orders, invoices, newsletters, spam, urgent, job alerts
- **3 tabs** — Inbox (click để expand body) / Rules (add/xóa rule) / Templates (2 preset)
- **Rule Builder** — 5 default rules, có thể add rule mới (condition + operator + value + action)
- **"Run Rules" button** — Animate từng email: highlight → badge xuất hiện (AUTO-REPLIED/FORWARDED/ARCHIVED/SPAM/PRIORITY)
- **Stats bar** — 6 metrics: Processed, Replied, Forwarded, Archived, Spam, Time Saved
- **Log terminal** — Hiển thị từng action thực hiện, auto-scroll
- **Python code snippet** — imaplib + smtplib + email parsing

### Logic
**applyRules:** Loop qua rules array, check condition (subject/from/body) + operator (contains/equals/starts_with) → return first matching status.
**handleRunRules:** Delay 450ms/email → set status → update stats. `showAddRule` state cho inline "Add Rule" form.
**Reset demo** button xuất hiện sau khi done để chạy lại từ đầu.

**Tags:** Python, Gmail API, IMAP, SMTP, imaplib  
**Result:** "Automated 80% of inbox management, saved 2.5h/day"

---

## Trang chính (app/page.tsx)
- **Hero**: avatar bên phải (next/image, glow ring), badge "Available · $15/hr", 2 CTAs, tech tags
- **Skills**: 6 cards
- **Projects**: 8 cards (4 cũ + 4 mới), mỗi card có nút "View Demo →"
- **Process / Contact / Footer**: giữ nguyên
