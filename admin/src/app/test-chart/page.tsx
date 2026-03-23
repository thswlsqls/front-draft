"use client";

import { AgentChart } from "@/components/agent/agent-chart";
import type { ChartData } from "@/types/agent";

const testChart: ChartData = {
  chartType: "pie",
  title: "Provider별 통계",
  meta: { groupBy: "provider", startDate: null, endDate: null, totalCount: 303 },
  dataPoints: [
    { label: "OPENAI", value: 130 },
    { label: "ANTHROPIC", value: 76 },
    { label: "GOOGLE", value: 65 },
    { label: "META", value: 32 },
  ],
};

export default function TestChartPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <h1 style={{ padding: 16 }}>Test 1: Standalone</h1>
      <AgentChart data={testChart} />

      <h1 style={{ padding: 16 }}>Test 2: Inside absolute+overflow container (same as agent)</h1>
      <div style={{ position: "relative", flex: 1 }}>
        <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ maxWidth: "85%", background: "#F5F5F5", border: "2px solid #000", padding: 12 }}>
              <p>Message text above chart</p>
              <AgentChart data={testChart} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
