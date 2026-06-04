import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') ?? 'bitcoin';

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1&interval=hourly`,
      { next: { revalidate: 300 }, headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    // Return only prices array: [[timestamp, price], ...]
    return NextResponse.json({ prices: data.prices ?? [] });
  } catch {
    // Generate realistic fallback data (24 points, 1h apart)
    const base = id === 'ethereum' ? 3500 : 67000;
    const now = Date.now();
    const prices = Array.from({ length: 25 }, (_, i) => {
      const t = now - (24 - i) * 3600_000;
      const noise = (Math.random() - 0.5) * base * 0.02;
      const trend = ((i / 24) - 0.5) * base * 0.015;
      return [t, Math.round(base + trend + noise)];
    });
    return NextResponse.json({ prices, fallback: true });
  }
}
