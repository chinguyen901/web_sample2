"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type Severity = "CRITICAL" | "MAJOR" | "MINOR";
type AlarmStatus = "ACTIVE" | "CLEARING" | "CLEARED";

interface Alarm {
  id: string;
  type: string;
  source: string;
  severity: Severity;
  status: AlarmStatus;
  time: string;
  desc: string;
}

const ALARM_PRESETS = [
  {
    type: "LINK_DOWN",
    source: "gNB-CU-CP / F1 Interface",
    severity: "CRITICAL" as Severity,
    desc: "F1 interface link between CU-CP and DU is down. Cells in affected DU are unavailable.",
  },
  {
    type: "CPU_HIGH",
    source: "gNB-DU / Scheduler",
    severity: "MAJOR" as Severity,
    desc: "DU CPU utilization exceeded 90% threshold. Scheduling performance may be degraded.",
  },
  {
    type: "SYNC_LOSS",
    source: "gNB-DU / PTP Sync",
    severity: "CRITICAL" as Severity,
    desc: "PTP timing synchronization lost. Radio transmission accuracy compromised.",
  },
  {
    type: "CELL_UNAVAILABLE",
    source: "gNB-CU-CP / Cell 1",
    severity: "MAJOR" as Severity,
    desc: "NR cell administratively disabled or failed to activate after configuration push.",
  },
  {
    type: "MEM_THRESHOLD",
    source: "gNB-CU-UP / User Plane",
    severity: "MINOR" as Severity,
    desc: "Memory usage at 80% of configured threshold. Monitor for further growth.",
  },
] as const;

const SEV_STYLE: Record<Severity, string> = {
  CRITICAL: "text-red-400 bg-red-900/20 border-red-800",
  MAJOR: "text-amber-400 bg-amber-900/20 border-amber-800",
  MINOR: "text-yellow-400 bg-yellow-900/20 border-yellow-800",
};

const SEV_DOT: Record<Severity, string> = {
  CRITICAL: "bg-red-500",
  MAJOR: "bg-amber-500",
  MINOR: "bg-yellow-500",
};

let alarmSeq = 1;
function makeId() { return `ALM-${String(alarmSeq++).padStart(4, "0")}`; }
function now() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const FLOW_NODES = ["gNB Component", "ZMQ Queue", "OAM Agent", "ConfD", "NMS"];
const CLEAR_NODES = ["gNB Component", "ZMQ Queue", "OAM Agent", "ConfD", "NMS"];

