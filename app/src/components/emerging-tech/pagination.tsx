"use client";

interface PaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  pageNumber,
  pageSize,
  totalCount,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  // Show max 7 page buttons with ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [1];

    if (pageNumber > 3) {
      pages.push("...");
    }

    const start = Math.max(2, pageNumber - 1);
    const end = Math.min(totalPages - 1, pageNumber + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (pageNumber < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(pageNumber - 1)}
        disabled={pageNumber <= 1}
        className="brutal-border brutal-shadow-sm brutal-hover bg-white px-3 py-2 font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        &lt;
      </button>

      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 font-bold text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`brutal-border brutal-shadow-sm min-w-[40px] px-3 py-2 font-bold cursor-pointer transition-colors ${
              p === pageNumber
                ? "bg-[#3B82F6] text-white"
                : "bg-white text-black hover:bg-[#DBEAFE]"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(pageNumber + 1)}
        disabled={pageNumber >= totalPages}
        className="brutal-border brutal-shadow-sm brutal-hover bg-white px-3 py-2 font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        &gt;
      </button>
    </nav>
  );
}
