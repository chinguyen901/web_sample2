import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const FALLBACK_PRODUCTS = [
  {
    title: 'A Light in the Attic',
    price: '£51.77',
    rating: '3 out of 5',
    availability: 'In stock',
    image: null,
    url: 'http://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html',
    source: 'books.toscrape.com (fallback data)',
  },
  {
    title: 'Tipping the Velvet',
    price: '£53.74',
    rating: '1 out of 5',
    availability: 'In stock',
    image: null,
    url: 'http://books.toscrape.com/catalogue/tipping-the-velvet_999/index.html',
    source: 'books.toscrape.com (fallback data)',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Math.min(50, Number(searchParams.get('page') ?? 1)));

  try {
    const url = `https://books.toscrape.com/catalogue/page-${page}.html`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-demo/1.0)' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const products: object[] = [];
    $('article.product_pod').each((_, el) => {
      const title = $(el).find('h3 a').attr('title') ?? $(el).find('h3 a').text();
      const price = $(el).find('p.price_color').text().trim();
      const ratingClass = $(el).find('p.star-rating').attr('class') ?? '';
      const ratingWord = ratingClass.replace('star-rating', '').trim();
      const availability = $(el).find('p.availability').text().trim();
      const imgSrc = $(el).find('img').attr('src') ?? '';
      const link = $(el).find('h3 a').attr('href') ?? '';

      products.push({
        title,
        price,
        rating: `${ratingWord} out of 5`,
        availability,
        image: imgSrc ? `https://books.toscrape.com/${imgSrc.replace('../', '')}` : null,
        url: `https://books.toscrape.com/catalogue/${link.replace('../', '')}`,
        source: 'books.toscrape.com (live)',
      });
    });

    if (!products.length) throw new Error('No products parsed');

    return NextResponse.json({ products, page, scraped_at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({
      products: FALLBACK_PRODUCTS,
      page,
      scraped_at: new Date().toISOString(),
      note: 'Live scrape failed — showing cached demo data',
    });
  }
}
