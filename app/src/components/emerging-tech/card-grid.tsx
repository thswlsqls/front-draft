"use client";

import type { EmergingTechItem } from "@/types/emerging-tech";
import { EmergingTechCard } from "./card";

interface CardGridProps {
  items: EmergingTechItem[];
  loading: boolean;
  onCardClick: (id: string) => void;
}

export function CardGrid({ items, loading, onCardClick }: CardGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="brutal-border brutal-shadow h-52 animate-pulse bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="brutal-border brutal-shadow flex h-52 items-center justify-center bg-white">
        <p className="text-lg font-bold text-gray-400">
          No data found
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <EmergingTechCard key={item.id} item={item} onClick={onCardClick} />
      ))}
    </div>
  );
}
