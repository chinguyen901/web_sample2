"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

const UPWORK_URL = "https://www.upwork.com/freelancers/~012e9e4cf475446b7e";

type EmailStatus = "unread" | "auto-replied" | "forwarded" | "archived" | "spam" | "priority";

interface Email {
  id: number;
  from: string;
  fromEmail: string;
  avatar: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  status: EmailStatus;
  matchedRule?: string;
}

interface Rule {
  id: number;
  condition: "subject" | "from" | "body";
  operator: "contains" | "equals" | "starts_with";
  value: string;
  action: "auto-reply" | "forward" | "archive" | "spam" | "priority";
  template?: string;
  forwardTo?: string;
  label: string;
  color: string;
}

const INITIAL_EMAILS: Email[] = [
  {
    id: 1, from: "Sarah Johnson", fromEmail: "sarah@shopify-vendor.com", avatar: "👩",
    subject: "Invoice #2847 — $1,200 due Nov 30",
    preview: "Please find attached invoice for web scraping services...",
    body: "Hi, please find attached invoice #2847 for $1,200 for web scraping services delivered in November. Payment due by Nov 30.",
    time: "9:42 AM", status: "unread",
  },
  {
    id: 2, from: "Upwork Talent", fromEmail: "no-reply@upwork.com", avatar: "💼",
    subject: "New job matches your profile: Python Developer",
    preview: "3 new Python automation jobs posted today...",
    body: "3 new jobs match your profile: Python Automation Developer ($50/hr), Web Scraper needed ($40/hr), Bot Developer ($35/hr).",
    time: "9:15 AM", status: "unread",
  },
  {
    id: 3, from: "Mike Chen", fromEmail: "mike@startup.io", avatar: "👨",
    subject: "URGENT: Bot stopped working — need fix ASAP",
    preview: "Hi, our price alert bot has been down since last night...",
    body: "Hi, our price alert bot has been completely down since 11 PM last night. We are losing money. Please fix ASAP. This is urgent.",
    time: "8:55 AM", status: "unread",
  },
  {
    id: 4, from: "Mailchimp", fromEmail: "newsletter@mailchimp.com", avatar: "🐵",
    subject: "Your December marketing report is ready",
    preview: "Here's how your campaigns performed this month...",
    body: "Your December campaigns had 24% open rate, 3.2% click rate. 5 new subscribers this month. View full report in dashboard.",
    time: "8:30 AM", status: "unread",
  },
  {
    id: 5, from: "Alex Rivera", fromEmail: "alex@company.co", avatar: "🧑",
    subject: "Order #3921 — status update please",
    preview: "Hey, just checking on the order we placed last week...",
    body: "Hey, just checking on order #3921 that we placed last week for the automation scripts. Can you confirm when it will be delivered?",
    time: "8:10 AM", status: "unread",
  },
  {
    id: 6, from: "LinkedIn", fromEmail: "jobs@linkedin.com", avatar: "💼",
    subject: "5 new jobs for Python Automation Developer",
    preview: "Companies like TechCorp, DataFlow Inc are hiring...",
    body: "New Python developer roles: TechCorp ($90k remote), DataFlow Inc (contract $60/hr), 3 more. Apply before they close.",
    time: "7:45 AM", status: "unread",
  },
  {
    id: 7, from: "AWS Billing", fromEmail: "billing@aws.amazon.com", avatar: "☁️",
    subject: "Invoice: AWS charges for November 2024",
    preview: "Your AWS bill for November is ready: $47.82...",
    body: "Your AWS bill for November 2024: EC2 $32.10, S3 $8.40, Lambda $7.32. Total: $47.82. Auto-charge on Dec 5.",
    time: "7:20 AM", status: "unread",
  },
  {
    id: 8, from: "Win $1,000,000", fromEmail: "prize@notascam.xyz", avatar: "💰",
    subject: "CONGRATULATIONS! You've been selected!!!",
    preview: "You have won our grand prize lottery! Click to claim...",
    body: "CONGRATULATIONS! You have been randomly selected to win $1,000,000. Click here to claim your prize NOW!",
    time: "6:55 AM", status: "unread",
  },
  {
    id: 9, from: "Emma Watson", fromEmail: "emma@client-corp.com", avatar: "👩",
    subject: "Re: Project proposal — looks great!",
    preview: "Thanks for the detailed proposal, we'd love to proceed...",
    body: "Thanks for the detailed proposal. The timeline and pricing looks great. We'd like to proceed with the full automation package.",
    time: "Yesterday", status: "unread",
  },
  {
    id: 10, from: "GitHub", fromEmail: "noreply@github.com", avatar: "🐙",
    subject: "Security alert: potential vulnerability detected",
    preview: "We found a potential security vulnerability in one of your dependencies...",
    body: "A potential security vulnerability was found in requests==2.28.0. Please update to 2.31.0 or later.",
    time: "Yesterday", status: "unread",
  },
  {
    id: 11, from: "David Park", fromEmail: "david@bigcorp.com", avatar: "👔",
    subject: "Invoice #1192 for October services",
    preview: "Please process payment for last month's automation work...",
    body: "Please find attached invoice #1192 for $850 for October automation and scraping services. Net 30 payment terms.",
    time: "Mon", status: "unread",
  },
  {
    id: 12, from: "Substack", fromEmail: "newsletter@substack.com", avatar: "📰",
    subject: "This week in Python: asyncio deep dive",
    preview: "The best Python articles from this week...",
    body: "Top Python reads this week: asyncio mastery guide, new Python 3.13 features, best libraries for web scraping in 2025.",
    time: "Mon", status: "unread",
  },
];

