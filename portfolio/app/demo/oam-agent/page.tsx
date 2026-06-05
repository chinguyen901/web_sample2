"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const STARTUP_STEPS = [
  {
    module: "OAM_LIB",
    action: "Init ConfDSubscriber",
    log: "OAM_LIB  | ConfDSubscriber::init() — connecting to ConfD at 127.0.0.1:11000",
  },
  {
    module: "OAM_CM",
    action: "Init CMService",
    log: "OAM_CM   | CMService::start() — registering /ManagedElement subscription",
  },
  {
    module: "OAM_FM",
    action: "Init FMServiceR1",
    log: "OAM_FM   | FMServiceR1::start() — alarm store initialized, ZMQ topic: FM_SERVICE",
  },
  {
    module: "OAM_PM",
    action: "Init GenericPmSvc",
    log: "OAM_PM   | GenericPmSvc::start() — reading PM definition files, interval=15min",
  },
  {
    module: "OAM_LIB",
    action: "Connect ConfD (port 11000)",
    log: "OAM_LIB  | CDB session opened — session_id=42, socket=fd:7",
  },
  {
    module: "OAM_LIB",
    action: "Connect ZMQ (10011/10012)",
    log: "OAM_LIB  | MqIngress::connect() tcp://127.0.0.1:10011 OK\nOAM_LIB  | MqEgress::connect()  tcp://127.0.0.1:10012 OK",
  },
  {
    module: "OAM_LIB",
    action: "Register subscriptions",
    log: "OAM_LIB  | Subscribing: /ManagedElement\nOAM_LIB  | Subscribing: /wg5-delay-management\nOAM_LIB  | Subscribing: /hardware",
  },
  {
    module: "OAM_APP",
    action: "Wait MQ topics ready",
    log: "OAM_APP  | Waiting for: GENERIC_PM_SVC, FM_SERVICE, CM_NODAL_MANAGER_TOPIC\nOAM_APP  | All MQ topics ACK received",
  },
  {
    module: "OAM_APP",
    action: "Agent READY",
    log: "OAM_APP  | NF state: INITIALIZE → NF_REGISTRATION → NF_READY\nOAM_APP  | NETCONF state: CONNECTED → NETCONF_READY\nOAM_APP  | OAM Agent is READY — port CU-CP:2102 / DU:2100",
  },
];

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

export default function OamAgentPage() {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [hoveredThread, setHoveredThread] = useState<string | null>(null);
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
  };

  const boot = () => {
    if (running) return;
    reset();
    setRunning(true);

    STARTUP_STEPS.forEach((s, i) => {
      const t = setTimeout(() => {
        setStep(i);
        setLogs((prev) => [
          ...prev,
          ...s.log.split("\n").map((line) => `[${new Date().toLocaleTimeString("en-GB")}] ${line}`),
        ]);
        if (i === STARTUP_STEPS.length - 1) setRunning(false);
      }, i * 600);
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
            Startup sequence from the real DU simulator log — watch modules init, state machines transition, and threads come alive.
          </p>
        </div>

        {/* Control bar */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <button
            onClick={boot}
            disabled={running}
            className="px-5 py-2 rounded-lg bg-violet-600 text-white font-semibold text-sm hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Booting..." : step >= 0 ? "Reboot ▶" : "Boot OAM Agent ▶"}
          </button>
          {step >= 0 && (
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 transition-colors">
              Reset
            </button>
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
              </div>
              <div ref={logRef} className="p-4 h-40 overflow-auto">
                {logs.length === 0 ? (
                  <span className="text-zinc-700 text-xs font-mono">$ waiting for boot...</span>
                ) : (
                  logs.map((line, i) => (
                    <div key={i} className="text-xs font-mono text-emerald-300 leading-relaxed">
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right — State Machines + Threads */}
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
                      {s.replace("NETCONF_", "NC_")}
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
                  const isHovered = hoveredThread === t.id;
                  return (
                    <div
                      key={t.id}
                      onMouseEnter={() => setHoveredThread(t.id)}
                      onMouseLeave={() => setHoveredThread(null)}
                      className={`p-3 rounded-lg border cursor-default transition-all duration-300 ${
                        alive ? "border-zinc-700 bg-zinc-800 hover:border-violet-500/60" : "border-zinc-800 bg-zinc-900/50 opacity-40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${alive ? "bg-emerald-400" : "bg-zinc-700"} ${alive && !isHovered ? "animate-pulse" : ""}`} />
                        <span className="text-xs font-mono font-semibold text-zinc-200">{t.label}</span>
                      </div>
                      {isHovered && alive ? (
                        <p className="text-xs text-zinc-400 leading-relaxed mt-1">{t.role}</p>
                      ) : (
                        <p className="text-xs text-zinc-600">{alive ? "running" : "not started"}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-2 rounded-lg bg-amber-900/10 border border-amber-800/30 text-xs text-amber-400/80">
                <span className="font-semibold">Why 2 ConfD threads?</span> CDB has 2 root paths (ME + gnbvs). Single thread causes deadlock — separate sessions prevent lock contention.
              </div>
            </div>

            {/* Port info */}
            {step >= 8 && (
              <div className="p-4 rounded-xl border border-emerald-800/40 bg-emerald-900/10 text-xs font-mono">
                <div className="text-emerald-400 font-semibold mb-2">Agent endpoints ready:</div>
                <div className="text-zinc-400 space-y-1">
                  <div>CU-CP NETCONF  <span className="text-zinc-200">tcp://localhost:2102</span></div>
                  <div>DU NETCONF     <span className="text-zinc-200">tcp://localhost:2100</span></div>
                  <div>ZMQ consumer   <span className="text-zinc-200">tcp://127.0.0.1:10011</span></div>
                  <div>ZMQ producer   <span className="text-zinc-200">tcp://127.0.0.1:10012</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Other demos */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo/cm-flow" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            ← CM Flow Visualizer
          </Link>
          <Link href="/demo/fm-dashboard" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            ← FM Alarm Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
