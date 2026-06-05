"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type TabId = "installshield" | "mobile";
type Platform = "android" | "ios";

const FILE_TREE = [
  { name: "NetworkMgmt.ism", icon: "📦", depth: 0, type: "project" },
  { name: "Components/", icon: "📁", depth: 0, type: "folder" },
  { name: "Core.ism", icon: "⚙️", depth: 1, type: "file" },
  { name: "DataService.ism", icon: "⚙️", depth: 1, type: "file" },
  { name: "UI.ism", icon: "⚙️", depth: 1, type: "file" },
  { name: "Setup/", icon: "📁", depth: 0, type: "folder" },
  { name: "Prerequisites.ism", icon: "📄", depth: 1, type: "file" },
  { name: "LaunchConditions.ism", icon: "📄", depth: 1, type: "file" },
  { name: "Release/x64/", icon: "📁", depth: 0, type: "folder" },
  { name: "Signature.spc", icon: "🔑", depth: 0, type: "cert" },
];

const IS_STEPS = [
  { label: "Configure", sublabel: "Parse .ism · validate features · resolve 847 file paths" },
  { label: "Compile", sublabel: "Generate MSI database · 68 tables · registry entries" },
  { label: "Package", sublabel: "Compress files into cabinet · MSZIP 142MB → 67MB" },
  { label: "Sign", sublabel: "Authenticode SHA-256 + RFC 3161 timestamp server" },
  { label: "Deploy", sublabel: "MSI output ready · SHA256 checksum verified ✓" },
];

const ANDROID_STEPS = [
  { label: "Git Trigger", sublabel: "Push to main → CI webhook → Gradle daemon" },
  { label: "Gradle Sync", sublabel: "build.gradle · dependency resolution · maven.google.com" },
  { label: "Compile", sublabel: "javac · R.java generation · 847 classes compiled" },
  { label: "Unit Tests", sublabel: "JUnit4 · 124 tests passed · 0 failures" },
  { label: "Sign APK", sublabel: "release-key.jks · v2 APK Signature Scheme" },
  { label: "Distribute", sublabel: "Firebase App Distribution → QA group (8 testers)" },
];

const IOS_STEPS = [
  { label: "Git Trigger", sublabel: "Push to main → Fastlane webhook fired" },
  { label: "Pod Install", sublabel: "CocoaPods 1.14.2 · 42 pods resolved" },
  { label: "Xcode Build", sublabel: "LLVM · Swift 5.9 · arm64 · Release config" },
  { label: "XCTest", sublabel: "68 tests passed · 0 failures · coverage 78%" },
  { label: "Archive", sublabel: "Release build + distribution provisioning profile" },
  { label: "TestFlight", sublabel: "IPA uploaded → Apple review pipeline" },
];

const IS_LOGS = [
  'Reading project: NetworkMgmt.ism (InstallShield v23.1)',
  'Validating 3 components: Core, DataService, UI',
  'Resolving 847 source files across 12 feature sets',
  'Compiling MSI database — 68 tables generated',
  'Writing registry: HKLM\\Software\\TMA\\NetworkMgmt',
  'Building cabinet: data1.cab...',
  'Compressing: 142MB → 67MB (53% ratio, MSZIP)',
  'Signing with Authenticode: SHA-256',
  'Timestamp via RFC 3161 server: timestamp.verisign.com',
  'Signature verified: CN=TMA Solutions, O=TMA, C=VN',
  'Output: NetworkMgmt_v2.1.4_x64.msi (68MB) — SUCCESS',
];

const ANDROID_LOGS = [
  '> Gradle task queue initialized',
  '> Task :app:preBuild UP-TO-DATE',
  '> Task :app:generateDebugResources',
  'Downloading com.android.support:appcompat:28.0.0...',
  '> Task :app:compileReleaseJavaWithJavac',
  'Compiled 847 classes in 12.4s',
  '> Task :app:test',
  'Tests run: 124, Failures: 0, Errors: 0, Skipped: 2',
  '> Task :app:packageReleaseApk',
  'Signing APK with keystore: release-key.jks (v2 scheme)',
  'APK signed and verified successfully',
  'BUILD SUCCESSFUL in 1m 43s',
  'Uploading to Firebase App Distribution...',
  '✓ NetworkMgmt-release-2.1.4.apk distributed to 8 testers',
];

