"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { login } from "@/lib/auth-api";
import { useAuth } from "@/contexts/auth-context";
import { validateEmail } from "@/lib/utils";
import { AuthError } from "@/lib/auth-fetch";
import { OAuthButtons } from "./oauth-buttons";

export function SigninForm() {
  const router = useRouter();
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateField(name: string, value: string) {
    let error: string | null = null;
    if (name === "email") error = validateEmail(value);
    if (name === "password" && !value) error = "Password is required.";

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

    const emailErr = validateField("email", email);
    const passwordErr = validateField("password", password);
    setTouched({ email: true, password: true });

    if (emailErr || passwordErr) return;

    setLoading(true);
    try {
      const tokens = await login({ email, password });
      auth.login(tokens);
      router.push("/");
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

  return (
    <div className="brutal-border brutal-shadow bg-white p-8">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">Welcome Back</h2>

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
              handleChange("email", e.target.value);
            }}
            onBlur={() => handleBlur("email", email)}
            placeholder="you@example.com"
            className="brutal-border w-full px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none"
          />
          {touched.email && errors.email && (
            <p className="mt-1 text-sm text-[#EF4444]">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              handleChange("password", e.target.value);
            }}
            onBlur={() => handleBlur("password", password)}
            className="brutal-border w-full px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none"
          />
          {touched.password && errors.password && (
            <p className="mt-1 text-sm text-[#EF4444]">{errors.password}</p>
          )}
        </div>

        <div className="text-right">
          <Link
            href="/reset-password"
            className="text-sm font-bold text-[#3B82F6] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="brutal-border brutal-shadow brutal-hover w-full bg-[#3B82F6] py-3 font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <Loader2 className="mx-auto size-5 animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <OAuthButtons />

      <p className="mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold text-[#3B82F6] hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
