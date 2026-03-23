"use client";

import { PieChart, Pie, Tooltip, Legend } from "recharts";
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

// Minimal raw data with fill embedded — bypasses AgentChart entirely
const rawData = [
  { name: "OPENAI", value: 130, fill: "#3B82F6" },
  { name: "ANTHROPIC", value: 76, fill: "#EF4444" },
  { name: "GOOGLE", value: 65, fill: "#10B981" },
  { name: "META", value: 32, fill: "#F59E0B" },
];

export default function TestChartPage() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 32 }}>
      <section>
        <h2 style={{ marginBottom: 8, fontWeight: 700 }}>
          Test A: Raw Recharts PieChart (no AgentChart wrapper)
        </h2>
        <div style={{ border: "2px solid red", background: "#fff", padding: 16 }}>
          <PieChart width={400} height={300}>
            <Pie
              data={rawData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
            />
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: 8, fontWeight: 700 }}>
          Test B: AgentChart component
        </h2>
        <AgentChart data={testChart} />
      </section>
    </div>
  );
}
