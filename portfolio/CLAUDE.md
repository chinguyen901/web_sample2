# Portfolio — chi.dev

## Tổng quan
Web portfolio Next.js 14 (TypeScript + Tailwind CSS) cho dịch vụ Automation/Scraping của Chi Nguyen trên Upwork. Mục tiêu: chuyển đổi khách hàng tiềm năng qua demo tương tác thực tế.

**Ngoài ra còn có phần Work Experience** — giới thiệu kinh nghiệm full-time tại TMA Solutions + 3 demo kỹ thuật 5G OAM.

## Cấu trúc đầy đủ
```
app/
  layout.tsx                  — Root layout + metadata SEO
  page.tsx                    — Single-page:
                                  Nav (Skills / Experience / Projects / Process / Contact)
                                  Hero (avatar, badge, CTAs, tech tags)
                                  Skills (6 cards)
                                  Experience (TMA Solutions timeline — MỚI)
                                  Projects (8 demo cards)
                                  Process (4 bước)
                                  Contact + Footer
  demo/
    price-alert/page.tsx      — Demo 1: Price Alert Bot (Upwork)
    scraper/page.tsx          — Demo 2: E-commerce Scraper (Upwork)
    job-monitor/
      page.tsx                — Demo 3: Job Board Monitor (Upwork)
      mockJobs.ts             — 15 job entries mẫu
    chrome-extension/page.tsx — Demo 4: Chrome Extension Automator (Upwork)
    google-sheets/page.tsx    — Demo 5: Google Sheets Auto-Sync (Upwork)
    report-generator/page.tsx — Demo 6: Automated Report Generator (Upwork)
    discord-bot/page.tsx      — Demo 7: Discord Bot (Upwork)
    email-automator/page.tsx  — Demo 8: Email Inbox Automator (Upwork)
    cm-flow/page.tsx          — Demo 9: CM Flow Visualizer (5G OAM)
    fm-dashboard/page.tsx     — Demo 10: FM Alarm Dashboard (5G OAM)
    oam-agent/page.tsx        — Demo 11: OAM Agent Startup (5G OAM)
    ras-nms/page.tsx          — Demo 12: RAS Network Management System (TMA)
    installer/page.tsx        — Demo 13: InstallShield / Mobile CI/CD (TMA)
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

## Trang chính (app/page.tsx)

### Nav
- Links: Skills / Experience / Projects / Process / Contact
- CTA: "Hire me" → Upwork URL

### Hero
- Avatar bên phải (next/image, glow ring)
- Badge "Available · $15/hr"
- 2 CTAs: "Hire on Upwork ↗" + "View Projects"
- Tech tags: Python, Playwright, Selenium, Telegram API, REST API, Chrome Extension, BeautifulSoup

### Data objects trong page.tsx
- `skills[]` — 6 cards (Python Automation, Web Scraping, Telegram Bots, API Integration, Browser Automation, Chrome Extensions)
- `experience{}` — TMA Solutions data (xem phần dưới)
- `projects[]` — 8 Upwork demo cards
- `steps[]` — 4 bước process

---

## Work Experience Section (id="experience")

Nằm giữa Skills và Projects. Layout: company header + timeline với left border + dot markers.

### Data (experience object trong page.tsx)
```typescript
const experience = {
  company: "TMA Solutions",
  role: "Software Engineer",
  period: "Aug 2023 – Present",
  projects: [
    {
      name: "5G OAM Platform",
      tags: ["C++", "NETCONF/YANG", "ConfD", "ZMQ", "Docker", "GTest/GMock"],
      demos: [
        { label: "CM Flow Visualizer", href: "/demo/cm-flow" },
        { label: "FM Alarm Dashboard", href: "/demo/fm-dashboard" },
        { label: "OAM Agent Startup", href: "/demo/oam-agent" },
      ],
    },
    {
      name: "Network Management System",
      tags: ["Python", "Kafka", "SNMP", "SFTP", "Docker", "Linux"],
      demos: [],
    },
    {
      name: "InstallShield / Mobile App",
      tags: ["InstallShield", "Android Studio", "Xcode", "Git"],
      demos: [],
    },
  ],
};
```

### Render logic
- Company header: tên + role + badge period (font-mono cyan)
- `pl-4 border-l border-zinc-800` timeline
- Mỗi project: card với absolute dot (`-left-[21px]`), demo buttons nếu có, tags
- Demo buttons: `border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10`

---

## Demo 9 — `/demo/cm-flow` (CM Flow Visualizer — 5G OAM)

### Kỹ thuật (Technical)
- **React state**: `useState` cho preset / step / running / done / errorMode / errorTriggered / codeTab / packetArrow / liveMs
- **Timer management**: `useRef<ReturnType<typeof setTimeout>[]>` lưu tất cả timer IDs, clear toàn bộ khi reset — tránh memory leak / race condition
- **Live latency counter**: `setInterval` + `setLiveMs(prev => prev + increment)` pattern — 50ms tick, increment tỉ lệ với totalMs / 3700ms
- **Packet animation**: CSS `@keyframes packetSlide` định nghĩa inline trong `<style>` tag, trigger bằng `setTimeout` tại các mốc giữa node
- **TypeScript**: `CONFIG_PRESETS as const` → compiler suy ra `PresetKey = "cell" | "freq" | "power"` tự động, không cần enum
- **Error path**: `errorMode` toggle → `run()` dùng 2 timer thay vì 6, `errorTriggered` state → render rpc-error XML + node ConfD đổi đỏ

### Flow người dùng
1. Chọn preset (Cell / Frequency / Power) → XML NETCONF + YANG Inspector cập nhật ngay
2. Toggle "Inject Validation Error" (tùy chọn)
3. Click "Send Config ▶" → `run()` chạy
4. **Happy path**: 6 timer với delays `[0, 700, 1400, 2200, 3000, 3700]ms` → mỗi timer setStep(i) → node i đổi màu cyan → packet dot animate giữa nodes → latency counter chạy lên → done: panel latency breakdown xuất hiện
5. **Error path**: NMS (step 0) → ConfD (step 1, đỏ) → XML editor hiện rpc-error → flow dừng, gNB không bị touch

### Chức năng
- 3 Config presets: Cell / Frequency / Power (mỗi preset có XML, yangPath, yangType, ZMQ message, target node khác nhau)
- XML NETCONF editor (readonly) + copy button
- Error Mode toggle → inject YANG constraint validation failure
- Flow Visualizer 5 node với packet dot animation
- YANG Path Inspector (Path / Type / Target / ZMQ msg)
- Round-trip Latency Breakdown panel (sau successful run)
- Code tabs: `oam_agent_config_mapper.cpp` + YANG model snippet

### Kinh nghiệm liên quan
**TMA Solutions — 5G OAM Platform (CM subsystem)**  
File thật: `oam_agent_config_mapper.cpp`, `ConfDSubscriber.cpp`. OAM Agent nhận callback từ ConfD khi NMS push config → translate YANG path → build ZMQ struct → send đến gNB component.

### Tương đương thực tế
- Flow 5 node trong demo = kiến trúc thật: NMS → ConfD (validate + CDB) → `comm_thread` callback → OAM Agent mapper → ZMQ → gNB
- `CONFIG_PRESETS[k].yangPath` = path thật trong codebase (`/ManagedElement/GNBCUCPFunction/NRCellCU/nRCellIdentity`)
- Error flow = ConfD thực sự rollback CDB và trả về `rpc-error` XML khi YANG constraint fail (e.g. nRCellIdentity out of range)
- CPP snippet = code thật từ `handleSubscriptionCallback()` function

### Code đã dùng / Cần học
- **React**: `useState`, `useRef`, `useEffect`, `setTimeout` chain pattern, timer cleanup
- **TypeScript**: `as const`, inferred union types, `ReturnType<>`
- **CSS**: `@keyframes`, inline `<style>` tag trong React
- **Protocol**: NETCONF RFC 6241 (edit-config RPC, rpc-error), YANG (3GPP TS 28.541), ZMQ pub-sub
- **ConfD**: CDB subscription callback model, YANG validation flow

---

## Demo 10 — `/demo/fm-dashboard` (FM Alarm Dashboard — 5G OAM)

### Kỹ thuật (Technical)
- **Discriminated union**: `type AlarmStatus = "ACTIVE" | "ACKNOWLEDGED" | "CLEARING" | "CLEARED"` → TypeScript enforce state transitions, tránh typo
- **`useMemo`**: `filteredAlarms = useMemo(() => filter(alarms, severityFilter), [alarms, severityFilter])` — không re-filter khi state khác thay đổi
- **`useCallback`**: `injectAlarm`, `clearAlarm`, `acknowledgeAlarm` có stable reference (tránh re-render không cần thiết)
- **Stale closure workaround**: `injectAlarmRef = useRef(injectAlarm)` + `useEffect(() => { injectAlarmRef.current = injectAlarm }, [injectAlarm])` → Live Mode interval dùng `injectAlarmRef.current()` thay vì direct reference, tránh stale closure bug
- **Flow animation**: `setInterval(500ms)` chạy qua 5 nodes, `clearInterval` sau node cuối + gọi `onDone` callback
- **`buildZmqPayload()`**: inline function format alarm → real ZMQ `FM_ALARM_IND` struct text
- **AlarmHistoryChart**: SVG component, `HISTORY_POINTS` pseudo-random array + live active count làm điểm cuối, gradient fill + path stroke

### Flow người dùng
1. Click "Inject Fault ▾" → dropdown 5 alarm types (LINK_DOWN / CPU_HIGH / SYNC_LOSS / CELL_UNAVAILABLE / MEM_THRESHOLD)
2. Click alarm type → flow inject animates đỏ (gNB → ZMQ → OAM Agent → ConfD → NMS, 500ms/node)
3. Sau flow xong → alarm xuất hiện trong bảng với status `ACTIVE`, tự chọn
4. Click alarm row → detail panel bên phải hiện (tab Details + ZMQ Payload)
5. **Tab ZMQ Payload**: hiện `FM_ALARM_IND { alarm_id, alarm_type, severity, source, timestamp }` format
6. Click "Acknowledge ✋" → status → `ACKNOWLEDGED`
7. Click "Clear Alarm ✓" → status → `CLEARING` → flow clear animate xanh → `CLEARED`
8. Severity filter chips (ALL / CRITICAL / MAJOR / MINOR) → filter bảng ngay không cần re-inject
9. "Live Mode" toggle → auto-inject random alarm mỗi 3.5–5s

### Chức năng
- Stats bar: CRITICAL / MAJOR / MINOR / CLEARED counts (reactive)
- Inject Fault dropdown với 5 alarm types thật
- Alarm Table: click-to-select, status badge với màu, pulse dot khi ACTIVE
- Alarm Detail Panel: 2 tabs (Details / ZMQ Payload), ACK + Clear buttons
- Flow Visualizer: inject (đỏ) và clear (xanh) path animation
- Alarm History Chart: SVG 30-point sparkline
- Severity Filter chips + Live Mode toggle
- Clear All button

### Kinh nghiệm liên quan
**TMA Solutions — 5G OAM Platform (FM subsystem)**  
File thật: `FMServiceR1.cpp`. ZMQ message thật: `FM_ALARM_IND`. Flow thật: gNB component → ZMQ → OAM_RX thread → OAM Agent → ConfD alarm store → NETCONF notification → NMS.

### Tương đương thực tế
- 4-state lifecycle (`ACTIVE→ACK→CLEARING→CLEARED`) = state machine thật trong `FMServiceR1.cpp`
- 5 alarm types = real alarm types từ project (LINK_DOWN ở F1 interface, CPU_HIGH ở DU Scheduler, SYNC_LOSS ở PTP timing)
- `buildZmqPayload()` format `FM_ALARM_IND { alarm_id: hex, severity, source, timestamp_float }` = real ZMQ struct format
- Flow path 5 nodes = đường đi thật của FM data trong hệ thống

### Code đã dùng / Cần học
- **React**: `useCallback`, `useMemo`, `useRef` stale closure workaround, `setInterval` cleanup pattern
- **TypeScript**: discriminated unions, `Record<K, V>`, type narrowing
- **Pattern**: optimistic UI (set CLEARING ngay, animate sau), event-driven alarm lifecycle
- **Protocol**: ZMQ pub-sub, NETCONF notifications, 3GPP FM alarm model (ITU-T X.733)

---

## Demo 11 — `/demo/oam-agent` (OAM Agent Startup — 5G OAM)

### Kỹ thuật (Technical)
- **Derived state**: `nfIdx` và `ncIdx` tính trực tiếp từ `step` number (không store riêng) — tránh state sync bug
- **Two-level setTimeout**: step delay 600ms → per-line log delay 80ms → logs stream mượt trong terminal
- **`useRef` timer array**: `timers.current.push(t)` cho mỗi setTimeout → `timers.current.forEach(clearTimeout)` khi reset — critical cho 9 steps × multiple logs = ~20+ concurrent timers
- **Log auto-scroll**: `useEffect(() => { logRef.current.scrollTop = logRef.current.scrollHeight }, [logs])` — trigger sau mỗi log line thêm vào
- **`formatLog()`**: generate timestamp ISO string + random PID trong range + padded module name + level — output giống real log file thật
- **ResourceSparkline**: SVG component nhận `data[]` và `step` → slice visible portion → draw polyline + dot
- **CRASH_SCENARIOS as const**: 4 scenarios typed, mỗi scenario có `crashedThread` để highlight đúng thread card

### Flow người dùng
1. Click "Boot OAM Agent ▶" → 9 steps, mỗi step 600ms:
   - Startup list: step hiện tại highlight violet, step xong → green checkmark
   - Log terminal: lines stream vào (80ms/line), auto-scroll
   - NF state machine: `INITIALIZE (0-4) → NF_REGISTRATION (5-6) → NF_READY (8+)`
   - NETCONF state machine: `INIT (0-3) → DISCONNECTED (4) → CONNECTED (5-7) → READY (8+)`
   - Thread cards: OAM_AGENT (step 0), comm/sys threads (step 1), OAM_RX (step 5)
2. Khi step >= 8: Health Check panel + Port Info + Resource Sparklines xuất hiện
3. Click "Reset" để reboot từ đầu
4. **Crash simulation** (chỉ sau khi boot xong):
   - Chọn scenario: SIGSEGV / ZMQ Timeout / ConfD Drop / OOM
   - Click "Simulate ▶" → 5 recovery log lines stream (700ms/line) → thread card đổi đỏ trong quá trình
   - Kết quả: recovery panel xanh xuất hiện với result + note

### Chức năng
- Boot sequence: 9 bước với module names thật (OAM_LIB, OAM_CM, OAM_FM, OAM_PM, OAM_APP)
- Log Terminal: fake log format thật với timestamp/PID/level, auto-scroll, copy button
- NF State Machine (3 states) + NETCONF State Machine (4 states)
- Thread Model: 4 cards (comm_thread / sys_thread / OAM_AGENT / OAM_RX), hover tooltip, crash highlight
- WHY note về deadlock prevention (CDB 2 root paths, 2 sessions)
- Health Check panel + Port info (khi step >= 8)
- Resource Sparklines: CPU% + Heap MB (khi step >= 2)
- 4 Crash/Recovery scenarios với realistic logs

### Kinh nghiệm liên quan
**TMA Solutions — 5G OAM Platform (tất cả subsystems)**  
Dữ liệu từ file `LogDUSim.txt` thật. Thread model, state machines, port numbers, module names đều từ codebase thực tế. Crash scenarios phản ánh failure modes đã gặp trong dự án.

### Tương đương thực tế
- `STARTUP_STEPS` log lines = copy từ `LogDUSim.txt` thật
- Thread model 4 threads = architecture thật của OAM Agent C++ process
- "Why 2 ConfD threads?" note = giải thích vấn đề deadlock thật đã encounter (CDB có 2 root paths `/ManagedElement` + `/gnbvs`, single thread tạo lock contention)
- CRASH_SCENARIOS = failure modes thật: SIGSEGV trong callback processing, ZMQ recv timeout, ConfD ECONNRESET, `std::bad_alloc` khi heap đầy
- Recovery pattern = restart từng module độc lập không cần full agent restart

### Code đã dùng / Cần học
- **React**: derived state pattern, two-level setTimeout, `useRef` timer array, log auto-scroll
- **TypeScript**: `as const` objects, keyof typeof, union narrowing
- **C++ concepts**: threading model, CDB session management, RAII, signal handling (SIGSEGV)
- **ZMQ**: reconnect loop, exponential backoff, consumer/producer pattern
- **ConfD**: CDB session lifecycle, subscription re-registration after reconnect
- **OAM**: 3GPP NF state machine (TS 28.550), NETCONF state machine

---

## Demo 1 — `/demo/price-alert` (Telegram Price Alert Bot)

### Kỹ thuật (Technical)
- **API proxy routes**: `/api/demo/price/route.ts` + `/api/demo/chart/route.ts` → proxy CoinGecko để tránh CORS và bảo vệ API key
- **Polling với `useRef`**: `pollRef.current = setInterval(...)` + cleanup trong `useEffect` return → tránh double-fire khi React strict mode re-render
- **SparklineChart component**: nhận `[timestamp, price][]` → tính min/max → normalize → SVG path + gradient area + dot cuối + time labels 4 điểm; `isUp` flag → auto-color xanh/đỏ
- **TelegramWindow component**: nhận `TelegramMsg[]` → `useEffect` auto-scroll khi messages thay đổi; styled như Telegram dark theme thật
- **AI fallback**: `/api/demo/ai/route.ts` call Gemini API, nếu fail → fallback text dựa vào sign của change24h
- **`useCallback`** cho poll function tránh recreate mỗi render

### Flow người dùng
1. Chọn BTC hoặc ETH
2. Stats row load từ CoinGecko (Current Price / 24h Change / Market Cap / 24h Volume)
3. Sparkline 24h load từ `/api/demo/chart`
4. Nhập target price + chọn direction (Above / Below)
5. Click "Start Bot" → bot polling mỗi 4s, price updates stream vào Telegram window
6. Khi giá chạm target → alert message xuất hiện trong Telegram window
7. Click "Get AI Analysis" → gọi `/api/demo/ai` → Gemini phân tích 2 câu xuất hiện

### Chức năng
- Coin selector (BTC / ETH)
- Live stats 4 metrics từ CoinGecko API thật
- 24h SVG Sparkline với auto-color theo trend
- Target price alert config (direction + value)
- Telegram window mock (dark theme #17212b, bot bubbles, input bar)
- AI Market Analysis với Gemini 1.5 Flash
- Python code snippet (asyncio + aiohttp + Telegram Bot API)

### Kinh nghiệm liên quan
**Upwork freelance — crypto monitoring / price alert bot projects**  
Loại project phổ biến trên Upwork: client muốn bot theo dõi giá 24/7 không cần ngồi nhìn màn hình, alert khi giá đạt target.

### Tương đương thực tế
- Python code snippet = pattern thật deliverable cho client: `asyncio.run(monitor(...))` với `while True` loop + conditional alert
- `SparklineChart` visualizes data từ CoinGecko API thật (không mock)
- Polling logic với `useRef` = tương đương `asyncio.sleep(5)` trong Python bot
- Telegram window UI = preview chính xác output bot sẽ gửi cho client

### Code đã dùng / Cần học
- **Next.js**: App Router API routes (route.ts), proxy pattern cho external APIs
- **React**: polling với `useRef` cleanup, component separation (SparklineChart + TelegramWindow)
- **SVG**: normalize data → coordinates, gradient, polyline path, conditional coloring
- **APIs**: CoinGecko REST API, Telegram Bot API (`sendMessage`), Google Gemini API
- **Python**: `asyncio`, `aiohttp`, `python-telegram-bot`

---

## Demo 2 — `/demo/scraper` (E-commerce Data Scraper)

### Kỹ thuật (Technical)
- **`useMemo` cho filter/sort**: `processed = useMemo(() => sortAndFilter(result.products, sortKey, filterRating, filterStock), [result, sortKey, filterRating, filterStock])` — recalculate O(n) client-side, không re-fetch API
- **Client-side CSV export**: `Blob([csvString], { type: 'text/csv' })` → `URL.createObjectURL(blob)` → programmatic `<a>` click → `URL.revokeObjectURL()` — zero backend
- **Log terminal animation**: `useState(logStep)` increment mỗi 280ms bằng setTimeout chain, mỗi step render thêm 1 log line
- **`/api/demo/scrape/route.ts`**: real `fetch()` đến `books.toscrape.com` với `User-Agent` header + 8s timeout → `cheerio.load(html)` → select `article.product_pod` → extract 5 fields → fallback 2 hardcoded products
- **`priceNum()`** utility: `parseFloat(p.replace(/[^0-9.]/g, ''))` → strip currency symbols để numeric sort
- **TypeScript**: `SortKey = 'price_asc' | 'price_desc' | 'rating_desc' | 'title_asc'` union

### Flow người dùng
1. Chọn page number → click "Scrape Page X"
2. Log terminal animate 8 steps (280ms/step): init → GET request → HTTP 200 → cheerio.load → query → extract → normalize → ready
3. Products grid xuất hiện với title, price, rating stars, availability badge
4. Stats dashboard: total scraped / in-stock % / avg price range / 5-star count
5. Sort dropdown (price↑↓ / rating / title A-Z) → grid re-sort ngay (không re-fetch)
6. Filter by rating (1-5★) + filter by availability → `useMemo` recompute
7. Click "Export CSV" → file download ngay (client-side Blob)
8. Toggle "Show Code" → Python scraper snippet hiện

### Chức năng
- Page selector + Scrape button
- 8-step animated log terminal (280ms/step)
- Product grid với stats dashboard
- Filter/Sort (3 sort keys, rating filter, availability filter) via `useMemo`
- CSV Export (client-side, zero backend)
- Scrape timing display ("X products in Y.Zs")
- Python code snippet (requests + BeautifulSoup)

### Kinh nghiệm liên quan
**Upwork freelance — e-commerce scraping / data collection projects**  
Client muốn thu thập giá, tồn kho, rating hàng nghìn sản phẩm tự động, export CSV để import vào spreadsheet.

### Tương đương thực tế
- `/api/demo/scrape/route.ts` = code scraper thật hoạt động (không mock) — fetch books.toscrape.com, parse với cheerio
- `downloadCSV()` pattern = deliverable thật cho Upwork clients: CSV export không cần backend
- `useMemo` filter = pattern cho large dataset filtering trong production scraper dashboards
- `books.toscrape.com` = trang training scraping chuẩn, không block, 1000 products (50 pages × 20)

### Code đã dùng / Cần học
- **Next.js**: API route handlers, server-side fetch với headers
- **cheerio**: `load(html)`, CSS selectors, `.text()` / `.attr()` extraction
- **React**: `useMemo` optimization, useState + setTimeout log animation
- **Web API**: `Blob`, `URL.createObjectURL`, programmatic link click
- **Python equivalent**: `requests` + `BeautifulSoup`, same selector patterns

---

## Demo 3 — `/demo/job-monitor` (Job Board Auto-Monitor)

### Tính năng
- **Bộ lọc nâng cao**: Keywords + Job Type (Remote/Hybrid/On-site)
- **Source tabs**: Filter kết quả theo LinkedIn / Indeed / Upwork sau khi scan
- **Per-source count**: Hiện số job tìm được từng nguồn ngay khi scan xong
- **Telegram window**: Styled như Telegram dark app, hiện alert khi click "Notify via Telegram"
- **Monitor Schedule panel**: Countdown đếm ngược đến lần scan tiếp theo (30 min), last scan time
- **`NextScanCountdown` component**: `useEffect` tick mỗi giây, reset về 1800 khi về 0

### Logic
**runScan**: Animate từng source với setTimeout 1.3s/source → filter MOCK_JOBS theo keywords + jobType → set sourceCounts  
**Filter UI**: `displayed = useMemo()` filter theo `sourceFilter` → re-render ngay không cần re-scan  
**Tại sao mock?** LinkedIn/Indeed block scraping — demo minh họa flow/UX, Python code thật vẫn hiển thị

---

## Demo 4 — `/demo/chrome-extension` (Chrome Extension Task Automator)

### Tính năng
- **3 Workflow presets**: Vendor Order Form / Competitor Price Check / Lead Form Fill
- **Batch Mode**: 5 records, progress bar + queue status table (Queued → Processing → Done)
- **Extracted Data table**: Sau single run, hiển thị data extracted
- **Time Comparison**: So sánh manual time vs extension time với bar chart
- **Fake browser frame**: URL bar thay đổi theo workflow, extension icon pulse khi chạy

### Logic
**run (single)**: `setTimeout` mỗi 900ms → update `step` state → form fields fill sequentially  
**runBatch**: Offset timing per row (`ri * steps.length * 400ms`) → nested setTimeout → realtime status  
**3 Workflows với `as const`**: TypeScript infer `WorkflowId` union từ object keys

---

## Demo 5 — `/demo/google-sheets` (Google Sheets Auto-Sync)

### Kỹ thuật (Technical)
- **`useRef` + `useCallback`**: timer ref cho sync animation, stable callback references
- **Row status state machine**: `idle` → `writing` (cyan highlight) → `done` (normal) — per-row
- **Sequential setTimeout chain**: logs (320ms/step) chạy song song với rows (140ms/row delay)
- **Stats counter**: increment ngay khi mỗi row done — reactive live stats

### Flow người dùng
1. Chọn data source (Products / Crypto / Jobs), nhập sheet name, chọn sync interval
2. Click "Sync Now" → log terminal animate (auth → fetch → open sheet → write rows)
3. Spreadsheet grid: rows xuất hiện từng cái với cyan highlight fade → normal
4. Stats panel update realtime: Rows Written / Cells Updated / Sync Speed / Last Sync
5. Toggle "View Code" → gspread Python snippet

### Kinh nghiệm liên quan
**Upwork freelance — data pipeline / Google Sheets automation projects**

### Code đã dùng / Cần học
- **Python**: `gspread`, `google-auth`, OAuth2 service account flow
- **Pattern**: scraper → Sheets pipeline (phổ biến trong Upwork automation)

---

## Demo 6 — `/demo/report-generator` (Automated Report Generator)

### Kỹ thuật (Technical)
- **BarChart component**: nhận `animate` prop → CSS transition `width` từ 0% → value% với delay 120ms/bar
- **LineChart component**: SVG với `strokeDashoffset` transition từ `pathLength → 0`, gradient fill, dots xuất hiện sau
- **5-step progress tracker**: sequential animate 700ms/step via setTimeout chain
- **Light theme report preview**: `white bg` để giống PDF thật — contrast với dark app

### Flow người dùng
1. Config: chọn data sources, date range, format (HTML/PDF/Both) → click "Generate Report"
2. Progress tracker animate 5 bước: Collecting → Aggregating → Building Charts → Formatting → Ready
3. Report Preview xuất hiện: header gradient, 3 stats cards, animated bar chart + line chart, top-5 table
4. Delivery config: nhập email + schedule → "Set" → marked as scheduled

### Kinh nghiệm liên quan
**Upwork freelance — scheduled reporting / email automation projects**

### Code đã dùng / Cần học
- **Python**: `pandas`, `jinja2` templating, `smtplib`, `schedule` library
- **SVG**: `strokeDashoffset` animation technique, gradient fills

---

## Demo 7 — `/demo/discord-bot` (Discord Bot)

### Tính năng
- **Mock Discord UI**: `#313338` bg, `#2b2d31` sidebar, channel list, member list, rich embeds
- **5 Slash Commands**: `/price`, `/alert set`, `/status`, `/scrape`, `/help` — typing indicator 1.2s → embed response
- **Rich Embeds**: Colored border, field grid 2 cột, footer, BOT badge
- **Channel Monitor**: Toggle → `setInterval` 2.5s feed fake messages → keyword detect → bot alert

