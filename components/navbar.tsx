import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LogoutButton } from "@/components/logout-button";

export async function Navbar() {
  const user = await getCurrentUser();
  const cartCount = user
    ? await db.cartItem.count({ where: { userId: user.id } })
    : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          VNS <span className="text-brand">Store</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="text-slate-700 hover:text-slate-900">
            Shop
          </Link>
          <Link href="/profile" className="text-slate-700 hover:text-slate-900">
            Profile
          </Link>
          <Link href="/cart" className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900">
            <ShoppingBag className="h-4 w-4" />
            Cart ({cartCount})
          </Link>
          {user ? (
            <LogoutButton />
          ) : (
            <Link href="/profile" className="rounded-lg bg-slate-900 px-3 py-1.5 text-white">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
