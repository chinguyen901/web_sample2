# Portfolio — chi.dev

## Tổng quan
Web portfolio Next.js 14 (TypeScript + Tailwind CSS) cho dịch vụ Automation/Scraping của Chi Nguyen trên Upwork. Mục tiêu: chuyển đổi khách hàng tiềm năng qua demo tương tác thực tế.

## Cấu trúc
```
app/
  layout.tsx                  — Root layout + metadata SEO
  page.tsx                    — Single-page portfolio (hero với avatar, skills, projects, process, contact)
  globals.css                 — Tailwind base + smooth scroll
  demo/
    price-alert/page.tsx      — Demo: Telegram Price Alert Bot
    scraper/page.tsx          — Demo: E-commerce Data Scraper
    job-monitor/
      page.tsx                — Demo: Job Board Auto-Monitor
      mockJobs.ts             — 15 job entries mẫu
    chrome-extension/page.tsx — Demo: Chrome Extension Simulator
  api/demo/
    price/route.ts            — Proxy CoinGecko API
    scrape/route.ts           — Backend scraping với cheerio
public/
  avatar.png                  — Ảnh cá nhân, hiển thị trong hero section
```

## Chạy local
```bash
npm run dev   # http://localhost:3000
npm run build # Production build
```

## Stack
- Next.js 14.2.5 (App Router, `"use client"` cho interactive demos)
- TypeScript strict
- Tailwind CSS 3.4
- `cheerio` — HTML parser nhẹ cho scraper demo
- `next/image` — tối ưu ảnh avatar

---

## Chi tiết từng Demo

---

### 1. Telegram Price Alert Bot — `/demo/price-alert`

**Ý tưởng bán hàng:** Khách hàng không muốn ngồi nhìn màn hình chờ giá coin/cổ phiếu. Bot tự làm việc đó và bắn Telegram ngay khi điều kiện thỏa mãn.

**Logic hoạt động:**
1. User chọn coin (BTC hoặc ETH), nhập target price, chọn direction (above/below)
2. Nhấn "Start Monitoring" → `setInterval` 4 giây gọi `/api/demo/price`
3. API route proxy request tới CoinGecko `/simple/price` — lấy `usd` và `usd_24h_change`
4. Mỗi tick so sánh `current >= target` (hoặc `<=`) — nếu thỏa → render mock Telegram notification card
5. Dùng `useRef` cho `triggeredRef` để tránh fire nhiều lần khi giá vẫn ở mức đó
6. Nếu CoinGecko trả lỗi → fallback hardcode BTC ~67k, ETH ~3.5k

**File quan trọng:**
- `app/api/demo/price/route.ts` — fetch CoinGecko, fallback data nếu 429/lỗi
- `app/demo/price-alert/page.tsx` — toàn bộ UI + polling logic

**Câu hỏi khách hàng hay hỏi:**
- *"Bot có chạy 24/7 không?"* → Có, deploy trên VPS/Raspberry Pi, process không bao giờ tắt
- *"Hỗ trợ bao nhiêu coin?"* → Không giới hạn, CoinGecko có 10,000+ coin
- *"Có thể alert nhiều điều kiện cùng lúc không?"* → Có, mỗi điều kiện chạy một coroutine riêng

---

### 2. E-commerce Data Scraper — `/demo/scraper`

**Ý tưởng bán hàng:** Thu thập giá, tồn kho, review từ hàng nghìn sản phẩm tự động — không cần copy-paste bằng tay.

**Logic hoạt động:**
1. User chọn page (1–50) rồi nhấn "Scrape"
2. Frontend animate 8 bước log (Initializing → Returning JSON) với `setTimeout` 300ms/bước
3. Đồng thời gọi `/api/demo/scrape?page=N`
4. API route fetch `https://books.toscrape.com/catalogue/page-N.html` với User-Agent header và 8s timeout
5. Dùng `cheerio.load(html)` rồi query `article.product_pod` — extract từng field:
   - `h3 a[title]` → tên sách
   - `p.price_color` → giá (£)
   - `p.star-rating[class]` → rating chữ (One/Two/Three/Four/Five)
   - `p.availability` → In stock / Out of stock
   - `img[src]` → ảnh (fix URL `../` → `https://books.toscrape.com/`)
6. Nếu scrape fail (timeout, block) → trả fallback 2 sản phẩm cứng

**books.toscrape.com là gì?** — Trang web được tạo ra đặc biệt để luyện scraping, không block bot, dữ liệu ổn định.

**File quan trọng:**
- `app/api/demo/scrape/route.ts` — cheerio parsing + fallback
- `app/demo/scraper/page.tsx` — log animation + product grid

