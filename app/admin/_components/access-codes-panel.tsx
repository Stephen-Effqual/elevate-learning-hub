"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, Check, Key } from "lucide-react";

interface GeneratedCode {
  userId: string;
  days: number;
  code: string;
  createdAt: string;
}

export default function AccessCodesPanel() {
  const [userId, setUserId] = useState("");
  const [days, setDays] = useState<30 | 60>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codes, setCodes] = useState<GeneratedCode[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleGenerate() {
    if (!userId.trim()) {
      setError("Enter the student's Clerk user ID");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/access-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId.trim(), days }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to generate code");
      return;
    }

    setCodes((prev) => [
      {
        userId: userId.trim(),
        days,
        code: data.code as string,
        createdAt: new Date().toLocaleString("en-NZ"),
      },
      ...prev,
    ]);
    setUserId("");
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          <CardTitle>Access Code Generator</CardTitle>
        </div>
        <CardDescription>
          Generate single-use access codes for students. Each code grants 30 or 60
          days of tutor access from the date it is redeemed. You can issue multiple
          codes to the same student for stacked extensions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Clerk User ID
            </label>
            <Input
              placeholder="user_xxxxxxxxxxxxxxxxxxxx"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Duration</label>
            <div className="flex gap-2">
              <Button
                variant={days === 30 ? "default" : "outline"}
                onClick={() => setDays(30)}
                type="button"
                size="sm"
              >
                30 days
              </Button>
              <Button
                variant={days === 60 ? "default" : "outline"}
                onClick={() => setDays(60)}
                type="button"
                size="sm"
              >
                60 days
              </Button>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating…" : "Generate Code"}
          </Button>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {codes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Codes generated this session
            </h3>
            {codes.map((entry, i) => (
              <div
                key={i}
                className="border rounded-lg p-3 bg-gray-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    <span className="font-mono">{entry.userId}</span> ·{" "}
                    {entry.days} days · {entry.createdAt}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(entry.code)}
                    title="Copy code"
                  >
                    {copied === entry.code ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs font-mono break-all text-gray-600 bg-white border rounded px-2 py-1">
                  {entry.code}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
