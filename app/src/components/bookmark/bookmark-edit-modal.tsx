"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { fetchBookmarkDetail, updateBookmark } from "@/lib/bookmark-api";
import { useToast } from "@/contexts/toast-context";
import { AuthError } from "@/lib/auth-fetch";
import type { BookmarkDetailResponse } from "@/types/bookmark";

interface BookmarkEditModalProps {
  bookmarkId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function BookmarkEditModal({
  bookmarkId,
  onClose,
  onUpdated,
}: BookmarkEditModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookmark, setBookmark] = useState<BookmarkDetailResponse | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!bookmarkId) {
      setBookmark(null);
      return;
    }

    setLoading(true);
    fetchBookmarkDetail(bookmarkId)
      .then((data) => {
        setBookmark(data);
        setTags(data.tags ?? []);
        setMemo(data.memo ?? "");
      })
      .catch((err) => {
        showToast(
          err instanceof AuthError ? err.message : "Failed to load bookmark.",
          "error"
        );
        onClose();
      })
      .finally(() => setLoading(false));
  }, [bookmarkId, showToast, onClose]);

  const handleAddTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!bookmarkId) return;
    setSaving(true);

    try {
      await updateBookmark(bookmarkId, { tags, memo: memo || undefined });
      showToast("Bookmark updated.", "success");
      onUpdated();
      onClose();
    } catch (err) {
      showToast(
        err instanceof AuthError
          ? err.message
          : "Failed to update bookmark.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTagInput("");
    onClose();
  };

  return (
    <DialogPrimitive.Root open={!!bookmarkId} onOpenChange={(open) => !open && handleClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-[50%] left-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] brutal-border-3 brutal-shadow-lg bg-white p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <DialogPrimitive.Title className="sr-only">Loading</DialogPrimitive.Title>
              <Loader2 className="size-6 animate-spin text-[#3B82F6]" />
            </div>
          ) : bookmark ? (
            <>
              <div className="border-b-3 border-black p-6 pb-4">
                <DialogPrimitive.Title className="text-xl font-bold">
                  Edit Bookmark
                </DialogPrimitive.Title>
                <div className="mt-1 h-[2px] bg-black" />
              </div>

              <div className="space-y-5 p-6">
                {/* Title (readonly) */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide">
                    Title
                  </label>
                  <p className="text-sm text-gray-600">
                    {bookmark.title || "Untitled"}
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide">
                    Tags
                  </label>
                  <div className="brutal-border flex flex-wrap gap-1.5 p-2 min-h-[44px]">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="brutal-border inline-flex items-center gap-1 bg-[#F5F5F5] px-2 py-0.5 text-xs font-semibold"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-[#EF4444] transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => {
                        if (tagInput.trim()) handleAddTag(tagInput);
                      }}
                      placeholder="Add tag..."
                      className="min-w-[80px] flex-1 border-none px-1 py-0.5 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Memo */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide">
                    Memo
                  </label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="brutal-border w-full resize-none px-4 py-3 text-base focus:border-[#3B82F6] focus:outline-none"
                    placeholder="Write your notes..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleClose}
                    disabled={saving}
                    className="brutal-border brutal-shadow-sm brutal-hover bg-white px-6 py-2.5 font-bold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="brutal-border brutal-shadow-sm brutal-hover bg-[#3B82F6] px-6 py-2.5 font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {saving ? (
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
