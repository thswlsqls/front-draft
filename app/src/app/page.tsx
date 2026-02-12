"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchBar } from "@/components/emerging-tech/search-bar";
import { FilterBar } from "@/components/emerging-tech/filter-bar";
import { CardGrid } from "@/components/emerging-tech/card-grid";
import { DetailModal } from "@/components/emerging-tech/detail-modal";
import { Pagination } from "@/components/emerging-tech/pagination";
import { AuthHeader } from "@/components/auth/auth-header";
import { fetchList, fetchSearch } from "@/lib/api";
import { fetchBookmarks } from "@/lib/bookmark-api";
import { useAuth } from "@/contexts/auth-context";
import type {
  EmergingTechItem,
  TechProvider,
  EmergingTechType,
  SourceType,
} from "@/types/emerging-tech";

export default function Home() {
  const { user } = useAuth();

  // Data state
  const [items, setItems] = useState<EmergingTechItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [provider, setProvider] = useState<TechProvider | null>(null);
  const [updateType, setUpdateType] = useState<EmergingTechType | null>(null);
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  // Modal state
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Bookmark state: emergingTechId -> bookmarkTsid
  const [bookmarkMap, setBookmarkMap] = useState<Map<string, string>>(
    new Map()
  );

  // Load bookmark set for logged-in user
  useEffect(() => {
    if (!user) {
      setBookmarkMap(new Map());
      return;
    }

    fetchBookmarks({ size: 100 })
      .then((res) => {
        const map = new Map<string, string>();
        for (const b of res.data.list) {
          map.set(b.emergingTechId, b.bookmarkTsid);
        }
        setBookmarkMap(map);
      })
      .catch(() => {
        // Silently fail - bookmarks just won't show
      });
  }, [user]);

  const handleBookmarkToggle = useCallback(
    (emergingTechId: string, bookmarkTsid: string | null) => {
      setBookmarkMap((prev) => {
        const next = new Map(prev);
        if (bookmarkTsid) {
          next.set(emergingTechId, bookmarkTsid);
        } else {
          next.delete(emergingTechId);
        }
        return next;
      });
    },
    []
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (searchQuery) {
        const data = await fetchSearch({
          q: searchQuery,
          page: pageNumber,
          size: pageSize,
        });
        setItems(data.items);
        setTotalCount(data.totalCount);
      } else {
        const data = await fetchList({
          page: pageNumber,
          size: pageSize,
          provider: provider ?? undefined,
          updateType: updateType ?? undefined,
          sourceType: sourceType ?? undefined,
          startDate: startDate ?? undefined,
          endDate: endDate ?? undefined,
          sort: "publishedAt,desc",
        });
        setItems(data.items);
        setTotalCount(data.totalCount);
      }
    } catch {
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    pageNumber,
    pageSize,
    provider,
    updateType,
    sourceType,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = <T,>(
    setter: (v: T) => void,
    value: T
  ) => {
    setter(value);
    setPageNumber(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPageNumber(1);
  };

  const handleSearchClear = () => {
    setSearchQuery(null);
    setPageNumber(1);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="border-b-3 border-black bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <h1 className="shrink-0 text-2xl font-bold tracking-tight md:text-3xl">
            Tech <span className="text-[#3B82F6]">N</span> AI
          </h1>
          <div className="w-full max-w-md">
            <SearchBar onSearch={handleSearch} onClear={handleSearchClear} />
          </div>
          <AuthHeader />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* Filter Bar */}
        <FilterBar
          provider={provider}
          updateType={updateType}
          sourceType={sourceType}
          startDate={startDate}
          endDate={endDate}
          disabled={!!searchQuery}
          onProviderChange={(v) => handleFilterChange(setProvider, v)}
          onUpdateTypeChange={(v) => handleFilterChange(setUpdateType, v)}
          onSourceTypeChange={(v) => handleFilterChange(setSourceType, v)}
          onStartDateChange={(v) => handleFilterChange(setStartDate, v)}
          onEndDateChange={(v) => handleFilterChange(setEndDate, v)}
        />

        {/* Search indicator */}
        {searchQuery && (
          <div className="brutal-border brutal-shadow flex items-center gap-3 bg-[#DBEAFE] px-4 py-3">
            <span className="font-bold">
              Results for &ldquo;{searchQuery}&rdquo;
            </span>
            <span className="text-sm text-gray-600">
              {totalCount} items
            </span>
          </div>
        )}

        {/* Section heading */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            Emerging Tech
          </h2>
          <div className="h-[3px] flex-1 bg-black" />
          {!loading && (
            <span className="brutal-border bg-white px-3 py-1 text-sm font-bold">
              {totalCount} items
            </span>
          )}
        </div>

        {/* Card Grid */}
        <CardGrid
          items={items}
          loading={loading}
          onCardClick={setSelectedId}
          bookmarkMap={user ? bookmarkMap : undefined}
          onBookmarkToggle={user ? handleBookmarkToggle : undefined}
          showBookmark={!!user}
        />

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="py-4">
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPageNumber}
            />
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <DetailModal
        itemId={selectedId}
        onClose={() => setSelectedId(null)}
        bookmarkTsid={selectedId ? (bookmarkMap.get(selectedId) ?? null) : null}
        onBookmarkToggle={user ? handleBookmarkToggle : undefined}
        showBookmark={!!user}
      />
    </div>
  );
}
