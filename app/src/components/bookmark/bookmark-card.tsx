"use client";

import { History, Pencil, Trash2 } from "lucide-react";
import type { BookmarkDetailResponse } from "@/types/bookmark";
import { PROVIDER_COLORS, PROVIDER_LABELS } from "@/lib/constants";
import type { TechProvider } from "@/types/emerging-tech";

interface BookmarkCardProps {
  bookmark: BookmarkDetailResponse;
  onEdit: (bookmark: BookmarkDetailResponse) => void;
  onDelete: (bookmark: BookmarkDetailResponse) => void;
  onHistory: (bookmark: BookmarkDetailResponse) => void;
}

export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onHistory,
}: BookmarkCardProps) {
  const createdDate = new Date(bookmark.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const providerKey = bookmark.provider as TechProvider | null;
  const providerColor = providerKey && PROVIDER_COLORS[providerKey]
    ? PROVIDER_COLORS[providerKey]
    : "bg-gray-500 text-white";
  const providerLabel = providerKey && PROVIDER_LABELS[providerKey]
    ? PROVIDER_LABELS[providerKey]
    : bookmark.provider;

  return (
    <article className="brutal-border brutal-shadow bg-white p-5">
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {bookmark.provider && (
            <span
              className={`brutal-border px-2 py-0.5 text-xs font-bold ${providerColor}`}
            >
              {providerLabel}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs font-medium text-gray-500 font-mono">
          {createdDate}
        </span>
      </div>

      {/* Title */}
      {bookmark.title && bookmark.url ? (
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 block text-lg font-bold leading-tight hover:text-[#3B82F6] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {bookmark.title}
        </a>
      ) : (
        <h3 className="mb-2 text-lg font-bold leading-tight">
          {bookmark.title || "Untitled"}
        </h3>
      )}

      {/* Summary */}
      {bookmark.summary && (
        <p className="mb-3 text-sm leading-relaxed text-gray-600 line-clamp-2">
          {bookmark.summary}
        </p>
      )}

      {/* Tags */}
      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {bookmark.tags.map((tag) => (
            <span
              key={tag}
              className="brutal-border bg-[#F5F5F5] px-2 py-0.5 text-xs font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Memo */}
      {bookmark.memo && (
        <p className="mb-3 text-sm italic text-gray-500 line-clamp-1">
          {bookmark.memo}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 border-t-2 border-black pt-3">
        <button
          onClick={() => onHistory(bookmark)}
          className="p-1.5 hover:bg-[#F5F5F5] transition-colors"
          aria-label="View history"
        >
          <History className="size-4" />
        </button>
        <button
          onClick={() => onEdit(bookmark)}
          className="p-1.5 hover:bg-[#F5F5F5] transition-colors"
          aria-label="Edit bookmark"
        >
          <Pencil className="size-4" />
        </button>
        <button
          onClick={() => onDelete(bookmark)}
          className="p-1.5 text-[#EF4444] hover:bg-red-50 transition-colors"
          aria-label="Delete bookmark"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  );
}