### Logic
**handleCommand**: Add user message → `setIsTyping` → 1200ms → add bot embed  
**toggleMonitor**: `setInterval` 2500ms → check keyword match → reply embed nếu match  
Escape `\${...}` trong Python f-strings để tránh JS template literal conflict

---

## Demo 8 — `/demo/email-automator` (Email Inbox Automator)

### Tính năng
- **12 mock emails**: Mix orders, invoices, newsletters, spam, urgent
- **3 tabs**: Inbox (click expand body) / Rules (add/delete) / Templates (2 preset)
- **Rule Builder**: 5 default rules + add rule form (condition + operator + value + action)
- **"Run Rules"**: Animate 450ms/email → badge xuất hiện (AUTO-REPLIED/FORWARDED/ARCHIVED/SPAM/PRIORITY)
- **Stats bar**: 6 metrics + Log terminal auto-scroll

### Logic
**applyRules**: Loop rules, check condition (subject/from/body) + operator (contains/equals/starts_with) → first match  
**handleRunRules**: Delay 450ms/email → set status → update stats  
**Reset demo** button xuất hiện sau done

---

## Demo 12 — `/demo/ras-nms` (Network Management System — TMA Solutions)

### Kỹ thuật (Technical)
- **`useRef` multiple arrays**: `logsTimerRef` + `flowTimerRef` chạy concurrent — logs stream trong khi flow nodes animate
- **`getLogs(device)`**: function trả array log strings với device-specific data (protocol, count, table name) — không hardcode
- **Stats reactive**: `totalDevices`, `kafkaEvents`, `dbRecords`, `activeAlerts` tăng dần khi flow progress qua các node
- **7-node flow**: setTimeout 800ms/node, mỗi node có `msg` hiển thị khi active
- **`useEffect` log auto-scroll**: scroll terminal xuống sau mỗi log thêm vào

