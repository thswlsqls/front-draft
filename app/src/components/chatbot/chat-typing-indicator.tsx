"use client";

export function ChatTypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-[80%]">
      <div className="brutal-border bg-secondary p-3" aria-label="AI is thinking">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="inline-block size-2 bg-black animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="inline-block size-2 bg-black animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="inline-block size-2 bg-black animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-muted-foreground">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
}
