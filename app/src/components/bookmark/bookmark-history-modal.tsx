"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  fetchBookmarkHistory,
  fetchBookmarkAtTime,
} from "@/lib/bookmark-api";
import { useToast } from "@/contexts/toast-context";
import { AuthError } from "@/lib/auth-fetch";
import { Pagination } from "@/components/emerging-tech/pagination";
import { BookmarkRestoreDialog } from "./bookmark-restore-dialog";
import type {
  BookmarkHistoryDetailResponse,
  BookmarkHistoryParams,
} from "@/types/bookmark";

interface BookmarkHistoryModalProps {
  entityId: string | null;
  onClose: () => void;
  onVersionRestored: () => void;
}

const OP_BADGE_STYLES: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 brutal-border",
  UPDATE: "bg-[#DBEAFE] text-blue-800 brutal-border",
  DELETE: "bg-red-100 text-red-800 brutal-border",
};

type OperationFilter = "" | "CREATE" | "UPDATE" | "DELETE";

function formatDataField(
  data: Record<string, unknown> | null
): React.ReactNode {
  if (!data) return <span className="text-gray-400">-</span>;
  const tags = data.tags as string[] | undefined;
  const memo = data.memo as string | undefined;

  return (
    <div className="space-y-1 text-xs">
      {tags !== undefined && (
        <div>
          <span className="font-semibold">tags:</span>{" "}
          {Array.isArray(tags) ? `[${tags.join(", ")}]` : String(tags)}
        </div>
      )}
      {memo !== undefined && (
        <div>
          <span className="font-semibold">memo:</span>{" "}
          {memo ? `"${memo}"` : '""'}
        </div>
      )}
    </div>
  );
}

