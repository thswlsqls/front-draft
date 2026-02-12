"use client";

import { X } from "lucide-react";
import { useToast } from "@/contexts/toast-context";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 text-sm font-bold animate-in slide-in-from-right-full duration-200 ${
            toast.type === "success"
              ? "bg-[#DBEAFE] brutal-border brutal-shadow-sm text-black"
              : "bg-red-50 border-2 border-[#EF4444] text-[#EF4444]"
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 p-0.5 hover:opacity-70 transition-opacity"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
