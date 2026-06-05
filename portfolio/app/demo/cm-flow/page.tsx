"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const CONFIG_PRESETS = {
  cell: {
    label: "Cell Config",
    xml: `<rpc xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <edit-config>
    <target><running/></target>
    <config>
      <ManagedElement>
        <GNBCUCPFunction>
          <NRCellCU>
            <cellLocalId>1</cellLocalId>
            <nRCellIdentity>123456</nRCellIdentity>
            <operationalState>ENABLED</operationalState>
          </NRCellCU>
        </GNBCUCPFunction>
      </ManagedElement>
    </config>
  </edit-config>
</rpc>`,
    errorXml: `<rpc-reply xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <rpc-error>
    <error-type>application</error-type>
    <error-tag>invalid-value</error-tag>
    <error-severity>error</error-severity>
    <error-message xml:lang="en">
      YANG constraint violation:
      nRCellIdentity value 123456 out of range.
      Valid range: [0..1007] (uint10)
    </error-message>
    <error-info>
      <bad-element>nRCellIdentity</bad-element>
    </error-info>
  </rpc-error>
</rpc-reply>`,
    yangPath: "/ManagedElement/GNBCUCPFunction/NRCellCU/nRCellIdentity",
    yangType: "uint36",
    zmqMsg: "OAM_GNB_CONFIG_REQ { cell_id=1, nci=123456, state=ENABLED }",
    target: "gNB-CU-CP",
  },
  freq: {
    label: "Frequency Config",
    xml: `<rpc xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <edit-config>
    <target><running/></target>
    <config>
      <ManagedElement>
        <GNBCUCPFunction>
          <NRCellCU>
            <cellLocalId>1</cellLocalId>
            <arfcnDL>660000</arfcnDL>
            <bSChannelBwDL>100</bSChannelBwDL>
          </NRCellCU>
        </GNBCUCPFunction>
      </ManagedElement>
    </config>
  </edit-config>
</rpc>`,
    errorXml: `<rpc-reply xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <rpc-error>
    <error-type>application</error-type>
    <error-tag>invalid-value</error-tag>
    <error-severity>error</error-severity>
    <error-message xml:lang="en">
      YANG constraint violation:
      arfcnDL 660000 not in valid NR band n78.
      Valid NR-ARFCN range: [620000..653333]
    </error-message>
  </rpc-error>
</rpc-reply>`,
    yangPath: "/ManagedElement/GNBCUCPFunction/NRCellCU/arfcnDL",
    yangType: "uint32",
    zmqMsg: "OAM_GNB_CONFIG_REQ { cell_id=1, arfcn=660000, bw=100MHz }",
    target: "gNB-CU-CP",
  },
  power: {
    label: "Power Config",
    xml: `<rpc xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <edit-config>
    <target><running/></target>
    <config>
      <ManagedElement>
        <GNBDUFunction>
          <NRCellDU>
            <cellLocalId>1</cellLocalId>
            <ssbPeriodicity>20</ssbPeriodicity>
            <ssbOffset>0</ssbOffset>
          </NRCellDU>
        </GNBDUFunction>
      </ManagedElement>
    </config>
  </edit-config>
</rpc>`,
    errorXml: `<rpc-reply xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <rpc-error>
    <error-type>application</error-type>
    <error-tag>invalid-value</error-tag>
    <error-severity>error</error-severity>
    <error-message xml:lang="en">
      YANG constraint violation:
      ssbPeriodicity must be one of {5,10,20,40,80,160}.
      Received: 20 with ssbOffset=0 conflicts
      with existing cell timing offset.
    </error-message>
  </rpc-error>
</rpc-reply>`,
    yangPath: "/ManagedElement/GNBDUFunction/NRCellDU/ssbPeriodicity",
    yangType: "uint8",
    zmqMsg: "OAM_GNB_CONFIG_REQ { cell_id=1, ssb_period=20, ssb_offset=0 }",
    target: "gNB-DU",
  },
} as const;

