"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star, TrendingUp, MessageSquare, User } from "lucide-react";

interface FeedbackItem {
  id: string;
  accuracy: number;
  helpfulness: number;
  understanding: number;
  friendliness: number;
  responseSpeed: number;
  nceaRelevance: number;
  additionalComments: string | null;
  submittedAt: string;
  student: {
    id: string;
    username: string;
    name: string | null;
  };
}

interface FeedbackSummary {
  totalFeedback: number;
  averages: {
    accuracy: number;
    helpfulness: number;
    understanding: number;
    friendliness: number;
    responseSpeed: number;
    nceaRelevance: number;
    overall: number;
  };
}

const aspectLabels: Record<string, string> = {
  accuracy: "Accuracy of Information",
  helpfulness: "Helpfulness of Explanations",
  understanding: "Understanding Questions",
  friendliness: "Friendliness / Tone",
  responseSpeed: "Speed of Responses",
  nceaRelevance: "Relevance to NCEA",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`w-4 h-4 ${
            value <= rating
              ? "fill-yellow-500 text-yellow-500"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-gray-600">({rating})</span>
    </div>
  );
}

function AverageCard({ label, value }: { label: string; value: number }) {
  const getColorClass = (val: number) => {
    if (val >= 4.5) return "text-green-600 bg-green-50";
    if (val >= 3.5) return "text-blue-600 bg-blue-50";
    if (val >= 2.5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className={`p-4 rounded-lg ${getColorClass(value)}`}>
      <div className="text-2xl font-bold">{value.toFixed(1)}</div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  );
}

export default function FeedbackManagement() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/feedback");
      if (!response.ok) throw new Error("Failed to fetch feedback");
      const data = await response.json();
      setFeedback(data.feedback);
      setSummary(data.summary);
    } catch (err) {
      setError("Failed to load feedback data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Feedback Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary && summary.totalFeedback > 0 ? (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Total Feedback Responses</div>
                  <div className="text-3xl font-bold text-blue-900">{summary.totalFeedback}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Overall Average</div>
                  <div className="text-3xl font-bold text-blue-900">
                    {summary.averages.overall.toFixed(1)}
                    <span className="text-lg font-normal text-gray-500"> / 5</span>
                  </div>
                </div>
              </div>

              {/* Individual Aspect Averages */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <AverageCard label="Accuracy" value={summary.averages.accuracy} />
                <AverageCard label="Helpfulness" value={summary.averages.helpfulness} />
                <AverageCard label="Understanding" value={summary.averages.understanding} />
                <AverageCard label="Friendliness" value={summary.averages.friendliness} />
                <AverageCard label="Speed" value={summary.averages.responseSpeed} />
                <AverageCard label="NCEA Relevance" value={summary.averages.nceaRelevance} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No feedback submitted yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>All Feedback ({feedback.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length > 0 ? (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {item.student.name || item.student.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.submittedAt).toLocaleString("en-NZ", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Average</div>
                      <div className="font-bold text-lg">
                        {(
                          (item.accuracy +
                            item.helpfulness +
                            item.understanding +
                            item.friendliness +
                            item.responseSpeed +
                            item.nceaRelevance) /
                          6
                        ).toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Ratings Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Accuracy:</span>
                      <StarRating rating={item.accuracy} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Helpfulness:</span>
                      <StarRating rating={item.helpfulness} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Understanding:</span>
                      <StarRating rating={item.understanding} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Friendliness:</span>
                      <StarRating rating={item.friendliness} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Speed:</span>
                      <StarRating rating={item.responseSpeed} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">NCEA Relevance:</span>
                      <StarRating rating={item.nceaRelevance} />
                    </div>
                  </div>

                  {/* Additional Comments */}
                  {item.additionalComments && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase mb-1">Comments</div>
                      <p className="text-sm text-gray-700 italic">
                        "{item.additionalComments}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No feedback submissions to display.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
