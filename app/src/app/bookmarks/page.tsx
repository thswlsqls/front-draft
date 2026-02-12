"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AuthHeader } from "@/components/auth/auth-header";
import { BookmarkCard } from "@/components/bookmark/bookmark-card";
import { BookmarkSearchBar } from "@/components/bookmark/bookmark-search-bar";
import { BookmarkEditModal } from "@/components/bookmark/bookmark-edit-modal";
import { BookmarkDeleteDialog } from "@/components/bookmark/bookmark-delete-dialog";
import { BookmarkHistoryModal } from "@/components/bookmark/bookmark-history-modal";
import { Pagination } from "@/components/emerging-tech/pagination";
import { fetchBookmarks, searchBookmarks } from "@/lib/bookmark-api";
import { PROVIDER_LABELS } from "@/lib/constants";
import type { BookmarkDetailResponse } from "@/types/bookmark";
import type { TechProvider } from "@/types/emerging-tech";

type SortOption = "createdAt,desc" | "createdAt,asc" | "updatedAt,desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "createdAt,desc", label: "Newest" },
  { value: "createdAt,asc", label: "Oldest" },
  { value: "updatedAt,desc", label: "Recently Updated" },
];

const PROVIDER_OPTIONS = Object.entries(PROVIDER_LABELS) as [
  TechProvider,
  string,
][];

export default function BookmarksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Data
  const [bookmarks, setBookmarks] = useState<BookmarkDetailResponse[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sort, setSort] = useState<SortOption>("createdAt,desc");
  const [provider, setProvider] = useState<string>("");

  // Search
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [searchField, setSearchField] = useState<
    "all" | "title" | "memo" | "tags"
  >("all");

  // Modals
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [user, authLoading, router]);

  // Data loading
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (searchQuery) {
        const res = await searchBookmarks({
          q: searchQuery,
          page,
          size: pageSize,
          searchField,
        });
        setBookmarks(res.data.list);
        setTotalSize(res.data.totalSize);
      } else {
        const res = await fetchBookmarks({
          page,
          size: pageSize,
          sort,
          provider: provider || undefined,
        });
        setBookmarks(res.data.list);
        setTotalSize(res.data.totalSize);
      }
    } catch {
      setBookmarks([]);
      setTotalSize(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchField, page, pageSize, sort, provider]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleSearch = (query: string, field: "all" | "title" | "memo" | "tags") => {
    setSearchQuery(query);
    setSearchField(field);
    setPage(1);
  };

  const handleSearchClear = () => {
    setSearchQuery(null);
    setPage(1);
  };

  const handleRefresh = () => {
    loadData();
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <div className="brutal-border h-8 w-8 animate-spin bg-[#3B82F6]" />
      </div>
    );
  }

  const isSearchActive = !!searchQuery;

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
              My Bookmarks
            </h2>
            <div className="h-[3px] flex-1 bg-black" />
          </div>
          <Link
            href="/bookmarks/deleted"
            className="brutal-border brutal-shadow-sm brutal-hover ml-4 flex items-center gap-1.5 bg-white px-4 py-2 text-sm font-bold"
          >
            <Trash2 className="size-4" />
            Trash
          </Link>
        </div>

        {/* Search Bar */}
        <BookmarkSearchBar onSearch={handleSearch} onClear={handleSearchClear} />

        {/* Search indicator */}
        {isSearchActive && (
          <div className="brutal-border brutal-shadow flex items-center gap-3 bg-[#DBEAFE] px-4 py-3">
            <span className="font-bold">
              Results for &ldquo;{searchQuery}&rdquo;
            </span>
            <span className="text-sm text-gray-600">
              {totalSize} items
            </span>
          </div>
        )}

        {/* Sort & Filter (disabled during search) */}
        {!isSearchActive && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-bold">Sort:</label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption);
                setPage(1);
              }}
              className="brutal-border bg-white px-3 py-2 text-sm font-bold focus:border-[#3B82F6] focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="ml-4 text-sm font-bold">Provider:</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setProvider("");
                  setPage(1);
                }}
                className={`brutal-border px-3 py-1.5 text-xs font-bold transition-colors ${
                  !provider
                    ? "bg-[#3B82F6] text-white"
                    : "bg-white hover:bg-[#DBEAFE]"
                }`}
              >
                All
              </button>
              {PROVIDER_OPTIONS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setProvider(key);
                    setPage(1);
                  }}
                  className={`brutal-border px-3 py-1.5 text-xs font-bold transition-colors ${
                    provider === key
                      ? "bg-[#3B82F6] text-white"
                      : "bg-white hover:bg-[#DBEAFE]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bookmark List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="brutal-border brutal-shadow h-40 animate-pulse bg-gray-100"
              />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="brutal-border brutal-shadow flex flex-col items-center justify-center bg-white py-16 text-center">
            {isSearchActive ? (
              <p className="text-gray-500">
                No bookmarks found for &ldquo;{searchQuery}&rdquo;.
              </p>
            ) : (
              <>
                <p className="mb-1 text-lg font-bold text-gray-400">
                  No bookmarks yet.
                </p>
                <p className="mb-4 text-gray-500">
                  Start bookmarking articles from the main page!
                </p>
                <Link
                  href="/"
                  className="brutal-border brutal-shadow-sm brutal-hover bg-[#3B82F6] px-6 py-2.5 font-bold text-white"
                >
                  Browse Articles
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.bookmarkTsid}
                bookmark={bookmark}
                onEdit={(b) => setEditId(b.bookmarkTsid)}
                onDelete={(b) => setDeleteId(b.bookmarkTsid)}
                onHistory={(b) => setHistoryId(b.bookmarkTsid)}
              />
            ))}
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

      {/* Edit Modal */}
      <BookmarkEditModal
        bookmarkId={editId}
        onClose={() => setEditId(null)}
        onUpdated={handleRefresh}
      />

      {/* Delete Dialog */}
      <BookmarkDeleteDialog
        bookmarkId={deleteId}
        onClose={() => setDeleteId(null)}
        onDeleted={handleRefresh}
      />

      {/* History Modal */}
      <BookmarkHistoryModal
        entityId={historyId}
        onClose={() => setHistoryId(null)}
        onVersionRestored={handleRefresh}
      />
    </div>
  );
}
