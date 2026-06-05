"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const STARTUP_STEPS = [
  { module: "OAM_LIB", action: "Init ConfDSubscriber", log: "ConfDSubscriber::init() — connecting to ConfD at 127.0.0.1:11000" },
  { module: "OAM_CM", action: "Init CMService", log: "CMService::start() — registering /ManagedElement subscription" },
  { module: "OAM_FM", action: "Init FMServiceR1", log: "FMServiceR1::start() — alarm store initialized, ZMQ topic: FM_SERVICE" },
  { module: "OAM_PM", action: "Init GenericPmSvc", log: "GenericPmSvc::start() — reading PM definition files, interval=15min" },
  { module: "OAM_LIB", action: "Connect ConfD (port 11000)", log: "CDB session opened — session_id=42, socket=fd:7" },
  { module: "OAM_LIB", action: "Connect ZMQ (10011/10012)", log: "MqIngress::connect() tcp://127.0.0.1:10011 OK\nMqEgress::connect()  tcp://127.0.0.1:10012 OK" },
  { module: "OAM_LIB", action: "Register subscriptions", log: "Subscribing: /ManagedElement\nSubscribing: /wg5-delay-management\nSubscribing: /hardware" },
  { module: "OAM_APP", action: "Wait MQ topics ready", log: "Waiting for: GENERIC_PM_SVC, FM_SERVICE, CM_NODAL_MANAGER_TOPIC\nAll MQ topics ACK received" },
  { module: "OAM_APP", action: "Agent READY", log: "NF state: INITIALIZE → NF_REGISTRATION → NF_READY\nNETCONF state: CONNECTED → NETCONF_READY\nOAM Agent is READY — port CU-CP:2102 / DU:2100" },
];

const CRASH_SCENARIOS = {
  sigsegv: {
    label: "SIGSEGV — CMService",
    badge: "Segfault",
    badgeStyle: "text-red-400",
    crashedThread: "comm",
    steps: [
      { module: "OAM_CM",  log: "Segmentation fault (core dumped) in CMService::processCallback()", level: "ERROR" },
      { module: "OAM_APP", log: "Thread OAM_CM terminated unexpectedly — initiating recovery", level: "WARN " },
      { module: "OAM_CM",  log: "CMService::restart() — clearing subscription state", level: "INFO " },
      { module: "OAM_CM",  log: "CMService::start() — re-registering /ManagedElement subscription", level: "INFO " },
      { module: "OAM_APP", log: "Recovery complete — OAM_CM thread restored · NF state: NF_READY", level: "INFO " },
    ],
    result: "OAM_CM thread restored · /ManagedElement re-subscribed · NF state maintained: NF_READY",
    note: "Each module can restart independently without full agent restart.",
  },
  zmq_timeout: {
    label: "ZMQ Timeout — OAM_RX",
    badge: "ZMQ disconnect",
    badgeStyle: "text-amber-400",
    crashedThread: "rx",
    steps: [
      { module: "OAM_RX",  log: "ZMQ recv timeout after 30000ms on tcp://127.0.0.1:10011", level: "WARN " },
      { module: "OAM_RX",  log: "Connection lost to ZMQ consumer endpoint — attempting reconnect", level: "ERROR" },
      { module: "OAM_RX",  log: "MqIngress::reconnect() attempt 1/3 — tcp://127.0.0.1:10011", level: "INFO " },
      { module: "OAM_RX",  log: "MqIngress::connect() tcp://127.0.0.1:10011 OK — session restored", level: "INFO " },
      { module: "OAM_APP", log: "OAM_RX reconnected · FM/PM data flow restored · NF state: NF_READY", level: "INFO " },
    ],
    result: "OAM_RX reconnected · ZMQ consumer session restored · FM/PM data flow resumed",
    note: "ZMQ reconnect loop: exponential backoff up to 3 retries, then thread restart.",
  },
  confd_drop: {
    label: "ConfD Session Drop",
    badge: "NETCONF drop",
    badgeStyle: "text-cyan-400",
    crashedThread: "comm",
    steps: [
      { module: "OAM_LIB", log: "ConfD CDB session dropped — fd:7 closed (errno: ECONNRESET)", level: "ERROR" },
      { module: "OAM_LIB", log: "NETCONF state: CONNECTED → DISCONNECTED — re-subscribing", level: "WARN " },
      { module: "OAM_LIB", log: "ConfDSubscriber::reconnect() — opening new CDB session port 11000", level: "INFO " },
      { module: "OAM_LIB", log: "CDB session restored — session_id=47, re-registering 3 subscriptions", level: "INFO " },
      { module: "OAM_APP", log: "ConfD session restored · NETCONF state: CONNECTED → READY · NF_READY", level: "INFO " },
    ],
    result: "ConfD session restored · All YANG subscriptions re-registered · NETCONF state: READY",
    note: "ConfD reconnect re-registers all subscriptions (/ManagedElement, /wg5-delay, /hardware).",
  },
  oom: {
    label: "OOM — Heap Exhausted",
    badge: "Memory OOM",
    badgeStyle: "text-yellow-400",
    crashedThread: "agent",
    steps: [
      { module: "OAM_APP", log: "Heap usage at 95% threshold — 487MB/512MB allocated", level: "WARN " },
      { module: "OAM_APP", log: "std::bad_alloc thrown in OamConfigMapper::buildRequest()", level: "ERROR" },
      { module: "OAM_APP", log: "Emergency GC: releasing 23 stale subscription buffers (−148MB)", level: "WARN " },
      { module: "OAM_APP", log: "Memory recovered — heap at 67% (344MB). Restarting failed operation.", level: "INFO " },
      { module: "OAM_APP", log: "OOM recovery complete · NF state maintained: NF_READY · heap: 67%", level: "INFO " },
    ],
    result: "Memory pressure resolved · Emergency GC freed 148MB · Heap: 344MB/512MB",
    note: "OOM protection: pre-allocated ring buffer for ZMQ messages prevents full heap exhaustion.",
  },
} as const;

