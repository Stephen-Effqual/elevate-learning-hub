"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, LogOut, Users, BarChart3, Link2, MessageSquare, Star } from "lucide-react";
import UserManagement from "./user-management";
import LinkManagement from "./link-management";
import StatsOverview from "./stats-overview";
import ConversationLogs from "./conversation-logs";
import FeedbackManagement from "./feedback-management";

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("stats");

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
              <p className="text-sm text-gray-600">Admin Dashboard - {user.username}</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center space-x-2">
              <Link2 className="w-4 h-4" />
              <span>Links</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Conversations</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Feedback</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <StatsOverview />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="links">
            <LinkManagement />
          </TabsContent>

          <TabsContent value="logs">
            <ConversationLogs />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
