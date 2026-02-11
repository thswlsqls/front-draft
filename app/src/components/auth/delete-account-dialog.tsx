"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { withdraw } from "@/lib/auth-api";
import { useAuth } from "@/contexts/auth-context";
import { clearTokens, AuthError } from "@/lib/auth-fetch";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { logout } = useAuth();

  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setServerError("");
    setLoading(true);

    try {
      await withdraw({
        password: password || undefined,
        reason: reason || undefined,
      });
      clearTokens();
      // Force context update by calling logout without API call (already deleted)
      await logout();
      onOpenChange(false);
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

  function handleClose() {
    setPassword("");
    setReason("");
    setServerError("");
    onOpenChange(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] brutal-border-3 brutal-shadow-lg bg-white p-8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          <DialogPrimitive.Title className="mb-1 text-xl font-bold">
            Delete Account
          </DialogPrimitive.Title>
          <div className="mb-5 h-[2px] bg-black" />

          <p className="mb-5 text-sm text-gray-700">
            Are you sure you want to delete your account? This action cannot be
            undone.
          </p>

          {serverError && (
            <div className="mb-4 border-2 border-[#EF4444] bg-red-50 p-3 text-sm text-[#EF4444]">
              {serverError}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide">
                Password{" "}
                <span className="text-gray-400 normal-case font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="brutal-border w-full px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide">
                Reason{" "}
                <span className="text-gray-400 normal-case font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                className="brutal-border w-full resize-none px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="brutal-border brutal-shadow-sm brutal-hover bg-white px-6 py-2.5 font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="brutal-border brutal-shadow-sm brutal-hover bg-[#EF4444] px-6 py-2.5 font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="mx-auto size-5 animate-spin" />
              ) : (
                "Delete Account"
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
