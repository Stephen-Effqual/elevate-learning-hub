"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, LogOut, User, FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  username: string;
  createdAt: string;
}

interface Report {
  id: string;
  generatedAt: string;
  reportContent: string;
}

export default function ParentDashboard({ user }: { user: any }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchReports(selectedStudent.id);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/parent/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        if (data.students?.length > 0) {
          setSelectedStudent(data.students[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (studentId: string) => {
    setLoadingReports(true);
    try {
      const response = await fetch(`/api/parent/reports/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    setDownloadingReportId(reportId);
    try {
      const response = await fetch(`/api/report/pdf/${reportId}`);
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Progress_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Report downloaded successfully!",
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download report",
        variant: "destructive",
      });
    } finally {
      setDownloadingReportId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">Elevate Learning Hub</h1>
              <p className="text-sm text-gray-600">Parent Dashboard - {user.username}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
          </div>
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Linked Students
              </h3>
              <p className="text-gray-600">
                Please contact an administrator to link your account to a student.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Students List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Linked Students</CardTitle>
                <CardDescription>
                  Select a student to view their progress reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {students.map((student) => (
                    <Button
                      key={student.id}
                      variant={selectedStudent?.id === student.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {student.username}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  Progress Reports - {selectedStudent?.username}
                </CardTitle>
                <CardDescription>
                  Download and view progress reports for your student
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingReports ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">No reports generated yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => {
                      const reportData = JSON.parse(report.reportContent);
                      return (
                        <div
                          key={report.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900">
                                  Progress Report
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                Generated: {new Date(report.generatedAt).toLocaleDateString()}
                              </p>
                              <div className="text-sm text-gray-700 space-y-1">
                                <p>
                                  <strong>Topics:</strong>{" "}
                                  {reportData.topicsCovered?.slice(0, 100) || "N/A"}...
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReport(report.id)}
                              disabled={downloadingReportId === report.id}
                            >
                              {downloadingReportId === report.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
