"use client";

import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
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
        <ResetPasswordForm />
      </main>
    </div>
  );
}
