'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const STEPS = [
  { id: 0, label: 'Open target page', detail: 'Navigating to vendor portal...', field: null },
  { id: 1, label: 'Fill Company Name', detail: 'Typing "Acme Corporation"', field: 'company' },
  { id: 2, label: 'Fill Email', detail: 'Typing "orders@acme.com"', field: 'email' },
  { id: 3, label: 'Select Category', detail: 'Selecting "Enterprise"', field: 'category' },
  { id: 4, label: 'Extract Order ID', detail: 'Scraping order confirmation...', field: 'result' },
  { id: 5, label: 'Done — data saved', detail: 'Saved to spreadsheet ✓', field: null },
];

const MANIFEST = `{
  "manifest_version": 3,
  "name": "Task Automator",
  "version": "1.0",
  "description": "Automates repetitive form workflows",
  "permissions": ["activeTab", "storage", "scripting"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}`;

const CONTENT_JS = `// content.js — injected into every page
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.action !== "autoFill") return;

  // Fill form fields
  const fill = (selector, value) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  fill("#company-name", msg.data.company);
  fill("#email",        msg.data.email);

  const select = document.querySelector("#category");
  if (select) select.value = msg.data.category;

  // Extract result after submit
  document.querySelector("#submit-btn")?.click();
  setTimeout(() => {
    const orderId = document.querySelector("#order-id")?.textContent;
    sendResponse({ orderId });
  }, 500);

  return true; // keep channel open for async response
});`;

