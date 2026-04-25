import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      accuracy,
      helpfulness,
      understanding,
      friendliness,
      responseSpeed,
      nceaRelevance,
      additionalComments,
    } = data;

    // Validate ratings are between 1-5
    const ratings = [accuracy, helpfulness, understanding, friendliness, responseSpeed, nceaRelevance];
    for (const rating of ratings) {
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: "All ratings must be between 1 and 5" },
          { status: 400 }
        );
      }
    }

    // Save feedback to database
    const feedback = await prisma.sessionFeedback.create({
      data: {
        studentId: user.id,
        accuracy,
        helpfulness,
        understanding,
        friendliness,
        responseSpeed,
        nceaRelevance,
        additionalComments: additionalComments || null,
      },
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
