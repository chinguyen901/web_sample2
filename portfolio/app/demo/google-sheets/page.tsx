"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

const UPWORK_URL = "https://www.upwork.com/freelancers/~012e9e4cf475446b7e";

type DataSource = "products" | "crypto" | "jobs";

interface SheetRow {
  id: number;
  col1: string;
  col2: string;
  col3: string;
  col4: string;
  col5: string;
  col6: string;
  status: "idle" | "writing" | "done";
}

const SOURCES: Record<DataSource, { label: string; headers: string[]; rows: string[][] }> = {
  products: {
    label: "E-commerce Products",
    headers: ["Title", "Price", "Rating", "In Stock", "Category", "Updated"],
    rows: [
      ["A Light in the Attic", "$51.77", "★★★", "In Stock", "Poetry", "2025-01-15"],
      ["Tipping the Velvet", "$53.74", "★", "In Stock", "Historical", "2025-01-15"],
      ["Soumission", "$50.10", "★", "In Stock", "Fiction", "2025-01-15"],
      ["Sharp Objects", "$47.82", "★★★★", "In Stock", "Mystery", "2025-01-15"],
      ["Sapiens", "$54.23", "★★★★★", "In Stock", "History", "2025-01-15"],
      ["The Requiem Red", "$22.65", "★", "In Stock", "Fantasy", "2025-01-15"],
      ["The Dirty Little Secrets", "$33.34", "★★★★", "In Stock", "Mystery", "2025-01-15"],
      ["The Coming Woman", "$17.93", "★★★", "In Stock", "Historical", "2025-01-15"],
      ["The Boys in the Boat", "$22.60", "★★★★", "In Stock", "Sports", "2025-01-15"],
      ["The Black Maria", "$52.15", "★★", "In Stock", "Poetry", "2025-01-15"],
      ["Starving Hearts (Triangular Trade)", "$13.99", "★★★", "Out of Stock", "YA", "2025-01-15"],
      ["Shakespeare's Sonnets", "$20.66", "★★★★", "In Stock", "Poetry", "2025-01-15"],
    ],
  },
  crypto: {
    label: "Crypto Prices",
    headers: ["Coin", "Price (USD)", "24h Change", "Market Cap", "Volume", "Timestamp"],
    rows: [
      ["Bitcoin (BTC)", "$96,842", "+2.34%", "$1.91T", "$38.2B", "08:00:00"],
      ["Ethereum (ETH)", "$3,421", "+1.87%", "$411B", "$18.4B", "08:00:00"],
      ["BNB", "$682", "-0.42%", "$96B", "$2.1B", "08:00:00"],
      ["Solana (SOL)", "$198", "+5.12%", "$93B", "$6.8B", "08:00:00"],
      ["XRP", "$2.41", "+3.76%", "$138B", "$9.2B", "08:00:00"],
      ["USDC", "$1.00", "0.00%", "$45B", "$8.9B", "08:00:00"],
      ["Dogecoin (DOGE)", "$0.382", "+8.91%", "$56B", "$4.1B", "08:00:00"],
      ["Cardano (ADA)", "$1.02", "+2.15%", "$36B", "$1.7B", "08:00:00"],
      ["Avalanche (AVAX)", "$41.20", "-1.23%", "$17B", "$890M", "08:00:00"],
      ["Chainlink (LINK)", "$24.80", "+4.56%", "$15B", "$720M", "08:00:00"],
    ],
  },
  jobs: {
    label: "Job Listings",
    headers: ["Title", "Company", "Location", "Type", "Salary", "Posted"],
    rows: [
      ["Python Developer", "TechCorp", "Remote", "Full-time", "$80-100k", "2025-01-14"],
      ["Automation Engineer", "DataFlow Inc", "Remote", "Contract", "$50-70/hr", "2025-01-14"],
      ["Web Scraping Specialist", "ScrapeCo", "Hybrid", "Part-time", "$40-55/hr", "2025-01-13"],
      ["Backend Developer", "StartupXYZ", "Remote", "Full-time", "$90-120k", "2025-01-13"],
      ["Data Engineer", "BigData Corp", "On-site", "Full-time", "$95-130k", "2025-01-12"],
      ["DevOps Engineer", "CloudSys", "Remote", "Contract", "$60-80/hr", "2025-01-12"],
      ["API Integration Dev", "IntegrateMe", "Remote", "Full-time", "$75-95k", "2025-01-11"],
      ["ML Engineer", "AIVenture", "Hybrid", "Full-time", "$110-150k", "2025-01-11"],
      ["React Developer", "WebAgency", "Remote", "Contract", "$45-65/hr", "2025-01-10"],
      ["Bot Developer", "AutoBot Ltd", "Remote", "Part-time", "$35-50/hr", "2025-01-10"],
    ],
  },
};

