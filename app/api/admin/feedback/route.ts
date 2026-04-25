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

    // Fetch all feedback with student info
    const feedback = await prisma.sessionFeedback.findMany({
      include: {
        student: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Calculate summary statistics
    const totalFeedback = feedback.length;
    
    let avgAccuracy = 0;
    let avgHelpfulness = 0;
    let avgUnderstanding = 0;
    let avgFriendliness = 0;
    let avgResponseSpeed = 0;
    let avgNceaRelevance = 0;

    if (totalFeedback > 0) {
      avgAccuracy = feedback.reduce((sum: number, f) => sum + f.accuracy, 0) / totalFeedback;
      avgHelpfulness = feedback.reduce((sum: number, f) => sum + f.helpfulness, 0) / totalFeedback;
      avgUnderstanding = feedback.reduce((sum: number, f) => sum + f.understanding, 0) / totalFeedback;
      avgFriendliness = feedback.reduce((sum: number, f) => sum + f.friendliness, 0) / totalFeedback;
      avgResponseSpeed = feedback.reduce((sum: number, f) => sum + f.responseSpeed, 0) / totalFeedback;
      avgNceaRelevance = feedback.reduce((sum: number, f) => sum + f.nceaRelevance, 0) / totalFeedback;
    }

    const overallAverage = totalFeedback > 0
      ? (avgAccuracy + avgHelpfulness + avgUnderstanding + avgFriendliness + avgResponseSpeed + avgNceaRelevance) / 6
      : 0;

    return NextResponse.json({
      feedback,
      summary: {
        totalFeedback,
        averages: {
          accuracy: Number(avgAccuracy.toFixed(2)),
          helpfulness: Number(avgHelpfulness.toFixed(2)),
          understanding: Number(avgUnderstanding.toFixed(2)),
          friendliness: Number(avgFriendliness.toFixed(2)),
          responseSpeed: Number(avgResponseSpeed.toFixed(2)),
          nceaRelevance: Number(avgNceaRelevance.toFixed(2)),
          overall: Number(overallAverage.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error("Fetch feedback error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
