"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, FileText, TrendingUp, Loader2 } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalParents: number;
  totalAdmins: number;
  totalConversations: number;
  totalFiles: number;
  todayMessages: number;
}

export default function StatsOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-600">Failed to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Students",
      value: stats.totalStudents,
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Parents",
      value: stats.totalParents,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Admins",
      value: stats.totalAdmins,
      icon: Users,
      color: "bg-orange-500",
    },
    {
      title: "Total Conversations",
      value: stats.totalConversations,
      icon: MessageSquare,
      color: "bg-teal-500",
    },
    {
      title: "Uploaded Files",
      value: stats.totalFiles,
      icon: FileText,
      color: "bg-indigo-500",
    },
    {
      title: "Today's Messages",
      value: stats.todayMessages,
      icon: TrendingUp,
      color: "bg-pink-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`${card.color} p-2 rounded-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
