"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type SearchField = "all" | "title" | "memo" | "tags";

interface BookmarkSearchBarProps {
  onSearch: (query: string, field: SearchField) => void;
  onClear: () => void;
}

const FIELD_OPTIONS: { value: SearchField; label: string }[] = [
  { value: "all", label: "All" },
  { value: "title", label: "Title" },
  { value: "memo", label: "Memo" },
  { value: "tags", label: "Tags" },
];

export function BookmarkSearchBar({
  onSearch,
  onClear,
}: BookmarkSearchBarProps) {
  const [query, setQuery] = useState("");
  const [field, setField] = useState<SearchField>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSearch = useCallback(
    (q: string, f: SearchField) => {
      if (q.trim()) {
        onSearch(q.trim(), f);
      } else {
        onClear();
      }
    },
    [onSearch, onClear]
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      triggerSearch(query, field);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, field, triggerSearch]);

  const handleClear = () => {
    setQuery("");
    onClear();
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks..."
          className="brutal-border w-full py-3 pl-10 pr-10 text-base focus:border-[#3B82F6] focus:outline-none"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:opacity-70"
          >
            <X className="size-4 text-gray-400" />
          </button>
        )}
      </div>
      <select
        value={field}
        onChange={(e) => setField(e.target.value as SearchField)}
        className="brutal-border bg-white px-3 py-3 text-sm font-bold focus:border-[#3B82F6] focus:outline-none"
      >
        {FIELD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
