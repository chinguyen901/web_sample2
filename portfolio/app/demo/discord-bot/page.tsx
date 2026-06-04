"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

const UPWORK_URL = "https://www.upwork.com/freelancers/~012e9e4cf475446b7e";

interface ChatMessage {
  id: number;
  type: "user" | "bot" | "system";
  author: string;
  avatar: string;
  content?: string;
  embed?: {
    color: string;
    title: string;
    fields: { name: string; value: string; inline?: boolean }[];
    footer?: string;
    timestamp?: string;
  };
  time: string;
  isTyping?: boolean;
}

const BOT_AVATAR = "🤖";
const USER_AVATAR = "👤";
const CHANNELS = ["#general", "#price-alerts", "#job-feed", "#bot-commands"];

type CommandId = "price" | "alert" | "status" | "scrape" | "help";

const COMMANDS: { id: CommandId; label: string; desc: string; color: string }[] = [
  { id: "price", label: "/price BTC", desc: "Get current Bitcoin price", color: "text-yellow-400" },
  { id: "alert", label: "/alert set 95000", desc: "Set price alert for BTC > $95k", color: "text-green-400" },
  { id: "status", label: "/status", desc: "Check bot & monitoring status", color: "text-cyan-400" },
  { id: "scrape", label: "/scrape products", desc: "Trigger product scrape now", color: "text-purple-400" },
  { id: "help", label: "/help", desc: "List all available commands", color: "text-zinc-400" },
];

const BOT_RESPONSES: Record<CommandId, Omit<ChatMessage, "id" | "time">> = {
  price: {
    type: "bot",
    author: "PriceBot",
    avatar: BOT_AVATAR,
    embed: {
      color: "#fbbf24",
      title: "₿ Bitcoin (BTC) · Live Price",
      fields: [
        { name: "Current Price", value: "**$96,842.50**", inline: true },
        { name: "24h Change", value: "🟢 +2.34% (+$2,213)", inline: true },
        { name: "Market Cap", value: "$1.91 Trillion", inline: true },
        { name: "24h Volume", value: "$38.2 Billion", inline: true },
        { name: "24h High", value: "$97,450", inline: true },
        { name: "24h Low", value: "$94,100", inline: true },
      ],
      footer: "CoinGecko API",
      timestamp: new Date().toLocaleTimeString(),
    },
  },
  alert: {
    type: "bot",
    author: "PriceBot",
    avatar: BOT_AVATAR,
    embed: {
      color: "#34d399",
      title: "🔔 Price Alert Set",
      fields: [
        { name: "Coin", value: "Bitcoin (BTC)", inline: true },
        { name: "Condition", value: "Price > $95,000", inline: true },
        { name: "Notify", value: "#price-alerts channel", inline: false },
        { name: "Status", value: "🟢 Active — monitoring every 60s", inline: false },
      ],
      footer: "You'll be notified when condition is met",
    },
  },
  status: {
    type: "bot",
    author: "PriceBot",
    avatar: BOT_AVATAR,
    embed: {
      color: "#22d3ee",
      title: "📊 Bot Status Dashboard",
      fields: [
        { name: "Bot Uptime", value: "🟢 14d 6h 22m", inline: true },
        { name: "Ping", value: "⚡ 42ms", inline: true },
        { name: "Active Alerts", value: "7 alerts set", inline: true },
        { name: "Jobs Monitored", value: "3 sources", inline: true },
        { name: "Scraper Status", value: "🟢 Running (last: 2m ago)", inline: false },
        { name: "API Health", value: "CoinGecko ✅  LinkedIn ✅  Indeed ✅", inline: false },
      ],
      footer: "All systems operational",
    },
  },
  scrape: {
    type: "bot",
    author: "PriceBot",
    avatar: BOT_AVATAR,
    embed: {
      color: "#a78bfa",
      title: "🕷️ Scrape Triggered",
      fields: [
        { name: "Target", value: "books.toscrape.com", inline: true },
        { name: "Pages", value: "50 pages", inline: true },
        { name: "Est. Time", value: "~45 seconds", inline: true },
        { name: "Output", value: "Google Sheets: 'Product Inventory'", inline: false },
        { name: "Notification", value: "Will ping #general when done", inline: false },
      ],
      footer: "Scrape started — check back in a minute",
    },
  },
  help: {
    type: "bot",
    author: "PriceBot",
    avatar: BOT_AVATAR,
    embed: {
      color: "#6b7280",
      title: "🤖 PriceBot — Command Reference",
      fields: [
        { name: "/price [coin]", value: "Get live price (BTC, ETH, SOL...)" },
        { name: "/alert set [coin] [price]", value: "Create a price alert" },
        { name: "/alert list", value: "See all your active alerts" },
        { name: "/status", value: "Check bot uptime and API health" },
        { name: "/scrape [source]", value: "Manually trigger a scrape job" },
        { name: "/jobs [keyword]", value: "Search for jobs matching keyword" },
      ],
      footer: "PriceBot v2.1.0 · Powered by discord.py",
    },
  },
};

