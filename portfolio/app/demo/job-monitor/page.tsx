'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MOCK_JOBS, type Job } from './mockJobs';

const SOURCES = ['LinkedIn', 'Indeed', 'Upwork'] as const;

const SOURCE_COLORS: Record<string, string> = {
  LinkedIn: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  Indeed: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  Upwork: 'text-green-400 bg-green-400/10 border-green-400/30',
};

const CODE_SNIPPET = `import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from telegram import Bot

def scan_jobs(keywords: list[str]) -> list[dict]:
    driver = webdriver.Chrome()
    driver.get("https://www.linkedin.com/jobs/search/?keywords=" + "+".join(keywords))
    time.sleep(2)

    jobs = []
    cards = driver.find_elements(By.CLASS_NAME, "job-card-container")
    for card in cards:
        jobs.append({
            "title": card.find_element(By.CLASS_NAME, "job-card-list__title").text,
            "company": card.find_element(By.CLASS_NAME, "job-card-container__company-name").text,
            "url": card.find_element(By.TAG_NAME, "a").get_attribute("href"),
        })
    driver.quit()
    return jobs

async def notify_new_jobs(jobs: list[dict]):
    bot = Bot(token="YOUR_BOT_TOKEN")
    for job in jobs:
        msg = f"🆕 New Job Alert!\\n{job['title']} @ {job['company']}\\n{job['url']}"
        await bot.send_message(chat_id="YOUR_CHAT_ID", text=msg)

# Run every 30 minutes
while True:
    new_jobs = scan_jobs(["python automation", "web scraping"])
    await notify_new_jobs(new_jobs)
    time.sleep(1800)`;

export default function JobMonitorDemo() {
  const [keywords, setKeywords] = useState('python automation');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(-1);
  const [results, setResults] = useState<Job[]>([]);
  const [notifiedJob, setNotifiedJob] = useState<Job | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  function clearTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  function runScan() {
    if (scanning) return;
    setScanning(true);
    setScanStep(0);
    setResults([]);
    setNotifiedJob(null);
    setHasScanned(false);
    clearTimeouts();

    // Step through each source with delay
    SOURCES.forEach((_, i) => {
      const t = setTimeout(() => setScanStep(i + 1), (i + 1) * 1200);
      timeoutsRef.current.push(t);
    });

    const done = setTimeout(() => {
      const kw = keywords.toLowerCase().split(/\s+/);
      const matched = MOCK_JOBS.filter(job =>
        kw.some(k =>
          job.title.toLowerCase().includes(k) ||
          job.tags.some(tag => tag.toLowerCase().includes(k))
        )
      );
      setResults(matched.length ? matched : MOCK_JOBS.slice(0, 6));
      setScanning(false);
      setScanStep(-1);
      setHasScanned(true);
    }, SOURCES.length * 1200 + 400);

    timeoutsRef.current.push(done);
  }

  function notifyJob(job: Job) {
    setNotifiedJob(job);
    setTimeout(() => setNotifiedJob(null), 4000);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-zinc-400 hover:text-cyan-400 text-sm transition-colors">
            ← Back to Portfolio
          </Link>
          <a
            href="https://www.upwork.com/freelancers/~012e9e4cf475446b7e"
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
            <span className="text-2xl">🔍</span>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded">LIVE DEMO</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Job Board Auto-Monitor</h1>
          <p className="text-zinc-400">
            Enter keywords → the bot scans LinkedIn, Indeed, and Upwork simultaneously → get instant Telegram alerts for matching listings.
          </p>
        </div>

        {/* Search */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-400">Search Criteria</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              disabled={scanning}
              placeholder="python automation, web scraping, telegram bot..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              onKeyDown={e => e.key === 'Enter' && runScan()}
            />
            <button
              onClick={runScan}
              disabled={scanning}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>
        </div>

        {/* Scan progress */}
        {scanning && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Scanning job boards...</p>
            <div className="space-y-3">
              {SOURCES.map((source, i) => (
                <div key={source} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full transition-colors ${
                    scanStep > i ? 'bg-green-400' : scanStep === i ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-700'
                  }`} />
                  <span className={`text-sm transition-colors ${
                    scanStep > i ? 'text-green-400' : scanStep === i ? 'text-cyan-400' : 'text-zinc-600'
                  }`}>
                    {source}
                    {scanStep === i && <span className="ml-2 text-xs">scanning...</span>}
                    {scanStep > i && <span className="ml-2 text-xs text-zinc-500">✓ done</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {hasScanned && results.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-zinc-400 mb-3">
              Found <span className="text-white font-semibold">{results.length}</span> matching jobs
              {' '}— click <span className="text-cyan-400">Notify</span> to send a Telegram alert
            </p>
            <div className="space-y-3">
              {results.map(job => (
                <div key={job.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${SOURCE_COLORS[job.source]}`}>
                          {job.source}
                        </span>
                        <span className="text-xs text-zinc-600">{job.posted}</span>
                        <span className="text-xs text-zinc-500">{job.type}</span>
                      </div>
                      <h3 className="font-semibold text-sm text-white">{job.title}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{job.company} · {job.location}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.tags.map(tag => (
                          <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-sm font-mono text-green-400">{job.salary}</span>
                      <button
                        onClick={() => notifyJob(job)}
                        className="text-xs px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-colors"
                      >
                        Notify →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code snippet */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
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

      {/* Telegram notification popup */}
      {notifiedJob && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-zinc-900 border border-green-500/40 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-sm flex-shrink-0">
              🤖
            </div>
            <div>
              <p className="text-xs font-semibold text-cyan-400 mb-1">JobAlertBot · Telegram</p>
              <p className="text-green-400 text-xs font-semibold mb-0.5">🆕 New Job Alert!</p>
              <p className="text-sm text-zinc-200">{notifiedJob.title}</p>
              <p className="text-xs text-zinc-500">{notifiedJob.company} · {notifiedJob.salary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
