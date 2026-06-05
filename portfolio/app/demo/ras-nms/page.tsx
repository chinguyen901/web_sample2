"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const DEVICE_TYPES = [
  { id: "tn-foss", label: "TN-FOSS", sublabel: "Backbone Router", protocol: "SNMP v2c", count: 12, color: "text-blue-400", border: "border-blue-500", bg: "bg-blue-500/10" },
  { id: "e-passtel", label: "E-PASSTEL", sublabel: "Ethernet Devices", protocol: "NETCONF", count: 28, color: "text-emerald-400", border: "border-emerald-500", bg: "bg-emerald-500/10" },
  { id: "of-passtel", label: "OF-PASSTEL", sublabel: "Optical Devices", protocol: "SNMP v3", count: 8, color: "text-violet-400", border: "border-violet-500", bg: "bg-violet-500/10" },
  { id: "if-passtel", label: "IF-PASSTEL", sublabel: "Access Routers", protocol: "RESTCONF", count: 45, color: "text-amber-400", border: "border-amber-500", bg: "bg-amber-500/10" },
] as const;

type DeviceId = typeof DEVICE_TYPES[number]["id"];

const FLOW_NODES = [
  { id: "devices", label: "Network Devices", sublabel: "TN-FOSS · E-PASSTEL · OF-PASSTEL · IF-PASSTEL", msg: "polling via SNMP / NETCONF / RESTCONF..." },
  { id: "ems", label: "EMS Collection Layer", sublabel: "EMS1 / EMS2 / ... / EMS N", msg: "aggregating metrics from all managed elements..." },
  { id: "ddc", label: "DDC Server", sublabel: "Python · BBU_info.service · SSE · event_changes()", msg: "processing event_changes(), detecting diffs..." },
  { id: "kafka", label: "Kafka Bus", sublabel: "Topic: network-metrics · 3 partitions", msg: "streaming 847 events to consumers..." },
  { id: "idb", label: "IDB Server", sublabel: "PostgreSQL · Application / Data Lake", msg: "writing batch rows to network_metrics table..." },
  { id: "zabbix", label: "Zabbix Server", sublabel: "Trigger evaluation · alerting rules", msg: "evaluating 24 trigger expressions..." },
  { id: "virtuora", label: "Virtuora VXM", sublabel: "Data management · Display · vSure", msg: "refreshing dashboards and reports..." },
];

const PYTHON_SNIPPET = `# snmp_collector.py — DDC Server data ingestion
import asyncio
from pysnmp.hlapi.asyncio import *
from kafka import KafkaProducer
import json, time

producer = KafkaProducer(
    bootstrap_servers=['kafka:9092'],
    value_serializer=lambda v: json.dumps(v).encode()
)

async def poll_device(host: str, community: str):
    """SNMP GET for interface metrics."""
    iterator = getCmd(
        SnmpEngine(),
        CommunityData(community, mpModel=1),
        UdpTransportTarget((host, 161), timeout=2, retries=3),
        ContextData(),
        ObjectType(ObjectIdentity('IF-MIB', 'ifDescr', 1)),
        ObjectType(ObjectIdentity('IF-MIB', 'ifOperStatus', 1)),
        ObjectType(ObjectIdentity('IF-MIB', 'ifInOctets', 1)),
    )
    errorIndication, errorStatus, _, varBinds = await iterator
    if not errorIndication and not errorStatus:
        payload = {h: str(v) for h, v in varBinds}
        payload['host'] = host
        payload['ts'] = time.time()
        producer.send('network-metrics', payload)

async def event_changes():
    """Detect config diffs and publish change events."""
    while True:
        hosts = await get_device_list()  # from DDC database
        tasks = [poll_device(h, 'public') for h in hosts]
        await asyncio.gather(*tasks)
        await asyncio.sleep(30)  # 30s poll interval`;

function getLogs(device: typeof DEVICE_TYPES[number]) {
  return [
    `Initializing SNMP engine for ${device.label} (${device.protocol})...`,
    `Discovering ${device.count} ${device.sublabel} — broadcast scan complete`,
    `EMS1: Collected 847 metrics · EMS2: 612 metrics · EMS N: 234 metrics`,
    `DDC Server: event_changes() — 12 config diffs detected vs last snapshot`,
    `Kafka producer: publishing 847 events to topic 'network-metrics'`,
    `Kafka broker: all partitions ACK received — offset 18472`,
    `IDB PostgreSQL: BEGIN; INSERT ${device.count * 71} rows INTO network_metrics; COMMIT;`,
    `IDB: ${(device.count * 71).toLocaleString()} rows written in 42ms — index updated`,
    `Zabbix: evaluating 24 trigger expressions against latest metrics`,
    `Zabbix: 0 new alerts — all thresholds nominal`,
    `Virtuora VXM: dashboard refresh triggered — 3 panels updated`,
    `Monitoring cycle complete · next poll in 30s · devices healthy: ${device.count}/${device.count}`,
  ];
}

