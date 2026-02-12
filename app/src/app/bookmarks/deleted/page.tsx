"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AuthHeader } from "@/components/auth/auth-header";
import { Pagination } from "@/components/emerging-tech/pagination";
import { fetchDeletedBookmarks, restoreBookmark } from "@/lib/bookmark-api";
import { useToast } from "@/contexts/toast-context";
import { AuthError } from "@/lib/auth-fetch";
import { PROVIDER_COLORS, PROVIDER_LABELS } from "@/lib/constants";
import type { BookmarkDetailResponse } from "@/types/bookmark";
import type { TechProvider } from "@/types/emerging-tech";

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

export default function DeletedBookmarksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [bookmarks, setBookmarks] = useState<BookmarkDetailResponse[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDeletedBookmarks({ page, size: pageSize, days });
      setBookmarks(res.data.list);
      setTotalSize(res.data.totalSize);
    } catch {
      setBookmarks([]);
      setTotalSize(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, days]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleRestore = async (bookmark: BookmarkDetailResponse) => {
    setRestoringId(bookmark.bookmarkTsid);
    try {
      await restoreBookmark(bookmark.bookmarkTsid);
      showToast("Bookmark restored.", "success");
      loadData();
    } catch (err) {
      showToast(
        err instanceof AuthError
          ? err.message
          : "Failed to restore bookmark.",
        "error"
      );
    } finally {
      setRestoringId(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <div className="brutal-border h-8 w-8 animate-spin bg-[#3B82F6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="border-b-3 border-black bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <Link
            href="/"
            className="shrink-0 text-2xl font-bold tracking-tight md:text-3xl"
          >
            Tech <span className="text-[#3B82F6]">N</span> AI
          </Link>
          <AuthHeader />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* Page heading */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              Trash
            </h2>
            <div className="h-[3px] flex-1 bg-black" />
          </div>
          <Link
            href="/bookmarks"
            className="brutal-border brutal-shadow-sm brutal-hover ml-4 flex items-center gap-1.5 bg-white px-4 py-2 text-sm font-bold"
          >
            <ArrowLeft className="size-4" />
            Back to Bookmarks
          </Link>
        </div>

        {/* Days filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing items deleted within
          </span>
          <select
            value={days}
            onChange={(e) => {
              setDays(Number(e.target.value));
              setPage(1);
            }}
            className="brutal-border bg-white px-3 py-1.5 text-sm font-bold focus:border-[#3B82F6] focus:outline-none"
          >
            {DAYS_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">days</span>
        </div>

        {/* Deleted bookmarks list */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="brutal-border brutal-shadow h-32 animate-pulse bg-gray-100"
              />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="brutal-border brutal-shadow flex items-center justify-center bg-white py-16">
            <p className="text-gray-500">Trash is empty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => {
              const providerKey = bookmark.provider as TechProvider | null;
              const providerColor =
                providerKey && PROVIDER_COLORS[providerKey]
                  ? PROVIDER_COLORS[providerKey]
                  : "bg-gray-500 text-white";
              const providerLabel =
                providerKey && PROVIDER_LABELS[providerKey]
                  ? PROVIDER_LABELS[providerKey]
                  : bookmark.provider;

              const deletedDate = bookmark.updatedAt
                ? new Date(bookmark.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "";

              return (
                <article
                  key={bookmark.bookmarkTsid}
                  className="brutal-border brutal-shadow bg-white p-5"
                >
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
                      {deletedDate}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-bold leading-tight">
                    {bookmark.title || "Untitled"}
                  </h3>

                  {bookmark.summary && (
                    <p className="mb-3 text-sm leading-relaxed text-gray-600 line-clamp-2">
                      {bookmark.summary}
                    </p>
                  )}

                  <div className="flex items-center justify-end border-t-2 border-black pt-3">
                    <button
                      onClick={() => handleRestore(bookmark)}
                      disabled={restoringId === bookmark.bookmarkTsid}
                      className="brutal-border brutal-shadow-sm brutal-hover bg-[#3B82F6] px-4 py-2 text-sm font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {restoringId === bookmark.bookmarkTsid ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Restore"
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalSize > pageSize && (
          <div className="py-4">
            <Pagination
              pageNumber={page}
              pageSize={pageSize}
              totalCount={totalSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
