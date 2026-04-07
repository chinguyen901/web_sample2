"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const router = useRouter();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload = mode === "login" ? { email, password } : { name, email, password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      push("Auth failed", data.error || "Try again.");
      return;
    }

    push("Welcome to VNS Store");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {mode === "register" ? (
        <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
      ) : null}
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input
        type="password"
        placeholder="Password (min 6)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button className="w-full" disabled={loading} type="submit">
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
      </Button>
      <button
        type="button"
        className="text-sm text-slate-600 underline"
        onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
      >
        {mode === "login" ? "Need an account? Register" : "Already have account? Login"}
      </button>
    </form>
  );
}