### Flow người dùng
1. Chọn device family (TN-FOSS / E-PASSTEL / OF-PASSTEL / IF-PASSTEL) → protocol + count hiển thị
2. Click "Start Monitoring" → flow 7 nodes animate (800ms/node): Network Devices → EMS → DDC → Kafka → IDB → Zabbix → Virtuora VXM
3. Song song: log terminal stream Python-format logs với timestamps thật
4. Stats bar increment khi mỗi stage hoàn thành
5. Click "Inject Fault" (sau khi monitoring started) → Zabbix alert panel xuất hiện

### Chức năng
- Device Family selector (4 loại, mỗi loại protocol khác nhau)
- 7-node Architecture Flow animation
- Python log terminal (format: `[timestamp][LEVEL][PID] module: message`)
- Stats bar: Total Devices / Kafka Events / DB Records / Active Alerts
- Inject Fault → Zabbix alert panel
- Python code snippet (asyncio SNMP + Kafka producer)

### Kinh nghiệm liên quan
**TMA Solutions — Network Management System (Python, Kafka, SNMP, Docker)**  
Dự án RAS (Resource Assurance System): collect metrics từ 4 loại thiết bị mạng → process bằng DDC Server Python → Kafka → PostgreSQL → Virtuora VXM display.

### Tương đương thực tế
- Device families (TN-FOSS, E-PASSTEL, OF-PASSTEL, IF-PASSTEL) = thật từ NMS project
- Component names (DDC Server, IDB, Virtuora VXM, Zabbix, Mediation) = thật
- Python service names (`BBU_info.service`, `SSE`, `event_changes()`) = tên thật trong codebase
- Python snippet pattern (`asyncio.gather` + `KafkaProducer`) = code pattern thật được dùng
- Log format `[2024-11-15 09:12:33.123][INFO ]` = log format thật của DDC Server