type CrashScenarioId = keyof typeof CRASH_SCENARIOS;

type NfState = "INITIALIZE" | "NF_REGISTRATION" | "NF_READY";
type NcState = "INIT" | "DISCONNECTED" | "CONNECTED" | "READY";

const NF_STATES: NfState[] = ["INITIALIZE", "NF_REGISTRATION", "NF_READY"];
const NC_STATES: NcState[] = ["INIT", "DISCONNECTED", "CONNECTED", "READY"];

const THREADS = [
  { id: "comm", label: "comm_thread", role: "Handles ConfD subscription callbacks. Processes config changes from NMS via CDB session #1.", startAt: 1 },
  { id: "sys", label: "sys_thread", role: "Infinite loop reading dynamic config (gnbvs path). Uses CDB session #2 to avoid deadlock with comm_thread.", startAt: 1 },
  { id: "agent", label: "OAM_AGENT", role: "Main coordinator thread. Initializes all modules and routes messages between ConfD and gNB components.", startAt: 0 },
  { id: "rx", label: "OAM_RX", role: "Dedicated ZMQ receive thread. Listens for FM alarms and PM data from gNB components (CU-CP, CU-UP, DU).", startAt: 5 },
];

const HEALTH_CHECKS = [
  { label: "ConfD CDB", endpoint: "127.0.0.1:11000", latency: 11 },
  { label: "ZMQ Consumer", endpoint: "tcp://127.0.0.1:10011", latency: 3 },
  { label: "CM Subscription", endpoint: "/ManagedElement", latency: 7 },
  { label: "FM Subscription", endpoint: "ZMQ topic: FM_SERVICE", latency: 4 },
];

const BASE_PID = 1247;

// Simulated resource usage per startup step (9 steps)
const CPU_BY_STEP  = [8, 25, 38, 46, 62, 44, 28, 18, 14];
const MEM_BY_STEP  = [84, 112, 148, 176, 208, 224, 252, 268, 284];

function ResourceSparkline({ data, step, stroke, label, unit }: {
  data: number[], step: number, stroke: string, label: string, unit: string
}) {
  const visible = data.slice(0, Math.max(step + 1, 2));
  const max = Math.max(...data) * 1.1;
  const w = 200; const h = 32;
  const path = visible.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const cx = ((visible.length - 1) / (data.length - 1)) * w;
  const cy = h - (visible[visible.length - 1] / max) * (h - 4) - 2;
  const current = data[Math.min(step, data.length - 1)];
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-zinc-500 font-mono">{label}</span>
        <span className="text-xs font-mono font-semibold" style={{ color: stroke }}>{current}{unit}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 32 }}>
        <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={cx.toFixed(1)} cy={cy.toFixed(1)} r="2.5" fill={stroke} />
      </svg>
    </div>
  );
}

function formatLog(line: string, module: string, level: string = "INFO ") {
  const now = new Date();
  const ts = now.toISOString().replace("T", " ").slice(0, 23);
  const pid = BASE_PID + Math.floor(Math.random() * 4);
  return `[${ts}][${level}][${pid}] ${module.padEnd(8)}: ${line}`;
}