const LOG_STEPS: Record<DataSource, string[]> = {
  products: [
    "🔐 Authenticating with Google OAuth2...",
    "✅ Access granted. Scopes: spreadsheets, drive.file",
    "🌐 Connecting to books.toscrape.com...",
    "📦 Fetching product data — page 1/2...",
    "📦 Fetching product data — page 2/2...",
    "📊 Parsed 12 products successfully",
    "📋 Opening spreadsheet: 'Product Inventory'...",
    "🗑️  Clearing existing rows (A2:F50)...",
    "✏️  Writing header row...",
    "📝 Writing rows 1–6...",
    "📝 Writing rows 7–12...",
    "✅ 12 rows written in 2.3s",
    "📧 Notification sent to admin@example.com",
  ],
  crypto: [
    "🔐 Authenticating with Google OAuth2...",
    "✅ Access granted. Scopes: spreadsheets",
    "🌐 Connecting to CoinGecko API...",
    "💱 Fetching prices for 10 coins...",
    "📊 Parsed price data with market stats",
    "📋 Opening spreadsheet: 'Crypto Dashboard'...",
    "🗑️  Clearing old data (A2:F20)...",
    "✏️  Writing header row...",
    "📝 Writing rows 1–5...",
    "📝 Writing rows 6–10...",
    "✅ 10 rows written in 1.8s",
    "🔄 Next auto-sync in 5 minutes",
  ],
  jobs: [
    "🔐 Authenticating with Google OAuth2...",
    "✅ Access granted. Scopes: spreadsheets, drive.file",
    "🔍 Connecting to job board APIs...",
    "📋 Scraping LinkedIn feed (5 results)...",
    "📋 Scraping Indeed feed (3 results)...",
    "📋 Scraping Upwork feed (2 results)...",
    "📊 Parsed 10 job listings, 0 duplicates",
    "📋 Opening spreadsheet: 'Job Pipeline'...",
    "✏️  Writing header row...",
    "📝 Writing rows 1–5...",
    "📝 Writing rows 6–10...",
    "✅ 10 rows written in 2.1s",
    "🤖 Telegram alert sent: 2 new Remote jobs found",
  ],
};

const PYTHON_CODE = `import gspread
from google.oauth2.service_account import Credentials
import requests, time

SCOPES = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]

def sync_to_sheets(sheet_name: str, data: list[dict]):
    creds = Credentials.from_service_account_file(
        "service_account.json", scopes=SCOPES
    )
    client = gspread.authorize(creds)
    sheet = client.open(sheet_name).sheet1

    # Clear old data, keep header
    sheet.clear()
    headers = list(data[0].keys())
    sheet.append_row(headers)

    rows = [list(row.values()) for row in data]
    sheet.append_rows(rows, value_input_option="USER_ENTERED")
    print(f"✅ {len(rows)} rows synced to '{sheet_name}'")

# Schedule: run every 6 hours
while True:
    products = fetch_product_data()
    sync_to_sheets("Product Inventory", products)
    time.sleep(6 * 3600)`;