### Code đã dùng / Cần học
- **Python**: `asyncio.gather`, `pysnmp.hlapi.asyncio`, `kafka-python`, batch DB inserts
- **Protocols**: SNMP v2c/v3 (OID, community string, varBinds), NETCONF, RESTCONF
- **Kafka**: producer/consumer, partitions, offset, serializer pattern
- **PostgreSQL**: batch INSERT, transactions, index management

---

## Demo 13 — `/demo/installer` (InstallShield / Mobile CI/CD — TMA Solutions)

### Kỹ thuật (Technical)
- **Tab state**: `TabId = "installshield" | "mobile"` → switch tab reset toàn bộ build state
- **Platform toggle**: `Platform = "android" | "ios"` → switch platform chọn steps/logs tương ứng
- **`runBuild()`**: `stepDelay=1200ms` per step, `logsPerStep` batch với 300ms/line delay — 2-level timeout
- **Wizard state machine**: `wizardStep` (0-4) navigate Back/Next, chỉ render sau khi IS build done (conditional)
- **`useRef` timer cleanup**: abort build mid-run khi switch tab/platform

### Flow người dùng
**Tab InstallShield:**
1. File tree hiển thị project.ism structure
2. Click "Build MSI" → 5 steps animate (1.2s/step): Configure → Compile → Package → Sign → Deploy
3. Build log stream với InstallShield format thật
4. Artifact output: x64/x86 MSI với SHA256 + Authenticode info
5. Sau khi done: Installer Wizard mock xuất hiện (5 steps: Welcome → License → Directory → Installing → Finish)

