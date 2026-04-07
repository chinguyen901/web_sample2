"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";

type ToastItem = { id: number; title: string; description?: string };
type ToastContextType = { push: (title: string, description?: string) => void };

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const value = useMemo(
    () => ({
      push: (title: string, description?: string) => {
        const id = Date.now();
        setItems((prev) => [...prev, { id, title, description }]);
        setTimeout(() => {
          setItems((prev) => prev.filter((item) => item.id !== id));
        }, 3000);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="min-w-72 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                ) : null}
              </div>
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setItems((prev) => prev.filter((t) => t.id !== item.id))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
