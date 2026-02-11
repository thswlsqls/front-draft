"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, XCircle } from "lucide-react";
import { ResetPasswordConfirmForm } from "@/components/auth/reset-password-confirm-form";

function ResetPasswordConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="brutal-border brutal-shadow bg-white p-8 text-center">
        <XCircle className="mx-auto mb-4 size-12 text-[#EF4444]" />
        <h2 className="mb-3 text-2xl font-bold tracking-tight">
          Invalid Link
        </h2>
        <p className="mb-6 text-sm text-gray-700">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/reset-password"
          className="brutal-border brutal-shadow brutal-hover inline-block bg-[#3B82F6] px-6 py-3 font-bold text-white"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  return <ResetPasswordConfirmForm token={token} />;
}

export default function ResetPasswordConfirmPage() {
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
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Loader2 className="size-10 animate-spin text-[#3B82F6]" />
            </div>
          }
        >
          <ResetPasswordConfirmContent />
        </Suspense>
      </main>
    </div>
  );
}
