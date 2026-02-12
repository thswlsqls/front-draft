"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle } from "lucide-react";
import { signup } from "@/lib/auth-api";
import { validateEmail, validatePassword, validateUsername } from "@/lib/utils";
import { AuthError } from "@/lib/auth-fetch";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");

  function validateField(name: string, value: string) {
    let error: string | null = null;
    switch (name) {
      case "email":
        error = validateEmail(value);
        break;
      case "username":
        error = validateUsername(value);
        break;
      case "password":
        error = validatePassword(value);
        if (touched.confirmPassword && confirmPassword) {
          const matchError = confirmPassword !== value ? "Passwords do not match." : null;
          setErrors((prev) => {
            const next = { ...prev };
            if (matchError) next.confirmPassword = matchError;
            else delete next.confirmPassword;
            return next;
          });
        }
        break;
      case "confirmPassword":
        error = value !== password ? "Passwords do not match." : null;
        break;
    }
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
    const usernameErr = validateField("username", username);
    const passwordErr = validateField("password", password);
    const confirmErr = validateField("confirmPassword", confirmPassword);
    setTouched({ email: true, username: true, password: true, confirmPassword: true });

    if (emailErr || usernameErr || passwordErr || confirmErr) return;

    setLoading(true);
    try {
      await signup({ email, username, password });
      setSuccessEmail(email);
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
          Account Created!
        </h2>
        <p className="mb-1 text-sm text-gray-700">
          We&apos;ve sent a verification email to
        </p>
        <p className="mb-4 font-mono text-sm font-bold">{successEmail}</p>
        <p className="mb-6 text-sm text-gray-700">
          Please check your inbox.
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
        Create Account
      </h2>

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
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              handleChange("username", e.target.value);
            }}
            onBlur={() => handleBlur("username", username)}
            placeholder="johndoe"
            className="brutal-border w-full px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none"
          />
          {touched.username && errors.username && (
            <p className="mt-1 text-sm text-[#EF4444]">{errors.username}</p>
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

        <div>
          <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide">
            Confirm Password
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
            "Sign Up"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link href="/signin" className="font-bold text-[#3B82F6] hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
