"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [user, isLoading, router]);

  if (isLoading || user) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="border-b-3 border-black bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-5">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight md:text-3xl"
          >
            Tech <span className="text-[#3B82F6]">N</span> AI
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-12">
        <SignupForm />
      </main>
    </div>
  );
}
