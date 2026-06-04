'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Product {
  title: string;
  price: string;
  rating: string;
  availability: string;
  image: string | null;
  url: string;
  source: string;
}

interface ScrapeResult {
  products: Product[];
  page: number;
  scraped_at: string;
  note?: string;
}

type SortKey = 'price_asc' | 'price_desc' | 'rating_desc' | 'title_asc';

const RATING_STARS: Record<string, string> = {
  One: '★☆☆☆☆', Two: '★★☆☆☆', Three: '★★★☆☆', Four: '★★★★☆', Five: '★★★★★',
};
const RATING_SCORE: Record<string, number> = {
  One: 1, Two: 2, Three: 3, Four: 4, Five: 5,
};

const LOG_STEPS = [
  '→ Initializing HTTP session',
  '→ GET https://books.toscrape.com/...',
  '← HTTP 200 OK · HTML received',
  '→ cheerio.load(html)',
  '→ Querying article.product_pod',
  '→ Extracting title, price, rating...',
  '→ Normalising image URLs',
  '✓ JSON response ready',
];

function priceNum(p: string) {
  return parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
}

function ratingWord(r: string) {
  return r.split(' ')[0] ?? 'One';
}

function downloadCSV(products: Product[]) {
  const header = ['Title', 'Price', 'Rating', 'Availability', 'URL'];
  const rows = products.map(p => [
    `"${p.title.replace(/"/g, '""')}"`,
    p.price,
    ratingWord(p.rating),
    p.availability.trim(),
    p.url,
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'scraped_products.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function ScraperDemo() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logStep, setLogStep] = useState(-1);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('price_asc');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'in' | 'out'>('all');
  const [scrapeTime, setScrapeTime] = useState<number | null>(null);

  async function scrape(p: number) {
    setLoading(true); setResult(null); setError(''); setLogStep(0); setScrapeTime(null);
    const t0 = Date.now();
    LOG_STEPS.forEach((_, i) => setTimeout(() => setLogStep(i), i * 280));
    try {
      const res = await fetch(`/api/demo/scrape?page=${p}`);
      const data: ScrapeResult = await res.json();
      setTimeout(() => {
        setResult(data);
        setScrapeTime(Date.now() - t0);
        setLoading(false); setLogStep(-1);
      }, LOG_STEPS.length * 280 + 200);
    } catch {
      setError('Request failed. Please try again.');
      setLoading(false); setLogStep(-1);
    }
  }

  const processed = useMemo(() => {
    if (!result) return [];
    let list = [...result.products];
    if (filterRating !== 'all') list = list.filter(p => ratingWord(p.rating) === filterRating);
    if (filterStock === 'in') list = list.filter(p => p.availability.includes('In stock'));
    if (filterStock === 'out') list = list.filter(p => !p.availability.includes('In stock'));
    switch (sortKey) {
      case 'price_asc': list.sort((a, b) => priceNum(a.price) - priceNum(b.price)); break;
      case 'price_desc': list.sort((a, b) => priceNum(b.price) - priceNum(a.price)); break;
      case 'rating_desc': list.sort((a, b) => (RATING_SCORE[ratingWord(b.rating)] ?? 0) - (RATING_SCORE[ratingWord(a.rating)] ?? 0)); break;
      case 'title_asc': list.sort((a, b) => a.title.localeCompare(b.title)); break;
    }
    return list;
  }, [result, sortKey, filterRating, filterStock]);

  // Stats
  const stats = useMemo(() => {
    if (!result || !result.products.length) return null;
    const all = result.products;
    const prices = all.map(p => priceNum(p.price)).filter(Boolean);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const inStock = all.filter(p => p.availability.includes('In stock')).length;
    const fiveStar = all.filter(p => ratingWord(p.rating) === 'Five').length;
    return {
      total: all.length,
      avg: avg.toFixed(2),
      inStock,
      inStockPct: Math.round((inStock / all.length) * 100),
      fiveStar,
      maxPrice: Math.max(...prices).toFixed(2),
      minPrice: Math.min(...prices).toFixed(2),
    };
  }, [result]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-zinc-400 hover:text-cyan-400 text-sm transition-colors">← Back to Portfolio</Link>
          <a href="https://www.upwork.com/freelancers/~012e9e4cf475446b7e" target="_blank" rel="noopener noreferrer"
            className="text-xs bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold px-3 py-1.5 rounded transition-colors">
            Hire me on Upwork ↗
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🌐</span>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded">LIVE DEMO</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">E-commerce Data Scraper</h1>
          <p className="text-zinc-400 text-sm">
            Live scrape of <span className="text-zinc-300 font-mono">books.toscrape.com</span> — extracts structured product data, filters, sorts, and exports to CSV.
          </p>
        </div>

        {/* Config bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Target Site</label>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300">
                books.toscrape.com
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Page (1–50)</label>
              <input type="number" min={1} max={50} value={page}
                onChange={e => setPage(Math.max(1, Math.min(50, Number(e.target.value))))}
                disabled={loading}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50" />
            </div>
            <button onClick={() => scrape(page)} disabled={loading}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Scraping...' : '▶ Scrape'}
            </button>
            {result && (
              <button onClick={() => downloadCSV(processed)}
                className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:border-cyan-500 hover:text-cyan-400 rounded-lg text-sm transition-colors flex items-center gap-2">
                ↓ Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Log terminal */}
        {loading && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5 font-mono">
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-3">scraper.log</p>
            <div className="space-y-0.5">
              {LOG_STEPS.map((line, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${logStep >= i ? 'opacity-100' : 'opacity-15'}`}>
                  <span className={logStep > i ? 'text-green-400' : logStep === i ? 'text-cyan-400' : 'text-zinc-600'}>
                    {logStep > i ? '✓' : logStep === i ? '▶' : ' '}
                  </span>
                  <span className={logStep === i ? 'text-cyan-300' : 'text-zinc-400'}>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5 text-red-400 text-sm">{error}</div>
        )}

        {/* Stats dashboard */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Products Scraped', value: stats.total, sub: scrapeTime ? `in ${(scrapeTime / 1000).toFixed(1)}s` : '' },
              { label: 'In Stock', value: `${stats.inStock}`, sub: `${stats.inStockPct}%`, color: 'text-green-400' },
              { label: 'Avg Price', value: `£${stats.avg}`, sub: `£${stats.minPrice} – £${stats.maxPrice}` },
              { label: '5-Star Products', value: stats.fiveStar, sub: `${Math.round((stats.fiveStar / stats.total) * 100)}% of page` },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
                <p className={`font-mono font-bold text-xl ${s.color ?? 'text-white'}`}>{s.value}</p>
                {s.sub && <p className="text-xs text-zinc-600 mt-0.5">{s.sub}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {result && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500">
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="rating_desc">Rating ↓</option>
              <option value="title_asc">Title A–Z</option>
            </select>

            <select value={filterRating} onChange={e => setFilterRating(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500">
              <option value="all">All ratings</option>
              {['Five','Four','Three','Two','One'].map(r => (
                <option key={r} value={r}>{RATING_STARS[r]} {r}</option>
              ))}
            </select>

            <select value={filterStock} onChange={e => setFilterStock(e.target.value as typeof filterStock)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500">
              <option value="all">All availability</option>
              <option value="in">In stock only</option>
              <option value="out">Out of stock</option>
            </select>

            <span className="text-xs text-zinc-500 ml-auto">
              Showing <span className="text-white font-semibold">{processed.length}</span> of {result.products.length}
              {result.note && <span className="ml-2 text-yellow-500">⚠ cached</span>}
            </span>
          </div>
        )}

        {/* Product grid */}
        {processed.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {processed.map((p, i) => {
              const inStock = p.availability.includes('In stock');
              const rw = ratingWord(p.rating);
              return (
                <div key={i} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl overflow-hidden transition-all group">
                  {p.image && (
                    <div className="h-28 bg-zinc-800 flex items-center justify-center overflow-hidden">
                      <img src={p.image} alt={p.title} className="h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-yellow-400 mb-1">{RATING_STARS[rw] ?? '★☆☆☆☆'}</p>
                    <h3 className="font-medium text-xs text-white mb-2 line-clamp-2 leading-snug">{p.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-400 text-sm">{p.price}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${inStock ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {inStock ? 'In stock' : 'Out'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Code */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <button onClick={() => setShowCode(v => !v)}
            className="w-full px-6 py-4 flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            <span className="flex items-center gap-2"><span className="text-cyan-500">{'</>'}</span>Python implementation (BeautifulSoup + httpx)</span>
            <span>{showCode ? '▲' : '▼'}</span>
          </button>
          {showCode && (
            <pre className="px-6 pb-6 text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed"><code>{`import httpx, time, csv
from bs4 import BeautifulSoup

def scrape_page(page: int) -> list[dict]:
    url = f"https://books.toscrape.com/catalogue/page-{page}.html"
    r = httpx.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    products = []
    for art in soup.select("article.product_pod"):
        products.append({
            "title":    art.find("h3").find("a")["title"],
            "price":    art.select_one(".price_color").text.strip(),
            "rating":   art.find("p", class_="star-rating")["class"][1],
            "in_stock": "In stock" in art.select_one(".availability").text,
            "image":    "https://books.toscrape.com/" + art.find("img")["src"].lstrip("../"),
        })
    return products

# Scrape all 50 pages → export CSV
all_products = []
for page in range(1, 51):
    all_products.extend(scrape_page(page))
    time.sleep(0.5)      # polite delay

with open("products.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=all_products[0].keys())
    writer.writeheader()
    writer.writerows(all_products)

print(f"Scraped {len(all_products)} products")`}</code></pre>
          )}
        </div>
      </div>
    </div>
  );
}
