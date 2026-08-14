"use client";

import React, { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateItem {
  id: string; // 'live' | 'all' | 'YYYY-MM-DD'
  label: string; // 'Live (In-Play)' | 'All' | 'Fri, 14 Aug'
  dayOfWeek: string; // 'TODAY' | 'TOMORROW' | 'SAT' | 'SUN'
  dayAndMonth: string; // '14 AUG'
  dateStr: string; // '2026-08-14'
  count: number;
}

interface DateNavigationCarouselProps {
  selectedDate: string; // 'live' | 'all' | '2026-08-14'
  onSelectDate: (dateId: string) => void;
  matches: any[];
  className?: string;
}

export function DateNavigationCarousel({
  selectedDate,
  onSelectDate,
  matches,
  className
}: DateNavigationCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate a continuous rolling 14-day timeline anchored to current reference date (2026-08-14)
  const baseDate = new Date("2026-08-14T00:00:00Z");
  const DAYS_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  // Calculate live count
  const liveCount = matches.filter(m => m.status === "Live").length;
  const totalCount = matches.length;

  const dateItems: DateItem[] = [
    {
      id: "live",
      label: "Live (In-Play)",
      dayOfWeek: "LIVE",
      dayAndMonth: "IN-PLAY",
      dateStr: "live",
      count: liveCount
    },
    {
      id: "all",
      label: "All Upcoming",
      dayOfWeek: "ALL",
      dayAndMonth: "SCHEDULE",
      dateStr: "all",
      count: totalCount
    }
  ];

  // 14 days: Day -1 (Yesterday) to Day +12
  for (let offset = -1; offset <= 12; offset++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + offset);

    const year = d.getFullYear();
    const monthStr = String(d.getMonth() + 1).padStart(2, "0");
    const dayStr = String(d.getDate()).padStart(2, "0");
    const formattedDateKey = `${year}-${monthStr}-${dayStr}`;

    let dayOfWeekLabel = DAYS_SHORT[d.getDay()];
    if (offset === 0) dayOfWeekLabel = "TODAY";
    else if (offset === 1) dayOfWeekLabel = "TOMORROW";
    else if (offset === -1) dayOfWeekLabel = "YESTERDAY";

    const dayAndMonthLabel = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
    const dayMatchCount = matches.filter(m => m.dateStr === formattedDateKey).length;

    dateItems.push({
      id: formattedDateKey,
      label: `${dayOfWeekLabel}, ${dayAndMonthLabel}`,
      dayOfWeek: dayOfWeekLabel,
      dayAndMonth: dayAndMonthLabel,
      dateStr: formattedDateKey,
      count: dayMatchCount
    });
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector(`[data-date-id="${selectedDate}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [selectedDate]);

  return (
    <div className={cn("relative w-full bg-white border-b border-slate-200 select-none", className)}>
      <div className="flex items-center px-1.5 sm:px-3 py-1.5 sm:py-2">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="hidden sm:flex items-center justify-center w-7 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0 mr-1.5 cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Date Ribbon */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none scroll-smooth px-0.5 py-0.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {dateItems.map((item) => {
            const isSelected = selectedDate === item.id;
            const isLiveItem = item.id === "live";
            const isAllItem = item.id === "all";

            return (
              <button
                key={item.id}
                data-date-id={item.id}
                type="button"
                onClick={() => onSelectDate(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[62px] sm:min-w-[80px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all text-center shrink-0 cursor-pointer border",
                  isSelected
                    ? isLiveItem
                      ? "bg-red-600 text-white border-red-600 shadow-xs ring-1 ring-red-400"
                      : "bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-400"
                    : isLiveItem
                    ? "bg-red-50/80 text-red-700 border-red-200 hover:bg-red-100"
                    : isAllItem
                    ? "bg-blue-50/80 text-blue-800 border-blue-200 hover:bg-blue-100"
                    : "bg-slate-50 text-slate-700 border-slate-200/90 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                {/* Top Row: Day Name or Icon */}
                <div className="flex items-center gap-1 leading-none">
                  {isLiveItem && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                  )}
                  {isAllItem && (
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 shrink-0" />
                  )}
                  <span className={cn(
                    "text-[8.5px] sm:text-[9.5px] font-black tracking-wider uppercase",
                    isSelected ? "text-white" : isLiveItem ? "text-red-700" : isAllItem ? "text-blue-700" : "text-slate-500"
                  )}>
                    {item.dayOfWeek}
                  </span>
                </div>

                {/* Middle/Bottom: Date & Match Count in compact form */}
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={cn(
                    "text-[11px] sm:text-xs font-black tracking-tight leading-none",
                    isSelected ? "text-white" : "text-slate-900"
                  )}>
                    {item.dayAndMonth}
                  </span>
                  <span className={cn(
                    "text-[8px] sm:text-[9px] font-bold px-1 py-0.2 rounded-full leading-none",
                    isSelected
                      ? "bg-white/20 text-white"
                      : isLiveItem
                      ? "bg-red-100 text-red-800"
                      : isAllItem
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-200/80 text-slate-600"
                  )}>
                    {item.count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="hidden sm:flex items-center justify-center w-7 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0 ml-1.5 cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
