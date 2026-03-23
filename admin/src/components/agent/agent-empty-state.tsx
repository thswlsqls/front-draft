"use client";

import { Bot } from "lucide-react";

const EXAMPLE_GOALS = [
  "Collect latest AI releases from GitHub",
  "Provider별 수집 현황을 통계로 보여주세요",
  "Analyze top keyword trends from collected articles",
  "Search for OpenAI updates this month",
];

interface Props {
  onGoalClick: (goal: string) => void;
}

export function AgentEmptyState({ onGoalClick }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="brutal-border brutal-shadow mb-6 bg-white p-4">
        <Bot className="size-10 text-[#3B82F6]" />
      </div>

      <h2 className="mb-2 text-2xl font-bold">Welcome to AI Agent</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Give the agent a goal and it will autonomously collect, search, and
        analyze emerging tech data.
      </p>

      <div className="w-full max-w-md space-y-3">
        <p className="text-sm font-bold text-muted-foreground">Try a goal:</p>
        {EXAMPLE_GOALS.map((goal) => (
          <button
            key={goal}
            onClick={() => onGoalClick(goal)}
            className="brutal-border brutal-shadow-sm brutal-hover w-full cursor-pointer bg-white p-3 text-left text-sm font-medium"
          >
            {goal}
          </button>
        ))}
      </div>
    </div>
  );
}
