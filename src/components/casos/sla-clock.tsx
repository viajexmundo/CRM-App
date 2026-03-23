"use client";

import { useState, useEffect } from "react";
import { ClockIcon, AlertTriangleIcon } from "lucide-react";

interface SlaClockProps {
  deadline: Date | string;
  breached?: boolean;
  className?: string;
}

export function SlaClock({ deadline, breached = false, className }: SlaClockProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const deadlineDate = new Date(deadline);
  const remaining = deadlineDate.getTime() - now.getTime();
  const isExpired = remaining <= 0 || breached;

  // Calculate time components
  const absRemaining = Math.abs(remaining);
  const totalSeconds = Math.floor(absRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Color states
  let colorClass: string;
  let bgClass: string;
  let label: string;

  if (isExpired) {
    colorClass = "text-red-700 dark:text-red-400";
    bgClass = "bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-800";
    label = "SLA incumplido";
  } else {
    // Calculate what percentage of time remains
    // Using SLA hours from creation - we approximate by total hours
    const totalHours = hours + minutes / 60;

    if (totalHours < 2) {
      // Less than 25% time (roughly < 2 hours for most SLAs)
      colorClass = "text-red-700 dark:text-red-400";
      bgClass = "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800";
      label = "Tiempo crítico";
    } else if (totalHours < 6) {
      // 25-50% time remaining
      colorClass = "text-yellow-700 dark:text-yellow-400";
      bgClass = "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800";
      label = "Atención";
    } else {
      // > 50% time remaining
      colorClass = "text-green-700 dark:text-green-400";
      bgClass = "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800";
      label = "En tiempo";
    }
  }

  const timeString = `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${bgClass} ${className ?? ""}`}
    >
      <div className={`flex items-center gap-1.5 ${colorClass}`}>
        {isExpired ? (
          <AlertTriangleIcon className="h-4 w-4" />
        ) : (
          <ClockIcon className="h-4 w-4" />
        )}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className={`font-mono text-lg font-bold tabular-nums ${colorClass}`}>
        {isExpired ? "-" : ""}
        {timeString}
      </span>
    </div>
  );
}
