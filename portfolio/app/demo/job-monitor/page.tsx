'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_JOBS, type Job } from './mockJobs';

const SOURCES = ['LinkedIn', 'Indeed', 'Upwork'] as const;
type Source = typeof SOURCES[number];

const SOURCE_STYLE: Record<Source, { dot: string; badge: string }> = {
  LinkedIn: { dot: 'bg-blue-400', badge: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  Indeed:   { dot: 'bg-purple-400', badge: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  Upwork:   { dot: 'bg-green-400', badge: 'text-green-400 bg-green-400/10 border-green-400/30' },
};

interface TgMsg { id: number; text: string; time: string; type: 'bot' | 'system'; }

function TelegramWindow({ messages }: { messages: TgMsg[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700 flex flex-col" style={{ height: '320px', background: '#17212b' }}>
      <div className="px-4 py-2.5 flex items-center gap-3 border-b" style={{ background: '#17212b', borderColor: '#0d1621' }}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm flex-shrink-0">🔍</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">JobAlertBot</p>
          <p className="text-xs" style={{ color: '#6c7883' }}>bot</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: '#182533', color: '#6c7883' }}>
          {messages.filter(m => m.type === 'bot').length} msgs
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-xs mt-8" style={{ color: '#6c7883' }}>Run a scan to receive job alerts</div>
        )}
        {messages.map(msg =>
          msg.type === 'system' ? (
            <div key={msg.id} className="text-center">
              <span className="text-xs px-3 py-1 rounded-full" style={{ color: '#6c7883', background: '#182533' }}>{msg.text}</span>
            </div>
          ) : (
            <div key={msg.id} className="flex items-end gap-2 max-w-[90%]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs flex-shrink-0 mb-0.5">🔍</div>
              <div>
                <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-xs whitespace-pre-line leading-relaxed" style={{ background: '#182533', color: '#e8e8e8' }}>
                  {msg.text}
                </div>
                <span className="text-[10px] ml-1" style={{ color: '#6c7883' }}>{msg.time}</span>
              </div>
            </div>
          )
        )}
        <div ref={endRef} />
      </div>

      <div className="px-3 py-2 flex items-center gap-2 border-t" style={{ background: '#17212b', borderColor: '#0d1621' }}>
        <span className="text-lg" style={{ color: '#6c7883' }}>😊</span>
        <div className="flex-1 rounded-full px-4 py-1.5 text-xs" style={{ background: '#242f3d', color: '#6c7883' }}>Message</div>
        <span className="text-lg" style={{ color: '#6c7883' }}>🎤</span>
      </div>
    </div>
  );
}

function NextScanCountdown() {
  const [secs, setSecs] = useState(1800);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s <= 1 ? 1800 : s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return (
    <span className="font-mono text-cyan-400">{m}:{s}</span>
  );
}