const DEFAULT_RULES: Rule[] = [
  {
    id: 1, condition: "subject", operator: "contains", value: "invoice",
    action: "forward", forwardTo: "accounting@company.com",
    label: "Forward Invoices", color: "text-blue-400",
  },
  {
    id: 2, condition: "from", operator: "contains", value: "newsletter@",
    action: "archive",
    label: "Archive Newsletters", color: "text-zinc-400",
  },
  {
    id: 3, condition: "subject", operator: "contains", value: "order",
    action: "auto-reply", template: "order",
    label: "Auto-Reply Orders", color: "text-green-400",
  },
  {
    id: 4, condition: "body", operator: "contains", value: "urgent",
    action: "priority",
    label: "Flag Urgent", color: "text-red-400",
  },
  {
    id: 5, condition: "subject", operator: "contains", value: "CONGRATULATIONS",
    action: "spam",
    label: "Block Spam", color: "text-orange-400",
  },
];

const REPLY_TEMPLATES: Record<string, string> = {
  order: `Hi {name},

Thanks for reaching out! I've received your message about order #{order_id}.

Your order is being processed and you'll receive a tracking update within 24 hours.

Best regards,
Automation Bot`,
  inquiry: `Hi {name},

Thanks for your inquiry! I'll review your message and get back to you within 2 business hours.

If this is urgent, please mark your email as "URGENT" and I'll prioritize it.

Best regards,
Chi Nguyen`,
};

const ACTION_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  "auto-replied": { label: "AUTO-REPLIED", bg: "bg-green-500/20", text: "text-green-400" },
  "forwarded": { label: "FORWARDED", bg: "bg-blue-500/20", text: "text-blue-400" },
  "archived": { label: "ARCHIVED", bg: "bg-zinc-700", text: "text-zinc-400" },
  "spam": { label: "SPAM", bg: "bg-orange-500/20", text: "text-orange-400" },
  "priority": { label: "PRIORITY", bg: "bg-red-500/20", text: "text-red-400" },
};

const PYTHON_CODE = `import imaplib, smtplib, email, time
from email.mime.text import MIMEText
from email.header import decode_header

def check_and_process(imap_host, user, password, rules):
    with imaplib.IMAP4_SSL(imap_host) as imap:
        imap.login(user, password)
        imap.select("INBOX")
        _, ids = imap.search(None, "UNSEEN")

        for eid in ids[0].split():
            _, data = imap.fetch(eid, "(RFC822)")
            msg = email.message_from_bytes(data[0][1])
            subject = decode_header(msg["Subject"])[0][0]
            sender = msg["From"]
            body = get_body(msg)

            for rule in rules:
                if matches(rule, subject, sender, body):
                    apply_action(rule, msg, imap, eid)
                    break  # First matching rule wins

def apply_action(rule, msg, imap, eid):
    if rule["action"] == "archive":
        imap.store(eid, "+FLAGS", "\\\\Seen")
        imap.copy(eid, "Archive")
    elif rule["action"] == "auto_reply":
        send_reply(msg, rule["template"])
    elif rule["action"] == "forward":
        forward_email(msg, rule["forward_to"])
    elif rule["action"] == "spam":
        imap.store(eid, "+FLAGS", "\\\\Deleted")

# Run every 5 minutes
while True:
    check_and_process(HOST, USER, PASSWORD, RULES)
    time.sleep(300)`;

