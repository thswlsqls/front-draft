"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { deleteSession } from "@/lib/chatbot-api";
import { AuthError } from "@/lib/auth-fetch";
import { useToast } from "@/contexts/toast-context";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  onDeleted: (sessionId: string) => void;
}

export function ChatDeleteDialog({
  open,
  onOpenChange,
  sessionId,
  onDeleted,
}: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!sessionId) return;
    setLoading(true);

    try {
      await deleteSession(sessionId);
      showToast("Conversation deleted.", "success");
      onDeleted(sessionId);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof AuthError) {
        showToast(err.message, "error");
      } else {
        showToast("Failed to delete conversation.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content className="fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] brutal-border-3 brutal-shadow-lg bg-white p-8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          <AlertDialogPrimitive.Title className="mb-1 text-xl font-bold">
            Delete Conversation
          </AlertDialogPrimitive.Title>
          <div className="mb-5 h-[2px] bg-black" />

          <AlertDialogPrimitive.Description className="mb-2 text-sm text-gray-700">
            Are you sure you want to delete this conversation?
          </AlertDialogPrimitive.Description>
          <p className="mb-6 text-sm text-muted-foreground">
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <AlertDialogPrimitive.Cancel asChild>
              <button
                disabled={loading}
                className="brutal-border brutal-shadow-sm brutal-hover bg-white px-6 py-2.5 font-bold disabled:opacity-50"
              >
                Cancel
              </button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="brutal-border brutal-shadow-sm brutal-hover bg-[#EF4444] px-6 py-2.5 font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <Loader2 className="mx-auto size-5 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
