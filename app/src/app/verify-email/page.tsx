"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { verifyEmail } from "@/lib/auth-api";
import { AuthError } from "@/lib/auth-fetch";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid verification link.");
      return;
    }

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMessage(
          err instanceof AuthError
            ? err.message
            : "Something went wrong. Please try again later."
        );
      });
  }, [token]);

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
        {status === "loading" && (
          <div className="brutal-border brutal-shadow bg-white p-8 text-center">
            <Loader2 className="mx-auto size-10 animate-spin text-[#3B82F6]" />
            <p className="mt-4 font-bold">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="brutal-border brutal-shadow bg-[#DBEAFE] p-8 text-center">
            <CheckCircle className="mx-auto mb-4 size-12 text-[#3B82F6]" />
            <h2 className="mb-3 text-2xl font-bold tracking-tight">
              Email Verified!
            </h2>
            <p className="mb-6 text-sm text-gray-700">
              Your email has been verified successfully.
            </p>
            <Link
              href="/signin"
              className="brutal-border brutal-shadow brutal-hover inline-block bg-[#3B82F6] px-6 py-3 font-bold text-white"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="brutal-border brutal-shadow bg-white p-8 text-center">
            <XCircle className="mx-auto mb-4 size-12 text-[#EF4444]" />
            <h2 className="mb-3 text-2xl font-bold tracking-tight">
              Verification Failed
            </h2>
            <p className="mb-6 text-sm text-gray-700">{errorMessage}</p>
            <Link
              href="/signin"
              className="brutal-border brutal-shadow brutal-hover inline-block bg-[#3B82F6] px-6 py-3 font-bold text-white"
            >
              Go to Sign In
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
          <Loader2 className="size-10 animate-spin text-[#3B82F6]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
