"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, RotateCcw } from "lucide-react";
import { AgentExecutionMeta } from "./agent-execution-meta";
import { ChartSection } from "./chart-section";
import type { ChartData, ExecutionMeta, MessageRole } from "@/types/agent";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isToday) return time;

  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${monthDay}, ${time}`;
}

const markdownComponents = {
  code({ className, children, ...props }: React.ComponentProps<"code">) {
    const match = /language-(\w+)/.exec(className || "");
    if (match) {
      return (
        <pre className="brutal-border overflow-x-auto bg-white p-3 text-sm">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code
        className="bg-gray-200 px-1 py-0.5 font-mono text-sm"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children }: React.ComponentProps<"pre">) {
    return <>{children}</>;
  },
  table({ children }: React.ComponentProps<"table">) {
    return (
      <div className="overflow-x-auto">
        <table className="brutal-border w-full text-sm">{children}</table>
      </div>
    );
  },
  th({ children }: React.ComponentProps<"th">) {
    return (
      <th className="border border-black bg-[#DBEAFE] px-3 py-2 text-left font-bold">
        {children}
      </th>
    );
  },
  td({ children }: React.ComponentProps<"td">) {
    return (
      <td className="border border-black px-3 py-2">{children}</td>
    );
  },
  a({ children, href, ...props }: React.ComponentProps<"a">) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#3B82F6] underline"
        {...props}
      >
        {children}
      </a>
    );
  },
  blockquote({ children }: React.ComponentProps<"blockquote">) {
    return (
      <blockquote className="border-l-4 border-[#3B82F6] pl-4 italic text-gray-600">
        {children}
      </blockquote>
    );
  },
};

interface Props {
  role: MessageRole;
  content: string;
  createdAt: string;
  executionMeta?: ExecutionMeta;
  chartData?: ChartData[];
  failed?: boolean;
  onRetry?: () => void;
}

export function AgentMessageBubble({
  role,
  content,
  createdAt,
  executionMeta,
  chartData,
  failed,
  onRetry,
}: Props) {
  const isUser = role === "USER";

  return (
    <div>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`brutal-border p-3 ${
            isUser
              ? "ml-auto max-w-[70%] bg-[#3B82F6] text-white"
              : "max-w-[85%] bg-[#F5F5F5] text-black"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className="prose-brutal">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}

          {isUser && failed && (
            <div className="mt-2 flex items-center gap-2">
              <AlertCircle className="size-3.5 text-red-200" />
              <span className="text-xs text-red-200">Failed to send</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 text-xs text-red-200 hover:underline"
                >
                  <RotateCcw className="size-3" />
                  Retry
                </button>
              )}
            </div>
          )}

          {!isUser && executionMeta && (
            <AgentExecutionMeta meta={executionMeta} />
          )}

          <p
            className={`mt-1 font-mono text-xs ${
              isUser ? "text-white/70" : "text-muted-foreground"
            }`}
          >
            {formatTimestamp(createdAt)}
          </p>
        </div>
      </div>

      {!isUser && chartData && chartData.length > 0 && (
        <div className="mt-3 max-w-[85%]">
          <ChartSection chartData={chartData} />
        </div>
      )}
    </div>
  );
}
