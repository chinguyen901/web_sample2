# Portfolio — chi.dev

## Tổng quan
Web portfolio Next.js 14 (TypeScript + Tailwind CSS) cho dịch vụ Automation/Scraping của Chi Nguyen trên Upwork. Mục tiêu: chuyển đổi khách hàng tiềm năng thông qua demo tương tác thực tế.

## Cấu trúc
```
app/
  layout.tsx          — Root layout + metadata SEO
  page.tsx            — Single-page portfolio (hero, skills, projects, process, contact)
  globals.css         — Tailwind base + smooth scroll
  demo/
    price-alert/      — Demo: Telegram Price Alert Bot (CoinGecko realtime)
    scraper/          — Demo: E-commerce Data Scraper (cheerio + books.toscrape.com)
    job-monitor/      — Demo: Job Board Auto-Monitor (mock data + filter)
    chrome-extension/ — Demo: Chrome Extension Simulator (CSS animation)
  api/demo/
    price/route.ts    — Proxy CoinGecko API
    scrape/route.ts   — Backend scraping với cheerio
```

## Sections trang chính (app/page.tsx)
- **Hero**: tên, title "Automation Developer", rate $15/hr, CTA Upwork
- **Skills**: Python, Scraping, Telegram Bot, API Integration, Browser Automation, Chrome Extension
- **Projects**: 4 project cards — mỗi card có nút "View Demo →" link tới `/demo/[slug]`
- **Process**: 4 bước Understand → Plan → Build → Deliver
- **Contact**: Upwork link + copy email

## Demo Pages
| Route | Mô tả | Data Source |
|-------|-------|-------------|
| `/demo/price-alert` | Nhập coin + target price → polling giá thực → mock Telegram notification | CoinGecko public API (free, no key) |
| `/demo/scraper` | Nhập URL → scrape → hiện structured result | books.toscrape.com via cheerio |
| `/demo/job-monitor` | Keywords → scan animation → danh sách jobs → mock notify | Mock JSON data |
| `/demo/chrome-extension` | Fake browser frame → step-by-step automation animation | Pure frontend |

## Chạy local
```bash
npm run dev   # http://localhost:3000
npm run build # Production build
```

## Stack
- Next.js 14.2.5 (App Router)
- TypeScript strict
- Tailwind CSS 3.4
- cheerio (scraping demo)
- CoinGecko API (price demo)
