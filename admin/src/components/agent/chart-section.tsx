"use client";

import { AgentChart } from "./agent-chart";
import type { ChartData } from "@/types/agent";

interface Props {
  chartData: ChartData[];
}

export function ChartSection({ chartData }: Props) {
  if (chartData.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {chartData.map((chart, index) => (
        <AgentChart key={`${chart.chartType}-${chart.title}-${index}`} data={chart} />
      ))}
    </div>
  );
}