export default function FmDashboardPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [selected, setSelected] = useState<Alarm | null>(null);
  const [flowStep, setFlowStep] = useState(-1);
  const [flowMode, setFlowMode] = useState<"inject" | "clear" | null>(null);
  const [injecting, setInjecting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const counts = {
    CRITICAL: alarms.filter((a) => a.severity === "CRITICAL" && a.status === "ACTIVE").length,
    MAJOR: alarms.filter((a) => a.severity === "MAJOR" && a.status === "ACTIVE").length,
    MINOR: alarms.filter((a) => a.severity === "MINOR" && a.status === "ACTIVE").length,
    CLEARED: alarms.filter((a) => a.status === "CLEARED").length,
  };

  const animateFlow = (mode: "inject" | "clear", onDone?: () => void) => {
    setFlowMode(mode);
    setFlowStep(-1);
    let s = 0;
    const interval = setInterval(() => {
      setFlowStep(s);
      s++;
      if (s >= FLOW_NODES.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, 500);
  };

  const injectAlarm = useCallback((preset: typeof ALARM_PRESETS[number]) => {
    if (injecting) return;
    setInjecting(true);
    setDropdownOpen(false);

    animateFlow("inject", () => {
      const alarm: Alarm = {
        id: makeId(),
        type: preset.type,
        source: preset.source,
        severity: preset.severity,
        status: "ACTIVE",
        time: now(),
        desc: preset.desc,
      };
      setAlarms((prev) => [alarm, ...prev]);
      setSelected(alarm);
      setInjecting(false);
    });
  }, [injecting]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.map((a) => a.id === id ? { ...a, status: "CLEARING" as AlarmStatus } : a));
    animateFlow("clear", () => {
      setAlarms((prev) => prev.map((a) => a.id === id ? { ...a, status: "CLEARED" as AlarmStatus } : a));
      setSelected((prev) => prev?.id === id ? { ...prev, status: "CLEARED" } : prev);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearAll = () => {
    setAlarms((prev) => prev.map((a) => ({ ...a, status: "CLEARED" as AlarmStatus })));
    setSelected(null);
  };

  const flowNodes = flowMode === "clear" ? CLEAR_NODES : FLOW_NODES;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="font-mono text-cyan-400 font-semibold text-sm hover:text-cyan-300 transition-colors">
            ← chi.dev
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-400">FM Alarm Dashboard</span>
          <span className="ml-auto text-xs text-zinc-600 hidden md:block">5G OAM · Fault Management</span>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Demo 2 of 3 · Fault Management
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">FM Alarm Dashboard</h1>
          <p className="text-zinc-400 max-w-2xl">
            Real-time alarm lifecycle management — from gNB fault detection through ZMQ to OAM Agent, ConfD, and NMS notification.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: "CRITICAL", count: counts.CRITICAL, style: "text-red-400 bg-red-900/20 border-red-800/60" },
            { label: "MAJOR", count: counts.MAJOR, style: "text-amber-400 bg-amber-900/20 border-amber-800/60" },
            { label: "MINOR", count: counts.MINOR, style: "text-yellow-400 bg-yellow-900/20 border-yellow-800/60" },
            { label: "CLEARED", count: counts.CLEARED, style: "text-zinc-400 bg-zinc-800/40 border-zinc-700" },
          ].map(({ label, count, style }) => (
            <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-mono ${style}`}>
              <span className="font-semibold">{count}</span>
              <span className="opacity-70">{label}</span>
            </div>
          ))}

          <div className="ml-auto flex gap-2">
            {/* Inject dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                disabled={injecting}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                Inject Fault ▾
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl z-20 overflow-hidden">
                  {ALARM_PRESETS.map((p) => (
                    <button
                      key={p.type}
                      onClick={() => injectAlarm(p)}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800/60 last:border-0"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-mono font-semibold ${SEV_STYLE[p.severity].split(" ")[0]}`}>{p.severity}</span>
                        <span className="text-sm font-mono text-zinc-200">{p.type}</span>
                      </div>
                      <div className="text-xs text-zinc-500 truncate">{p.source}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={clearAll}
              className="text-sm px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left — Alarm Table */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 text-xs text-zinc-500 font-mono uppercase tracking-wider">
                Active Alarms
              </div>
              {alarms.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 text-sm">
                  No alarms — inject a fault to begin
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60 max-h-80 overflow-auto">
                  {alarms.map((alarm) => (
                    <button
                      key={alarm.id}
                      onClick={() => setSelected(alarm)}
                      className={`w-full text-left px-4 py-3 hover:bg-zinc-800/50 transition-colors ${selected?.id === alarm.id ? "bg-zinc-800/50" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${SEV_DOT[alarm.severity]} ${alarm.status === "ACTIVE" ? "animate-pulse" : "opacity-40"}`} />
                        <span className="font-mono text-sm font-semibold text-zinc-100">{alarm.type}</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${
                          alarm.status === "ACTIVE" ? "text-red-400 border-red-800 bg-red-900/20" :
                          alarm.status === "CLEARING" ? "text-amber-400 border-amber-800 bg-amber-900/20" :
                          "text-emerald-400 border-emerald-800 bg-emerald-900/20"
                        }`}>{alarm.status}</span>
                      </div>
                      <div className="text-xs text-zinc-500 truncate">{alarm.source}</div>
                      <div className="text-xs text-zinc-600 mt-0.5">{alarm.time}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-mono font-semibold text-zinc-100">{selected.id}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{selected.source}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded border ${SEV_STYLE[selected.severity]}`}>
                    {selected.severity}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{selected.desc}</p>
                {selected.status === "ACTIVE" && (
                  <button
                    onClick={() => clearAlarm(selected.id)}
                    className="w-full py-2 text-sm rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors"
                  >
                    Clear Alarm ✓
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right — Flow Visualizer */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                {flowMode === "clear" ? "Clear Flow" : "Alarm Flow"} Visualizer
              </p>
              {flowMode && (
                <span className={`text-xs px-2 py-1 rounded font-mono ${flowMode === "inject" ? "text-red-400 bg-red-900/20" : "text-emerald-400 bg-emerald-900/20"}`}>
                  {flowMode === "inject" ? "↑ ALARM" : "↓ CLEAR"}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-0">
              {flowNodes.map((node, i) => {
                const active = flowStep === i;
                const done = flowStep > i;
                return (
                  <div key={`${flowMode}-${i}`}>
                    <div className={`p-4 rounded-xl border-2 transition-all duration-400 ${
                      active ? (flowMode === "clear" ? "border-emerald-500 bg-emerald-900/20 shadow-[0_0_12px_rgba(52,211,153,0.2)]" : "border-red-500 bg-red-900/20 shadow-[0_0_12px_rgba(239,68,68,0.2)]")
                      : done ? "border-zinc-600 bg-zinc-800/40"
                      : "border-zinc-800 bg-zinc-900/50"
                    }`}>
                      <div className={`font-semibold text-sm ${active ? (flowMode === "clear" ? "text-emerald-300" : "text-red-300") : done ? "text-zinc-300" : "text-zinc-600"}`}>
                        {node}
                      </div>
                      {active && (
                        <div className={`text-xs mt-1 font-mono ${flowMode === "clear" ? "text-emerald-400" : "text-red-400"}`}>
                          {flowMode === "inject" ? (
                            ["FM_ALARM_IND via ZMQ", "routing alarm", "format + report", "NETCONF notify", "alarm displayed"][i] ?? ""
                          ) : (
                            ["clear signal sent", "ZMQ clear msg", "clear alarm API", "notify cleared", "alarm resolved"][i] ?? ""
                          )}
                        </div>
                      )}
                    </div>
                    {i < flowNodes.length - 1 && (
                      <div className={`flex justify-center py-1 transition-colors duration-300 ${done || active ? (flowMode === "clear" ? "text-emerald-500" : "text-red-500") : "text-zinc-800"}`}>
                        <div className="text-lg">↓</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {flowStep < 0 && !injecting && (
              <div className="mt-4 text-center text-zinc-600 text-xs">
                Inject a fault to see the alarm flow
              </div>
            )}
          </div>
        </div>

        {/* Other demos */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo/cm-flow" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            ← CM Flow Visualizer
          </Link>
          <Link href="/demo/oam-agent" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            OAM Agent Startup →
          </Link>
        </div>
      </div>
    </main>
  );
}