export default function ChromeExtensionDemo() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [showCode, setShowCode] = useState<'manifest' | 'content' | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const formValues: Record<string, string> = {
    company: step >= 1 ? 'Acme Corporation' : '',
    email: step >= 2 ? 'orders@acme.com' : '',
    category: step >= 3 ? 'Enterprise' : '',
    result: step >= 4 ? 'ORD-2024-88712' : '',
  };

  function clearTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  function runExtension() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setStep(0);
    clearTimeouts();

    STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setStep(i);
        if (i === STEPS.length - 1) {
          setTimeout(() => { setDone(true); setRunning(false); }, 600);
        }
      }, i * 1100);
      timeoutsRef.current.push(t);
    });
  }

  function reset() {
    clearTimeouts();
    setRunning(false);
    setStep(-1);
    setDone(false);
  }

  const elapsed = done ? ((STEPS.length - 1) * 1.1).toFixed(1) : null;

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
            <span className="text-2xl">🧩</span>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded">LIVE DEMO</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Chrome Extension — Task Automator</h1>
          <p className="text-zinc-400">
            Watch the extension fill a multi-step vendor form automatically in seconds — no clicks, no copy-paste.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-6">
          {/* Steps sidebar */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Automation Steps</h2>
              {done && (
                <span className="text-xs text-green-400 font-mono">{elapsed}s</span>
              )}
            </div>
            <div className="space-y-2 mb-5">
              {STEPS.map((s, i) => (
                <div key={s.id} className={`flex items-start gap-2.5 transition-all ${
                  step === i ? 'opacity-100' : step > i ? 'opacity-60' : 'opacity-30'
                }`}>
                  <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-colors ${
                    step > i || (done && step === i)
                      ? 'bg-green-500 text-zinc-950'
                      : step === i
                      ? 'bg-cyan-500 text-zinc-950 animate-pulse'
                      : 'bg-zinc-700 text-zinc-500'
                  }`}>
                    {step > i || (done && step >= i) ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{s.label}</p>
                    {step === i && <p className="text-xs text-cyan-400">{s.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
            {!running && !done && (
              <button
                onClick={runExtension}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-lg transition-colors text-sm"
              >
                ▶ Run Extension
              </button>
            )}
            {running && (
              <button disabled className="w-full py-2.5 bg-zinc-800 text-zinc-500 rounded-lg text-sm cursor-not-allowed">
                Running...
              </button>
            )}
            {done && (
              <button
                onClick={reset}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm"
              >
                ↺ Run Again
              </button>
            )}
          </div>

          {/* Fake browser window */}
          <div className="md:col-span-3">
            <div className="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700">
              {/* Browser chrome */}
              <div className="bg-zinc-700 px-3 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 bg-zinc-600 rounded px-3 py-0.5 text-xs text-zinc-400 font-mono">
                  vendor-portal.example.com/orders/new
                </div>
                {/* Extension icon */}
                <div className={`w-5 h-5 rounded bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-xs transition-all ${
                  running ? 'animate-pulse border-cyan-400 bg-cyan-500/40' : done ? 'bg-green-500/30 border-green-500/50' : ''
                }`}>
                  🧩
                </div>
              </div>

              {/* Page content */}
              <div className="bg-white p-5 min-h-[280px]">
                <h3 className="text-zinc-800 font-semibold text-sm mb-4">New Vendor Order Form</h3>
                <div className="space-y-3">
                  {/* Company field */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Company Name *</label>
                    <div className={`border rounded px-3 py-2 text-sm transition-all ${
                      step === 1 ? 'border-cyan-400 bg-cyan-50 ring-1 ring-cyan-300' : 'border-zinc-300 bg-white'
                    }`}>
                      <span className={formValues.company ? 'text-zinc-800' : 'text-zinc-400'}>
                        {formValues.company || 'Enter company name'}
                      </span>
                      {step === 1 && <span className="animate-pulse text-cyan-500">|</span>}
                    </div>
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Contact Email *</label>
                    <div className={`border rounded px-3 py-2 text-sm transition-all ${
                      step === 2 ? 'border-cyan-400 bg-cyan-50 ring-1 ring-cyan-300' : 'border-zinc-300 bg-white'
                    }`}>
                      <span className={formValues.email ? 'text-zinc-800' : 'text-zinc-400'}>
                        {formValues.email || 'Enter email address'}
                      </span>
                      {step === 2 && <span className="animate-pulse text-cyan-500">|</span>}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Account Category</label>
                    <div className={`border rounded px-3 py-2 text-sm transition-all ${
                      step === 3 ? 'border-cyan-400 bg-cyan-50 ring-1 ring-cyan-300' : 'border-zinc-300 bg-white'
                    }`}>
                      <span className={formValues.category ? 'text-zinc-800' : 'text-zinc-400'}>
                        {formValues.category || 'Select category'}
                      </span>
                    </div>
                  </div>

                  {/* Result */}
                  {step >= 4 && (
                    <div className={`border rounded px-3 py-3 text-sm transition-all ${
                      step === 4
                        ? 'border-yellow-400 bg-yellow-50 animate-pulse'
                        : 'border-green-400 bg-green-50'
                    }`}>
                      <p className="text-xs text-zinc-500 mb-0.5">Order Confirmation</p>
                      <p className={`font-mono font-bold ${step === 4 ? 'text-yellow-700' : 'text-green-700'}`}>
                        {formValues.result}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Before/after stat */}
            {done && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500">Manual time</p>
                  <p className="text-lg font-bold text-red-400">~2h</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500">With extension</p>
                  <p className="text-lg font-bold text-green-400">{elapsed}s</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code snippets */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex border-b border-zinc-800">
            {(['manifest', 'content'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setShowCode(showCode === tab ? null : tab)}
                className={`px-5 py-3 text-sm transition-colors ${
                  showCode === tab ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'manifest' ? 'manifest.json' : 'content.js'}
              </button>
            ))}
          </div>
          {showCode && (
            <pre className="px-6 py-5 text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed">
              <code>{showCode === 'manifest' ? MANIFEST : CONTENT_JS}</code>
            </pre>
          )}
          {!showCode && (
            <p className="px-6 py-4 text-xs text-zinc-600">Click a tab above to view the source code</p>
          )}
        </div>
      </div>
    </div>
  );
}