export default function GoogleSheetsPage() {
  const [source, setSource] = useState<DataSource>("products");
  const [sheetName, setSheetName] = useState("Product Inventory");
  const [interval, setIntervalVal] = useState("6h");
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ rowsWritten: 0, cellsUpdated: 0, syncSpeed: "—", lastSync: "Never" });
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const clearTimeouts = () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };

  const handleSync = useCallback(() => {
    if (syncing) return;
    clearTimeouts();
    setSyncing(true);
    setSynced(false);
    setLogs([]);
    setRows([]);
    setStats({ rowsWritten: 0, cellsUpdated: 0, syncSpeed: "—", lastSync: "Never" });

    const src = SOURCES[source];
    const logSteps = LOG_STEPS[source];
    const totalRows = src.rows.length;
    const startTime = Date.now();

    // Animate logs
    logSteps.forEach((log, i) => {
      const t = setTimeout(() => {
        setLogs(prev => [...prev, log]);
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
      }, i * 320);
      timeoutsRef.current.push(t);
    });

    // Animate rows appearing one by one (starts after auth logs)
    src.rows.forEach((rowData, ri) => {
      const delay = 1600 + ri * 140;
      const t = setTimeout(() => {
        const newRow: SheetRow = {
          id: ri + 1,
          col1: rowData[0],
          col2: rowData[1],
          col3: rowData[2],
          col4: rowData[3],
          col5: rowData[4],
          col6: rowData[5],
          status: "writing",
        };
        setRows(prev => [...prev, newRow]);
        setStats(prev => ({
          ...prev,
          rowsWritten: ri + 1,
          cellsUpdated: (ri + 1) * 6,
          syncSpeed: ((ri + 1) / ((Date.now() - startTime) / 1000)).toFixed(1),
        }));

        // Transition writing → done after 300ms
        const t2 = setTimeout(() => {
          setRows(prev => prev.map(r => r.id === ri + 1 ? { ...r, status: "done" } : r));
        }, 300);
        timeoutsRef.current.push(t2);
      }, delay);
      timeoutsRef.current.push(t);
    });

    // Finish
    const finishDelay = 1600 + totalRows * 140 + 400;
    const t = setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      setStats(prev => ({
        ...prev,
        syncSpeed: (totalRows / ((Date.now() - startTime) / 1000)).toFixed(1),
        lastSync: new Date().toLocaleTimeString(),
      }));
    }, finishDelay);
    timeoutsRef.current.push(t);
  }, [source, syncing]);

  const handleSourceChange = (s: DataSource) => {
    if (syncing) return;
    setSource(s);
    setRows([]);
    setLogs([]);
    setSynced(false);
    setStats({ rowsWritten: 0, cellsUpdated: 0, syncSpeed: "—", lastSync: "Never" });
    const names: Record<DataSource, string> = { products: "Product Inventory", crypto: "Crypto Dashboard", jobs: "Job Pipeline" };
    setSheetName(names[s]);
  };

  const src = SOURCES[source];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-mono text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
            ← chi.dev
          </Link>
          <span className="text-sm text-zinc-400 hidden sm:block">Google Sheets Auto-Sync Demo</span>
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
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xl">📊</div>
            <div>
              <h1 className="text-2xl font-bold">Google Sheets Auto-Sync</h1>
              <p className="text-sm text-zinc-500">Scraper / bot chạy xong → data tự vào Sheets, không cần copy-paste</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Python", "Google Sheets API", "gspread", "OAuth2", "google-auth"].map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{tag}</span>
            ))}
          </div>
        </div>

        {/* Config + Stats bar */}
        <div className="grid md:grid-cols-3 gap-4 mb-5">
          {/* Config */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 font-medium">Configuration</p>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Data Source</label>
                <select
                  value={source}
                  onChange={e => handleSourceChange(e.target.value as DataSource)}
                  disabled={syncing}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  <option value="products">E-commerce Products</option>
                  <option value="crypto">Crypto Prices</option>
                  <option value="jobs">Job Listings</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Sheet Name</label>
                <input
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                  disabled={syncing}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Auto-Sync Interval</label>
                <select
                  value={interval}
                  onChange={e => setIntervalVal(e.target.value)}
                  disabled={syncing}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  <option value="1h">Every 1 hour</option>
                  <option value="6h">Every 6 hours</option>
                  <option value="12h">Every 12 hours</option>
                  <option value="24h">Every 24 hours</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                syncing
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-400 text-zinc-950"
              }`}
            >
              {syncing ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  Syncing...
                </span>
              ) : (
                "▶ Sync Now"
              )}
            </button>
            {synced && (
              <span className="ml-3 text-sm text-green-400 font-medium animate-pulse">
                ✓ {src.rows.length} rows synced in {(src.rows.length * 0.14 + 1.8).toFixed(1)}s
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 font-medium">Live Stats</p>
            <div className="space-y-3">
              {[
                { label: "Rows Written", value: stats.rowsWritten.toString(), color: "text-green-400" },
                { label: "Cells Updated", value: stats.cellsUpdated.toString(), color: "text-cyan-400" },
                { label: "Sync Speed", value: stats.syncSpeed === "—" ? "—" : `${stats.syncSpeed} rows/s`, color: "text-yellow-400" },
                { label: "Last Sync", value: stats.lastSync, color: "text-zinc-300" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{s.label}</span>
                  <span className={`text-sm font-mono font-semibold ${s.color}`}>{s.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                <span className="text-xs text-zinc-500">Connection</span>
                <span className={`text-xs font-medium flex items-center gap-1.5 ${synced || syncing ? "text-green-400" : "text-zinc-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${synced || syncing ? "bg-green-400 animate-pulse" : "bg-zinc-600"}`} />
                  {synced || syncing ? "Connected" : "Idle"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spreadsheet mock */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-5">
          {/* Sheet tab bar */}
          <div className="flex items-center gap-0 px-3 pt-2.5 bg-zinc-950/50 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-700 border-b-0 rounded-t-md -mb-px text-xs text-zinc-200">
              <span className="text-green-400">📋</span>
              {sheetName}
            </div>
          </div>

          {/* Formula bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 bg-zinc-950/30">
            <span className="text-xs text-zinc-600 font-mono w-8">A1</span>
            <div className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-400 font-mono">
              {src.headers[0]}
            </div>
          </div>

          <div className="overflow-auto max-h-80">
            <table className="w-full text-xs border-collapse min-w-[600px]">
              {/* Column letters */}
              <thead>
                <tr className="bg-zinc-800/80">
                  <th className="w-8 text-center py-1 text-zinc-600 border-r border-zinc-700 font-normal">#</th>
                  {["A", "B", "C", "D", "E", "F"].map(col => (
                    <th key={col} className="py-1 px-2 text-center text-zinc-500 border-r border-zinc-700 font-normal min-w-[100px]">{col}</th>
                  ))}
                </tr>
                {/* Header row */}
                <tr className="bg-green-900/20 border-b border-zinc-700">
                  <td className="w-8 text-center py-1.5 text-zinc-600 border-r border-zinc-700 font-mono">1</td>
                  {src.headers.map((h, i) => (
                    <td key={i} className="py-1.5 px-2 text-zinc-200 border-r border-zinc-700 font-semibold">{h}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    key={row.id}
                    className={`border-b border-zinc-800/60 transition-all duration-300 ${
                      row.status === "writing" ? "bg-cyan-500/10" : row.id % 2 === 0 ? "bg-zinc-800/20" : ""
                    }`}
                  >
                    <td className="w-8 text-center py-1.5 text-zinc-600 border-r border-zinc-700 font-mono">{row.id + 1}</td>
                    {[row.col1, row.col2, row.col3, row.col4, row.col5, row.col6].map((val, i) => (
                      <td key={i} className={`py-1.5 px-2 border-r border-zinc-700 transition-colors ${row.status === "writing" ? "text-cyan-300" : "text-zinc-300"}`}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-600 text-sm">
                      {syncing ? "Writing data..." : "Click \"Sync Now\" to populate the sheet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Log terminal + Code */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* Log terminal */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-zinc-500 ml-1 font-mono">sync.py — output</span>
            </div>
            <div ref={logRef} className="p-4 font-mono text-xs h-52 overflow-y-auto space-y-1.5">
              {logs.length === 0 ? (
                <p className="text-zinc-600">$ python sync.py --sheet &quot;{sheetName}&quot;</p>
              ) : (
                <>
                  <p className="text-zinc-600">$ python sync.py --sheet &quot;{sheetName}&quot;</p>
                  {logs.map((log, i) => (
                    <p key={i} className={log.startsWith("✅") ? "text-green-400" : log.startsWith("❌") ? "text-red-400" : "text-zinc-300"}>
                      {log}
                    </p>
                  ))}
                  {syncing && <p className="text-zinc-500 animate-pulse">▊</p>}
                </>
              )}
            </div>
          </div>

          {/* Python code */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-zinc-500 ml-1 font-mono">sync_sheets.py</span>
            </div>
            <pre className="p-4 font-mono text-xs text-zinc-300 h-52 overflow-auto leading-relaxed">
              <code>{PYTHON_CODE}</code>
            </pre>
          </div>
        </div>

        {/* Result + FAQ */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <p className="text-xs text-green-400 font-medium uppercase tracking-wider mb-2">Kết quả thực tế</p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Client tiết kiệm <strong className="text-green-400">3–5 giờ/ngày</strong> copy-paste thủ công. Script chạy trên server, tự động sync mỗi 6 giờ, gửi email thông báo khi có lỗi.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Câu hỏi thường gặp</p>
            <div className="space-y-2 text-sm">
              {[
                ["Hỗ trợ nhiều sheet không?", "Có — mỗi nguồn data map tới 1 tab riêng trong cùng workbook."],
                ["Có cần chia sẻ Sheet không?", "Không cần public — chỉ share với service account email."],
                ["Xử lý rate limit?", "gspread tự retry, thêm exponential backoff nếu cần."],
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
    </main>
  );
}