export default function OamAgentPage() {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [hoveredThread, setHoveredThread] = useState<string | null>(null);
  const [crashRunning, setCrashRunning] = useState(false);
  const [crashDone, setCrashDone] = useState(false);
  const [selectedCrash, setSelectedCrash] = useState<CrashScenarioId>("sigsegv");
  const [crashDropdownOpen, setCrashDropdownOpen] = useState(false);
  const [logsCopied, setLogsCopied] = useState(false);
  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join("\n")).then(() => {
      setLogsCopied(true);
      setTimeout(() => setLogsCopied(false), 1500);
    });
  };
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const nfIdx = step < 5 ? 0 : step < 7 ? 1 : step >= 8 ? 2 : 1;
  const ncIdx = step < 4 ? 0 : step < 5 ? 1 : step < 8 ? 2 : 3;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStep(-1);
    setRunning(false);
    setLogs([]);
    setCrashDone(false);
    setCrashRunning(false);
  };

  const addLog = (line: string, module: string, level = "INFO ") => {
    setLogs((prev) => [...prev, formatLog(line, module, level)]);
  };

  const boot = () => {
    if (running) return;
    reset();
    setRunning(true);

    STARTUP_STEPS.forEach((s, i) => {
      const t = setTimeout(() => {
        setStep(i);
        s.log.split("\n").forEach((line, li) => {
          const lt = setTimeout(() => addLog(line, s.module), li * 80);
          timers.current.push(lt);
        });
        if (i === STARTUP_STEPS.length - 1) setRunning(false);
      }, i * 600);
      timers.current.push(t);
    });
  };

  const simulateCrash = () => {
    if (crashRunning || step < 8) return;
    setCrashRunning(true);
    setCrashDropdownOpen(false);
    const scenario = CRASH_SCENARIOS[selectedCrash];
    scenario.steps.forEach((s, i) => {
      const t = setTimeout(() => {
        addLog(s.log, s.module, s.level);
        if (i === scenario.steps.length - 1) {
          setCrashRunning(false);
          setCrashDone(true);
        }
      }, i * 700);
      timers.current.push(t);
    });
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="font-mono text-cyan-400 font-semibold text-sm hover:text-cyan-300 transition-colors">
            ← chi.dev
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-400">OAM Agent Startup</span>
          <span className="ml-auto text-xs text-zinc-600 hidden md:block">5G OAM · State Machines · Threading</span>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs text-violet-400 bg-violet-400/10 border border-violet-400/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Demo 3 of 3 · State Machine · Threading
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">OAM Agent Startup Visualizer</h1>
          <p className="text-zinc-400 max-w-2xl">
            Startup sequence from the real DU simulator log — watch modules init, state machines transition, and threads come alive. Includes crash recovery simulation.
          </p>
        </div>

        {/* Control bar */}
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900 flex-wrap">
          <button
            onClick={boot}
            disabled={running}
            className="px-5 py-2 rounded-lg bg-violet-600 text-white font-semibold text-sm hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Booting..." : step >= 0 ? "Reboot ▶" : "Boot OAM Agent ▶"}
          </button>
          {step >= 0 && !running && (
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 transition-colors">
              Reset
            </button>
          )}
          {step >= 8 && !running && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setCrashDropdownOpen((v) => !v)}
                  disabled={crashRunning}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-700/60 text-red-400 text-sm hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                >
                  <span className={`text-xs ${CRASH_SCENARIOS[selectedCrash].badgeStyle}`}>◉</span>
                  {CRASH_SCENARIOS[selectedCrash].label}
                  {!crashRunning && <span className="text-zinc-600 ml-1">▾</span>}
                </button>
                {crashDropdownOpen && !crashRunning && (
                  <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl z-20 overflow-hidden">
                    {(Object.keys(CRASH_SCENARIOS) as CrashScenarioId[]).map((id) => {
                      const sc = CRASH_SCENARIOS[id];
                      return (
                        <button
                          key={id}
                          onClick={() => { setSelectedCrash(id); setCrashDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-zinc-800 transition-colors border-b border-zinc-800/60 last:border-0 ${selectedCrash === id ? "bg-zinc-800/50" : ""}`}
                        >
                          <div className="text-sm text-zinc-200">{sc.label}</div>
                          <div className={`text-xs font-mono mt-0.5 ${sc.badgeStyle}`}>{sc.badge}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={simulateCrash}
                disabled={crashRunning}
                className="px-4 py-2 rounded-lg bg-red-900/20 border border-red-700/60 text-red-400 text-sm hover:bg-red-900/40 disabled:opacity-50 transition-colors font-semibold"
              >
                {crashRunning ? "Recovering..." : crashDone ? "Run Again ▶" : "Simulate ▶"}
              </button>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${step >= 8 ? "bg-emerald-400" : step >= 0 ? "bg-amber-400 animate-pulse" : "bg-zinc-700"}`} />
            <span className={`text-sm font-mono transition-colors duration-500 ${step >= 8 ? "text-emerald-400" : step >= 0 ? "text-amber-400" : "text-zinc-600"}`}>
              {step >= 8 ? "NF_READY" : step >= 0 ? "INITIALIZING" : "OFFLINE"}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left — Startup Steps + Log */}
          <div className="flex flex-col gap-4">
            {/* Step list */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 text-xs text-zinc-500 font-mono uppercase tracking-wider">
                Startup Sequence
              </div>
              <div className="divide-y divide-zinc-800/40">
                {STARTUP_STEPS.map((s, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 transition-all duration-300 ${
                    step === i ? "bg-violet-900/20" : step > i ? "opacity-60" : "opacity-30"
                  }`}>
                    <span className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 transition-colors duration-300 ${
                      step > i ? "border-emerald-600 bg-emerald-900/30 text-emerald-400" :
                      step === i ? "border-violet-500 bg-violet-900/30 text-violet-400 animate-pulse" :
                      "border-zinc-700 text-zinc-700"
                    }`}>
                      {step > i ? "✓" : i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-mono text-zinc-500 mr-2">[{s.module}]</span>
                      <span className="text-sm text-zinc-300">{s.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Log terminal */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-600/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600/60" />
                </div>
                <span className="text-xs text-zinc-500 font-mono ml-1">oam-agent.log</span>
                {(running || crashRunning) && <span className="text-xs text-violet-400 animate-pulse font-mono">● LIVE</span>}
                {logs.length > 0 && !running && !crashRunning && (
                  <button
                    onClick={copyLogs}
                    className="ml-auto text-xs font-mono text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {logsCopied ? "✓ copied" : "copy logs"}
                  </button>
                )}
              </div>
              <div ref={logRef} className="p-4 h-52 overflow-auto">
                {logs.length === 0 ? (
                  <span className="text-zinc-700 text-xs font-mono">$ waiting for boot...</span>
                ) : (
                  logs.map((line, i) => (
                    <div key={i} className={`text-xs font-mono leading-relaxed ${
                      line.includes("[ERROR]") ? "text-red-300" :
                      line.includes("[WARN ]") ? "text-amber-300" :
                      "text-emerald-300"
                    }`}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right — State Machines + Threads + Health */}
          <div className="flex flex-col gap-4">
            {/* NF State Machine */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-4">NF State Machine</p>
              <div className="flex items-center gap-2">
                {NF_STATES.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`flex-1 text-center px-2 py-2 rounded-lg border text-xs font-mono transition-all duration-500 ${
                      nfIdx === i ? "border-violet-500 bg-violet-900/30 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.3)]" :
                      nfIdx > i ? "border-emerald-700 bg-emerald-900/20 text-emerald-400" :
                      "border-zinc-800 text-zinc-700"
                    }`}>
                      {s.replace("NF_", "")}
                    </div>
                    {i < NF_STATES.length - 1 && (
                      <div className={`text-sm transition-colors duration-300 ${nfIdx > i ? "text-emerald-500" : "text-zinc-800"}`}>→</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-zinc-600 font-mono text-center">OamNFStateMachine.cpp</div>
            </div>

            {/* NETCONF State Machine */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-4">NETCONF State Machine</p>
              <div className="flex items-center gap-1 flex-wrap">
                {NC_STATES.map((s, i) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`px-2 py-2 rounded-lg border text-xs font-mono transition-all duration-500 ${
                      ncIdx === i ? "border-cyan-500 bg-cyan-900/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]" :
                      ncIdx > i ? "border-emerald-700 bg-emerald-900/20 text-emerald-400" :
                      "border-zinc-800 text-zinc-700"
                    }`}>
                      {s}
                    </div>
                    {i < NC_STATES.length - 1 && (
                      <div className={`text-xs transition-colors duration-300 ${ncIdx > i ? "text-emerald-500" : "text-zinc-800"}`}>→</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-zinc-600 font-mono text-center">OamNetconfStateMachine.cpp</div>
            </div>

            {/* Thread Model */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-4">Thread Model</p>
              <div className="grid grid-cols-2 gap-2">
                {THREADS.map((t) => {
                  const alive = step >= t.startAt;
                  const crashed = crashRunning && t.id === CRASH_SCENARIOS[selectedCrash].crashedThread;
                  return (
                    <div
                      key={t.id}
                      onMouseEnter={() => setHoveredThread(t.id)}
                      onMouseLeave={() => setHoveredThread(null)}
                      className={`p-3 rounded-lg border cursor-default transition-all duration-300 ${
                        crashed ? "border-red-700/60 bg-red-900/10" :
                        alive ? "border-zinc-700 bg-zinc-800 hover:border-violet-500/60" :
                        "border-zinc-800 bg-zinc-900/50 opacity-40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          crashed ? "bg-red-500 animate-pulse" :
                          alive ? "bg-emerald-400" : "bg-zinc-700"
                        } ${alive && !hoveredThread && !crashed ? "animate-pulse" : ""}`} />
                        <span className="text-xs font-mono font-semibold text-zinc-200">{t.label}</span>
                      </div>
                      {hoveredThread === t.id && alive ? (
                        <p className="text-xs text-zinc-400 leading-relaxed mt-1">{t.role}</p>
                      ) : (
                        <p className={`text-xs ${crashed ? "text-red-400" : alive ? "text-zinc-600" : "text-zinc-700"}`}>
                          {crashed ? "crashed — recovering" : alive ? "running" : "not started"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-2 rounded-lg bg-amber-900/10 border border-amber-800/30 text-xs text-amber-400/80">
                <span className="font-semibold">Why 2 ConfD threads?</span> CDB has 2 root paths (ME + gnbvs). Single thread causes deadlock — separate sessions prevent lock contention.
              </div>
            </div>

            {/* Health Check panel — shown when step >= 8 */}
            {step >= 8 && (
              <div className="p-4 rounded-xl border border-emerald-800/40 bg-emerald-900/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-emerald-400 font-mono uppercase tracking-wider">System Health</p>
                  <span className="text-xs text-emerald-400 font-mono">● All checks passed</span>
                </div>
                <div className="space-y-2">
                  {HEALTH_CHECKS.map((h) => (
                    <div key={h.label} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-xs font-mono text-zinc-300 w-32 shrink-0">{h.label}</span>
                      <span className="text-xs font-mono text-zinc-500 flex-1 truncate">{h.endpoint}</span>
                      <span className="text-xs font-mono text-emerald-400 shrink-0">{h.latency}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resource sparklines */}
            {step >= 2 && (
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-3">System Resources</p>
                <div className="space-y-4">
                  <ResourceSparkline data={CPU_BY_STEP} step={step} stroke="#22d3ee" label="CPU Usage" unit="%" />
                  <ResourceSparkline data={MEM_BY_STEP} step={step} stroke="#a78bfa" label="Heap Memory" unit="MB" />
                </div>
              </div>
            )}

            {/* Port info */}
            {step >= 8 && (
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono">
                <div className="text-zinc-400 font-semibold mb-2">Agent endpoints:</div>
                <div className="text-zinc-500 space-y-1">
                  <div>CU-CP NETCONF  <span className="text-zinc-200">tcp://localhost:2102</span></div>
                  <div>DU NETCONF     <span className="text-zinc-200">tcp://localhost:2100</span></div>
                  <div>ZMQ consumer   <span className="text-zinc-200">tcp://127.0.0.1:10011</span></div>
                  <div>ZMQ producer   <span className="text-zinc-200">tcp://127.0.0.1:10012</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Crash recovery result */}
        {crashDone && (
          <div className="mt-6 p-4 rounded-xl border border-emerald-800/40 bg-emerald-900/10 text-xs font-mono">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 font-semibold">✓ Recovery successful</span>
              <span className={`px-2 py-0.5 rounded border border-zinc-700/50 ${CRASH_SCENARIOS[selectedCrash].badgeStyle}`}>
                {CRASH_SCENARIOS[selectedCrash].badge}
              </span>
            </div>
            <div className="text-zinc-500">{CRASH_SCENARIOS[selectedCrash].result}</div>
            <div className="text-zinc-600 mt-1">{CRASH_SCENARIOS[selectedCrash].note}</div>
          </div>
        )}

        {/* Other demos */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo/cm-flow" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            ← CM Flow Visualizer
          </Link>
          <Link href="/demo/fm-dashboard" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            ← FM Alarm Dashboard
          </Link>
          <Link href="/demo/ras-nms" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            NMS / RAS →
          </Link>
        </div>
      </div>
    </main>
  );
}