export default function RasNmsPage() {
  const [activeDevice, setActiveDevice] = useState<DeviceId>("tn-foss");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [kafkaCount, setKafkaCount] = useState(0);
  const [dbCount, setDbCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const device = DEVICE_TYPES.find((d) => d.id === activeDevice)!;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = (line: string) => {
    const ts = new Date().toISOString().replace("T", " ").slice(0, 23);
    setLogs((prev) => [...prev, `[${ts}][INFO ] ${line}`]);
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(false);
    setStep(-1);
    setDone(false);
    setLogs([]);
    setShowAlert(false);
  };

  const startMonitoring = () => {
    if (running) return;
    reset();
    setRunning(true);
    const logLines = getLogs(device);
    const nodeDelays = [0, 900, 1800, 2700, 3500, 4300, 5100];

    nodeDelays.forEach((d, i) => {
      const t = setTimeout(() => {
        setStep(i);
        addLog(logLines[i]);
        if (i >= 3) setKafkaCount((prev) => prev + Math.floor(Math.random() * 200 + 600));
        if (i >= 4) setDbCount((prev) => prev + device.count * 71);
        if (i === nodeDelays.length - 1) {
          const doneT = setTimeout(() => {
            addLog(logLines[logLines.length - 1]);
            setRunning(false);
            setDone(true);
          }, 700);
          timers.current.push(doneT);
        }
      }, d);
      timers.current.push(t);
    });

    // Extra logs between steps
    [1200, 2200, 3100].forEach((d, i) => {
      const t = setTimeout(() => addLog(logLines[i + 7]), d);
      timers.current.push(t);
    });
  };

  const injectFault = () => {
    setShowAlert(true);
    setAlertCount((prev) => prev + 1);
    const ts = new Date().toISOString().replace("T", " ").slice(0, 23);
    setLogs((prev) => [
      ...prev,
      `[${ts}][WARN ] Zabbix trigger FIRED: ${device.label}-03 interface DOWN — severity HIGH`,
      `[${ts}][ALERT] Notification dispatched → ops-team@tma.com.vn`,
    ]);
  };

  const nodeColor = (i: number) => {
    if (step < i) return "border-zinc-700 bg-zinc-900 text-zinc-500";
    if (step === i) return "border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.25)]";
    return "border-zinc-600 bg-zinc-800/40 text-zinc-300";
  };

  const totalDevices = DEVICE_TYPES.reduce((a, d) => a + d.count, 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="font-mono text-cyan-400 font-semibold text-sm hover:text-cyan-300 transition-colors">
            ← chi.dev
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-400">Network Management System</span>
          <span className="ml-auto text-xs text-zinc-600 hidden md:block">TMA Solutions · Resource Assurance System</span>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            TMA Solutions · Network Management System
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Resource Assurance System (RAS)</h1>
          <p className="text-zinc-400 max-w-2xl leading-relaxed">
            End-to-end telemetry pipeline: 4 device families polled via SNMP/NETCONF → EMS collection layer → DDC Server Python processing → Kafka streaming → PostgreSQL storage → Virtuora VXM visualization + Zabbix alerting.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: "Total Devices", value: totalDevices.toString(), color: "text-zinc-200" },
            { label: "Kafka Events", value: kafkaCount > 0 ? kafkaCount.toLocaleString() : "—", color: "text-amber-400" },
            { label: "DB Records", value: dbCount > 0 ? dbCount.toLocaleString() : "—", color: "text-blue-400" },
            { label: "Active Alerts", value: alertCount.toString(), color: alertCount > 0 ? "text-red-400" : "text-zinc-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900 font-mono">
              <span className={`font-bold text-base ${color}`}>{value}</span>
              <span className="text-zinc-500 text-xs">{label}</span>
            </div>
          ))}

          <div className="ml-auto flex gap-2 flex-wrap">
            <button
              onClick={startMonitoring}
              disabled={running}
              className="text-sm px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {running ? "Monitoring..." : done ? "Run Again ▶" : "Start Monitoring ▶"}
            </button>
            <button
              onClick={injectFault}
              className="text-sm px-4 py-2 rounded-lg border border-red-700/60 text-red-400 hover:bg-red-900/20 transition-colors"
            >
              Inject Fault
            </button>
            {(done || logs.length > 0) && (
              <button onClick={reset} className="text-sm px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 transition-colors">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Device selector */}
        <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-3">Device Family</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {DEVICE_TYPES.map((d) => (
              <button
                key={d.id}
                onClick={() => { setActiveDevice(d.id); reset(); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  activeDevice === d.id ? `${d.border} ${d.bg} ${d.color}` : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                <span className="font-semibold">{d.label}</span>
                <span className="text-xs opacity-70">{d.sublabel}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 font-mono`}>{d.count}</span>
              </button>
            ))}
          </div>
          <div className="text-xs text-zinc-600 font-mono flex gap-6">
            <span>Protocol: <span className="text-zinc-400">{device.protocol}</span></span>
            <span>Devices: <span className="text-zinc-400">{device.count}</span></span>
            <span>Poll: <span className="text-zinc-400">30s interval</span></span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left — Architecture Flow */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
            <p className="text-xs text-zinc-500 mb-5 font-mono uppercase tracking-wider">RAS Architecture Flow</p>

            <div className="flex flex-col gap-0">
              {FLOW_NODES.map((node, i) => (
                <div key={node.id}>
                  <div className={`p-4 rounded-xl border-2 transition-all duration-500 ${nodeColor(i)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm">{node.label}</div>
                        <div className="text-xs mt-0.5 opacity-60">{node.sublabel}</div>
                      </div>
                      {step > i && <span className="text-xs text-emerald-500 font-mono shrink-0">✓</span>}
                      {step === i && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 mt-1" />}
                    </div>
                    {step === i && (
                      <div className="mt-2 text-xs font-mono text-emerald-400">{node.msg}</div>
                    )}
                  </div>
                  {i < FLOW_NODES.length - 1 && (
                    <div className={`flex justify-center py-1 transition-colors duration-500 ${step > i ? "text-emerald-600" : step === i ? "text-emerald-600 animate-pulse" : "text-zinc-800"}`}>
                      <div className="flex flex-col items-center">
                        <div className={`w-px h-3 ${step >= i ? "bg-emerald-700" : "bg-zinc-800"}`} />
                        <span className="text-sm">↓</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {done && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-xs text-emerald-400 font-mono text-center">
                ✓ Cycle complete · {device.count} devices · {kafkaCount.toLocaleString()} events · {dbCount.toLocaleString()} DB rows
              </div>
            )}
          </div>

          {/* Right — Log + Zabbix alert + Code */}
          <div className="flex flex-col gap-4">
            {/* Log terminal */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-600/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600/60" />
                </div>
                <span className="text-xs text-zinc-500 font-mono ml-1">ras-collector.log</span>
                {running && <span className="ml-auto text-xs text-emerald-400 animate-pulse font-mono">● LIVE</span>}
              </div>
              <div ref={logRef} className="p-4 h-52 overflow-auto">
                {logs.length === 0 ? (
                  <span className="text-zinc-700 text-xs font-mono">$ waiting — click Start Monitoring...</span>
                ) : (
                  logs.map((line, i) => (
                    <div key={i} className={`text-xs font-mono leading-relaxed ${
                      line.includes("[ALERT]") ? "text-red-300" :
                      line.includes("[WARN ]") ? "text-amber-300" :
                      "text-emerald-300"
                    }`}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Zabbix alert panel */}
            {showAlert && (
              <div className="p-4 rounded-xl border border-red-800/50 bg-red-900/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-semibold text-red-300 font-mono text-sm">ZABBIX ALERT FIRED</span>
                  <button onClick={() => setShowAlert(false)} className="ml-auto text-zinc-600 hover:text-zinc-400 text-xs">✕</button>
                </div>
                <div className="text-xs text-zinc-400 space-y-1 font-mono">
                  <div>Trigger: <span className="text-red-300">{device.label}-03 — interface DOWN</span></div>
                  <div>Severity: <span className="text-red-400 font-semibold">HIGH</span></div>
                  <div>Host: <span className="text-zinc-300">{device.sublabel} (IP: 10.0.1.{Math.floor(Math.random() * 100 + 100)})</span></div>
                  <div>Action: <span className="text-zinc-300">Email + SMS → ops-team@tma.com.vn</span></div>
                </div>
              </div>
            )}

            {/* Python code snippet */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden flex-1">
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-mono">snmp_collector.py</span>
                <span className="text-xs text-zinc-600">Python · asyncio · pysnmp · kafka-python</span>
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-300 leading-relaxed overflow-auto max-h-56">
                {PYTHON_SNIPPET}
              </pre>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo/cm-flow" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            5G OAM: CM Flow →
          </Link>
          <Link href="/demo/fm-dashboard" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            5G OAM: FM Dashboard →
          </Link>
          <Link href="/demo/installer" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            InstallShield / Mobile →
          </Link>
        </div>
      </div>
    </main>
  );
}
