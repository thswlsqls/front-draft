"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ResetPasswordConfirmForm } from "@/components/auth/reset-password-confirm-form";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (token) {
    return <ResetPasswordConfirmForm token={token} />;
  }

  return <ResetPasswordForm />;
}

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
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Loader2 className="size-10 animate-spin text-[#3B82F6]" />
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </main>
    </div>
  );
}
