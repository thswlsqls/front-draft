"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  TECH_PROVIDERS,
  UPDATE_TYPES,
  SOURCE_TYPES,
  type TechProvider,
  type EmergingTechType,
  type SourceType,
} from "@/types/emerging-tech";
import {
  PROVIDER_LABELS,
  UPDATE_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
} from "@/lib/constants";
import { format } from "date-fns";

interface FilterBarProps {
  provider: TechProvider | null;
  updateType: EmergingTechType | null;
  sourceType: SourceType | null;
  startDate: string | null;
  endDate: string | null;
  disabled: boolean;
  onProviderChange: (v: TechProvider | null) => void;
  onUpdateTypeChange: (v: EmergingTechType | null) => void;
  onSourceTypeChange: (v: SourceType | null) => void;
  onStartDateChange: (v: string | null) => void;
  onEndDateChange: (v: string | null) => void;
}

function TabGroup<T extends string>({
  label,
  items,
  labels,
  value,
  onChange,
  disabled,
}: {
  label: string;
  items: readonly T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (v: T | null) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange(null)}
          disabled={disabled}
          className={`brutal-border px-3 py-1.5 text-sm font-semibold transition-colors ${
            value === null
              ? "bg-[#3B82F6] text-white"
              : "bg-white text-black hover:bg-[#DBEAFE]"
          } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        >
          All
        </button>
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item)}
            disabled={disabled}
            className={`brutal-border px-3 py-1.5 text-sm font-semibold transition-colors ${
              value === item
                ? "bg-[#3B82F6] text-white"
                : "bg-white text-black hover:bg-[#DBEAFE]"
            } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {labels[item]}
          </button>
        ))}
      </div>
    </div>
  );
}

function DatePickerField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={`brutal-border brutal-shadow-sm h-10 min-w-[140px] justify-start text-left font-medium ${
            !value ? "text-gray-400" : "text-black"
          } ${disabled ? "opacity-40" : ""}`}
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {value || label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 brutal-border brutal-shadow" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"));
            } else {
              onChange(null);
            }
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function FilterBar({
  provider,
  updateType,
  sourceType,
  startDate,
  endDate,
  disabled,
  onProviderChange,
  onUpdateTypeChange,
  onSourceTypeChange,
  onStartDateChange,
  onEndDateChange,
}: FilterBarProps) {
  return (
    <div
      className={`space-y-4 brutal-border brutal-shadow bg-[#F5F5F5] p-5 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <TabGroup
        label="Provider"
        items={TECH_PROVIDERS}
        labels={PROVIDER_LABELS}
        value={provider}
        onChange={onProviderChange}
        disabled={disabled}
      />
      <TabGroup
        label="Update Type"
        items={UPDATE_TYPES}
        labels={UPDATE_TYPE_LABELS}
        value={updateType}
        onChange={onUpdateTypeChange}
        disabled={disabled}
      />
      <TabGroup
        label="Source Type"
        items={SOURCE_TYPES}
        labels={SOURCE_TYPE_LABELS}
        value={sourceType}
        onChange={onSourceTypeChange}
        disabled={disabled}
      />
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Published Date
        </span>
        <div className="flex items-center gap-3">
          <DatePickerField
            label="Start date"
            value={startDate}
            onChange={onStartDateChange}
            disabled={disabled}
          />
          <span className="font-bold text-gray-400">~</span>
          <DatePickerField
            label="End date"
            value={endDate}
            onChange={onEndDateChange}
            disabled={disabled}
          />
          {(startDate || endDate) && !disabled && (
            <button
              onClick={() => {
                onStartDateChange(null);
                onEndDateChange(null);
              }}
              className="brutal-border bg-white px-3 py-1.5 text-sm font-semibold hover:bg-[#DBEAFE] cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
