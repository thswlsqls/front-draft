"use client";

import type { EmergingTechItem } from "@/types/emerging-tech";
import {
  PROVIDER_COLORS,
  PROVIDER_LABELS,
  UPDATE_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
} from "@/lib/constants";
import { BookmarkToggle } from "@/components/bookmark/bookmark-toggle";

interface CardProps {
  item: EmergingTechItem;
  onClick: (id: string) => void;
  bookmarkTsid?: string | null;
  onBookmarkToggle?: (emergingTechId: string, bookmarkTsid: string | null) => void;
  showBookmark?: boolean;
}

export function EmergingTechCard({
  item,
  onClick,
  bookmarkTsid = null,
  onBookmarkToggle,
  showBookmark = false,
}: CardProps) {
  const publishedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : null;

  return (
    <article
      onClick={() => onClick(item.id)}
      className="brutal-border brutal-shadow brutal-hover flex cursor-pointer flex-col bg-white p-5"
    >
      {/* Badges */}
      <div className="mb-3 flex flex-wrap gap-2">
        <span
          className={`brutal-border px-2 py-0.5 text-xs font-bold ${PROVIDER_COLORS[item.provider]}`}
        >
          {PROVIDER_LABELS[item.provider]}
        </span>
        <span className="brutal-border bg-[#DBEAFE] px-2 py-0.5 text-xs font-bold text-black">
          {UPDATE_TYPE_LABELS[item.updateType]}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-bold leading-tight">{item.title}</h3>

      {/* Summary */}
      {item.summary && (
        <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600 line-clamp-3">
          {item.summary}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t-2 border-black pt-3">
        <span className="brutal-border bg-white px-2 py-0.5 text-xs font-semibold">
          {SOURCE_TYPE_LABELS[item.sourceType]}
        </span>
        <div className="flex items-center gap-2">
          {publishedDate && (
            <span className="text-xs font-medium text-gray-500">
              {publishedDate}
            </span>
          )}
          {showBookmark && onBookmarkToggle && (
            <BookmarkToggle
              emergingTechId={item.id}
              bookmarkTsid={bookmarkTsid ?? null}
              onToggle={onBookmarkToggle}
            />
          )}
        </div>
      </div>
    </article>
  );
}
