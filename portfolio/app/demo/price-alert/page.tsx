'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const COINS = [
  { id: 'bitcoin', label: 'Bitcoin (BTC)', symbol: 'BTC' },
  { id: 'ethereum', label: 'Ethereum (ETH)', symbol: 'ETH' },
];

interface PriceData {
  usd: number;
  usd_24h_change: number;
}

interface Notification {
  id: number;
  coin: string;
  symbol: string;
  price: number;
  target: number;
  direction: 'above' | 'below';
  time: string;
}

const CODE_SNIPPET = `import asyncio
import aiohttp
from telegram import Bot

BOT_TOKEN = "YOUR_BOT_TOKEN"
CHAT_ID   = "YOUR_CHAT_ID"

async def check_price(coin: str, target: float, direction: str):
    url = f"https://api.coingecko.com/api/v3/simple/price"
    params = {"ids": coin, "vs_currencies": "usd"}
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as r:
            data = await r.json()
            price = data[coin]["usd"]

    triggered = price >= target if direction == "above" else price <= target
    if triggered:
        bot = Bot(token=BOT_TOKEN)
        await bot.send_message(
            chat_id=CHAT_ID,
            text=f"🚨 Alert! {coin.upper()} is now \${price:,.2f}"
        )

async def main():
    while True:
        await check_price("bitcoin", 70000, "above")
        await asyncio.sleep(5)  # poll every 5s

asyncio.run(main())`;

