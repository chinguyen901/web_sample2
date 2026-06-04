'use client';

import { useState } from 'react';
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

const RATING_STARS: Record<string, string> = {
  One: '★☆☆☆☆',
  Two: '★★☆☆☆',
  Three: '★★★☆☆',
  Four: '★★★★☆',
  Five: '★★★★★',
};

const LOG_STEPS = [
  'Initializing HTTP session...',
  'Sending GET request...',
  'Received HTML response (200 OK)',
  'Loading DOM with cheerio...',
  'Querying article.product_pod selectors...',
  'Extracting title, price, rating, availability...',
  'Normalising image URLs...',
  'Returning structured JSON',
];

const CODE_SNIPPET = `import httpx
from bs4 import BeautifulSoup
import json, time

def scrape_page(page: int) -> list[dict]:
    url = f"https://books.toscrape.com/catalogue/page-{page}.html"
    headers = {"User-Agent": "Mozilla/5.0"}

    response = httpx.get(url, headers=headers, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    products = []

    for article in soup.select("article.product_pod"):
        products.append({
            "title":        article.find("h3").find("a")["title"],
            "price":        article.select_one(".price_color").text.strip(),
            "rating":       article.find("p", class_="star-rating")["class"][1],
            "availability": article.select_one(".availability").text.strip(),
            "image":        "https://books.toscrape.com/" + article.find("img")["src"].lstrip("../"),
        })
    return products

# Scrape all 50 pages
all_products = []
for page in range(1, 51):
    all_products.extend(scrape_page(page))
    time.sleep(0.5)  # polite delay

print(f"Scraped {len(all_products)} products")
with open("products.json", "w") as f:
    json.dump(all_products, f, indent=2)`;

export default function ScraperDemo() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logStep, setLogStep] = useState(-1);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);

  async function scrape(p: number) {
    setLoading(true);
    setResult(null);
    setError('');
    setLogStep(0);

    // Animate log steps
    LOG_STEPS.forEach((_, i) => {
      setTimeout(() => setLogStep(i), i * 300);
    });

    try {
      const res = await fetch(`/api/demo/scrape?page=${p}`);
      const data: ScrapeResult = await res.json();
      setTimeout(() => {
        setResult(data);
        setLoading(false);
        setLogStep(-1);
      }, LOG_STEPS.length * 300 + 200);
    } catch {
      setError('Request failed. Please try again.');
      setLoading(false);
      setLogStep(-1);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-zinc-400 hover:text-cyan-400 text-sm transition-colors">
            ← Back to Portfolio
          </Link>
          <a
            href="https://www.upwork.com/freelancers/~012e9e4cf475446b7e"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold px-3 py-1.5 rounded transition-colors"
          >
            Hire me on Upwork ↗
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🌐</span>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded">LIVE DEMO</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">E-commerce Data Scraper</h1>
          <p className="text-zinc-400">
            Live scrape of <span className="text-zinc-300 font-mono text-sm">books.toscrape.com</span> — a public scraping sandbox. Pick a page, hit Scrape, and get structured product data in real-time.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-400">Configure Scrape</h2>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Target Site</label>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300">
                books.toscrape.com
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Page (1–50)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={page}
                onChange={e => setPage(Math.max(1, Math.min(50, Number(e.target.value))))}
                disabled={loading}
                className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
            <button
              onClick={() => scrape(page)}
              disabled={loading}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Scraping...' : 'Scrape'}
            </button>
          </div>
        </div>

        {/* Loading log */}
        {loading && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 font-mono text-xs">
            <p className="text-zinc-500 mb-3 uppercase tracking-wider">Scraper log</p>
            <div className="space-y-1">
              {LOG_STEPS.map((line, i) => (
                <div key={i} className={`flex items-center gap-2 transition-opacity ${
                  logStep >= i ? 'opacity-100' : 'opacity-20'
                }`}>
                  <span className={logStep > i ? 'text-green-400' : logStep === i ? 'text-cyan-400 animate-pulse' : 'text-zinc-600'}>
                    {logStep > i ? '✓' : logStep === i ? '▶' : '·'}
                  </span>
                  <span className={logStep === i ? 'text-cyan-300' : 'text-zinc-400'}>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-sm text-zinc-400">
                <span className="text-white font-semibold">{result.products.length}</span> products scraped
                {' '}· page {result.page} · {new Date(result.scraped_at).toLocaleTimeString()}
              </p>
              {result.note && (
                <span className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded">
                  ⚠ {result.note}
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.products.map((p, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-colors">
                  {p.image && (
                    <div className="bg-zinc-800 h-32 flex items-center justify-center">
                      <img src={p.image} alt={p.title} className="h-full object-contain mix-blend-luminosity opacity-80" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-sm text-white mb-2 line-clamp-2">{p.title}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-cyan-400">{p.price}</span>
                      <span className="text-xs text-yellow-400">{RATING_STARS[p.rating.split(' ')[0]] ?? p.rating}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      p.availability.includes('In stock')
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {p.availability}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowCode(v => !v)}
            className="w-full px-6 py-4 flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-cyan-500">{'</>'}</span>
              View the actual Python implementation (BeautifulSoup)
            </span>
            <span>{showCode ? '▲' : '▼'}</span>
          </button>
          {showCode && (
            <pre className="px-6 pb-6 text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed">
              <code>{CODE_SNIPPET}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
