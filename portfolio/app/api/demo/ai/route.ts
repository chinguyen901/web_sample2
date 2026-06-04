import { NextResponse } from 'next/server';

const GEMINI_KEY = 'AQ.Ab8RN6IJctQi_FtVIY7rV4ZRA0yShNiFxkpF0bJ9LpDLhE95qw';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

export async function POST(request: Request) {
  const body = await request.json();
  const { coin, currentPrice, change24h, high24h, low24h } = body;

  const prompt = `You are a concise crypto market analyst. Given this data for ${coin}:
- Current price: $${currentPrice.toLocaleString()}
- 24h change: ${change24h > 0 ? '+' : ''}${change24h?.toFixed(2)}%
- 24h high: $${high24h?.toLocaleString() ?? 'N/A'}
- 24h low: $${low24h?.toLocaleString() ?? 'N/A'}

Write exactly 2 short sentences: one describing the current momentum, one short trading insight or caution. No bullet points. Plain text only.`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 120, temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return NextResponse.json({ analysis: text.trim() });
  } catch {
    // Deterministic fallback based on price change
    const sentiment = (change24h ?? 0) > 0 ? 'bullish' : 'bearish';
    const fallback = change24h > 2
      ? `${coin} is showing strong upward momentum with a ${change24h?.toFixed(1)}% gain, driven by increased buying pressure. Consider setting alerts near recent highs to manage risk.`
      : change24h < -2
      ? `${coin} is under selling pressure with a ${Math.abs(change24h)?.toFixed(1)}% decline in 24h. Watch key support levels before taking new positions.`
      : `${coin} is trading in a tight range with minimal ${sentiment} bias — typical consolidation behavior. Wait for a breakout above resistance or below support before acting.`;
    return NextResponse.json({ analysis: fallback, fallback: true });
  }
}
