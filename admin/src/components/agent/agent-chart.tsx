"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
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
const DEFAULT_WIDTH = 300;

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
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setWidth(el.clientWidth);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const coloredData = useMemo(
    () =>
      data.dataPoints.map((dp, i) => ({
        ...dp,
        value: Number(dp.value),
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [data.dataPoints],
  );

  if (data.chartType !== "pie" && data.chartType !== "bar") return null;
  if (!Array.isArray(data.dataPoints) || data.dataPoints.length === 0)
    return null;

  const chartWidth = width > 0 ? width : DEFAULT_WIDTH;

  return (
    <div
      ref={containerRef}
      className="brutal-border bg-white p-4"
      style={{ minWidth: 320 }}
      role="img"
      aria-label={`${data.title}. Total: ${data.meta.totalCount}`}
    >
      <h4 className="mb-3 text-sm font-bold">{data.title}</h4>

      {data.chartType === "pie" && (
        <PieChart width={chartWidth} height={CHART_HEIGHT}>
          <Pie
            data={coloredData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="45%"
            outerRadius={Math.min(100, (chartWidth - 32) / 3)}
            label={chartWidth >= 400}
            isAnimationActive={false}
          />
          <Tooltip />
          <Legend />
        </PieChart>
      )}

      {data.chartType === "bar" && (
        <BarChart width={chartWidth} height={CHART_HEIGHT} data={coloredData}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" isAnimationActive={false} />
        </BarChart>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        Period: {formatPeriod(data.meta)} | Total:{" "}
        {Number(data.meta.totalCount).toLocaleString()}
      </p>
    </div>
  );
}
