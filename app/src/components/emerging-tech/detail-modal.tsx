"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EmergingTechItem } from "@/types/emerging-tech";
import {
  PROVIDER_COLORS,
  PROVIDER_LABELS,
  UPDATE_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
} from "@/lib/constants";
import { fetchDetail } from "@/lib/api";

interface DetailModalProps {
  itemId: string | null;
  onClose: () => void;
}

export function DetailModal({ itemId, onClose }: DetailModalProps) {
  const [item, setItem] = useState<EmergingTechItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetchDetail(itemId)
      .then(setItem)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [itemId]);

  const publishedDate = item?.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Dialog open={!!itemId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="brutal-border-3 brutal-shadow-lg max-w-2xl bg-white p-0 sm:rounded-none">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <DialogTitle className="sr-only">Loading</DialogTitle>
            <div className="brutal-border h-8 w-8 animate-spin bg-[#3B82F6]" />
          </div>
        )}

        {error && (
          <div className="flex h-64 items-center justify-center">
            <DialogTitle className="sr-only">Error</DialogTitle>
            <p className="text-lg font-bold text-red-500">{error}</p>
          </div>
        )}

        {item && !loading && !error && (
          <>
            <DialogHeader className="border-b-3 border-black p-6 pb-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <span
                  className={`brutal-border px-2 py-0.5 text-xs font-bold ${PROVIDER_COLORS[item.provider]}`}
                >
                  {PROVIDER_LABELS[item.provider]}
                </span>
                <span className="brutal-border bg-[#DBEAFE] px-2 py-0.5 text-xs font-bold text-black">
                  {UPDATE_TYPE_LABELS[item.updateType]}
                </span>
                <span className="brutal-border bg-white px-2 py-0.5 text-xs font-bold">
                  {SOURCE_TYPE_LABELS[item.sourceType]}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold leading-tight">
                {item.title}
              </DialogTitle>
              {publishedDate && (
                <p className="text-sm font-medium text-gray-500">
                  {publishedDate}
                </p>
              )}
            </DialogHeader>

            <div className="space-y-5 p-6">
              {/* Summary */}
              {item.summary && (
                <div>
                  <p className="leading-relaxed text-gray-700">
                    {item.summary}
                  </p>
                </div>
              )}

              {/* Metadata */}
              {item.metadata && (
                <div className="space-y-3">
                  {item.metadata.tags && item.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.metadata.tags.map((tag) => (
                        <span
                          key={tag}
                          className="brutal-border bg-[#F5F5F5] px-2 py-0.5 text-xs font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    {item.metadata.version && (
                      <span>
                        <strong>Version:</strong> {item.metadata.version}
                      </span>
                    )}
                    {item.metadata.author && (
                      <span>
                        <strong>Author:</strong> {item.metadata.author}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 border-t-2 border-black pt-4">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brutal-border brutal-shadow brutal-hover inline-flex items-center gap-2 bg-[#3B82F6] px-4 py-2 font-bold text-white"
                >
                  View Original
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                {item.metadata?.githubRepo && (
                  <a
                    href={
                      item.metadata.githubRepo.startsWith("http")
                        ? item.metadata.githubRepo
                        : `https://github.com/${item.metadata.githubRepo}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brutal-border brutal-shadow brutal-hover inline-flex items-center gap-2 bg-black px-4 py-2 font-bold text-white"
                  >
                    GitHub
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
