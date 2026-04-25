"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });

    const data = await res.json();

    if (res.ok) {
      // Full reload so Clerk issues a fresh token with updated accessUntil
      window.location.href = "/student";
    } else {
      setError(data.error ?? "Invalid code. Please check and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-blue-900 text-center mb-1">
          Activate Your Access
        </h1>
        <p className="text-gray-500 text-center text-sm mb-6">
          Enter the access code provided by your school or teacher to unlock the
          Elevate tutor.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Access Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your access code here"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Activating…" : "Activate Access"}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-4">
          Don&apos;t have a code? Contact your school administrator.
        </p>
      </div>
    </div>
  );
}
