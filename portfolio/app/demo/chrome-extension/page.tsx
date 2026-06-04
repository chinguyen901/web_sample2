'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

// --- Workflow definitions ---
const WORKFLOWS = [
  {
    id: 'vendor-form',
    label: 'Vendor Order Form',
    icon: '📋',
    manualMins: 120,
    steps: [
      { label: 'Navigate to portal', detail: 'Opening vendor-portal.example.com...', field: null },
      { label: 'Fill Company Name', detail: 'Typing "Acme Corporation"', field: 'company', value: 'Acme Corporation' },
      { label: 'Fill Contact Email', detail: 'Typing "orders@acme.com"', field: 'email', value: 'orders@acme.com' },
      { label: 'Select Category', detail: 'Selecting "Enterprise"', field: 'category', value: 'Enterprise' },
      { label: 'Set Order Quantity', detail: 'Entering "500"', field: 'qty', value: '500' },
      { label: 'Submit & Extract ID', detail: 'Clicking submit, scraping order ID...', field: 'result', value: 'ORD-2024-88712' },
      { label: 'Save to spreadsheet', detail: 'Writing row to Google Sheets ✓', field: null },
    ],
    extracted: [
      { key: 'Order ID', value: 'ORD-2024-88712' },
      { key: 'Company', value: 'Acme Corporation' },
      { key: 'Email', value: 'orders@acme.com' },
      { key: 'Category', value: 'Enterprise' },
      { key: 'Quantity', value: '500 units' },
      { key: 'Status', value: 'Confirmed' },
    ],
    formFields: [
      { id: 'company', label: 'Company Name *', placeholder: 'Enter company name' },
      { id: 'email', label: 'Contact Email *', placeholder: 'Enter email' },
      { id: 'category', label: 'Category', placeholder: 'Select category', type: 'select', options: ['', 'Starter', 'Business', 'Enterprise'] },
      { id: 'qty', label: 'Order Quantity', placeholder: '0' },
    ],
  },
  {
    id: 'price-scrape',
    label: 'Competitor Price Check',
    icon: '💰',
    manualMins: 90,
    steps: [
      { label: 'Open competitor site', detail: 'Navigating to shop.example.com...', field: null },
      { label: 'Search product', detail: 'Typing "wireless headphones" in search...', field: 'search', value: 'wireless headphones' },
      { label: 'Extract product name', detail: 'Reading h1 title...', field: 'product', value: 'ProSound ANC 500' },
      { label: 'Extract price', detail: 'Reading .price-current selector...', field: 'price', value: '$149.99' },
      { label: 'Extract stock status', detail: 'Reading availability badge...', field: 'stock', value: 'In Stock (23 left)' },
      { label: 'Log to dashboard', detail: 'Appending row to tracking sheet ✓', field: null },
    ],
    extracted: [
      { key: 'Product', value: 'ProSound ANC 500' },
      { key: 'Price', value: '$149.99' },
      { key: 'Stock', value: 'In Stock (23 left)' },
      { key: 'Rating', value: '4.7 ★ (1,204 reviews)' },
      { key: 'Scraped at', value: new Date().toLocaleTimeString() },
      { key: 'Site', value: 'shop.example.com' },
    ],
    formFields: [
      { id: 'search', label: 'Search Query', placeholder: '' },
      { id: 'product', label: 'Product Name', placeholder: '' },
      { id: 'price', label: 'Current Price', placeholder: '' },
      { id: 'stock', label: 'Stock Status', placeholder: '' },
    ],
  },
  {
    id: 'lead-capture',
    label: 'Lead Form Fill',
    icon: '📇',
    manualMins: 180,
    steps: [
      { label: 'Open CRM', detail: 'Navigating to crm.example.com/leads/new...', field: null },
      { label: 'Fill Full Name', detail: 'Typing "Sarah Johnson"', field: 'name', value: 'Sarah Johnson' },
      { label: 'Fill Company', detail: 'Typing "Growthly Inc."', field: 'company', value: 'Growthly Inc.' },
      { label: 'Fill Phone', detail: 'Typing "+1 555 0192"', field: 'phone', value: '+1 555 0192' },
      { label: 'Set Lead Source', detail: 'Selecting "LinkedIn"', field: 'source', value: 'LinkedIn' },
      { label: 'Add tag', detail: 'Typing tag "hot-lead"', field: 'tag', value: 'hot-lead' },
      { label: 'Save lead', detail: 'Clicking Save, confirming #LID-7741 ✓', field: null },
    ],
    extracted: [
      { key: 'Lead ID', value: '#LID-7741' },
      { key: 'Name', value: 'Sarah Johnson' },
      { key: 'Company', value: 'Growthly Inc.' },
      { key: 'Phone', value: '+1 555 0192' },
      { key: 'Source', value: 'LinkedIn' },
      { key: 'Tag', value: 'hot-lead' },
    ],
    formFields: [
      { id: 'name', label: 'Full Name *', placeholder: '' },
      { id: 'company', label: 'Company', placeholder: '' },
      { id: 'phone', label: 'Phone', placeholder: '' },
      { id: 'source', label: 'Lead Source', placeholder: '', type: 'select', options: ['', 'Website', 'LinkedIn', 'Referral', 'Cold Outreach'] },
    ],
  },
] as const;

