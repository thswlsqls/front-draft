"use client";

import { useEffect, useRef, useState } from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartData, ChartMeta } from "@/types/agent";

const CHART_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

const CHART_HEIGHT = 300;

function formatPeriod(meta: ChartMeta): string {
  if (!meta.startDate && !meta.endDate) return "All period";
  if (meta.startDate && !meta.endDate) return `From ${meta.startDate}`;
  if (!meta.startDate && meta.endDate) return `Until ${meta.endDate}`;
  return `${meta.startDate} ~ ${meta.endDate}`;
}

interface Props {
  data: ChartData;
}

export function AgentChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        console.log("[AgentChart] ResizeObserver width:", w);
        setWidth(w);
      }
    });
    observer.observe(el);
    const initialWidth = el.clientWidth;
    console.log("[AgentChart] initial clientWidth:", initialWidth);
    setWidth(initialWidth);

    return () => observer.disconnect();
  }, []);

  console.log("[AgentChart] render:", { width, chartType: data.chartType, dataPoints: data.dataPoints });

  if (data.chartType !== "pie" && data.chartType !== "bar") return null;
  if (!Array.isArray(data.dataPoints) || data.dataPoints.length === 0)
    return null;

  // Recharts 3.x: embed fill directly into data for reliable rendering
  const coloredData = data.dataPoints.map((dp, i) => ({
    ...dp,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div
      ref={containerRef}
      className="brutal-border bg-white p-4"
      style={{ minWidth: 320 }}
      role="img"
      aria-label={`${data.title}. Total: ${data.meta.totalCount}`}
    >
      <h4 className="mb-3 text-sm font-bold">{data.title}</h4>

      {width > 0 && data.chartType === "pie" && (
        <PieChart width={width} height={CHART_HEIGHT}>
          <Pie
            data={coloredData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="45%"
            outerRadius={Math.min(100, (width - 32) / 3)}
            label={width >= 400}
          />
          <Tooltip />
          <Legend />
        </PieChart>
      )}

      {width > 0 && data.chartType === "bar" && (
        <BarChart width={width} height={CHART_HEIGHT} data={coloredData}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        Period: {formatPeriod(data.meta)} | Total:{" "}
        {data.meta.totalCount.toLocaleString()}
      </p>
    </div>
  );
}