const IOS_LOGS = [
  'Fastlane: lane :beta triggered',
  '$ pod install --repo-update',
  'Resolving dependencies for Podfile (42 pods)...',
  'Pod installation complete!',
  '=== BUILD TARGET NetworkMgmt ===',
  'CompileSwift normal arm64 (Swift 5.9)',
  'CompileSwiftSources: 312 source files',
  'Linked NetworkMgmt (arm64) in 8.3 seconds',
  '=== RUN TEST SUITE ===',
  'Test Suite: NetworkMgmtTests — 68 tests, 0 failures',
  '=== ARCHIVE ===',
  'Exporting IPA with distribution provisioning profile',
  'Uploading to TestFlight (build 1.4.2 / 47)...',
  '✓ Build uploaded successfully — pending Apple review',
];

const WIZARD_STEPS = ["Welcome", "License", "Directory", "Installing", "Finish"];

export default function InstallerPage() {
  const [tab, setTab] = useState<TabId>("installshield");
  const [platform, setPlatform] = useState<Platform>("android");
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [wizardStep, setWizardStep] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const pipelineSteps = tab === "installshield" ? IS_STEPS : platform === "android" ? ANDROID_STEPS : IOS_STEPS;
  const logLines = tab === "installshield" ? IS_LOGS : platform === "android" ? ANDROID_LOGS : IOS_LOGS;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStep(-1);
    setRunning(false);
    setDone(false);
    setLogs([]);
    setWizardStep(0);
  };

  const runBuild = () => {
    if (running) return;
    reset();
    setRunning(true);

    const stepDelay = 1200;
    const logsPerStep = Math.ceil(logLines.length / pipelineSteps.length);

    pipelineSteps.forEach((_, i) => {
      const t = setTimeout(() => {
        setStep(i);
        const start = i * logsPerStep;
        const end = Math.min(start + logsPerStep, logLines.length);
        for (let l = start; l < end; l++) {
          const lt = setTimeout(() => {
            setLogs((prev) => [...prev, logLines[l]]);
          }, (l - start) * 300);
          timers.current.push(lt);
        }
        if (i === pipelineSteps.length - 1) {
          const doneT = setTimeout(() => {
            setRunning(false);
            setDone(true);
          }, logsPerStep * 300 + 200);
          timers.current.push(doneT);
        }
      }, i * stepDelay);
      timers.current.push(t);
    });
  };

  const nodeColor = (i: number) => {
    const isActive = step === i;
    const isDone = step > i;
    if (isDone) return "border-zinc-600 bg-zinc-800/40 text-zinc-300";
    if (isActive) {
      if (tab === "installshield") return "border-blue-500 bg-blue-500/10 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.25)]";
      if (platform === "android") return "border-emerald-500 bg-emerald-500/10 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.25)]";
      return "border-violet-500 bg-violet-500/10 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.25)]";
    }
    return "border-zinc-700 bg-zinc-900 text-zinc-600";
  };

  const accentColor = tab === "installshield" ? "text-blue-400" : platform === "android" ? "text-emerald-400" : "text-violet-400";
  const btnBg = tab === "installshield" ? "bg-blue-600 hover:bg-blue-500" : platform === "android" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-violet-600 hover:bg-violet-500";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="font-mono text-cyan-400 font-semibold text-sm hover:text-cyan-300 transition-colors">
            ← chi.dev
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-400">InstallShield / Mobile App</span>
          <span className="ml-auto text-xs text-zinc-600 hidden md:block">TMA Solutions · Build & Deployment</span>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            TMA Solutions · InstallShield / Mobile App
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Build & Deployment Pipeline</h1>
          <p className="text-zinc-400 max-w-2xl leading-relaxed">
            Multi-platform release engineering: InstallShield MSI packages for Windows deployment and Android/iOS CI/CD pipelines with automated testing, signing, and distribution.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 mb-6 p-1 bg-zinc-900 rounded-xl border border-zinc-800 w-fit">
          {[
            { id: "installshield" as TabId, label: "InstallShield / Windows", icon: "🪟" },
            { id: "mobile" as TabId, label: "Mobile App CI/CD", icon: "📱" },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); reset(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Mobile platform toggle */}
        {tab === "mobile" && (
          <div className="flex gap-2 mb-6">
            {(["android", "ios"] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => { setPlatform(p); reset(); }}
                className={`px-4 py-1.5 rounded-lg border text-sm transition-all ${
                  platform === p
                    ? p === "android" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-violet-500 bg-violet-500/10 text-violet-400"
                    : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {p === "android" ? "🤖 Android" : "🍎 iOS"}
              </button>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left — File tree (IS only) + Pipeline flow */}
          <div className="flex flex-col gap-4">
            {tab === "installshield" && (
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-3">Project Structure (.ism)</p>
                <div className="font-mono text-xs space-y-0.5">
                  {FILE_TREE.map((f, i) => (
                    <div key={i} className={`flex items-center gap-1.5 py-0.5 ${f.depth === 1 ? "pl-4 text-zinc-500" : f.type === "project" ? "text-blue-300 font-semibold" : "text-zinc-400"}`}>
                      <span>{f.icon}</span>
                      <span>{f.name}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-zinc-600 font-mono flex gap-4">
                  <span>Platforms: <span className="text-zinc-400">x64 / x86</span></span>
                  <span>Compression: <span className="text-zinc-400">MSZIP</span></span>
                  <span>Signing: <span className="text-zinc-400">Authenticode</span></span>
                </div>
              </div>
            )}

            {/* Pipeline flow */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900 flex-1">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                  {tab === "installshield" ? "MSI Build Pipeline" : `${platform === "android" ? "Android" : "iOS"} CI/CD Pipeline`}
                </p>
                <div className="flex gap-2">
                  {(done || step >= 0) && (
                    <button onClick={reset} className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded-lg hover:border-zinc-500 transition-colors">Reset</button>
                  )}
                  <button
                    onClick={runBuild}
                    disabled={running}
                    className={`text-xs px-4 py-1.5 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${btnBg}`}
                  >
                    {running ? "Building..." : done ? "Rebuild ▶" : "Run Build ▶"}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-0">
                {pipelineSteps.map((s, i) => (
                  <div key={i}>
                    <div className={`p-4 rounded-xl border-2 transition-all duration-500 ${nodeColor(i)}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm">{s.label}</div>
                          <div className="text-xs mt-0.5 opacity-60">{s.sublabel}</div>
                        </div>
                        {step > i && <span className={`text-xs font-mono ${accentColor} shrink-0`}>✓</span>}
                        {step === i && <span className="w-2 h-2 rounded-full animate-pulse bg-current shrink-0" />}
                      </div>
                    </div>
                    {i < pipelineSteps.length - 1 && (
                      <div className={`flex justify-center py-1 text-sm transition-colors duration-300 ${step > i ? "text-emerald-600" : "text-zinc-800"}`}>↓</div>
                    )}
                  </div>
                ))}
              </div>

              {done && tab === "mobile" && (
                <div className={`mt-4 p-3 rounded-lg text-xs font-mono ${platform === "android" ? "bg-emerald-900/20 border border-emerald-700/30 text-emerald-400" : "bg-violet-900/20 border border-violet-700/30 text-violet-400"}`}>
                  {platform === "android" ? (
                    <>
                      <div className="font-semibold mb-1">✓ APK signed & distributed</div>
                      <div className="text-zinc-500">NetworkMgmt-release-2.1.4.apk · 18.4MB · 8 testers notified</div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold mb-1">✓ IPA uploaded to TestFlight</div>
                      <div className="text-zinc-500">NetworkMgmt-1.4.2(47).ipa · 23.1MB · Apple review pending</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right — Build log + Wizard (IS) / Artifact (mobile) */}
          <div className="flex flex-col gap-4">
            {/* Build log terminal */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-600/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600/60" />
                </div>
                <span className="text-xs text-zinc-500 font-mono ml-1">
                  {tab === "installshield" ? "build-output.log" : platform === "android" ? "gradle-build.log" : "xcode-build.log"}
                </span>
                {running && <span className="ml-auto text-xs text-amber-400 animate-pulse font-mono">● BUILDING</span>}
                {done && <span className="ml-auto text-xs text-emerald-400 font-mono">● SUCCESS</span>}
              </div>
              <div ref={logRef} className="p-4 h-56 overflow-auto">
                {logs.length === 0 ? (
                  <span className="text-zinc-700 text-xs font-mono">$ waiting for build trigger...</span>
                ) : (
                  logs.map((line, i) => (
                    <div key={i} className={`text-xs font-mono leading-relaxed ${
                      line.startsWith("✓") || line.includes("SUCCESSFUL") || line.includes("SUCCESS") ? "text-emerald-300" :
                      line.includes("ERROR") || line.includes("FAILURE") ? "text-red-300" :
                      line.startsWith(">") || line.startsWith("===") ? "text-blue-300" :
                      "text-zinc-400"
                    }`}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* InstallShield Wizard mock */}
            {tab === "installshield" && done && (
              <div className="rounded-xl border border-zinc-700 bg-zinc-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/50 border-b border-zinc-700">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  </div>
                  <span className="text-xs text-zinc-300 font-mono ml-1">NetworkMgmt v2.1.4 Setup Wizard</span>
                </div>

                <div className="p-5">
                  {/* Progress steps */}
                  <div className="flex gap-1 mb-5">
                    {WIZARD_STEPS.map((s, i) => (
                      <div key={i} className={`flex-1 text-center py-1 rounded text-xs font-mono transition-all ${
                        wizardStep === i ? "bg-blue-600 text-white" :
                        wizardStep > i ? "bg-emerald-900/40 text-emerald-400" :
                        "text-zinc-600 bg-zinc-900"
                      }`}>
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  <div className="min-h-[80px]">
                    {wizardStep === 0 && (
                      <div>
                        <div className="text-sm font-semibold mb-1">Welcome to NetworkMgmt Setup</div>
                        <div className="text-xs text-zinc-400">This wizard installs Network Management System v2.1.4. Click Next to continue.</div>
                      </div>
                    )}
                    {wizardStep === 1 && (
                      <div>
                        <div className="text-sm font-semibold mb-2">License Agreement</div>
                        <div className="text-xs text-zinc-500 border border-zinc-700 rounded p-2 h-10 overflow-hidden leading-relaxed">
                          TMA Solutions Software License Agreement. All rights reserved. Unauthorized distribution is prohibited...
                        </div>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="accent-blue-500" />
                          <span className="text-xs text-zinc-400">I accept the license terms</span>
                        </label>
                      </div>
                    )}
                    {wizardStep === 2 && (
                      <div>
                        <div className="text-sm font-semibold mb-2">Installation Directory</div>
                        <div className="flex items-center gap-2">
                          <input readOnly value="C:\Program Files\TMA\NetworkMgmt\" className="flex-1 text-xs font-mono bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-zinc-300" />
                          <button className="text-xs px-3 py-1.5 bg-zinc-700 rounded text-zinc-300 hover:bg-zinc-600 transition-colors">Browse</button>
                        </div>
                        <div className="text-xs text-zinc-600 mt-1 font-mono">Required: 142 MB · Available: 48.3 GB</div>
                      </div>
                    )}
                    {wizardStep === 3 && (
                      <div>
                        <div className="text-sm font-semibold mb-2">Installing...</div>
                        <div className="w-full bg-zinc-700 rounded-full h-2 mb-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: "74%" }} />
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">Copying DataService.dll... (74%)</div>
                      </div>
                    )}
                    {wizardStep === 4 && (
                      <div>
                        <div className="text-emerald-400 text-sm font-semibold mb-1">✓ Installation Complete</div>
                        <div className="text-xs text-zinc-400 mb-1">NetworkMgmt v2.1.4 installed successfully.</div>
                        <div className="text-xs text-zinc-500 font-mono">Authenticode signature verified ✓</div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between mt-4 pt-3 border-t border-zinc-700">
                    <button
                      onClick={() => setWizardStep((v) => Math.max(0, v - 1))}
                      disabled={wizardStep === 0}
                      className="text-xs px-4 py-1.5 border border-zinc-600 rounded text-zinc-400 disabled:opacity-30 hover:border-zinc-500 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setWizardStep((v) => Math.min(WIZARD_STEPS.length - 1, v + 1))}
                      disabled={wizardStep === WIZARD_STEPS.length - 1}
                      className="text-xs px-4 py-1.5 bg-blue-600 rounded text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                    >
                      {wizardStep >= WIZARD_STEPS.length - 2 ? "Finish" : "Next →"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Artifact output */}
            {done && tab === "installshield" && (
              <div className="p-4 rounded-xl border border-blue-800/40 bg-blue-900/10 text-xs font-mono">
                <div className="text-blue-400 font-semibold mb-2">✓ Build artifacts</div>
                <div className="space-y-1 text-zinc-400">
                  <div>📦 NetworkMgmt_v2.1.4_x64.msi <span className="text-zinc-200">68 MB</span></div>
                  <div>📦 NetworkMgmt_v2.1.4_x86.msi <span className="text-zinc-200">54 MB</span></div>
                  <div>🔑 Authenticode: <span className="text-emerald-400">SHA-256 verified ✓</span></div>
                  <div>🔢 SHA256: <span className="text-zinc-300 font-mono text-xs">a3f1c9d2b84e...</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo/ras-nms" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            ← NMS / RAS Demo
          </Link>
          <Link href="/demo/cm-flow" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            5G OAM: CM Flow →
          </Link>
          <Link href="/demo/oam-agent" className="text-sm px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors">
            5G OAM: OAM Agent →
          </Link>
        </div>
      </div>
    </main>
  );
}
