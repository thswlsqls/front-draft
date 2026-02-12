"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { createBookmark, deleteBookmark } from "@/lib/bookmark-api";
import { useToast } from "@/contexts/toast-context";
import { AuthError } from "@/lib/auth-fetch";

interface BookmarkToggleProps {
  emergingTechId: string;
  bookmarkTsid: string | null;
  onToggle: (emergingTechId: string, bookmarkTsid: string | null) => void;
}

export function BookmarkToggle({
  emergingTechId,
  bookmarkTsid,
  onToggle,
}: BookmarkToggleProps) {
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const isBookmarked = !!bookmarkTsid;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) return;

    setPending(true);

    if (isBookmarked) {
      // Optimistic: remove bookmark
      onToggle(emergingTechId, null);
      try {
        await deleteBookmark(bookmarkTsid);
        showToast("Bookmark removed.", "success");
      } catch (err) {
        // Rollback
        onToggle(emergingTechId, bookmarkTsid);
        showToast(
          err instanceof AuthError
            ? err.message
            : "Failed to remove bookmark.",
          "error"
        );
      }
    } else {
      // Optimistic: add bookmark (use temp id)
      const tempId = "__pending__";
      onToggle(emergingTechId, tempId);
      try {
        const result = await createBookmark({ emergingTechId });
        onToggle(emergingTechId, result.bookmarkTsid);
        showToast("Bookmarked!", "success");
      } catch (err) {
        if (err instanceof AuthError && err.code === "BOOKMARK_ALREADY_EXISTS") {
          // 409: keep as bookmarked
          showToast("This content is already bookmarked.", "success");
        } else {
          // Rollback
          onToggle(emergingTechId, null);
          showToast(
            err instanceof AuthError
              ? err.message
              : "Failed to bookmark. Please try again.",
            "error"
          );
        }
      }
    }

    setPending(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="p-1.5 transition-colors hover:bg-[#F5F5F5] disabled:opacity-50"
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <Bookmark
        className={`size-5 ${
          isBookmarked
            ? "text-[#3B82F6] fill-[#3B82F6]"
            : "text-gray-400 hover:text-[#3B82F6]"
        }`}
      />
    </button>
  );
}