const MONITOR_FEED = [
  { author: "alex_trader", avatar: "😎", content: "anyone watching BTC right now? looks bullish" },
  { author: "sarah_dev", avatar: "💻", content: "looking for Python developer role remote" },
  { author: "john_m", avatar: "🧑", content: "BTC just hit 96800, should we buy?" },
  { author: "crypto_watcher", avatar: "📊", content: "ETH pumping hard today" },
  { author: "alice_pm", avatar: "👩", content: "need automation script for scraping" },
];

const PYTHON_CODE = `import discord
from discord.ext import commands, tasks
import aiohttp

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="/", intents=intents)

@bot.tree.command(name="price", description="Get live crypto price")
async def price(interaction: discord.Interaction, coin: str = "bitcoin"):
    async with aiohttp.ClientSession() as s:
        r = await s.get(f"https://api.coingecko.com/api/v3/simple/price"
                        f"?ids={coin}&vs_currencies=usd&include_24hr_change=true")
        data = await r.json()
    price = data[coin]["usd"]
    change = data[coin]["usd_24h_change"]
    embed = discord.Embed(title=f"{coin.upper()} Price", color=0x22d3ee)
    embed.add_field(name="Price", value=f"\${price:,.2f}")
    embed.add_field(name="24h Change", value=f"{change:+.2f}%")
    await interaction.response.send_message(embed=embed)

@tasks.loop(minutes=1)
async def monitor_prices():
    # Check all active alerts, send notification if triggered
    for alert in active_alerts:
        current = await fetch_price(alert.coin)
        if current >= alert.target:
            channel = bot.get_channel(ALERT_CHANNEL_ID)
            await channel.send(f"🔔 Alert! {alert.coin} hit \${current:,.0f}")

bot.run(TOKEN)`;

let msgIdCounter = 10;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1, type: "system", author: "", avatar: "",
    content: "PriceBot joined the server", time: "Today at 8:00 AM",
  },
  {
    id: 2, type: "bot", author: "PriceBot", avatar: BOT_AVATAR,
    embed: {
      color: "#22d3ee",
      title: "🤖 PriceBot is online!",
      fields: [
        { name: "Monitoring", value: "BTC, ETH, SOL + 10 more coins" },
        { name: "Job Sources", value: "LinkedIn · Indeed · Upwork" },
        { name: "Active Alerts", value: "7 price alerts set by members" },
      ],
      footer: "Type /help to see all commands",
    },
    time: "Today at 8:00 AM",
  },
];

