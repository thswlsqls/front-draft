"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/signin");
  }

  return (
    <header className="border-b-3 border-black bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight md:text-2xl"
          >
            <ShieldCheck className="size-6 text-[#3B82F6] md:size-7" strokeWidth={2.5} />
            <span>
              Tech <span className="text-[#3B82F6]">N</span> AI
              <span className="ml-1 text-[#3B82F6]">[Admin]</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/accounts"
              className={`text-sm font-bold transition-colors hover:text-[#3B82F6] ${
                pathname === "/accounts" ? "text-[#3B82F6]" : ""
              }`}
            >
              Accounts
            </Link>
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold">{user.username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-bold transition-colors hover:text-[#EF4444]"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