export default function EmailAutomatorPage() {
  const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeTab, setActiveTab] = useState<"inbox" | "rules" | "templates">("inbox");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ processed: 0, replied: 0, forwarded: 0, archived: 0, spam: 0, priority: 0, timeSaved: "0m" });
  const [logs, setLogs] = useState<string[]>([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleValue, setNewRuleValue] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<"order" | "inquiry">("order");
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const clearTimeouts = () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };

  const applyRules = useCallback((email: Email): { status: EmailStatus; rule?: Rule } => {
    for (const rule of rules) {
      let fieldVal = "";
      if (rule.condition === "subject") fieldVal = email.subject.toLowerCase();
      else if (rule.condition === "from") fieldVal = email.fromEmail.toLowerCase();
      else if (rule.condition === "body") fieldVal = email.body.toLowerCase();

      const ruleVal = rule.value.toLowerCase();
      const matches = rule.operator === "contains" ? fieldVal.includes(ruleVal)
        : rule.operator === "equals" ? fieldVal === ruleVal
        : fieldVal.startsWith(ruleVal);

      if (matches) {
        const statusMap: Record<Rule["action"], EmailStatus> = {
          "auto-reply": "auto-replied",
          "forward": "forwarded",
          "archive": "archived",
          "spam": "spam",
          "priority": "priority",
        };
        return { status: statusMap[rule.action], rule };
      }
    }
    return { status: email.status };
  }, [rules]);

  const handleRunRules = useCallback(() => {
    if (running) return;
    clearTimeouts();
    setRunning(true);
    setDone(false);
    setLogs([]);
    setStats({ processed: 0, replied: 0, forwarded: 0, archived: 0, spam: 0, priority: 0, timeSaved: "0m" });
    setEmails(INITIAL_EMAILS.map(e => ({ ...e, status: "unread" })));

    const unread = INITIAL_EMAILS.filter(e => e.status === "unread");
    let processed = 0, replied = 0, forwarded = 0, archived = 0, spam = 0, priority = 0;

    const t0 = setTimeout(() => {
      setLogs(["🔐 Connecting to IMAP server (imap.gmail.com:993)...", "✅ Authenticated successfully"]);
    }, 200);
    timeoutsRef.current.push(t0);

    const t1 = setTimeout(() => {
      setLogs(prev => [...prev, `📬 Found ${unread.length} unread emails in INBOX`]);
    }, 700);
    timeoutsRef.current.push(t1);

    unread.forEach((email, i) => {
      const delay = 1200 + i * 450;
      const t = setTimeout(() => {
        const { status, rule } = applyRules(email);
        processed++;
        if (status === "auto-replied") replied++;
        else if (status === "forwarded") forwarded++;
        else if (status === "archived") archived++;
        else if (status === "spam") spam++;
        else if (status === "priority") priority++;

        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, status, matchedRule: rule?.label } : e));
        setStats({ processed, replied, forwarded, archived, spam, priority, timeSaved: `${(processed * 1.5).toFixed(0)}m` });

        const actionText: Record<EmailStatus, string> = {
          "auto-replied": `✉ Auto-replied to "${email.subject.slice(0, 35)}..."`,
          "forwarded": `→ Forwarded "${email.subject.slice(0, 35)}..." to accounting`,
          "archived": `📁 Archived "${email.subject.slice(0, 35)}..."`,
          "spam": `🗑 Marked as spam: "${email.subject.slice(0, 35)}..."`,
          "priority": `🔴 Priority flag: "${email.subject.slice(0, 35)}..."`,
          "unread": `  Skipped: "${email.subject.slice(0, 35)}..." (no rule matched)`,
        };

        setLogs(prev => {
          const updated = [...prev, actionText[status]];
          setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
          return updated;
        });
      }, delay);
      timeoutsRef.current.push(t);
    });

    const finishDelay = 1200 + unread.length * 450 + 300;
    const tf = setTimeout(() => {
      setRunning(false);
      setDone(true);
      setLogs(prev => [...prev, `✅ Done — ${unread.length} emails processed in 0.8s`]);
    }, finishDelay);
    timeoutsRef.current.push(tf);
  }, [running, applyRules]);

  const resetDemo = () => {
    clearTimeouts();
    setEmails(INITIAL_EMAILS.map(e => ({ ...e, status: "unread" })));
    setRunning(false);
    setDone(false);
    setLogs([]);
    setStats({ processed: 0, replied: 0, forwarded: 0, archived: 0, spam: 0, priority: 0, timeSaved: "0m" });
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-mono text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
            ← chi.dev
          </Link>
          <span className="text-sm text-zinc-400 hidden sm:block">Email Inbox Automator Demo</span>
          <a href={UPWORK_URL} target="_blank" rel="noopener noreferrer"
            className="text-sm px-4 py-1.5 rounded-full bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 transition-colors">
            Hire me
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">✉️</div>
            <div>
              <h1 className="text-2xl font-bold">Email Inbox Automator</h1>
              <p className="text-sm text-zinc-500">Script tự đọc inbox, phân loại, auto-reply — 80% email xử lý tự động</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Python", "Gmail API", "IMAP", "SMTP", "imaplib", "smtplib"].map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{tag}</span>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
          {[
            { label: "Processed", value: stats.processed, color: "text-zinc-200", total: INITIAL_EMAILS.length },
            { label: "Auto-Replied", value: stats.replied, color: "text-green-400", total: null },
            { label: "Forwarded", value: stats.forwarded, color: "text-blue-400", total: null },
            { label: "Archived", value: stats.archived, color: "text-zinc-400", total: null },
            { label: "Spam", value: stats.spam, color: "text-orange-400", total: null },
            { label: "Time Saved", value: stats.timeSaved, color: "text-cyan-400", total: null },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
              <p className={`text-xl font-bold font-mono ${s.color}`}>
                {typeof s.value === "number" ? s.value : s.value}
                {s.total !== null && <span className="text-zinc-600 text-sm">/{s.total}</span>}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
          {([["inbox", "📬 Inbox"], ["rules", "⚙️ Rules"], ["templates", "📝 Templates"]] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-5 gap-5 mb-5">
          {/* Left panel */}
          <div className="md:col-span-3">
            {activeTab === "inbox" && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <span className="text-sm font-medium text-zinc-200">
                    Inbox <span className="text-zinc-500 font-normal">({emails.filter(e => e.status === "unread").length} unread)</span>
                  </span>
                  <div className="flex gap-2">
                    {done && (
                      <button onClick={resetDemo} className="text-xs px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-600">
                        ↺ Reset
                      </button>
                    )}
                    <button onClick={handleRunRules} disabled={running}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        running ? "bg-zinc-700 text-zinc-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-400 text-white"
                      }`}>
                      {running ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                          Running...
                        </span>
                      ) : "▶ Run Rules"}
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-zinc-800/60 max-h-[480px] overflow-y-auto">
                  {emails.map(email => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)}
                      className={`px-4 py-3 cursor-pointer transition-all ${
                        selectedEmail?.id === email.id ? "bg-zinc-800" :
                        email.status === "archived" ? "opacity-40 hover:opacity-60" :
                        email.status === "spam" ? "opacity-30 hover:opacity-50" :
                        "hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm flex-shrink-0 border border-zinc-700">
                          {email.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className={`text-sm font-medium truncate ${email.status === "unread" ? "text-zinc-100" : "text-zinc-400"}`}>
                              {email.from}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {email.status !== "unread" && ACTION_BADGE[email.status] && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ACTION_BADGE[email.status].bg} ${ACTION_BADGE[email.status].text}`}>
                                  {ACTION_BADGE[email.status].label}
                                </span>
                              )}
                              <span className="text-xs text-zinc-600">{email.time}</span>
                            </div>
                          </div>
                          <p className={`text-xs truncate mb-0.5 ${email.status === "unread" ? "text-zinc-300 font-medium" : "text-zinc-500"}`}>
                            {email.subject}
                          </p>
                          <p className="text-xs text-zinc-600 truncate">{email.preview}</p>
                          {email.matchedRule && (
                            <p className="text-xs text-cyan-500/70 mt-0.5">Rule: {email.matchedRule}</p>
                          )}
                        </div>
                      </div>
                      {/* Expanded body */}
                      {selectedEmail?.id === email.id && (
                        <div className="mt-3 pl-11 text-xs text-zinc-400 leading-relaxed border-t border-zinc-700 pt-2">
                          <p className="text-zinc-500 mb-1">From: {email.fromEmail}</p>
                          <p>{email.body}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "rules" && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <span className="text-sm font-medium text-zinc-200">Automation Rules <span className="text-zinc-500">({rules.length} active)</span></span>
                  <button onClick={() => setShowAddRule(!showAddRule)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all">
                    + Add Rule
                  </button>
                </div>
                {showAddRule && (
                  <div className="p-4 border-b border-zinc-800 bg-zinc-800/30">
                    <p className="text-xs text-zinc-500 mb-2">New Rule — If subject contains:</p>
                    <div className="flex gap-2">
                      <input value={newRuleValue} onChange={e => setNewRuleValue(e.target.value)} placeholder="e.g. payment"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500" />
                      <button onClick={() => {
                        if (!newRuleValue.trim()) return;
                        setRules(prev => [...prev, {
                          id: Date.now(), condition: "subject", operator: "contains",
                          value: newRuleValue.trim(), action: "archive", label: `Archive "${newRuleValue.trim()}"`, color: "text-zinc-400",
                        }]);
                        setNewRuleValue(""); setShowAddRule(false);
                      }} className="px-3 py-1.5 rounded-lg bg-cyan-500 text-zinc-950 text-xs font-semibold hover:bg-cyan-400">
                        Add
                      </button>
                    </div>
                  </div>
                )}
                <div className="divide-y divide-zinc-800/60">
                  {rules.map(rule => (
                    <div key={rule.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${rule.color}`}>{rule.label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          If <span className="text-zinc-400">{rule.condition}</span>{" "}
                          {rule.operator}{" "}
                          <span className="text-cyan-400">&quot;{rule.value}&quot;</span>
                          {" → "}
                          <span className="text-zinc-300">{rule.action}</span>
                          {rule.forwardTo && <span className="text-zinc-500"> to {rule.forwardTo}</span>}
                        </p>
                      </div>
                      <button onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))}
                        className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "templates" && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-1 px-4 py-3 border-b border-zinc-800">
                  <span className="text-sm font-medium text-zinc-200">Reply Templates</span>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-4">
                    {(["order", "inquiry"] as const).map(t => (
                      <button key={t} onClick={() => setSelectedTemplate(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedTemplate === t ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                        }`}>
                        {t === "order" ? "Order Confirmation" : "General Inquiry"}
                      </button>
                    ))}
                  </div>
                  <pre className="text-xs text-zinc-300 leading-relaxed font-mono bg-zinc-800/50 rounded-lg p-3 whitespace-pre-wrap">
                    {REPLY_TEMPLATES[selectedTemplate]}
                  </pre>
                  <p className="text-xs text-zinc-600 mt-2">Variables like {"{{name}}"}, {"{{order_id}}"} are auto-filled from email content</p>
                </div>
              </div>
            )}
          </div>

          {/* Right panel: log + code */}
          <div className="md:col-span-2 space-y-4">
            {/* Log */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-zinc-500 ml-1 font-mono">email_bot.py — output</span>
              </div>
              <div ref={logRef} className="p-3 font-mono text-xs h-44 overflow-y-auto space-y-1">
                {logs.length === 0 ? (
                  <p className="text-zinc-600">$ python email_bot.py</p>
                ) : (
                  <>
                    <p className="text-zinc-600">$ python email_bot.py</p>
                    {logs.map((log, i) => (
                      <p key={i} className={
                        log.startsWith("✅") ? "text-green-400" :
                        log.startsWith("❌") ? "text-red-400" :
                        log.startsWith("🔐") || log.startsWith("📬") ? "text-cyan-400" :
                        log.startsWith("  ") ? "text-zinc-600" : "text-zinc-300"
                      }>{log}</p>
                    ))}
                    {running && <p className="text-zinc-500 animate-pulse">▊</p>}
                  </>
                )}
              </div>
            </div>

            {/* Python code */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-zinc-500 ml-1 font-mono">email_automator.py</span>
              </div>
              <pre className="p-3 font-mono text-xs text-zinc-300 h-56 overflow-auto leading-relaxed">
                <code>{PYTHON_CODE}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Result + FAQ */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-2">Kết quả thực tế</p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Xử lý <strong className="text-red-400">80% email tự động</strong> mỗi ngày — invoices tự forward kế toán, orders tự reply khách, newsletters tự archive. Tiết kiệm 2–3 giờ/ngày.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Câu hỏi thường gặp</p>
            <div className="space-y-2 text-sm">
              {[
                ["Hỗ trợ Gmail và Outlook?", "Có — IMAP/SMTP cho Gmail; Microsoft Graph API cho Outlook 365."],
                ["Email bị reply nhầm thì sao?", "Rule chạy theo thứ tự, rule nào match trước thì thắng. Test với whitelist trước khi live."],
                ["Có lưu log không?", "Có — mọi action được log vào file và có thể gửi daily digest report."],
              ].map(([q, a]) => (
                <div key={q}>
                  <p className="text-zinc-300 font-medium">{q}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
