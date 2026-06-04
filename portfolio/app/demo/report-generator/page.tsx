"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

const UPWORK_URL = "https://www.upwork.com/freelancers/~012e9e4cf475446b7e";

const STEPS = [
  { id: 1, label: "Collecting Data", icon: "🌐", desc: "Fetching from APIs & scrapers" },
  { id: 2, label: "Aggregating", icon: "⚙️", desc: "Cleaning & merging datasets" },
  { id: 3, label: "Building Charts", icon: "📈", desc: "Generating visualizations" },
  { id: 4, label: "Formatting", icon: "🎨", desc: "Applying report template" },
  { id: 5, label: "Report Ready", icon: "✅", desc: "PDF & HTML ready to deliver" },
];

const BAR_DATA = [
  { label: "Fiction", value: 34, color: "#22d3ee" },
  { label: "Mystery", value: 28, color: "#34d399" },
  { label: "Poetry", value: 18, color: "#a78bfa" },
  { label: "History", value: 12, color: "#fbbf24" },
  { label: "Sports", value: 8, color: "#f87171" },
];

const LINE_DATA = [42, 47, 44, 51, 55, 49, 58];
const LINE_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TOP_PRODUCTS = [
  { rank: 1, name: "Sapiens: A Brief History", cat: "History", price: "$54.23", stock: "In Stock", rating: "★★★★★" },
  { rank: 2, name: "Sharp Objects", cat: "Mystery", price: "$47.82", stock: "In Stock", rating: "★★★★" },
  { rank: 3, name: "A Light in the Attic", cat: "Poetry", price: "$51.77", stock: "In Stock", rating: "★★★" },
  { rank: 4, name: "Tipping the Velvet", cat: "Historical", price: "$53.74", stock: "In Stock", rating: "★" },
  { rank: 5, name: "The Boys in the Boat", cat: "Sports", price: "$22.60", stock: "In Stock", rating: "★★★★" },
];

const PYTHON_CODE = `import pandas as pd
from jinja2 import Environment, FileSystemLoader
import smtplib, schedule, time
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

def generate_report(data: pd.DataFrame) -> str:
    env = Environment(loader=FileSystemLoader("templates/"))
    template = env.get_template("report.html")

    stats = {
        "total": len(data),
        "avg_price": data["price"].mean(),
        "in_stock_pct": (data["stock"] == "In Stock").mean() * 100,
        "top_category": data["category"].mode()[0],
    }
    html = template.render(stats=stats, products=data.to_dict("records"))
    return html

def send_report(html: str, recipients: list[str]):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Daily Report — {pd.Timestamp.now():%Y-%m-%d}"
    msg["From"] = "bot@example.com"
    msg["To"] = ", ".join(recipients)
    msg.attach(MIMEBase("text", "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login("bot@example.com", SMTP_PASSWORD)
        smtp.sendmail("bot@example.com", recipients, msg.as_string())

# Schedule: every day at 08:00
schedule.every().day.at("08:00").do(
    lambda: send_report(generate_report(fetch_data()), RECIPIENTS)
)
while True:
    schedule.run_pending()
    time.sleep(60)`;