**Tab Mobile CI/CD:**
1. Toggle Android / iOS
2. Click "Run Pipeline" → 6 nodes animate: Git Trigger → Gradle/Pod Install → Compile → Tests → Sign → Distribute
3. Build log: Gradle format (Android) hoặc Fastlane/Xcode format (iOS)
4. Artifact: APK (Firebase Distribution) hoặc IPA (TestFlight)

### Kinh nghiệm liên quan
**TMA Solutions — InstallShield + Mobile App projects**  
Thực tế: maintain InstallShield project `NetworkMgmt.ism` cho Windows deployment + Android/iOS CI/CD pipeline.

### Tương đương thực tế
- `NetworkMgmt.ism` (v23.1), 3 components (Core, DataService, UI) = tên thật
- IS logs (registry path `HKLM\Software\TMA\NetworkMgmt`, SHA256, RFC 3161 timestamp) = format thật
- Android: `release-key.jks`, `JUnit4`, `Firebase App Distribution` = tools thật đã dùng
- iOS: `Fastlane`, `CocoaPods`, `XCTest`, `TestFlight` = pipeline thật

### Code đã dùng / Cần học
- **InstallShield**: .ism project structure, MSI database (68 tables), Authenticode signing, RFC 3161 timestamping
- **Android CI**: Gradle build system, APK signing scheme v2, Firebase App Distribution
- **iOS CI**: Fastlane lanes, CocoaPods dependency resolution, TestFlight upload
- **React**: tab-based state reset, wizard step navigation, conditional rendering

---

## RULE OF PROJECT
- Luôn update những thay đổi lớn vào trong "bộ não" CLAUDE.md
- Phải bám sát plan, tự động có thể đưa ra những câu hỏi quan trọng để tôi xác nhận lựa chọn