export default function PriceAlertDemo() {
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [monitoring, setMonitoring] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [triggered, setTriggered] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifIdRef = useRef(0);
  const triggeredRef = useRef(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  async function fetchPrices() {
    try {
      const res = await fetch('/api/demo/price?ids=bitcoin,ethereum');
      const data = await res.json();
      setPrices(data);
    } catch {}
  }

  function startMonitoring() {
    if (!targetPrice || isNaN(Number(targetPrice))) return;
    setMonitoring(true);
    setTriggered(false);
    triggeredRef.current = false;

    intervalRef.current = setInterval(async () => {
      const res = await fetch(`/api/demo/price?ids=${selectedCoin.id}`);
      const data = await res.json();
      setPrices(prev => ({ ...prev, ...data }));

      const current = data[selectedCoin.id]?.usd ?? 0;
      const target = Number(targetPrice);
      const hit =
        direction === 'above' ? current >= target : current <= target;

      if (hit && !triggeredRef.current) {
        triggeredRef.current = true;
        setTriggered(true);
        const now = new Date();
        const notif: Notification = {
          id: ++notifIdRef.current,
          coin: selectedCoin.label,
          symbol: selectedCoin.symbol,
          price: current,
          target,
          direction,
          time: now.toLocaleTimeString(),
        };
        setNotifications(prev => [notif, ...prev].slice(0, 5));
        clearInterval(intervalRef.current!);
        setMonitoring(false);
      }
    }, 4000);
  }

  function stopMonitoring() {
    clearInterval(intervalRef.current!);
    setMonitoring(false);
  }

  const currentPrice = prices[selectedCoin.id]?.usd;
  const change = prices[selectedCoin.id]?.usd_24h_change;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-zinc-400 hover:text-cyan-400 text-sm transition-colors">
            ← Back to Portfolio
          </Link>
          <a
            href="https://www.upwork.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold px-3 py-1.5 rounded transition-colors"
          >
            Hire me on Upwork ↗
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🤖</span>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded">LIVE DEMO</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Telegram Price Alert Bot</h1>
          <p className="text-zinc-400">
            Set a price target for any crypto — the bot monitors live prices and fires a Telegram notification the moment conditions are met.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Config Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-400">Configure Alert</h2>

            {/* Coin selector */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-1.5">Asset</label>
              <div className="flex gap-2">
                {COINS.map(coin => (
                  <button
                    key={coin.id}
                    onClick={() => { setSelectedCoin(coin); setTriggered(false); triggeredRef.current = false; }}
                    disabled={monitoring}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      selectedCoin.id === coin.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                    } disabled:opacity-50`}
                  >
                    {coin.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Current price display */}
            <div className="mb-4 p-3 bg-zinc-800 rounded-lg flex items-center justify-between">
              <span className="text-xs text-zinc-500">Current Price</span>
              <div className="text-right">
                <span className="font-mono font-bold text-white">
                  {currentPrice ? `$${currentPrice.toLocaleString()}` : '...'}
                </span>
                {change !== undefined && (
                  <span className={`ml-2 text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>

            {/* Direction */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-1.5">Trigger when price goes</label>
              <div className="flex gap-2">
                {(['above', 'below'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    disabled={monitoring}
                    className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors border ${
                      direction === d
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                    } disabled:opacity-50`}
                  >
                    {d === 'above' ? '↑ Above' : '↓ Below'}
                  </button>
                ))}
              </div>
            </div>

            {/* Target price */}
            <div className="mb-5">
              <label className="block text-xs text-zinc-500 mb-1.5">Target Price (USD)</label>
              <input
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                disabled={monitoring}
                placeholder={currentPrice ? String(Math.round(currentPrice * (direction === 'above' ? 1.02 : 0.98))) : '70000'}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
              {currentPrice && targetPrice && (
                <p className="text-xs text-zinc-500 mt-1">
                  {Math.abs(((Number(targetPrice) - currentPrice) / currentPrice) * 100).toFixed(1)}% {Number(targetPrice) > currentPrice ? 'above' : 'below'} current price
                </p>
              )}
            </div>

            {/* Start / Stop */}
            {!monitoring ? (
              <button
                onClick={startMonitoring}
                disabled={!targetPrice}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start Monitoring
              </button>
            ) : (
              <button
                onClick={stopMonitoring}
                className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 font-semibold rounded-lg transition-colors"
              >
                Stop Monitoring
              </button>
            )}
          </div>

          {/* Status Panel */}
          <div className="flex flex-col gap-4">
            {/* Live indicator */}
            <div className={`bg-zinc-900 border rounded-xl p-5 transition-colors ${
              monitoring ? 'border-cyan-500/50' : triggered ? 'border-green-500/50' : 'border-zinc-800'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${
                  monitoring ? 'bg-cyan-400 animate-pulse' : triggered ? 'bg-green-400' : 'bg-zinc-600'
                }`} />
                <span className="text-xs font-mono text-zinc-400">
                  {monitoring ? 'MONITORING — polling every 4s' : triggered ? 'ALERT FIRED' : 'IDLE'}
                </span>
              </div>
              {monitoring && (
                <p className="text-sm text-zinc-300">
                  Watching <span className="text-cyan-400">{selectedCoin.symbol}</span> for price{' '}
                  <span className="text-cyan-400">{direction} ${Number(targetPrice).toLocaleString()}</span>
                </p>
              )}
              {!monitoring && !triggered && (
                <p className="text-sm text-zinc-500">Set a target price and click Start Monitoring.</p>
              )}
            </div>

            {/* Telegram notification mock */}
            {notifications.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Telegram Notifications Sent</p>
                {notifications.map(n => (
                  <div key={n.id} className="bg-zinc-900 border border-green-500/30 rounded-xl p-4">
                    {/* Telegram UI mock */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-sm flex-shrink-0">
                        🤖
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-cyan-400">PriceAlertBot</span>
                          <span className="text-xs text-zinc-600">{n.time}</span>
                        </div>
                        <div className="bg-zinc-800 rounded-lg rounded-tl-none p-3 text-sm">
                          <p className="text-green-400 font-semibold mb-1">🚨 Price Alert Triggered!</p>
                          <p className="text-zinc-300">
                            <span className="text-white font-mono">{n.symbol}</span> is now{' '}
                            <span className="text-white font-mono">${n.price.toLocaleString()}</span>
                          </p>
                          <p className="text-zinc-500 text-xs mt-1">
                            Target: {n.direction} ${n.target.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Code snippet toggle */}
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowCode(v => !v)}
            className="w-full px-6 py-4 flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-cyan-500">{'</>'}</span>
              View the actual Python implementation
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