function BarChart({ animate }: { animate: boolean }) {
  const max = Math.max(...BAR_DATA.map(d => d.value));
  return (
    <div className="space-y-2">
      {BAR_DATA.map((d, i) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 w-14 text-right">{d.label}</span>
          <div className="flex-1 bg-zinc-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: animate ? `${(d.value / max) * 100}%` : "0%",
                backgroundColor: d.color,
                transitionDelay: `${i * 120}ms`,
              }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-400 w-6">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ animate }: { animate: boolean }) {
  const min = Math.min(...LINE_DATA);
  const max = Math.max(...LINE_DATA);
  const range = max - min || 1;
  const w = 300;
  const h = 80;
  const pad = 8;

  const points = LINE_DATA.map((v, i) => ({
    x: pad + (i / (LINE_DATA.length - 1)) * (w - pad * 2),
    y: h - pad - ((v - min) / range) * (h - pad * 2),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const pathLen = 400;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d={`${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`}
        fill="url(#lineGrad)"
        opacity={animate ? 1 : 0}
        className="transition-opacity duration-700"
        style={{ transitionDelay: "400ms" }}
      />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="#22d3ee"
        strokeWidth="2"
        strokeDasharray={pathLen}
        strokeDashoffset={animate ? 0 : pathLen}
        className="transition-all duration-1000"
        style={{ transitionDelay: "200ms" }}
      />
      {/* Dots */}
      {animate && points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#22d3ee" opacity={animate ? 1 : 0}
          className="transition-opacity duration-300" style={{ transitionDelay: `${600 + i * 80}ms` }} />
      ))}
      {/* Labels */}
      {LINE_LABELS.map((label, i) => (
        <text key={label} x={points[i].x} y={h - 1} textAnchor="middle" fontSize="7" fill="#71717a">{label}</text>
      ))}
    </svg>
  );
}

export default function ReportGeneratorPage() {
  const [sources, setSources] = useState<string[]>(["products"]);
  const [dateRange, setDateRange] = useState("7d");
  const [format, setFormat] = useState("html");
  const [email, setEmail] = useState("admin@example.com");
  const [schedule, setScheduleVal] = useState("daily");
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [chartsAnimated, setChartsAnimated] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };

  const toggleSource = (s: string) => {
    if (generating) return;
    setSources(prev => prev.includes(s) ? (prev.length > 1 ? prev.filter(x => x !== s) : prev) : [...prev, s]);
  };

  const handleGenerate = useCallback(() => {
    if (generating) return;
    clearTimeouts();
    setGenerating(true);
    setCurrentStep(0);
    setShowReport(false);
    setChartsAnimated(false);

    STEPS.forEach((_, i) => {
      const t = setTimeout(() => setCurrentStep(i + 1), (i + 1) * 700);
      timeoutsRef.current.push(t);
    });

    const t = setTimeout(() => {
      setGenerating(false);
      setShowReport(true);
      setTimeout(() => setChartsAnimated(true), 200);
    }, STEPS.length * 700 + 300);
    timeoutsRef.current.push(t);
  }, [generating]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-mono text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
            ← chi.dev
          </Link>
          <span className="text-sm text-zinc-400 hidden sm:block">Automated Report Generator Demo</span>
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
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl">📄</div>
            <div>
              <h1 className="text-2xl font-bold">Automated Report Generator</h1>
              <p className="text-sm text-zinc-500">Tổng hợp data từ nhiều nguồn → báo cáo đẹp gửi email lúc 8h sáng</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Python", "Pandas", "Jinja2", "SMTP", "schedule", "Matplotlib"].map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{tag}</span>
            ))}
          </div>
        </div>

        {/* Config bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 font-medium">Report Configuration</p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Data Sources</label>
              <div className="flex gap-2">
                {[
                  { id: "products", label: "Products" },
                  { id: "crypto", label: "Crypto" },
                  { id: "jobs", label: "Jobs" },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleSource(s.id)}
                    disabled={generating}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      sources.includes(s.id)
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                    }`}
                  >
                    {sources.includes(s.id) ? "✓ " : ""}{s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Date Range</label>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} disabled={generating}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50">
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} disabled={generating}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50">
                <option value="html">HTML Email</option>
                <option value="pdf">PDF File</option>
                <option value="both">Both</option>
              </select>
            </div>
            <button onClick={handleGenerate} disabled={generating}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                generating ? "bg-zinc-700 text-zinc-400 cursor-not-allowed" : "bg-purple-500 hover:bg-purple-400 text-white"
              }`}>
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : "⚡ Generate Report"}
            </button>
          </div>
        </div>

        {/* Progress steps */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between relative">
            {/* connector line */}
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-zinc-800 mx-8" />
            <div
              className="absolute left-0 top-5 h-0.5 bg-cyan-500 transition-all duration-700 ml-8"
              style={{ width: currentStep === 0 ? "0%" : `${Math.min(((currentStep - 1) / (STEPS.length - 1)) * 100, 100)}%`, right: "unset", maxWidth: "calc(100% - 64px)" }}
            />
            {STEPS.map(step => (
              <div key={step.id} className="flex flex-col items-center z-10 flex-1">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm transition-all duration-300 ${
                  currentStep > step.id ? "bg-cyan-500 border-cyan-500 text-zinc-950" :
                  currentStep === step.id ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 animate-pulse" :
                  "bg-zinc-900 border-zinc-700 text-zinc-600"
                }`}>
                  {currentStep > step.id ? "✓" : step.icon}
                </div>
                <p className={`text-xs mt-2 text-center font-medium transition-colors ${currentStep >= step.id ? "text-zinc-200" : "text-zinc-600"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-zinc-600 text-center hidden sm:block mt-0.5">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Report Preview */}
        {showReport && (
          <div className="bg-white rounded-xl overflow-hidden mb-5 shadow-2xl border border-zinc-700">
            {/* Report header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">Automated Daily Report</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Generated at 08:00 AM · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-300 text-xs">Sources: {sources.join(", ")}</p>
                <p className="text-slate-400 text-xs">Range: Last {dateRange === "1d" ? "24h" : dateRange === "7d" ? "7 days" : "30 days"}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50">
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Total Products", value: "1,000", sub: "50 pages scraped", color: "text-blue-600" },
                  { label: "Avg Price", value: "$35.40", sub: "↑ 2.3% vs last week", color: "text-green-600" },
                  { label: "In Stock", value: "84.2%", sub: "158 out of stock", color: "text-purple-600" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Products by Category</h3>
                  <BarChart animate={chartsAnimated} />
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Daily Scrape Volume (7 days)</h3>
                  <LineChart animate={chartsAnimated} />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">Min: 42</span>
                    <span className="text-xs text-slate-400">Max: 58 products/run</span>
                  </div>
                </div>
              </div>

              {/* Top products table */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">Top Products by Price</h3>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["#", "Product", "Category", "Price", "Stock", "Rating"].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-slate-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_PRODUCTS.map((p, i) => (
                      <tr key={p.rank} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-2 text-slate-400">{p.rank}</td>
                        <td className="px-3 py-2 text-slate-700 font-medium max-w-[180px] truncate">{p.name}</td>
                        <td className="px-3 py-2 text-slate-500">{p.cat}</td>
                        <td className="px-3 py-2 text-blue-600 font-semibold">{p.price}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">{p.stock}</span>
                        </td>
                        <td className="px-3 py-2 text-yellow-500">{p.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-400 text-center mt-4">
                🤖 Generated automatically by chi.dev automation script · Next report in{" "}
                {schedule === "daily" ? "24 hours" : schedule === "weekly" ? "7 days" : "30 days"}
              </p>
            </div>
          </div>
        )}

        {/* Actions + Delivery */}
        {showReport && (
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 font-medium">Download & Send</p>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all">
                  ↓ Download PDF
                </button>
                <button className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all">
                  ✉ Send HTML
                </button>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 font-medium">Schedule Delivery</p>
              <div className="flex gap-2">
                <input value={email} onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500" />
                <select value={schedule} onChange={e => setScheduleVal(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500">
                  <option value="daily">Daily 8 AM</option>
                  <option value="weekly">Weekly Mon</option>
                  <option value="monthly">Monthly 1st</option>
                </select>
                <button onClick={() => setScheduled(true)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${scheduled ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"}`}>
                  {scheduled ? "✓ Set" : "Set"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Code + FAQ */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-zinc-500 ml-1 font-mono">report_generator.py</span>
            </div>
            <pre className="p-4 font-mono text-xs text-zinc-300 h-64 overflow-auto leading-relaxed">
              <code>{PYTHON_CODE}</code>
            </pre>
          </div>
          <div className="space-y-4">
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
              <p className="text-xs text-purple-400 font-medium uppercase tracking-wider mb-2">Kết quả thực tế</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Thay thế hoàn toàn việc tổng hợp báo cáo thủ công. Client nhận email lúc <strong className="text-purple-400">8h sáng mỗi ngày</strong>, đúng format, có chart, không cần đợi nhân viên.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Câu hỏi thường gặp</p>
              <div className="space-y-2.5 text-sm">
                {[
                  ["Hỗ trợ nhiều format không?", "Có — HTML email, PDF (WeasyPrint/wkhtmltopdf), Excel (openpyxl)."],
                  ["Chart library nào?", "Matplotlib (static), Plotly (interactive HTML), hoặc Chart.js nếu cần web."],
                  ["Gửi nhiều recipient?", "Có — danh sách email, CC/BCC đều hỗ trợ qua smtplib."],
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
