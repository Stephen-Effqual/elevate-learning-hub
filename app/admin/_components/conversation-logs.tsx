"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare } from "lucide-react";

interface User {
  id: string;
  username: string;
  role: string;
}

interface Conversation {
  id: string;
  message: string;
  role: string;
  timestamp: string;
}

export default function ConversationLogs() {
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchConversations(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        const studentUsers = data.users?.filter((u: User) => u.role === "STUDENT") || [];
        setStudents(studentUsers);
        if (studentUsers.length > 0) {
          setSelectedStudentId(studentUsers[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async (studentId: string) => {
    setLoadingConversations(true);
    try {
      const response = await fetch(`/api/admin/conversations/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No students found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Logs</CardTitle>
        <CardDescription>View conversation history for quality review</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Student</label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingConversations ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 rounded-lg ${
                    conv.role === "user"
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {conv.role === "user" ? "Student" : "Tutor"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(conv.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{conv.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
