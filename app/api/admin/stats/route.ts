import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers, totalStudents, totalParents, totalAdmins, totalConversations, totalFiles] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "PARENT" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.conversation.count(),
      prisma.uploadedFile.count(),
    ]);

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsage = await prisma.usageTracking.findMany({
      where: { date: today },
    });

    const todayMessages = todayUsage.reduce((sum, u) => sum + u.messageCount, 0);

    return NextResponse.json({
      totalUsers,
      totalStudents,
      totalParents,
      totalAdmins,
      totalConversations,
      totalFiles,
      todayMessages,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
