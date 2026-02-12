"use client";

import { MessageSquare } from "lucide-react";

const EXAMPLE_QUESTIONS = [
  "What are the latest AI trends?",
  "Tell me about new model releases",
  "Compare GPT and Claude updates",
];

interface Props {
  onQuestionClick: (question: string) => void;
}

export function ChatEmptyState({ onQuestionClick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="brutal-border brutal-shadow bg-white p-4 mb-6">
        <MessageSquare className="size-10 text-primary" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Welcome to Tech Chat!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Ask me anything about emerging technologies. I&apos;ll reference the
        latest documents to help you.
      </p>

      <div className="w-full max-w-md space-y-3">
        <p className="text-sm font-bold text-muted-foreground">Try asking:</p>
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onQuestionClick(q)}
            className="brutal-border brutal-shadow-sm brutal-hover bg-white p-3 text-sm cursor-pointer w-full text-left font-medium"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