export function BookmarkHistoryModal({
  entityId,
  onClose,
  onVersionRestored,
}: BookmarkHistoryModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BookmarkHistoryDetailResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalSize, setTotalSize] = useState(0);
  const pageSize = 10;

  // Filters
  const [operationType, setOperationType] = useState<OperationFilter>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Timestamp lookup
  const [timestamp, setTimestamp] = useState("");
  const [timestampResult, setTimestampResult] =
    useState<BookmarkHistoryDetailResponse | null>(null);
  const [timestampLoading, setTimestampLoading] = useState(false);

  // Restore dialog
  const [restoreHistoryId, setRestoreHistoryId] = useState<string | null>(null);
  const [restoreChangedAt, setRestoreChangedAt] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);

    const params: BookmarkHistoryParams = {
      page,
      size: pageSize,
    };
    if (operationType) params.operationType = operationType;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    try {
      const res = await fetchBookmarkHistory(entityId, params);
      setHistory(res.data.list);
      setTotalSize(res.data.totalSize);
    } catch (err) {
      showToast(
        err instanceof AuthError ? err.message : "Failed to load history.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [entityId, page, operationType, startDate, endDate, showToast]);

  useEffect(() => {
    if (entityId) {
      setPage(1);
      setTimestampResult(null);
    }
  }, [entityId]);

  useEffect(() => {
    if (entityId) {
      loadHistory();
    }
  }, [entityId, loadHistory]);

  const handleTimestampView = async () => {
    if (!entityId || !timestamp.trim()) return;
    setTimestampLoading(true);
    setTimestampResult(null);

    try {
      const res = await fetchBookmarkAtTime(entityId, timestamp.trim());
      setTimestampResult(res);
    } catch (err) {
      showToast(
        err instanceof AuthError ? err.message : "Failed to load data at timestamp.",
        "error"
      );
    } finally {
      setTimestampLoading(false);
    }
  };

  const handleRestoreVersion = (item: BookmarkHistoryDetailResponse) => {
    setRestoreHistoryId(item.historyId);
    setRestoreChangedAt(item.changedAt);
  };

  const handleVersionRestored = () => {
    setRestoreHistoryId(null);
    setRestoreChangedAt(null);
    onVersionRestored();
    onClose();
  };

  const handleClose = () => {
    setOperationType("");
    setStartDate("");
    setEndDate("");
    setTimestamp("");
    setTimestampResult(null);
    onClose();
  };

  return (
    <>
      <DialogPrimitive.Root
        open={!!entityId}
        onOpenChange={(open) => !open && handleClose()}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed top-[50%] left-[50%] z-50 w-full max-w-2xl max-h-[85vh] translate-x-[-50%] translate-y-[-50%] brutal-border-3 brutal-shadow-lg bg-white p-0 overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
            {/* Header */}
            <div className="border-b-3 border-black p-6 pb-4">
              <DialogPrimitive.Title className="text-xl font-bold">
                Change History
              </DialogPrimitive.Title>
              <div className="mt-1 h-[2px] bg-black" />
            </div>

            <div className="space-y-5 p-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={operationType}
                  onChange={(e) => {
                    setOperationType(e.target.value as OperationFilter);
                    setPage(1);
                  }}
                  className="brutal-border bg-white px-3 py-2 text-sm font-bold focus:border-[#3B82F6] focus:outline-none"
                >
                  <option value="">All</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="brutal-border bg-white px-3 py-2 text-sm font-mono focus:border-[#3B82F6] focus:outline-none"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="brutal-border bg-white px-3 py-2 text-sm font-mono focus:border-[#3B82F6] focus:outline-none"
                  placeholder="End Date"
                />
              </div>

              {/* History List */}
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-[#3B82F6]" />
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No change history.
                </div>
              ) : (
                <div className="divide-y-2 divide-black">
                  {history.map((item) => (
                    <div key={item.historyId} className="py-4 first:pt-0 last:pb-0">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold ${
                            OP_BADGE_STYLES[item.operationType] || ""
                          }`}
                        >
                          {item.operationType}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(item.changedAt).toLocaleString("en-US")}
                        </span>
                      </div>

                      {item.beforeData && (
                        <div className="mb-1">
                          <span className="text-xs font-semibold text-gray-500">
                            Before:
                          </span>
                          {formatDataField(item.beforeData)}
                        </div>
                      )}
                      {item.afterData && (
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-gray-500">
                            After:
                          </span>
                          {formatDataField(item.afterData)}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRestoreVersion(item)}
                          className="text-xs font-bold text-[#3B82F6] hover:underline"
                        >
                          Restore Version
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && totalSize > pageSize && (
                <div className="py-2">
                  <Pagination
                    pageNumber={page}
                    pageSize={pageSize}
                    totalCount={totalSize}
                    onPageChange={setPage}
                  />
                </div>
              )}

              {/* Timestamp lookup */}
              <div className="border-t-2 border-black pt-4">
                <p className="mb-3 text-sm font-bold">
                  View at Specific Time
                </p>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    className="brutal-border flex-1 bg-white px-3 py-2 text-sm font-mono focus:border-[#3B82F6] focus:outline-none"
                  />
                  <button
                    onClick={handleTimestampView}
                    disabled={!timestamp.trim() || timestampLoading}
                    className="brutal-border brutal-shadow-sm brutal-hover bg-[#3B82F6] px-4 py-2 text-sm font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {timestampLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "View"
                    )}
                  </button>
                </div>

                {timestampResult && (
                  <div className="mt-3 brutal-border bg-[#F5F5F5] p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold ${
                          OP_BADGE_STYLES[timestampResult.operationType] || ""
                        }`}
                      >
                        {timestampResult.operationType}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(timestampResult.changedAt).toLocaleString(
                          "en-US"
                        )}
                      </span>
                    </div>
                    {timestampResult.afterData && (
                      <div>
                        <span className="text-xs font-semibold text-gray-500">
                          Data:
                        </span>
                        {formatDataField(timestampResult.afterData)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Close button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleClose}
                  className="brutal-border brutal-shadow-sm brutal-hover bg-white px-6 py-2.5 font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <BookmarkRestoreDialog
        entityId={entityId}
        historyId={restoreHistoryId}
        changedAt={restoreChangedAt}
        onClose={() => {
          setRestoreHistoryId(null);
          setRestoreChangedAt(null);
        }}
        onRestored={handleVersionRestored}
      />
    </>
  );
}
