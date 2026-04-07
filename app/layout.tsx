import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "VNS Store",
  description: "Modern premium e-commerce built with Next.js"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Navbar />
          <main className="container-app py-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
