"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle } from "lucide-react";
import { resetPassword } from "@/lib/auth-api";
import { validateEmail } from "@/lib/utils";
import { AuthError } from "@/lib/auth-fetch";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(value: string) {
    const err = validateEmail(value);
    setError(err || "");
    return err;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setTouched(true);

    const err = validate(email);
    if (err) return;

    setLoading(true);
    try {
      await resetPassword({ email });
      setSuccess(true);
    } catch (err) {
      if (err instanceof AuthError) {
        setServerError(err.message);
      } else {
        setServerError("Something went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="brutal-border brutal-shadow bg-[#DBEAFE] p-8 text-center">
        <CheckCircle className="mx-auto mb-4 size-12 text-[#3B82F6]" />
        <h2 className="mb-3 text-2xl font-bold tracking-tight">
          Check Your Email
        </h2>
        <p className="mb-6 text-sm text-gray-700">
          If an account exists for that email, we&apos;ve sent a password reset
          link.
        </p>
        <Link
          href="/signin"
          className="brutal-border brutal-shadow brutal-hover inline-block bg-[#3B82F6] px-6 py-3 font-bold text-white"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="brutal-border brutal-shadow bg-white p-8">
      <h2 className="mb-2 text-2xl font-bold tracking-tight">
        Reset Password
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {serverError && (
        <div className="mb-6 border-2 border-[#EF4444] bg-red-50 p-4 text-sm text-[#EF4444]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched) validate(e.target.value);
            }}
            onBlur={() => {
              setTouched(true);
              validate(email);
            }}
            placeholder="you@example.com"
            className="brutal-border w-full px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none"
          />
          {touched && error && (
            <p className="mt-1 text-sm text-[#EF4444]">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="brutal-border brutal-shadow brutal-hover w-full bg-[#3B82F6] py-3 font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <Loader2 className="mx-auto size-5 animate-spin" />
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/signin" className="font-bold text-[#3B82F6] hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
