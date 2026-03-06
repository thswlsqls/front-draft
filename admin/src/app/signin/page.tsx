"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { SigninForm } from "@/components/auth/signin-form";

export default function SigninPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [user, isLoading, router]);

  if (isLoading || user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
      <header className="border-b-3 border-black bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-5">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight md:text-3xl"
          >
            Tech <span className="text-[#3B82F6]">N</span> AI
            <span className="ml-1 text-[#3B82F6]">[Admin]</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex flex-1 items-center justify-center max-w-md px-6">
        <SigninForm />
      </main>
    </div>
  );
}
