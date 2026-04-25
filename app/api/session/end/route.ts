import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's conversations only (current session)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conversations = await prisma.conversation.findMany({
      where: {
        studentId: user.id,
        timestamp: { gte: today },
      },
      orderBy: { timestamp: "asc" },
    });

    if (conversations.length < 2) {
      return NextResponse.json(
        { error: "Not enough conversation history for a report. Chat with the tutor first!" },
        { status: 400 }
      );
    }

    // Prepare conversation summary for LLM
    const conversationSummary = conversations
      .map((c) => `${c.role.toUpperCase()}: ${c.message}`)
      .join("\n\n");

    // Call LLM to generate report
    const reportPrompt = `Based on the following tutoring session with an NCEA student, generate a comprehensive progress report for their parent/teacher.

Include:
1. Session Summary: Brief overview of what was covered today
2. Topics Covered: What subjects, topics, and standards were discussed
3. Standards Practiced: Which NCEA standards were addressed
4. Strengths: What the student demonstrated well
5. Areas for Improvement: What needs more work
6. Suggested Next Steps: Actionable recommendations for continued learning

Use professional, supportive language suitable for a parent/teacher audience. Be specific about what was discussed.

SESSION CONVERSATION:
${conversationSummary.slice(-8000)}

Generate the report in JSON format with these exact keys:
{
  "sessionSummary": "...",
  "topicsCovered": "...",
  "standardsPracticed": "...",
  "strengths": "...",
  "areasForImprovement": "...",
  "nextSteps": "..."
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const llmResponse = await fetch("https://apps.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: reportPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error("Failed to generate report");
    }

    const llmData = await llmResponse.json();
    const reportContent = llmData.choices?.[0]?.message?.content || "{}";
    const reportData = JSON.parse(reportContent);

    // Save report to database
    const report = await prisma.report.create({
      data: {
        studentId: user.id,
        reportContent: JSON.stringify(reportData),
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      report: reportData,
      message: "Session ended. Progress report generated and saved.",
    });
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json(
      { error: "Failed to end session and generate report" },
      { status: 500 }
    );
  }
}
