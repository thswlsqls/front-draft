"use client";

import { useRef, useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";

const MAX_LENGTH = 500;

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  isSending?: boolean;
}

export function ChatInput({ onSend, disabled, isSending }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const isOverLimit = value.length > MAX_LENGTH;
  const canSend = trimmed.length > 0 && !isOverLimit && !disabled && !isSending;

  const handleSend = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t-2 border-black bg-white p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder="Ask about emerging tech..."
            aria-label="Message input"
            aria-describedby="char-count"
            rows={1}
            className="brutal-border w-full resize-none px-4 py-3 text-base focus:border-primary focus:outline-none min-h-[48px] max-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span
            id="char-count"
            aria-live="polite"
            className={`absolute bottom-1 right-3 text-xs font-mono ${
              isOverLimit ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {value.length}/{MAX_LENGTH}
          </span>
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className="brutal-border brutal-shadow-sm brutal-hover bg-primary text-primary-foreground p-3 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isSending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <SendHorizontal className="size-5" />
          )}
        </button>
      </div>
    </div>
  );
}
