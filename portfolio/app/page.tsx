"use client";

import { useState } from "react";

const skills = [
  {
    icon: "🐍",
    title: "Python Automation",
    desc: "Custom scripts that automate repetitive tasks, data processing, and workflow orchestration.",
  },
  {
    icon: "🌐",
    title: "Web Scraping",
    desc: "Extract structured data from any website using Playwright, Selenium, and BeautifulSoup.",
  },
  {
    icon: "🤖",
    title: "Telegram Bots",
    desc: "Monitor channels, process signals, send alerts, and trigger automated actions.",
  },
  {
    icon: "🔌",
    title: "API Integration",
    desc: "Connect services, sync data, and build workflows between platforms via REST APIs.",
  },
  {
    icon: "🖥️",
    title: "Browser Automation",
    desc: "Auto-login, form submission, click flows, and multi-step web interactions.",
  },
  {
    icon: "🧩",
    title: "Chrome Extensions",
    desc: "Custom browser extensions that inject functionality and automate in-browser tasks.",
  },
];

const projects = [
  {
    title: "Telegram Price Alert Bot",
    desc: "A bot that monitors crypto/stock prices across multiple sources and sends instant Telegram notifications when target conditions are met.",
    tags: ["Python", "Telegram API", "WebSocket"],
    result: "Reduced manual monitoring by 100%",
  },
  {
    title: "E-commerce Data Scraper",
    desc: "Multi-site scraper that extracts product data, prices, and availability from major e-commerce platforms on a configurable schedule.",
    tags: ["Playwright", "Python", "PostgreSQL"],
    result: "Scraped 50,000+ products/day reliably",
  },
  {
    title: "Job Board Auto-Monitor",
    desc: "Automated tool that watches job boards for new listings matching criteria and notifies via Telegram — no more manual refreshing.",
    tags: ["Selenium", "Python", "REST API"],
    result: "Saved 5+ hours/day of manual checks",
  },
  {
    title: "Chrome Extension — Task Automator",
    desc: "Browser extension that automates repetitive in-browser workflows: form fills, data extraction, and multi-step click sequences.",
    tags: ["JavaScript", "Chrome API", "REST API"],
    result: "Reduced task time from 2h to under 5min",
  },
];

const steps = [
  {
    num: "01",
    title: "Understand",
    desc: "I take time to fully understand your workflow and pain points before writing a single line of code.",
  },
  {
    num: "02",
    title: "Plan",
    desc: "We agree on the approach, timeline, and deliverables upfront — no surprises.",
  },
  {
    num: "03",
    title: "Build",
    desc: "I build iteratively with regular updates so you can see progress at every stage.",
  },
  {
    num: "04",
    title: "Deliver",
    desc: "Clean, documented code. I test thoroughly and stay available for questions after handover.",
  },
];

const UPWORK_URL = "https://www.upwork.com/freelancers/~YOUR_UPWORK_ID";
const EMAIL = "chinguyen10022000@gmail.com";

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono text-cyan-400 font-semibold tracking-tight">
            chi.dev
          </span>
          <div className="hidden md:flex gap-7 text-sm text-zinc-400">
            {["Skills", "Projects", "Process", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-zinc-50 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          <a
            href={UPWORK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-1.5 rounded-full bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 transition-colors"
          >
            Hire me
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-36 pb-28 px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-3 py-1 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Available for new projects · $15/hr
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-4">
          Chi Nguyen
        </h1>
        <p className="text-2xl md:text-3xl text-zinc-500 font-medium mb-8">
          Automation Developer
        </p>
        <p className="text-zinc-400 text-lg max-w-2xl mb-10 leading-relaxed">
          I build automation tools that save time and reduce manual work — from
          web scraping and Telegram bots to API integrations and browser
          automation.
        </p>

        <div className="flex flex-wrap gap-4 mb-20">
          <a
            href={UPWORK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-cyan-500 text-zinc-950 font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
          >
            Hire on Upwork ↗
          </a>
          <a
            href="#projects"
            className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 hover:text-zinc-50 transition-colors"
          >
            View Projects
          </a>
        </div>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-2">
          {[
            "Python",
            "Playwright",
            "Selenium",
            "Telegram API",
            "REST API",
            "Chrome Extension",
            "BeautifulSoup",
          ].map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full border border-zinc-800 text-zinc-500 bg-zinc-900"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="skills" className="py-24 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">What I do</h2>
          <p className="text-zinc-500 mb-12">Core areas I specialize in</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.title}
                className="p-5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all"
              >
                <div className="text-2xl mb-3">{skill.icon}</div>
                <h3 className="font-semibold mb-2">{skill.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {skill.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section
        id="projects"
        className="py-24 px-6 border-t border-zinc-800/60"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Projects</h2>
          <p className="text-zinc-500 mb-12">
            Examples of automation work I&apos;ve built
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {projects.map((project) => (
              <div
                key={project.title}
                className="p-6 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 transition-all flex flex-col"
              >
                <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                <p className="text-sm text-zinc-400 mb-4 leading-relaxed flex-1">
                  {project.desc}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-cyan-400 font-medium">
                  ✓ {project.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section id="process" className="py-24 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">How I work</h2>
          <p className="text-zinc-500 mb-12">Simple process, reliable delivery</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step) => (
              <div
                key={step.num}
                className="p-5 rounded-xl border border-zinc-800 bg-zinc-900"
              >
                <div className="font-mono text-cyan-400 text-sm font-semibold mb-3">
                  {step.num}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-28 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to automate?
          </h2>
          <p className="text-zinc-400 mb-10 max-w-lg mx-auto leading-relaxed">
            Tell me what you need automated. I&apos;ll respond within 24 hours
            with a clear plan and timeline.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={UPWORK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-cyan-500 text-zinc-950 font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
            >
              Message on Upwork ↗
            </a>
            <button
              onClick={copyEmail}
              className="px-8 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 hover:text-zinc-50 transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy Email"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/60 py-8 px-6 text-center text-sm text-zinc-600">
        <span className="font-mono text-cyan-400/50">chi.dev</span>
        {" · "}Built with Next.js{" · "}
        {new Date().getFullYear()}
      </footer>
    </main>
  );
}