type PresetKey = keyof typeof CONFIG_PRESETS;

const LATENCY = [
  { label: "NMS → ConfD", ms: 12 },
  { label: "ConfD validate", ms: 8 },
  { label: "Callback → Agent", ms: 5 },
  { label: "ZMQ dispatch", ms: 3 },
  { label: "gNB apply", ms: 22 },
];

const CPP_SNIPPET = `// oam_agent_config_mapper.cpp
void OamConfigMapper::handleSubscriptionCallback(
    const std::string& yang_path,
    const cdb_value_t& value)
{
    OAM_GNB_CONFIG_REQ req{};

    if (yang_path == ME_CELL_IDENTITY_PATH) {
        req.nci = value.as_uint36();
    } else if (yang_path == ME_ARFCN_DL_PATH) {
        req.arfcn_dl = value.as_uint32();
    } else if (yang_path == ME_SSB_PERIOD_PATH) {
        req.ssb_periodicity = value.as_uint8();
    }

    zmq_proxy_.send(ZMQ_TOPIC_CONFIG, req);
}`;

const YANG_SNIPPET = `// YANG model (3GPP TS 28.541)
module _3gpp-nr-nrm-gnbcucpfunction {
  container GNBCUCPFunction {
    list NRCellCU {
      key cellLocalId;
      leaf cellLocalId   { type uint16; }
      leaf nRCellIdentity {
        type uint36;
        config true;    // configurable via NETCONF
      }
      leaf operationalState {
        type enumeration { enum ENABLED; enum DISABLED; }
        config false;   // read-only state data
      }
    }
  }
}`;

