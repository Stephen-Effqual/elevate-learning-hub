"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import ChatInterface from "./chat-interface";
import FileUpload from "./file-upload";
import UsageTracker from "./usage-tracker";
import { FeedbackModal, FeedbackData } from "./feedback-modal";

export default function StudentDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"chat" | "files">("chat");
  const [endingSession, setEndingSession] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleEndSessionClick = () => {
    if (endingSession) return;
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (feedback: FeedbackData) => {
    // Submit feedback to API
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
    
    // Close modal and proceed with session end
    setShowFeedbackModal(false);
    await completeSessionEnd();
  };

  const handleFeedbackSkip = async () => {
    setShowFeedbackModal(false);
    await completeSessionEnd();
  };

  const completeSessionEnd = async () => {
    setEndingSession(true);
    
    try {
      // Generate the session report
      const response = await fetch("/api/session/end", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (response.ok && data.reportId) {
        // Download the PDF report
        const pdfUrl = `/api/report/pdf/${data.reportId}`;
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `progress-report-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Wait a moment for download to start, then sign out
        setTimeout(() => {
          signOut({ callbackUrl: "/login" });
        }, 1500);
      } else {
        // If no conversations today, just log out
        alert(data.error || "Session ended.");
        signOut({ callbackUrl: "/login" });
      }
    } catch (error) {
      console.error("End session error:", error);
      alert("Failed to generate report. Logging out anyway.");
      signOut({ callbackUrl: "/login" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">Elevate Learning Hub</h1>
              <p className="text-sm text-gray-600">Welcome, {user.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <UsageTracker />
            <Button
              variant="default"
              size="sm"
              onClick={handleEndSessionClick}
              disabled={endingSession}
              className="bg-green-600 hover:bg-green-700"
            >
              {endingSession ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  End Session
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              disabled={endingSession}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex space-x-2 mb-4">
          <Button
            variant={activeTab === "chat" ? "default" : "outline"}
            onClick={() => setActiveTab("chat")}
            className="flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Tutor Chat</span>
          </Button>
          <Button
            variant={activeTab === "files" ? "default" : "outline"}
            onClick={() => setActiveTab("files")}
            className="flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>My Files</span>
          </Button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg">
          {activeTab === "chat" && <ChatInterface />}
          {activeTab === "files" && <FileUpload />}
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={handleFeedbackSkip}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
