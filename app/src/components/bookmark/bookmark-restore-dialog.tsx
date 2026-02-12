"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { restoreBookmarkVersion } from "@/lib/bookmark-api";
import { useToast } from "@/contexts/toast-context";
import { AuthError } from "@/lib/auth-fetch";

interface BookmarkRestoreDialogProps {
  entityId: string | null;
  historyId: string | null;
  changedAt: string | null;
  onClose: () => void;
  onRestored: () => void;
}

export function BookmarkRestoreDialog({
  entityId,
  historyId,
  changedAt,
  onClose,
  onRestored,
}: BookmarkRestoreDialogProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const formattedDate = changedAt
    ? new Date(changedAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleRestore = async () => {
    if (!entityId || !historyId) return;
    setLoading(true);

    try {
      await restoreBookmarkVersion(entityId, historyId);
      showToast("Restored to selected version.", "success");
      onRestored();
      onClose();
    } catch (err) {
      showToast(
        err instanceof AuthError
          ? err.message
          : "Failed to restore version.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogPrimitive.Root
      open={!!(entityId && historyId)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-[50%] left-[50%] z-[60] w-full max-w-md translate-x-[-50%] translate-y-[-50%] brutal-border-3 brutal-shadow-lg bg-white p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          <DialogPrimitive.Title className="mb-1 text-xl font-bold">
            Restore Version
          </DialogPrimitive.Title>
          <div className="mb-5 h-[2px] bg-black" />

          <p className="mb-2 text-sm text-gray-700">
            Restore this bookmark to the version from{" "}
            <strong>{formattedDate}</strong>?
          </p>
          <p className="mb-6 text-sm text-gray-500">
            Current data will be overwritten.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="brutal-border brutal-shadow-sm brutal-hover bg-white px-6 py-2.5 font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRestore}
              disabled={loading}
              className="brutal-border brutal-shadow-sm brutal-hover bg-[#3B82F6] px-6 py-2.5 font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="mx-auto size-5 animate-spin" />
              ) : (
                "Restore"
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