export default function CmFlowPage() {
  const [preset, setPreset] = useState<PresetKey>("cell");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [errorMode, setErrorMode] = useState(false);
  const [errorTriggered, setErrorTriggered] = useState(false);
  const [codeTab, setCodeTab] = useState<"cpp" | "yang">("cpp");
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [packetArrow, setPacketArrow] = useState(-1);
  const [liveMs, setLiveMs] = useState(0);
  const latencyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = CONFIG_PRESETS[preset];
  const [copied, setCopied] = useState<string | null>(null);
  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const reset = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    if (latencyTimerRef.current) {
      clearInterval(latencyTimerRef.current);
      latencyTimerRef.current = null;
    }
    setRunning(false);
    setStep(-1);
    setDone(false);
    setErrorTriggered(false);
    setPacketArrow(-1);
    setLiveMs(0);
  };

  useEffect(() => { reset(); }, [preset]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    if (running) return;
    reset();
    setRunning(true);

    if (errorMode) {
      // Stop at ConfD with validation error
      const t0 = setTimeout(() => setStep(0), 0);
      const t1 = setTimeout(() => {
        setStep(1);
        setErrorTriggered(true);
        setRunning(false);
      }, 900);
      timerRef.current.push(t0, t1);
    } else {
      const delays = [0, 700, 1400, 2200, 3000, 3700];
      delays.forEach((d, i) => {
        const t = setTimeout(() => {
          setStep(i);
          if (i === delays.length - 1) {
            setRunning(false);
            setDone(true);
            if (latencyTimerRef.current) {
              clearInterval(latencyTimerRef.current);
              latencyTimerRef.current = null;
            }
          }
        }, d);
        timerRef.current.push(t);
      });

      // Latency ticker: count from 0 → totalMs over 3700ms
      const tickInterval = 50;
      const tickIncrement = (totalMs / 3700) * tickInterval;
      latencyTimerRef.current = setInterval(() => {
        setLiveMs((v) => {
          const next = v + tickIncrement;
          if (next >= totalMs) {
            if (latencyTimerRef.current) clearInterval(latencyTimerRef.current);
            return totalMs;
          }
          return next;
        });
      }, tickInterval);

      // Packet animation between each step
      ([[350, 0], [1050, 1], [1800, 2]] as const).forEach(([delay, arrowIdx]) => {
        const pt = setTimeout(() => {
          setPacketArrow(arrowIdx);
          const clearPt = setTimeout(() => setPacketArrow(-1), 650);
          timerRef.current.push(clearPt);
        }, delay);
        timerRef.current.push(pt);
      });
    }
  };

  const nodeColor = (i: number) => {
    if (errorTriggered && i === 1) return "border-red-500 bg-red-900/20 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]";
    if (errorTriggered && i > 1) return "border-zinc-800 bg-zinc-900/50 text-zinc-600";
    if (step < i) return "border-zinc-700 bg-zinc-900 text-zinc-500";
    if (step === i) return "border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]";
    return "border-emerald-600 bg-emerald-900/20 text-emerald-400";
  };

  const totalMs = LATENCY.reduce((a, l) => a + l.ms, 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <style>{`
        @keyframes packetSlide {
          0%   { transform: translate(-50%, -8px);  opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translate(-50%, 58px);  opacity: 0; }
        }
      `}</style>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="font-mono text-cyan-400 font-semibold text-sm hover:text-cyan-300 transition-colors">
            ← chi.dev
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-400">CM Flow Visualizer</span>
          <span className="ml-auto text-xs text-zinc-600 hidden md:block">5G OAM · Configuration Management</span>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Demo 1 of 3 · Configuration Management
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">CM Flow Visualizer</h1>
          <p className="text-zinc-400 max-w-2xl">
            How I translate NMS configs to a 5G base station in real-time — from NETCONF XML through ConfD and OAM Agent down to gNB via ZMQ.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left — Config Editor */}
          <div className="flex flex-col gap-4">
            {/* Preset selector */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-500 mb-3 font-mono uppercase tracking-wider">Config Type</p>
              <div className="flex gap-2 flex-wrap mb-5">
                {(Object.keys(CONFIG_PRESETS) as PresetKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setPreset(k)}
                    className={`text-sm px-4 py-1.5 rounded-lg border transition-colors ${
                      preset === k
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {CONFIG_PRESETS[k].label}
                  </button>
                ))}
              </div>

              {/* XML display */}
              <div className="rounded-lg bg-zinc-950 border border-zinc-800 overflow-auto max-h-64">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
                  <span className="text-xs font-mono text-zinc-500">
                    NETCONF edit-config · port {preset === "power" ? "2100" : "2102"}
                  </span>
                  <button
                    onClick={() => copyText(errorTriggered ? cfg.errorXml : cfg.xml, "xml")}
                    className="text-xs font-mono text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {copied === "xml" ? "✓ copied" : "copy"}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre">
                  {errorTriggered ? cfg.errorXml : cfg.xml}
                </pre>
              </div>

              {/* Error mode toggle */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => { setErrorMode((v) => !v); reset(); }}
                    className={`relative w-10 h-5 rounded-full transition-colors ${errorMode ? "bg-red-600" : "bg-zinc-700"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${errorMode ? "left-5" : "left-0.5"}`} />
                  </div>
                  <span className="text-xs text-zinc-400">
                    Inject Validation Error{" "}
                    {errorMode && <span className="text-red-400">(YANG constraint fail)</span>}
                  </span>
                </label>

                <button
                  onClick={run}
                  disabled={running}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    errorMode ? "bg-red-600 text-white hover:bg-red-500" : "bg-cyan-500 text-zinc-950 hover:bg-cyan-400"
                  }`}
                >
                  {running ? "Sending..." : done || errorTriggered ? "Send Again ▶" : "Send Config ▶"}
                </button>
              </div>
            </div>

            {/* YANG Inspector */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
              <p className="text-xs text-zinc-500 mb-3 font-mono uppercase tracking-wider">YANG Path Inspector</p>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-zinc-600 w-16 shrink-0">Path</span>
                  <code className="text-cyan-400 font-mono text-xs break-all">{cfg.yangPath}</code>
                </div>
                <div className="flex gap-2">
                  <span className="text-zinc-600 w-16 shrink-0">Type</span>
                  <code className="text-emerald-400 font-mono text-xs">{cfg.yangType}</code>
                </div>
                <div className="flex gap-2">
                  <span className="text-zinc-600 w-16 shrink-0">Target</span>
                  <code className="text-zinc-300 font-mono text-xs">{cfg.target}</code>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-zinc-600 w-16 shrink-0">ZMQ msg</span>
                  <code className="text-amber-400 font-mono text-xs break-all flex-1">{cfg.zmqMsg}</code>
                  <button
                    onClick={() => copyText(cfg.zmqMsg, "zmq")}
                    className="text-xs font-mono text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
                  >
                    {copied === "zmq" ? "✓" : "⎘"}
                  </button>
                </div>
              </div>
            </div>

            {/* Latency timeline — shown after successful run */}
            {done && !errorMode && (
              <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
                <p className="text-xs text-zinc-500 mb-4 font-mono uppercase tracking-wider">Round-trip Latency Breakdown</p>
                <div className="space-y-3">
                  {LATENCY.map((l) => (
                    <div key={l.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400 font-mono">{l.label}</span>
                        <span className="text-cyan-400 font-mono">{l.ms}ms</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div
                          className="bg-cyan-500 h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${(l.ms / totalMs) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-zinc-800 flex justify-between text-xs font-mono">
                    <span className="text-zinc-500">Total round-trip</span>
                    <span className="text-emerald-400 font-semibold">{totalMs}ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right — Flow Visualizer */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Flow Visualizer</p>
              {(running || done) && !errorTriggered && (
                <span className={`text-xs font-mono tabular-nums ${running ? "text-cyan-400 animate-pulse" : "text-emerald-400"}`}>
                  {running ? `⏱ ${Math.round(liveMs)}ms` : `✓ ${totalMs}ms`}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-0">
              {/* NMS */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${nodeColor(0)}`}>
                <div className="font-semibold text-sm">NMS</div>
                <div className="text-xs mt-0.5 opacity-70">Network Management System</div>
              </div>

              {/* Arrow 0→1 */}
              <div className={`relative flex flex-col items-center py-1 transition-all duration-300 ${step >= 1 ? "opacity-100" : "opacity-20"}`}>
                {packetArrow === 0 && (
                  <div className="absolute z-10 pointer-events-none" style={{ left: "50%", top: 0, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#22d3ee", boxShadow: "0 0 12px 4px rgba(6,182,212,0.7)", animation: "packetSlide 0.65s ease-in-out forwards" }} />
                )}
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 1 ? "bg-cyan-500" : "bg-zinc-700"}`} />
                <div className="text-xs text-cyan-400 font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-center">
                  NETCONF edit-config (XML/SSH)
                </div>
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 1 ? "bg-cyan-500" : "bg-zinc-700"}`} />
              </div>

              {/* ConfD */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${nodeColor(1)}`}>
                <div className="font-semibold text-sm">ConfD</div>
                <div className="text-xs mt-0.5 opacity-70">
                  {errorTriggered ? "YANG validation FAILED — rollback" : "YANG validate → write CDB"}
                </div>
                {step >= 1 && !errorTriggered && (
                  <div className="absolute top-3 right-3 text-xs text-emerald-400 font-mono">✓ validated</div>
                )}
                {errorTriggered && (
                  <div className="mt-2 p-2 rounded bg-red-950/60 border border-red-800/40 text-xs font-mono text-red-300">
                    error-tag: invalid-value<br />
                    YANG constraint violation — CDB rollback triggered
                  </div>
                )}
              </div>

              {/* Arrow 1→2 */}
              <div className={`relative flex flex-col items-center py-1 transition-all duration-300 ${step >= 2 && !errorTriggered ? "opacity-100" : "opacity-20"}`}>
                {packetArrow === 1 && (
                  <div className="absolute z-10 pointer-events-none" style={{ left: "50%", top: 0, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#22d3ee", boxShadow: "0 0 12px 4px rgba(6,182,212,0.7)", animation: "packetSlide 0.65s ease-in-out forwards" }} />
                )}
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 2 && !errorTriggered ? "bg-cyan-500" : "bg-zinc-700"}`} />
                <div className="text-xs text-cyan-400 font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded">
                  subscription callback → comm_thread
                </div>
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 2 && !errorTriggered ? "bg-cyan-500" : "bg-zinc-700"}`} />
              </div>

              {/* OAM Agent */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${nodeColor(2)}`}>
                <div className="font-semibold text-sm">OAM Agent <span className="font-normal text-xs">(C++)</span></div>
                <div className="text-xs mt-0.5 opacity-70">comm_thread · oam_agent_config_mapper.cpp</div>
                {step >= 2 && !errorTriggered && (
                  <div className="mt-2 text-xs font-mono text-amber-400 truncate">
                    building {cfg.zmqMsg.split("{")[0].trim()}...
                  </div>
                )}
              </div>

              {/* Arrow 2→3 */}
              <div className={`relative flex flex-col items-center py-1 transition-all duration-300 ${step >= 3 && !errorTriggered ? "opacity-100" : "opacity-20"}`}>
                {packetArrow === 2 && (
                  <div className="absolute z-10 pointer-events-none" style={{ left: "50%", top: 0, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#f59e0b", boxShadow: "0 0 12px 4px rgba(245,158,11,0.7)", animation: "packetSlide 0.65s ease-in-out forwards" }} />
                )}
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 3 && !errorTriggered ? "bg-cyan-500" : "bg-zinc-700"}`} />
                <div className="text-xs text-amber-400 font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded">
                  ZMQ · OAM_GNB_CONFIG_REQ
                </div>
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 3 && !errorTriggered ? "bg-cyan-500" : "bg-zinc-700"}`} />
              </div>

              {/* gNB */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${step >= 3 && !errorTriggered ? nodeColor(3) : "border-zinc-800 bg-zinc-900/50 text-zinc-600"}`}>
                <div className="font-semibold text-sm">{cfg.target}</div>
                <div className="text-xs mt-0.5 opacity-70">
                  {done ? "✓ config applied" : "waiting for config..."}
                </div>
                {done && !errorTriggered && (
                  <div className="absolute top-3 right-3">
                    <span className="text-xs text-emerald-400 font-semibold animate-pulse">APPLIED</span>
                  </div>
                )}
              </div>
            </div>

            {done && !errorMode && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/40 text-xs text-emerald-400 font-mono text-center">
                ✓ Config flow complete · round trip ~3.7s simulated
              </div>
            )}

            {errorTriggered && (
              <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-700/40 text-xs text-red-400 font-mono">
                <div className="font-semibold mb-1">✗ Config rejected — ConfD rollback</div>
                <div className="text-red-300/70">YANG validation failed · NMS receives rpc-error · CDB unchanged · gNB not modified</div>
              </div>
            )}
          </div>
        </div>

        {/* Code tabs */}
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="flex border-b border-zinc-800">
            {(["cpp", "yang"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                className={`px-5 py-3 text-xs font-mono transition-colors ${
                  codeTab === tab ? "text-cyan-400 border-b-2 border-cyan-500 bg-zinc-800/50" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab === "cpp" ? "oam_agent_config_mapper.cpp" : "YANG model (3GPP)"}
              </button>
            ))}
          </div>
          <pre className="p-5 text-xs font-mono text-zinc-300 leading-relaxed overflow-auto max-h-60">
            {codeTab === "cpp" ? CPP_SNIPPET : YANG_SNIPPET}
          </pre>
        </div>

        {/* Other demos */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo/fm-dashboard" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            FM Alarm Dashboard →
          </Link>
          <Link href="/demo/oam-agent" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            OAM Agent Startup →
          </Link>
          <Link href="/demo/ras-nms" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            NMS / RAS →
          </Link>
        </div>
      </div>
    </main>
  );
}
