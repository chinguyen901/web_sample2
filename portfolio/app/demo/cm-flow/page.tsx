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
    yangPath: "/ManagedElement/GNBDUFunction/NRCellDU/ssbPeriodicity",
    yangType: "uint8",
    zmqMsg: "OAM_GNB_CONFIG_REQ { cell_id=1, ssb_period=20, ssb_offset=0 }",
    target: "gNB-DU",
  },
} as const;

type PresetKey = keyof typeof CONFIG_PRESETS;

const FLOW_STEPS = [
  { id: "nms", label: "NMS", sublabel: "Network Management System", edge: "NETCONF edit-config (XML/SSH)" },
  { id: "confd1", label: "ConfD", sublabel: "YANG validate", edge: "write CDB ✓" },
  { id: "confd2", label: "ConfD", sublabel: "CDB write + notify", edge: "subscription callback → comm_thread" },
  { id: "oam", label: "OAM Agent", sublabel: "oam_agent_config_mapper.cpp", edge: "" },
  { id: "zmq", label: "ZMQ", sublabel: "OAM_GNB_CONFIG_REQ", edge: "apply config ✓" },
  { id: "gnb", label: "", sublabel: "config applied ✓", edge: "" },
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
  const [codeTab, setCodeTab] = useState<"cpp" | "yang">("cpp");
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cfg = CONFIG_PRESETS[preset];

  const reset = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setRunning(false);
    setStep(-1);
    setDone(false);
  };

  useEffect(() => { reset(); }, [preset]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    if (running) return;
    reset();
    setRunning(true);
    const delays = [0, 700, 1400, 2200, 3000, 3700];
    delays.forEach((d, i) => {
      const t = setTimeout(() => {
        setStep(i);
        if (i === delays.length - 1) {
          setRunning(false);
          setDone(true);
        }
      }, d);
      timerRef.current.push(t);
    });
  };

  const nodeColor = (i: number) => {
    if (step < i) return "border-zinc-700 bg-zinc-900 text-zinc-500";
    if (step === i) return "border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]";
    return "border-emerald-600 bg-emerald-900/20 text-emerald-400";
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
                <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
                  <span className="text-xs font-mono text-zinc-500">NETCONF edit-config · port {preset === "power" ? "2100" : "2102"}</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre">
                  {cfg.xml}
                </pre>
              </div>

              <button
                onClick={run}
                disabled={running}
                className="mt-4 w-full py-2.5 rounded-lg bg-cyan-500 text-zinc-950 font-semibold text-sm hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {running ? "Sending..." : done ? "Send Again ▶" : "Send Config ▶"}
              </button>
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
                <div className="flex gap-2">
                  <span className="text-zinc-600 w-16 shrink-0">ZMQ msg</span>
                  <code className="text-amber-400 font-mono text-xs break-all">{cfg.zmqMsg}</code>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Flow Visualizer */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
            <p className="text-xs text-zinc-500 mb-5 font-mono uppercase tracking-wider">Flow Visualizer</p>

            <div className="flex flex-col gap-0">
              {/* NMS */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${nodeColor(0)}`}>
                <div className="font-semibold text-sm">NMS</div>
                <div className="text-xs mt-0.5 opacity-70">Network Management System</div>
              </div>

              {/* Arrow 0→1 */}
              <div className={`flex flex-col items-center py-1 transition-all duration-300 ${step >= 1 ? "opacity-100" : "opacity-20"}`}>
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 1 ? "bg-cyan-500" : "bg-zinc-700"}`} />
                <div className="text-xs text-cyan-400 font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-center">
                  NETCONF edit-config (XML/SSH)
                </div>
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 1 ? "bg-cyan-500" : "bg-zinc-700"}`} />
              </div>

              {/* ConfD */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${nodeColor(1)}`}>
                <div className="font-semibold text-sm">ConfD</div>
                <div className="text-xs mt-0.5 opacity-70">YANG validate → write CDB</div>
                {step >= 1 && (
                  <div className="absolute top-3 right-3 text-xs text-emerald-400 font-mono">✓ validated</div>
                )}
              </div>

              {/* Arrow 1→2 */}
              <div className={`flex flex-col items-center py-1 transition-all duration-300 ${step >= 2 ? "opacity-100" : "opacity-20"}`}>
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 2 ? "bg-cyan-500" : "bg-zinc-700"}`} />
                <div className="text-xs text-cyan-400 font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded">
                  subscription callback → comm_thread
                </div>
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 2 ? "bg-cyan-500" : "bg-zinc-700"}`} />
              </div>

              {/* OAM Agent */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${nodeColor(2)}`}>
                <div className="font-semibold text-sm">OAM Agent <span className="font-normal text-xs">(C++)</span></div>
                <div className="text-xs mt-0.5 opacity-70">comm_thread · oam_agent_config_mapper.cpp</div>
                {step >= 2 && (
                  <div className="mt-2 text-xs font-mono text-amber-400 truncate">
                    building {cfg.zmqMsg.split("{")[0].trim()}...
                  </div>
                )}
              </div>

              {/* Arrow 2→3 */}
              <div className={`flex flex-col items-center py-1 transition-all duration-300 ${step >= 3 ? "opacity-100" : "opacity-20"}`}>
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 3 ? "bg-cyan-500" : "bg-zinc-700"}`} />
                <div className="text-xs text-amber-400 font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded">
                  ZMQ · OAM_GNB_CONFIG_REQ
                </div>
                <div className={`w-px h-4 transition-colors duration-300 ${step >= 3 ? "bg-cyan-500" : "bg-zinc-700"}`} />
              </div>

              {/* gNB */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${step >= 3 ? nodeColor(3) : nodeColor(99)}`}>
                <div className="font-semibold text-sm">{cfg.target}</div>
                <div className="text-xs mt-0.5 opacity-70">
                  {done ? "✓ config applied" : "waiting for config..."}
                </div>
                {done && (
                  <div className="absolute top-3 right-3">
                    <span className="text-xs text-emerald-400 font-semibold animate-pulse">APPLIED</span>
                  </div>
                )}
              </div>
            </div>

            {done && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/40 text-xs text-emerald-400 font-mono text-center">
                ✓ Config flow complete · round trip ~3.7s simulated
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
        </div>
      </div>
    </main>
  );
}
