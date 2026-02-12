"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Trash2 } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { DeleteAccountDialog } from "./delete-account-dialog";

export function AuthHeader() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return <div className="flex items-center gap-3 h-9" />;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/signup"
          className="brutal-border brutal-shadow-sm brutal-hover bg-white px-4 py-2 text-sm font-bold"
        >
          Sign Up
        </Link>
        <Link
          href="/signin"
          className="brutal-border brutal-shadow-sm brutal-hover bg-[#3B82F6] px-4 py-2 text-sm font-bold text-white"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const isBookmarksActive = pathname.startsWith("/bookmarks");
  const isChatActive = pathname.startsWith("/chat");

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/bookmarks"
        className={`text-sm font-bold transition-colors ${
          isBookmarksActive
            ? "text-[#3B82F6]"
            : "hover:text-[#3B82F6]"
        }`}
      >
        Bookmarks
      </Link>

      <Link
        href="/chat"
        className={`text-sm font-bold transition-colors ${
          isChatActive
            ? "text-[#3B82F6]"
            : "hover:text-[#3B82F6]"
        }`}
      >
        Chat
      </Link>

      <PopoverPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button className="flex items-center gap-1.5 text-sm font-bold hover:text-[#3B82F6] transition-colors">
            {user.username || user.email}
            <ChevronDown className="size-4" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="end"
            sideOffset={8}
            className="z-50 brutal-border brutal-shadow bg-white p-1 min-w-[180px]"
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#EF4444] hover:bg-red-50 font-medium"
            >
              <Trash2 className="size-4" />
              Delete Account
            </button>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      <button
        onClick={handleLogout}
        className="brutal-border brutal-shadow-sm brutal-hover flex items-center gap-1.5 bg-white px-4 py-2 text-sm font-bold"
      >
        <LogOut className="size-4" />
        Logout
      </button>

      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}
