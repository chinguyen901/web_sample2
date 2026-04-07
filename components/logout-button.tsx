"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  };

  return (
    <Button variant="ghost" className="px-2 py-1 text-sm" onClick={onLogout}>
      Logout
    </Button>
  );
}
