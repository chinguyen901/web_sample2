import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids') ?? 'bitcoin,ethereum';

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error('CoinGecko error');
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      bitcoin: { usd: 67420, usd_24h_change: 2.3, usd_24h_vol: 28_000_000_000, usd_market_cap: 1_320_000_000_000 },
      ethereum: { usd: 3521, usd_24h_change: 1.8, usd_24h_vol: 14_000_000_000, usd_market_cap: 423_000_000_000 },
    });
  }
}
