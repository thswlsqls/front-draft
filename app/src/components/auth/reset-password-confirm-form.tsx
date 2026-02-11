"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle } from "lucide-react";
import { resetPasswordConfirm } from "@/lib/auth-api";
import { validatePassword } from "@/lib/utils";
import { AuthError } from "@/lib/auth-fetch";

interface Props {
  token: string;
}

export function ResetPasswordConfirmForm({ token }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validateField(name: string, value: string) {
    let error: string | null = null;
    if (name === "newPassword") error = validatePassword(value);
    if (name === "confirmPassword")
      error = value !== newPassword ? "Passwords do not match." : null;

    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
    return error;
  }

  function handleBlur(name: string, value: string) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  }

  function handleChange(name: string, value: string) {
    if (touched[name]) validateField(name, value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const passErr = validateField("newPassword", newPassword);
    const confirmErr = validateField("confirmPassword", confirmPassword);
    setTouched({ newPassword: true, confirmPassword: true });

    if (passErr || confirmErr) return;

    setLoading(true);
    try {
      await resetPasswordConfirm({ token, newPassword });
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
          Password Reset!
        </h2>
        <p className="mb-6 text-sm text-gray-700">
          Your password has been reset successfully.
        </p>
        <Link
          href="/signin"
          className="brutal-border brutal-shadow brutal-hover inline-block bg-[#3B82F6] px-6 py-3 font-bold text-white"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="brutal-border brutal-shadow bg-white p-8">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">
        Set New Password
      </h2>

      {serverError && (
        <div className="mb-6 border-2 border-[#EF4444] bg-red-50 p-4 text-sm text-[#EF4444]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              handleChange("newPassword", e.target.value);
            }}
            onBlur={() => handleBlur("newPassword", newPassword)}
            className="brutal-border w-full px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none"
          />
          {touched.newPassword && errors.newPassword && (
            <p className="mt-1 text-sm text-[#EF4444]">
              {errors.newPassword}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              handleChange("confirmPassword", e.target.value);
            }}
            onBlur={() => handleBlur("confirmPassword", confirmPassword)}
            className="brutal-border w-full px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none"
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="mt-1 text-sm text-[#EF4444]">
              {errors.confirmPassword}
            </p>
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
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );
}
