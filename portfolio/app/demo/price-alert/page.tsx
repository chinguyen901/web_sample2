'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

const COINS = [
  { id: 'bitcoin',  label: 'Bitcoin',  symbol: 'BTC', color: '#F7931A' },
  { id: 'ethereum', label: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
];

interface PriceData { usd: number; usd_24h_change: number; usd_market_cap: number; usd_24h_vol: number; }
interface TelegramMsg { id: number; text: string; time: string; type: 'bot' | 'system'; }

const CODE_SNIPPET = `import asyncio, aiohttp
from telegram import Bot

BOT_TOKEN = "YOUR_BOT_TOKEN"
CHAT_ID   = "YOUR_CHAT_ID"

async def monitor(coin: str, target: float, direction: str):
    bot = Bot(token=BOT_TOKEN)
    async with aiohttp.ClientSession() as session:
        while True:
            async with session.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={"ids": coin, "vs_currencies": "usd"}
            ) as r:
                price = (await r.json())[coin]["usd"]

            hit = price >= target if direction == "above" else price <= target
            if hit:
                await bot.send_message(
                    chat_id=CHAT_ID,
                    text=f"🚨 Alert! {coin.upper()} hit \${price:,.2f}\\n"
                         f"Target was {direction} \${target:,.2f}"
                )
                break
            await asyncio.sleep(5)

asyncio.run(monitor("bitcoin", 70000, "above"))`;

function SparklineChart({ prices, color }: { prices: [number, number][]; color: string }) {
  if (prices.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-zinc-600 text-xs animate-pulse">
        Loading chart data...
      </div>
    );
  }

  const values = prices.map(p => p[1]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 600, H = 100, PAD = 6;

  const pts = values.map((v, i) => [
    PAD + (i / (values.length - 1)) * (W - PAD * 2),
    PAD + (1 - (v - min) / range) * (H - PAD * 2),
  ]);

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${(W - PAD).toFixed(1)},${H} L${PAD},${H} Z`;
  const isUp = values[values.length - 1] >= values[0];
  const lineColor = isUp ? '#34d399' : '#f87171';
  const gradId = `grad${color.replace('#', '')}`;

  const labelIdxs = [0, Math.floor(values.length * 0.33), Math.floor(values.length * 0.66), values.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" style={{ height: '120px' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill={lineColor} />
        {labelIdxs.map(idx => {
          const ts = prices[idx]?.[0];
          if (!ts) return null;
          const lbl = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const x = PAD + (idx / (values.length - 1)) * (W - PAD * 2);
          return <text key={idx} x={x} y={H + 13} textAnchor="middle" fontSize="8" fill="#52525b">{lbl}</text>;
        })}
      </svg>
      <div className="flex justify-between text-xs text-zinc-600 font-mono">
        <span>Low: ${min.toLocaleString()}</span>
        <span className={isUp ? 'text-green-400' : 'text-red-400'}>
          {isUp ? '▲' : '▼'} {(((values[values.length - 1] - values[0]) / values[0]) * 100).toFixed(2)}%
        </span>
        <span>High: ${max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function TelegramWindow({ messages, botName }: { messages: TelegramMsg[]; botName: string }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700 flex flex-col" style={{ height: '340px', background: '#17212b' }}>
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-b" style={{ background: '#17212b', borderColor: '#0d1621' }}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-sm flex-shrink-0">
          🤖
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white leading-none">{botName}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6c7883' }}>bot</p>
        </div>
        <div className="flex gap-3" style={{ color: '#6c7883' }}>
          <span className="cursor-pointer hover:text-white text-sm transition-colors">🔍</span>
          <span className="cursor-pointer hover:text-white text-sm transition-colors">⋮</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-xs mt-8" style={{ color: '#6c7883' }}>
            Configure an alert to receive Telegram messages
          </div>
        )}
        {messages.map(msg =>
          msg.type === 'system' ? (
            <div key={msg.id} className="text-center">
              <span className="text-xs px-3 py-1 rounded-full" style={{ color: '#6c7883', background: '#182533' }}>{msg.text}</span>
            </div>
          ) : (
            <div key={msg.id} className="flex items-end gap-2 max-w-[90%]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs flex-shrink-0 mb-0.5">
                🤖
              </div>
              <div>
                <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-sm whitespace-pre-line leading-relaxed" style={{ background: '#182533', color: '#e8e8e8' }}>
                  {msg.text}
                </div>
                <span className="text-[10px] ml-1" style={{ color: '#6c7883' }}>{msg.time}</span>
              </div>
            </div>
          )
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 flex items-center gap-2 border-t" style={{ background: '#17212b', borderColor: '#0d1621' }}>
        <span className="text-lg" style={{ color: '#6c7883' }}>😊</span>
        <div className="flex-1 rounded-full px-4 py-1.5 text-xs" style={{ background: '#242f3d', color: '#6c7883' }}>Message</div>
        <span className="text-lg" style={{ color: '#6c7883' }}>🎤</span>
      </div>
    </div>
  );
}

export default function PriceAlertDemo() {
  const [coin, setCoin] = useState(COINS[0]);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [chartData, setChartData] = useState<[number, number][]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [tgMsgs, setTgMsgs] = useState<TelegramMsg[]>([]);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const triggeredRef = useRef(false);
  const msgId = useRef(0);
  const pricesRef = useRef(prices);
  pricesRef.current = prices;

  const addMsg = useCallback((text: string, type: TelegramMsg['type'] = 'bot') => {
    setTgMsgs(prev => [...prev, {
      id: ++msgId.current, text, type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  }, []);

  const loadChart = useCallback(async (id: string) => {
    setChartLoading(true);
    setChartData([]);
    try {
      const r = await fetch(`/api/demo/chart?id=${id}`);
      const d = await r.json();
      setChartData(d.prices ?? []);
    } catch {}
    setChartLoading(false);
  }, []);

  const loadAI = useCallback(async (id: string, usd: number, change: number) => {
    setAiText('');
    setAiLoading(true);
    try {
      const r = await fetch('/api/demo/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coin: id, currentPrice: usd, change24h: change, high24h: usd * 1.02, low24h: usd * 0.98 }),
      });
      const d = await r.json();
      setAiText(d.analysis ?? '');
    } catch {}
    setAiLoading(false);
  }, []);

  useEffect(() => {
    fetch('/api/demo/price?ids=bitcoin,ethereum')
      .then(r => r.json())
      .then(d => {
        setPrices(d);
        loadChart(coin.id);
        const p = d[coin.id];
        if (p) loadAI(coin.id, p.usd, p.usd_24h_change);
      })
      .catch(() => { loadChart(coin.id); });
    addMsg('👋 PriceAlertBot is ready.\nSet a target price and click Start Monitoring.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchCoin(c: typeof COINS[0]) {
    if (monitoring) return;
    setCoin(c);
    setTriggered(false);
    triggeredRef.current = false;
    loadChart(c.id);
    const p = pricesRef.current[c.id];
    if (p) loadAI(c.id, p.usd, p.usd_24h_change);
  }

  function startMonitoring() {
    if (!targetPrice || isNaN(Number(targetPrice))) return;
    setMonitoring(true);
    setTriggered(false);
    triggeredRef.current = false;
    addMsg(`🔍 Monitoring started\n${coin.symbol} — alert when price ${direction} $${Number(targetPrice).toLocaleString()}`);

    intervalRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/demo/price?ids=${coin.id}`);
        const data = await r.json();
        setPrices(prev => ({ ...prev, ...data }));
        const current: number = data[coin.id]?.usd ?? 0;
        const target = Number(targetPrice);
        const hit = direction === 'above' ? current >= target : current <= target;
        if (hit && !triggeredRef.current) {
          triggeredRef.current = true;
          setTriggered(true);
          clearInterval(intervalRef.current!);
          setMonitoring(false);
          const diff = (((current - target) / target) * 100).toFixed(2);
          addMsg(
            `🚨 Price Alert Triggered!\n\n${coin.symbol} is now $${current.toLocaleString()}\nTarget: ${direction} $${target.toLocaleString()}\nDiff: ${diff}%\n\n⏰ ${new Date().toLocaleTimeString()}`
          );
        }
      } catch {}
    }, 4000);
  }

  function stopMonitoring() {
    clearInterval(intervalRef.current!);
    setMonitoring(false);
    addMsg('⏹ Monitoring stopped.', 'system');
  }

  const cur = prices[coin.id];
  const fmt = (n: number) =>
    n >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;

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
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🤖</span>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded">LIVE DEMO</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">Telegram Price Alert Bot</h1>
          <p className="text-zinc-400 text-sm">Live crypto prices · AI market analysis · Real-time Telegram alerts</p>
        </div>

        {/* Coin tabs */}
        <div className="flex gap-3 mb-5">
          {COINS.map(c => (
            <button key={c.id} onClick={() => switchCoin(c)} disabled={monitoring}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-50 ${
                coin.id === c.id ? 'bg-zinc-800 border-zinc-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.label}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Current Price', value: cur ? `$${cur.usd.toLocaleString()}` : '—', extra: '' },
            { label: '24h Change', value: cur ? `${cur.usd_24h_change >= 0 ? '+' : ''}${cur.usd_24h_change.toFixed(2)}%` : '—', color: cur ? (cur.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400') : '' },
            { label: 'Market Cap', value: cur ? fmt(cur.usd_market_cap) : '—', extra: '' },
            { label: '24h Volume', value: cur ? fmt(cur.usd_24h_vol) : '—', extra: '' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className={`font-mono font-bold text-base ${s.color ?? 'text-white'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid md:grid-cols-5 gap-5 mb-5">
          {/* Left: config */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Configure Alert</h2>

              <div className="mb-4">
                <label className="block text-xs text-zinc-500 mb-1.5">Trigger when price goes</label>
                <div className="flex gap-2">
                  {(['above', 'below'] as const).map(d => (
                    <button key={d} onClick={() => setDirection(d)} disabled={monitoring}
                      className={`flex-1 py-1.5 rounded-lg text-sm capitalize border transition-colors disabled:opacity-50 ${
                        direction === d ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                      }`}>
                      {d === 'above' ? '↑ Above' : '↓ Below'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-zinc-500 mb-1.5">Target Price (USD)</label>
                <input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} disabled={monitoring}
                  placeholder={cur ? String(Math.round(cur.usd * (direction === 'above' ? 1.02 : 0.98))) : '70000'}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50" />
                {cur && targetPrice && (
                  <p className="text-xs text-zinc-600 mt-1">
                    {Math.abs(((Number(targetPrice) - cur.usd) / cur.usd) * 100).toFixed(1)}%
                    {Number(targetPrice) > cur.usd ? ' above' : ' below'} current
                  </p>
                )}
              </div>

              {!monitoring ? (
                <button onClick={startMonitoring} disabled={!targetPrice}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-lg transition-colors disabled:opacity-40 text-sm">
                  ▶ Start Monitoring
                </button>
              ) : (
                <button onClick={stopMonitoring}
                  className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 font-semibold rounded-lg transition-colors text-sm">
                  ⏹ Stop
                </button>
              )}

              <div className={`mt-3 px-3 py-2 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                monitoring ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' :
                triggered ? 'bg-green-500/10 border-green-500/30 text-green-300' :
                'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  monitoring ? 'bg-cyan-400 animate-pulse' : triggered ? 'bg-green-400' : 'bg-zinc-600'
                }`} />
                {monitoring ? 'LIVE — polling every 4s' : triggered ? 'ALERT FIRED ✓' : 'IDLE'}
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">✨</span>
                <span className="text-xs font-semibold text-zinc-300">AI Market Analysis</span>
                <span className="text-[10px] text-zinc-600 ml-auto font-mono">Gemini AI</span>
              </div>
              {aiLoading ? (
                <div className="space-y-1.5">
                  <div className="h-2 bg-zinc-800 rounded animate-pulse w-full" />
                  <div className="h-2 bg-zinc-800 rounded animate-pulse w-4/5" />
                  <div className="h-2 bg-zinc-800 rounded animate-pulse w-3/5" />
                </div>
              ) : aiText ? (
                <p className="text-xs text-zinc-300 leading-relaxed">{aiText}</p>
              ) : (
                <p className="text-xs text-zinc-600">Analysis will appear here</p>
              )}
            </div>
          </div>

          {/* Right: chart + telegram */}
          <div className="md:col-span-3 flex flex-col gap-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{coin.symbol}/USD — 24h</span>
                {chartLoading && <span className="text-xs text-zinc-600 animate-pulse">Loading...</span>}
              </div>
              <SparklineChart prices={chartData} color={coin.color} />
            </div>

            <TelegramWindow messages={tgMsgs} botName="PriceAlertBot" />
          </div>
        </div>

        {/* Code */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <button onClick={() => setShowCode(v => !v)}
            className="w-full px-6 py-4 flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            <span className="flex items-center gap-2"><span className="text-cyan-500">{'</>'}</span>Python implementation</span>
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
