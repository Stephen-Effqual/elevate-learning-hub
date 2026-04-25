"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

export default function UsageTracker() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/usage");
      if (response.ok) {
        const data = await response.json();
        setRemaining(data.remaining ?? null);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    }
  };

  if (remaining === null) return null;

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
      <MessageSquare className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-900">
        {remaining} / 120 messages today
      </span>
    </div>
  );
}