type WorkflowId = typeof WORKFLOWS[number]['id'];

const MANIFEST = `{
  "manifest_version": 3,
  "name": "Task Automator",
  "version": "1.0",
  "permissions": ["activeTab", "storage", "scripting"],
  "action": { "default_popup": "popup.html" },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}`;

const CONTENT_JS = `// content.js — injected into every page
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.action !== "autoFill") return;

  const fill = (selector, value) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event("input",  { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Apply each field from payload
  for (const [selector, value] of Object.entries(msg.data)) {
    fill(selector, value);
  }

  // Click submit and wait for confirmation
  document.querySelector(msg.submitSelector)?.click();
  setTimeout(() => {
    const result = document.querySelector(msg.resultSelector)?.textContent;
    sendResponse({ result });
  }, 500);

  return true; // keep channel open for async
});`;

const BATCH_DATA = [
  { company: 'Acme Corp', email: 'orders@acme.com', qty: 500 },
  { company: 'BlueSky Ltd', email: 'buy@bluesky.io', qty: 120 },
  { company: 'TechNova', email: 'procurement@technova.ai', qty: 2000 },
  { company: 'GreenLeaf Co.', email: 'supplies@greenleaf.co', qty: 75 },
  { company: 'MegaStore', email: 'orders@megastore.com', qty: 9999 },
];