export default function DiscordBotPage() {
  const [activeChannel, setActiveChannel] = useState("#bot-commands");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [watchKeywords, setWatchKeywords] = useState("BTC, python, automation");
  const chatRef = useRef<HTMLDivElement>(null);
  const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedIndexRef = useRef(0);

  const scrollToBottom = () => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const addUserMessage = (text: string) => {
    const msg: ChatMessage = {
      id: ++msgIdCounter,
      type: "user",
      author: "You",
      avatar: USER_AVATAR,
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, msg]);
  };

  const addBotMessage = (response: Omit<ChatMessage, "id" | "time">) => {
    const msg: ChatMessage = {
      ...response,
      id: ++msgIdCounter,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleCommand = useCallback((cmdId: CommandId) => {
    if (isTyping) return;
    const cmd = COMMANDS.find(c => c.id === cmdId);
    if (!cmd) return;
    addUserMessage(cmd.label);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(BOT_RESPONSES[cmdId]);
    }, 1200);
  }, [isTyping]);

  const toggleMonitor = useCallback(() => {
    if (monitoring) {
      setMonitoring(false);
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
    } else {
      setMonitoring(true);
      feedIndexRef.current = 0;
      const interval = setInterval(() => {
        const feed = MONITOR_FEED[feedIndexRef.current % MONITOR_FEED.length];
        const feedMsg: ChatMessage = {
          id: ++msgIdCounter,
          type: "user",
          author: feed.author,
          avatar: feed.avatar,
          content: feed.content,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages(prev => [...prev, feedMsg]);

        // Check if keywords match
        const keywords = watchKeywords.split(",").map(k => k.trim().toLowerCase());
        const matched = keywords.some(k => feed.content.toLowerCase().includes(k));
        if (matched) {
          setTimeout(() => {
            addBotMessage({
              type: "bot",
              author: "PriceBot",
              avatar: BOT_AVATAR,
              embed: {
                color: "#f59e0b",
                title: "🔍 Keyword Alert Detected",
                fields: [
                  { name: "Matched keyword", value: keywords.find(k => feed.content.toLowerCase().includes(k)) || "—", inline: true },
                  { name: "Author", value: feed.author, inline: true },
                  { name: "Message", value: `"${feed.content}"` },
                  { name: "Action", value: "📢 Notification sent to #price-alerts" },
                ],
                footer: "Channel Monitor Active",
              },
            });
          }, 800);
        }
        feedIndexRef.current++;
      }, 2500);
      monitorIntervalRef.current = interval;
    }
  }, [monitoring, watchKeywords]);

  useEffect(() => () => { if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current); }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-mono text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
            ← chi.dev
          </Link>
          <span className="text-sm text-zinc-400 hidden sm:block">Discord Bot Demo</span>
          <a href={UPWORK_URL} target="_blank" rel="noopener noreferrer"
            className="text-sm px-4 py-1.5 rounded-full bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 transition-colors">
            Hire me
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl">🎮</div>
            <div>
              <h1 className="text-2xl font-bold">Discord Bot</h1>
              <p className="text-sm text-zinc-500">Bot tự trả lời commands, monitor kênh, gửi alert real-time cho cả server</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Python", "discord.py", "Slash Commands", "Rich Embeds", "asyncio", "aiohttp"].map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{tag}</span>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-5 mb-5">
          {/* Discord mock */}
          <div className="md:col-span-3 rounded-xl overflow-hidden border border-zinc-700" style={{ background: "#313338" }}>
            {/* Titlebar */}
            <div className="flex items-center justify-between px-3 py-2" style={{ background: "#1e1f22" }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-100">🔱 chi-automation-server</span>
                <span className="text-xs text-zinc-500 ml-1">— 42 members online</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
            </div>

            <div className="flex h-[420px]">
              {/* Sidebar channels */}
              <div className="w-36 flex-shrink-0 py-2" style={{ background: "#2b2d31" }}>
                <p className="text-xs text-zinc-500 px-3 py-1 uppercase tracking-wider font-semibold mb-1">Text Channels</p>
                {CHANNELS.map(ch => (
                  <button
                    key={ch}
                    onClick={() => setActiveChannel(ch)}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded mx-1 transition-colors ${
                      activeChannel === ch
                        ? "bg-zinc-600/60 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                    }`}
                    style={{ width: "calc(100% - 8px)" }}
                  >
                    {ch}
                  </button>
                ))}
                <div className="border-t border-zinc-700/50 mt-2 pt-2 mx-2">
                  <p className="text-xs text-zinc-500 px-1 uppercase tracking-wider mb-1">Members</p>
                  <div className="space-y-1">
                    {[
                      { name: "PriceBot", color: "text-green-400", status: "🟢" },
                      { name: "You", color: "text-zinc-300", status: "🟢" },
                    ].map(m => (
                      <div key={m.name} className="flex items-center gap-1.5 px-1">
                        <span className="text-xs">{m.status}</span>
                        <span className={`text-xs ${m.color}`}>{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col">
                {/* Channel header */}
                <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: "#1e1f22" }}>
                  <span className="text-zinc-300 font-medium text-sm">{activeChannel}</span>
                  {isTyping && (
                    <span className="text-xs text-zinc-500 italic ml-2">PriceBot is typing...</span>
                  )}
                </div>

                {/* Messages */}
                <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                  {messages.map(msg => {
                    if (msg.type === "system") {
                      return (
                        <div key={msg.id} className="flex items-center gap-2 text-xs text-zinc-500 py-1">
                          <div className="flex-1 h-px bg-zinc-700/50" />
                          <span>{msg.content}</span>
                          <div className="flex-1 h-px bg-zinc-700/50" />
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id} className="flex items-start gap-2.5 group">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm flex-shrink-0">
                          {msg.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className={`text-sm font-semibold ${msg.type === "bot" ? "text-indigo-400" : "text-zinc-200"}`}>
                              {msg.author}
                            </span>
                            {msg.type === "bot" && (
                              <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 py-0.5 rounded text-[10px] font-medium">BOT</span>
                            )}
                            <span className="text-xs text-zinc-600">{msg.time}</span>
                          </div>
                          {msg.content && <p className="text-sm text-zinc-300 leading-relaxed">{msg.content}</p>}
                          {msg.embed && (
                            <div className="mt-1 rounded-r-lg pl-3 py-2.5 pr-3 max-w-sm"
                              style={{ background: "#2b2d31", borderLeft: `4px solid ${msg.embed.color}` }}>
                              <p className="text-sm font-semibold text-zinc-100 mb-2">{msg.embed.title}</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                {msg.embed.fields.map((f, i) => (
                                  <div key={i} className={f.inline === false ? "col-span-2" : ""}>
                                    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">{f.name}</p>
                                    <p className="text-xs text-zinc-300"
                                      dangerouslySetInnerHTML={{ __html: f.value.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                  </div>
                                ))}
                              </div>
                              {msg.embed.footer && (
                                <p className="text-xs text-zinc-600 mt-2 border-t border-zinc-700/50 pt-1.5">{msg.embed.footer}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm">{BOT_AVATAR}</div>
                      <div className="flex gap-1 px-3 py-2 rounded-lg" style={{ background: "#2b2d31" }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div className="px-3 pb-3">
                  <div className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: "#383a40" }}>
                    <span className="text-zinc-600 text-sm">+</span>
                    <span className="text-zinc-600 text-sm flex-1">Click a command →</span>
                    <span className="text-zinc-600 text-sm">😊</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Commands + Monitor */}
          <div className="md:col-span-2 space-y-4">
            {/* Slash commands */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 font-medium">Try Slash Commands</p>
              <div className="space-y-2">
                {COMMANDS.map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={() => handleCommand(cmd.id)}
                    disabled={isTyping}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all disabled:opacity-50 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-mono font-medium ${cmd.color}`}>{cmd.label}</span>
                      <span className="text-xs text-zinc-600 group-hover:text-zinc-400">→</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{cmd.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Channel monitor */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Channel Monitor</p>
                <button
                  onClick={toggleMonitor}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    monitoring
                      ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                      : "bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"
                  }`}
                >
                  {monitoring ? "⏹ Stop" : "▶ Start"}
                </button>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-zinc-500 mb-1.5">Watch Keywords</label>
                <input
                  value={watchKeywords}
                  onChange={e => setWatchKeywords(e.target.value)}
                  disabled={monitoring}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                />
              </div>
              <div className={`flex items-center gap-2 text-xs ${monitoring ? "text-green-400" : "text-zinc-500"}`}>
                <div className={`w-2 h-2 rounded-full ${monitoring ? "bg-green-400 animate-pulse" : "bg-zinc-600"}`} />
                {monitoring ? "Monitoring #general for keywords..." : "Inactive"}
              </div>
            </div>
          </div>
        </div>

        {/* Code + FAQ */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-zinc-500 ml-1 font-mono">bot.py</span>
            </div>
            <pre className="p-4 font-mono text-xs text-zinc-300 h-64 overflow-auto leading-relaxed">
              <code>{PYTHON_CODE}</code>
            </pre>
          </div>
          <div className="space-y-4">
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-2">Kết quả thực tế</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Bot chạy <strong className="text-indigo-400">24/7</strong>, thay thế hoàn toàn việc manual check. 500+ member server được notify ngay khi giá crypto hit target, không cần F5.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Câu hỏi thường gặp</p>
              <div className="space-y-2.5 text-sm">
                {[
                  ["Bot cần server riêng không?", "Chạy trên VPS $5/tháng (DigitalOcean, Hetzner) hoặc Railway."],
                  ["Có thể control từ Discord không?", "Có — admin dùng slash command để bật/tắt, config alert không cần SSH."],
                  ["Hỗ trợ nhiều server không?", "Có — 1 bot instance có thể join nhiều server cùng lúc."],
                ].map(([q, a]) => (
                  <div key={q}>
                    <p className="text-zinc-300 font-medium">{q}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