export default function JobMonitorDemo() {
  const [keywords, setKeywords] = useState('python automation');
  const [jobType, setJobType] = useState<'all' | 'Remote' | 'Hybrid' | 'On-site'>('all');
  const [sourceFilter, setSourceFilter] = useState<Source | 'all'>('all');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(-1);
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Job[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [tgMsgs, setTgMsgs] = useState<TgMsg[]>([]);
  const [showCode, setShowCode] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const msgId = useRef(0);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  const addMsg = (text: string, type: TgMsg['type'] = 'bot') =>
    setTgMsgs(prev => [...prev, { id: ++msgId.current, text, type, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

  function clearTs() { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; }

  function runScan() {
    if (scanning) return;
    setScanning(true); setScanStep(0); setResults([]); setHasScanned(false); setSourceCounts({});
    clearTs();
    addMsg(`🔍 Scan started\nKeywords: "${keywords}"\nSources: LinkedIn · Indeed · Upwork`, 'system');

    SOURCES.forEach((_src, i) => {
      const t = setTimeout(() => setScanStep(i + 1), (i + 1) * 1300);
      timeoutsRef.current.push(t);
    });

    const done = setTimeout(() => {
      const kw = keywords.toLowerCase().split(/\s+/).filter(Boolean);
      let matched = MOCK_JOBS.filter(job => {
        const kwMatch = kw.length === 0 || kw.some(k =>
          job.title.toLowerCase().includes(k) || job.tags.some(t => t.toLowerCase().includes(k))
        );
        const typeMatch = jobType === 'all' || job.type === jobType;
        return kwMatch && typeMatch;
      });
      if (!matched.length) matched = MOCK_JOBS.slice(0, 8);

      const counts: Record<string, number> = {};
      matched.forEach(j => { counts[j.source] = (counts[j.source] ?? 0) + 1; });
      setSourceCounts(counts);
      setResults(matched);
      setScanning(false); setScanStep(-1); setHasScanned(true);
      setLastScan(new Date());
      addMsg(`✅ Scan complete!\nFound ${matched.length} matching jobs\n\nTop result: ${matched[0].title} @ ${matched[0].company} (${matched[0].salary})`);
    }, SOURCES.length * 1300 + 500);
    timeoutsRef.current.push(done);
  }

  function notifyJob(job: Job) {
    addMsg(`🆕 New Job Alert!\n\n${job.title}\n${job.company} · ${job.location}\n${job.salary}\n\nSource: ${job.source}`);
  }

  const displayed = useMemo(() => {
    if (sourceFilter === 'all') return results;
    return results.filter(j => j.source === sourceFilter);
  }, [results, sourceFilter]);

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
            <span className="text-2xl">🔍</span>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded">LIVE DEMO</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">Job Board Auto-Monitor</h1>
          <p className="text-zinc-400 text-sm">Scans LinkedIn · Indeed · Upwork simultaneously — sends Telegram alerts the moment matching jobs appear.</p>
        </div>

        {/* Search bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-zinc-500 mb-1.5">Keywords</label>
              <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} disabled={scanning}
                placeholder="python, selenium, telegram bot..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                onKeyDown={e => e.key === 'Enter' && runScan()} />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Job Type</label>
              <select value={jobType} onChange={e => setJobType(e.target.value as typeof jobType)} disabled={scanning}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50">
                <option value="all">All types</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
            <button onClick={runScan} disabled={scanning}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-lg transition-colors disabled:opacity-50">
              {scanning ? 'Scanning...' : '▶ Scan Now'}
            </button>
          </div>
        </div>

        {/* Scan progress */}
        {scanning && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Scanning job boards...</p>
            <div className="space-y-3">
              {SOURCES.map((src, i) => (
                <div key={src} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full transition-colors ${
                    scanStep > i ? SOURCE_STYLE[src].dot : scanStep === i ? `${SOURCE_STYLE[src].dot} animate-pulse` : 'bg-zinc-700'
                  }`} />
                  <span className={`text-sm flex-1 transition-colors ${
                    scanStep > i ? 'text-green-400' : scanStep === i ? 'text-white' : 'text-zinc-600'
                  }`}>
                    {src}
                    {scanStep === i && <span className="ml-2 text-xs text-zinc-500">crawling listings...</span>}
                    {scanStep > i && <span className="ml-2 text-xs text-zinc-500">✓ done</span>}
                  </span>
                  {scanStep > i && sourceCounts[src] !== undefined && (
                    <span className="text-xs font-mono text-zinc-400">{sourceCounts[src] ?? 0} found</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats row after scan */}
        {hasScanned && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">Jobs Found</p>
              <p className="font-mono font-bold text-xl text-white">{results.length}</p>
            </div>
            {SOURCES.map(src => (
              <div key={src} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">{src}</p>
                <p className={`font-mono font-bold text-xl ${SOURCE_STYLE[src].dot.replace('bg-', 'text-')}`}>
                  {sourceCounts[src] ?? 0}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Main grid */}
        <div className="grid md:grid-cols-5 gap-5">
          {/* Job list */}
          <div className="md:col-span-3">
            {hasScanned && (
              <>
                {/* Source filter tabs */}
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setSourceFilter('all')}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${sourceFilter === 'all' ? 'bg-zinc-700 border-zinc-500 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                    All ({results.length})
                  </button>
                  {SOURCES.map(src => (
                    <button key={src} onClick={() => setSourceFilter(src)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${sourceFilter === src ? `${SOURCE_STYLE[src].badge} border-current` : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                      {src} ({sourceCounts[src] ?? 0})
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {displayed.map(job => (
                    <div key={job.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${SOURCE_STYLE[job.source as Source]?.badge}`}>
                              {job.source}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${job.type === 'Remote' ? 'text-cyan-400 bg-cyan-400/10' : 'text-zinc-400 bg-zinc-800'}`}>
                              {job.type}
                            </span>
                            <span className="text-xs text-zinc-600">{job.posted}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-white">{job.title}</h3>
                          <p className="text-xs text-zinc-400">{job.company} · {job.location}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {job.tags.map(t => (
                              <span key={t} className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-sm font-mono text-green-400">{job.salary}</span>
                          <button onClick={() => notifyJob(job)}
                            className="text-xs px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-colors">
                            Notify via Telegram
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!hasScanned && !scanning && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <p className="text-zinc-600 text-sm">Enter keywords and click Scan to find matching jobs</p>
              </div>
            )}
          </div>

          {/* Right column: Telegram + schedule */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <TelegramWindow messages={tgMsgs} />

            {/* Schedule info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Monitor Schedule</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Scan interval</span>
                  <span className="text-zinc-300 font-mono">every 30 min</span>
                </div>
                {lastScan && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Last scan</span>
                    <span className="text-zinc-300">{lastScan.toLocaleTimeString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Next scan</span>
                  <NextScanCountdown />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Telegram alerts</span>
                  <span className="text-green-400">● Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code */}
        <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <button onClick={() => setShowCode(v => !v)}
            className="w-full px-6 py-4 flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            <span className="flex items-center gap-2"><span className="text-cyan-500">{'</>'}</span>Python implementation</span>
            <span>{showCode ? '▲' : '▼'}</span>
          </button>
          {showCode && (
            <pre className="px-6 pb-6 text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed"><code>{`import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from telegram import Bot

def scan_jobs(keywords: list[str]) -> list[dict]:
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    driver = webdriver.Chrome(options=options)
    driver.get("https://www.linkedin.com/jobs/search/?keywords=" + "+".join(keywords))
    time.sleep(2)

    jobs = []
    for card in driver.find_elements(By.CLASS_NAME, "job-card-container"):
        jobs.append({
            "title":   card.find_element(By.CLASS_NAME, "job-card-list__title").text,
            "company": card.find_element(By.CLASS_NAME, "job-card-container__company-name").text,
            "url":     card.find_element(By.TAG_NAME, "a").get_attribute("href"),
        })
    driver.quit()
    return jobs

async def notify(jobs: list[dict]):
    bot = Bot(token="YOUR_BOT_TOKEN")
    for job in jobs:
        await bot.send_message(
            chat_id="YOUR_CHAT_ID",
            text=f"🆕 {job['title']} @ {job['company']}\\n{job['url']}"
        )

# Run every 30 minutes
while True:
    new_jobs = scan_jobs(["python automation"])
    await notify(new_jobs)
    time.sleep(1800)`}</code></pre>
          )}
        </div>
      </div>
    </div>
  );
}