**Câu hỏi khách hàng hay hỏi:**
- *"Scraper có bị block không?"* → Có thể, tùy site. Giải pháp: rotate User-Agent, thêm delay, dùng proxy
- *"Dùng Playwright hay BeautifulSoup?"* → Site dùng JS động → Playwright. Site HTML tĩnh → BeautifulSoup/cheerio (nhanh hơn 10x)
- *"Lưu data ở đâu?"* → CSV, PostgreSQL, Google Sheets — tùy yêu cầu

---

### 3. Job Board Auto-Monitor — `/demo/job-monitor`

**Ý tưởng bán hàng:** Thay vì F5 LinkedIn mỗi giờ, bot tự quét và chỉ ping khi có job mới match keyword.

**Logic hoạt động:**
1. User nhập keywords (vd: "python automation"), nhấn "Scan Now"
2. Scan animation: lần lượt highlight từng source (LinkedIn → Indeed → Upwork) với delay 1.2s/source, dùng `setTimeout` loop
3. Sau khi animation xong → filter `MOCK_JOBS` array (15 entries) theo keyword:
   - So với `job.title.toLowerCase()` và `job.tags[]`
   - Nếu không match gì → show 6 jobs đầu tiên
4. Nhấn "Notify →" trên một job → hiện popup Telegram notification ở góc dưới phải, tự ẩn sau 4 giây

**Tại sao dùng mock data?** — LinkedIn, Indeed đều chặn scraping nghiêm. Demo này minh họa UX/flow của bot thực, không phải live scraper.

**File quan trọng:**
- `app/demo/job-monitor/mockJobs.ts` — 15 job objects (title, company, salary, source, tags)
- `app/demo/job-monitor/page.tsx` — scan animation + filter + popup

**Câu hỏi khách hàng hay hỏi:**
- *"Có scrape LinkedIn thật được không?"* → Khó và rủi ro bị ban. Thực tế dùng RSS feed, unofficial API, hoặc Apify
- *"Delay bao lâu quét 1 lần?"* → Thường 15–30 phút để tránh rate limit
- *"Có filter theo lương/location không?"* → Có, thêm điều kiện filter vào code là xong

---

### 4. Chrome Extension — Task Automator — `/demo/chrome-extension`

**Ý tưởng bán hàng:** Nhân viên phải điền cùng form đó 50 lần/ngày. Extension làm trong vài giây, không cần rời trình duyệt.

**Logic hoạt động:**
1. Nhấn "▶ Run Extension" → `setInterval` đi qua 6 steps (0→5), mỗi step cách 1.1 giây
2. Mỗi step cập nhật `step` state → các field trong "fake browser" thay đổi conditional render:
   - `step >= 1` → Company Name hiện "Acme Corporation" + highlight border cyan
   - `step >= 2` → Email hiện "orders@acme.com"
   - `step >= 3` → Category hiện "Enterprise"
   - `step >= 4` → Order ID "ORD-2024-88712" xuất hiện (màu vàng → xanh khi xong)
3. Khi xong → hiện before/after comparison (2h vs ~5.5s)
4. Tab manifest.json / content.js show code thực của Chrome Extension

**Cấu trúc Chrome Extension thực:**
- `manifest.json` — khai báo permissions (`activeTab`, `storage`, `scripting`), link popup và content script
- `content.js` — inject vào page, lắng nghe message từ popup, dùng `querySelector` fill form, dispatch `input`/`change` events để React/Vue nhận được
- `popup.html` — UI nút bấm để user trigger

**File quan trọng:**
- `app/demo/chrome-extension/page.tsx` — toàn bộ simulator, pure frontend

**Câu hỏi khách hàng hay hỏi:**
- *"Extension có hoạt động trên mọi website không?"* → Có nếu cấp `"matches": ["<all_urls>"]` trong manifest
- *"Có lên Chrome Web Store không?"* → Có thể, hoặc cài private (unpacked) trong nội bộ
- *"Có lấy data từ trang về được không?"* → Có, `content.js` read DOM rồi `sendResponse` về popup

---

## Sections trang chính (app/page.tsx)

- **Hero**: avatar bên phải, text bên trái, badge "Available · $15/hr", 2 CTA buttons, tech tags
- **Skills**: 6 cards (Python, Scraping, Telegram, API, Browser, Chrome Extension)
- **Projects**: 4 cards với nút "View Demo →" link tới `/demo/[slug]`
- **Process**: 4 bước Understand → Plan → Build → Deliver
- **Contact**: Upwork link + copy email button