export default function ChromeExtensionDemo() {
  const [workflowId, setWorkflowId] = useState<WorkflowId>('vendor-form');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchRow, setBatchRow] = useState(-1);
  const [batchDone, setBatchDone] = useState(false);
  const [showCode, setShowCode] = useState<'manifest' | 'content' | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const wf = WORKFLOWS.find(w => w.id === workflowId)!;

  const fieldValues: Record<string, string> = {};
  wf.steps.forEach((s, i) => {
    if (s.field && step >= i) fieldValues[s.field] = (s as { value?: string }).value ?? '';
  });

  function clearTs() { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; }

  function run() {
    if (running) return;
    setRunning(true); setDone(false); setStep(0); setBatchDone(false); setBatchRow(-1);
    clearTs();
    wf.steps.forEach((_, i) => {
      const t = setTimeout(() => {
        setStep(i);
        if (i === wf.steps.length - 1) setTimeout(() => { setDone(true); setRunning(false); }, 500);
      }, i * 900);
      timeoutsRef.current.push(t);
    });
  }

  function runBatch() {
    if (running) return;
    setRunning(true); setDone(false); setStep(-1); setBatchDone(false); setBatchRow(0);
    clearTs();
    let offset = 0;
    BATCH_DATA.forEach((_, ri) => {
      const rowStart = offset;
      wf.steps.forEach((_, si) => {
        const t = setTimeout(() => {
          setBatchRow(ri);
          setStep(si);
        }, rowStart + si * 400);
        timeoutsRef.current.push(t);
      });
      offset += wf.steps.length * 400 + 200;
    });
    const finalT = setTimeout(() => {
      setBatchDone(true); setDone(true); setRunning(false);
      setStep(wf.steps.length - 1); setBatchRow(BATCH_DATA.length - 1);
    }, offset);
    timeoutsRef.current.push(finalT);
  }

  function reset() {
    clearTs(); setRunning(false); setStep(-1); setDone(false);
    setBatchRow(-1); setBatchDone(false);
  }

  const elapsed = done ? (batchMode ? ((BATCH_DATA.length * wf.steps.length * 0.4)).toFixed(1) : ((wf.steps.length - 1) * 0.9).toFixed(1)) : null;
  const manualTotal = batchMode ? wf.manualMins * BATCH_DATA.length : wf.manualMins;
  const manualDisplay = manualTotal >= 60 ? `${(manualTotal / 60).toFixed(0)}h` : `${manualTotal}m`;

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
            <span className="text-2xl">🧩</span>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded">LIVE DEMO</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">Chrome Extension — Task Automator</h1>
          <p className="text-zinc-400 text-sm">Pick a workflow, watch the extension execute it step-by-step — or run batch mode to process multiple records.</p>
        </div>

        {/* Workflow selector */}
        <div className="flex flex-wrap gap-3 mb-5">
          {WORKFLOWS.map(w => (
            <button key={w.id} onClick={() => { if (!running) { setWorkflowId(w.id); reset(); } }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all ${
                workflowId === w.id ? 'bg-zinc-800 border-zinc-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              } ${running ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span>{w.icon}</span>{w.label}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex gap-2">
            <button onClick={() => { setBatchMode(false); reset(); }} disabled={running}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${!batchMode ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
              Single Run
            </button>
            <button onClick={() => { setBatchMode(true); reset(); }} disabled={running}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${batchMode ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
              Batch Mode ({BATCH_DATA.length} records)
            </button>
          </div>
          {batchMode && <span className="text-xs text-zinc-500">Processes all {BATCH_DATA.length} entries sequentially</span>}
        </div>

        <div className="grid md:grid-cols-5 gap-5 mb-5">
          {/* Steps sidebar */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {batchMode ? `Processing Record ${Math.max(0, batchRow) + 1}/${BATCH_DATA.length}` : 'Automation Steps'}
                </h2>
                {elapsed && <span className="text-xs font-mono text-green-400">{elapsed}s</span>}
              </div>

              {/* Batch progress bar */}
              {batchMode && (batchRow >= 0 || batchDone) && (
                <div className="mb-4">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 transition-all rounded-full"
                      style={{ width: `${((batchDone ? BATCH_DATA.length : batchRow + 1) / BATCH_DATA.length) * 100}%` }} />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{batchDone ? BATCH_DATA.length : batchRow + 1} / {BATCH_DATA.length} records</p>
                </div>
              )}

              <div className="space-y-1.5 mb-4">
                {wf.steps.map((s, i) => (
                  <div key={i} className={`flex items-start gap-2 transition-all ${
                    step === i && !done ? 'opacity-100' : step > i || done ? 'opacity-50' : 'opacity-25'
                  }`}>
                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      (step > i || done) ? 'bg-green-500 text-zinc-950' :
                      step === i ? 'bg-cyan-500 text-zinc-950 animate-pulse' : 'bg-zinc-700 text-zinc-500'
                    }`}>
                      {step > i || done ? '✓' : i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 leading-snug">{s.label}</p>
                      {step === i && !done && <p className="text-xs text-cyan-400 mt-0.5">{s.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {!running && !done && (
                <button onClick={batchMode ? runBatch : run}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-lg transition-colors text-sm">
                  {batchMode ? `▶ Run Batch (${BATCH_DATA.length} records)` : '▶ Run Extension'}
                </button>
              )}
              {running && (
                <button disabled className="w-full py-2 bg-zinc-800 text-zinc-500 rounded-lg text-sm cursor-not-allowed">
                  Running...
                </button>
              )}
              {done && (
                <button onClick={reset}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm">
                  ↺ Run Again
                </button>
              )}
            </div>

            {/* Time saved */}
            {done && elapsed && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3">Time Comparison</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-16">Manual</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500/60 rounded-full w-full" />
                    </div>
                    <span className="text-xs font-mono text-red-400 w-10 text-right">{manualDisplay}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-16">Extension</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '2%' }} />
                    </div>
                    <span className="text-xs font-mono text-green-400 w-10 text-right">{elapsed}s</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  {batchMode ? `Saved ~${manualDisplay} processing ${BATCH_DATA.length} records` : `Saved ~${manualDisplay} of manual work`}
                </p>
              </div>
            )}
          </div>

          {/* Right: browser + extracted data */}
          <div className="md:col-span-3 flex flex-col gap-4">
            {/* Fake browser */}
            <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
              {/* Browser bar */}
              <div className="bg-zinc-700 px-3 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 bg-zinc-600 rounded px-3 py-0.5 text-xs text-zinc-400 font-mono truncate">
                  {workflowId === 'vendor-form' ? 'vendor-portal.example.com/orders/new' :
                   workflowId === 'price-scrape' ? 'shop.example.com/products/search' :
                   'crm.example.com/leads/new'}
                </div>
                <div className={`w-5 h-5 rounded bg-cyan-500/20 border flex items-center justify-center text-xs transition-all ${
                  running ? 'animate-pulse border-cyan-400 bg-cyan-500/40' : done ? 'bg-green-500/30 border-green-500/50' : 'border-cyan-500/50'
                }`}>🧩</div>
              </div>

              {/* Page */}
              <div className="bg-white p-4 min-h-[220px]">
                <h3 className="text-zinc-700 font-semibold text-sm mb-3">{wf.icon} {wf.label}</h3>
                <div className="space-y-2.5">
                  {wf.formFields.map(f => {
                    const isActive = step >= 0 && wf.steps[step]?.field === f.id;
                    const hasValue = fieldValues[f.id];
                    return (
                      <div key={f.id}>
                        <label className="block text-xs text-zinc-500 mb-0.5">{f.label}</label>
                        {'type' in f && f.type === 'select' ? (
                          <div className={`border rounded px-2 py-1.5 text-sm transition-all ${isActive ? 'border-cyan-400 bg-cyan-50 ring-1 ring-cyan-300' : 'border-zinc-300'}`}>
                            <span className={hasValue ? 'text-zinc-800' : 'text-zinc-400'}>{hasValue || f.placeholder || 'Select...'}</span>
                          </div>
                        ) : (
                          <div className={`border rounded px-2 py-1.5 text-sm transition-all ${isActive ? 'border-cyan-400 bg-cyan-50 ring-1 ring-cyan-300' : 'border-zinc-300'}`}>
                            <span className={hasValue ? 'text-zinc-800' : 'text-zinc-400'}>{hasValue || f.placeholder || '—'}</span>
                            {isActive && <span className="animate-pulse text-cyan-500">|</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {fieldValues['result'] || fieldValues['price'] || fieldValues['source'] ? (
                    <div className="border border-green-400 bg-green-50 rounded px-3 py-2 text-sm">
                      <p className="text-xs text-zinc-500 mb-0.5">Result</p>
                      <p className="font-mono font-bold text-green-700">
                        {fieldValues['result'] ?? fieldValues['price'] ?? fieldValues['source'] ?? fieldValues['tag']}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Batch table */}
            {batchMode && (batchRow >= 0 || batchDone) && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3 border-b border-zinc-800">
                  Batch Processing Queue
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left text-zinc-600 px-4 py-2 font-normal">#</th>
                        <th className="text-left text-zinc-600 px-4 py-2 font-normal">Company</th>
                        <th className="text-left text-zinc-600 px-4 py-2 font-normal">Email</th>
                        <th className="text-right text-zinc-600 px-4 py-2 font-normal">Qty</th>
                        <th className="text-center text-zinc-600 px-4 py-2 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BATCH_DATA.map((row, i) => {
                        const isDone = batchDone || i < batchRow || (i === batchRow && done);
                        const isCurrent = i === batchRow && !batchDone;
                        return (
                          <tr key={i} className={`border-b border-zinc-800/50 transition-colors ${isCurrent ? 'bg-cyan-500/5' : ''}`}>
                            <td className="px-4 py-2 text-zinc-600">{i + 1}</td>
                            <td className="px-4 py-2 text-zinc-300">{row.company}</td>
                            <td className="px-4 py-2 text-zinc-500 font-mono">{row.email}</td>
                            <td className="px-4 py-2 text-zinc-400 text-right font-mono">{row.qty.toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">
                              {isDone ? (
                                <span className="text-green-400">✓ Done</span>
                              ) : isCurrent ? (
                                <span className="text-cyan-400 animate-pulse">● Processing</span>
                              ) : (
                                <span className="text-zinc-600">Queued</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Extracted data */}
            {done && !batchMode && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3 border-b border-zinc-800">
                  Extracted Data
                </p>
                <div className="divide-y divide-zinc-800">
                  {wf.extracted.map(e => (
                    <div key={e.key} className="flex justify-between px-4 py-2 text-xs">
                      <span className="text-zinc-500">{e.key}</span>
                      <span className="text-zinc-200 font-mono">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex border-b border-zinc-800">
            {(['manifest', 'content'] as const).map(tab => (
              <button key={tab} onClick={() => setShowCode(showCode === tab ? null : tab)}
                className={`px-5 py-3 text-sm transition-colors ${showCode === tab ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {tab === 'manifest' ? 'manifest.json' : 'content.js'}
              </button>
            ))}
          </div>
          {showCode && (
            <pre className="px-6 py-5 text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed">
              <code>{showCode === 'manifest' ? MANIFEST : CONTENT_JS}</code>
            </pre>
          )}
          {!showCode && <p className="px-6 py-4 text-xs text-zinc-600">Click a tab above to view source code</p>}
        </div>
      </div>
    </div>
  );
}
