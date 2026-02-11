"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { oauthCallback } from "@/lib/auth-api";
import { useAuth } from "@/contexts/auth-context";
import { AuthError } from "@/lib/auth-fetch";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state") || undefined;

    if (!code) {
      setError("OAuth authentication failed. Missing authorization code.");
      setTimeout(() => router.push("/signin"), 3000);
      return;
    }

    oauthCallback("google", code, state)
      .then((tokens) => {
        auth.login(tokens);
        router.push("/");
      })
      .catch((err) => {
        const msg =
          err instanceof AuthError
            ? err.message
            : "OAuth authentication failed. Please try again.";
        setError(msg);
        setTimeout(() => router.push("/signin"), 3000);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F5]">
        <div className="brutal-border brutal-shadow bg-white p-8 text-center max-w-sm">
          <p className="text-sm text-[#EF4444] font-bold">{error}</p>
          <p className="mt-2 text-xs text-gray-500">
            Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
      <div className="text-center">
        <Loader2 className="mx-auto size-10 animate-spin text-[#3B82F6]" />
        <p className="mt-4 font-bold">Signing in...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
          <Loader2 className="size-10 animate-spin text-[#3B82F6]" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
