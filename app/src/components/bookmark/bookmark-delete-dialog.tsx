"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { deleteBookmark } from "@/lib/bookmark-api";
import { useToast } from "@/contexts/toast-context";
import { AuthError } from "@/lib/auth-fetch";

interface BookmarkDeleteDialogProps {
  bookmarkId: string | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function BookmarkDeleteDialog({
  bookmarkId,
  onClose,
  onDeleted,
}: BookmarkDeleteDialogProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!bookmarkId) return;
    setLoading(true);

    try {
      await deleteBookmark(bookmarkId);
      showToast(
        "Bookmark deleted. You can restore it from Trash.",
        "success"
      );
      onDeleted();
      onClose();
    } catch (err) {
      showToast(
        err instanceof AuthError
          ? err.message
          : "Failed to delete bookmark.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogPrimitive.Root open={!!bookmarkId} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] brutal-border-3 brutal-shadow-lg bg-white p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          <DialogPrimitive.Title className="mb-1 text-xl font-bold">
            Delete Bookmark
          </DialogPrimitive.Title>
          <div className="mb-5 h-[2px] bg-black" />

          <p className="mb-2 text-sm text-gray-700">
            Are you sure you want to delete this bookmark?
          </p>
          <p className="mb-6 text-sm text-gray-500">
            You can restore it from Trash within 30 days.
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
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
