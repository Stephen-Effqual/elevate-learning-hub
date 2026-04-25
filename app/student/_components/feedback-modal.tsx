"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Star, Loader2 } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => Promise<void>;
}

export interface FeedbackData {
  accuracy: number;
  helpfulness: number;
  understanding: number;
  friendliness: number;
  responseSpeed: number;
  nceaRelevance: number;
  additionalComments: string;
}

const ratingLabels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

const aspects = [
  { key: "accuracy", label: "Accuracy of information" },
  { key: "helpfulness", label: "Helpfulness of explanations" },
  { key: "understanding", label: "Understanding my questions" },
  { key: "friendliness", label: "Friendliness / Tone" },
  { key: "responseSpeed", label: "Speed of responses" },
  { key: "nceaRelevance", label: "Relevance to NCEA" },
] as const;

export function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    accuracy: 0,
    helpfulness: 0,
    understanding: 0,
    friendliness: 0,
    responseSpeed: 0,
    nceaRelevance: 0,
  });
  const [additionalComments, setAdditionalComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleRatingChange = (aspect: string, value: number) => {
    setRatings((prev) => ({ ...prev, [aspect]: value }));
  };

  const handleSubmit = async () => {
    // Validate all ratings are set
    const allRated = Object.values(ratings).every((r) => r > 0);
    if (!allRated) {
      setError("Please rate all aspects before submitting.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await onSubmit({
        ...ratings,
        additionalComments,
      } as FeedbackData);
    } catch (err) {
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-800">Session Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Please rate your tutor on the following aspects:
          </p>

          {/* Rating Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Aspect</th>
                  {ratingLabels.map((label, idx) => (
                    <th key={label} className="text-center px-2 py-2 font-medium text-gray-600 text-sm">
                      <div>{label}</div>
                      <div className="text-xs text-gray-400">({idx + 1})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aspects.map(({ key, label }) => (
                  <tr key={key} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 text-gray-700">{label}</td>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <td key={value} className="text-center px-2 py-3">
                        <button
                          type="button"
                          onClick={() => handleRatingChange(key, value)}
                          className={`p-1 rounded-full transition-all ${
                            ratings[key] >= value
                              ? "text-yellow-500 hover:text-yellow-600"
                              : "text-gray-300 hover:text-gray-400"
                          }`}
                          disabled={submitting}
                        >
                          <Star
                            className={`w-6 h-6 ${
                              ratings[key] >= value ? "fill-yellow-500" : ""
                            }`}
                          />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Additional Comments */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Additional Comments (Optional)
            </label>
            <Textarea
              placeholder="Share any additional thoughts about your tutoring session..."
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              rows={4}
              className="w-full resize-none"
              disabled={submitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
