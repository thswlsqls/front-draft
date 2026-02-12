"use client";

import type { SourceResponse } from "@/types/chatbot";

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

const COLLECTION_BADGE_STYLES: Record<string, string> = {
  EMERGING_TECH:
    "bg-accent text-accent-foreground brutal-border px-2 py-0.5 text-xs font-bold",
  NEWS: "bg-green-100 text-green-800 brutal-border px-2 py-0.5 text-xs font-bold",
};

const DEFAULT_BADGE_STYLE =
  "bg-gray-100 text-gray-600 brutal-border px-2 py-0.5 text-xs font-bold";

interface Props {
  sources: SourceResponse[];
}

export function ChatSourceCitation({ sources }: Props) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 border-t-2 border-black pt-2">
      <p className="text-xs font-bold text-muted-foreground mb-1">Sources</p>
      <ul className="space-y-1">
        {sources.map((source, idx) => (
          <li key={source.documentId ?? idx} className="flex items-center gap-2 text-sm">
            <span className="font-mono text-xs text-muted-foreground">
              [{idx + 1}]
            </span>

            {source.url && isSafeUrl(source.url) ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium truncate"
              >
                {source.title || source.url}
              </a>
            ) : (
              <span className="font-medium truncate">
                {source.title || "Untitled"}
              </span>
            )}

            {source.collectionType && (
              <span
                className={
                  COLLECTION_BADGE_STYLES[source.collectionType] ??
                  DEFAULT_BADGE_STYLE
                }
              >
                {source.collectionType}
              </span>
            )}

            {source.score != null && (
              <span className="text-xs text-muted-foreground font-mono ml-auto shrink-0">
                {Math.round(source.score * 100)}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
