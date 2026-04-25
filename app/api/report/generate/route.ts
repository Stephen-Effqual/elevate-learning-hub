import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get conversation history
    const conversations = await prisma.conversation.findMany({
      where: { studentId: user.id },
      orderBy: { timestamp: "asc" },
    });

    if (conversations.length === 0) {
      return NextResponse.json(
        { error: "No conversation history found" },
        { status: 400 }
      );
    }

    // Prepare conversation summary for LLM
    const conversationSummary = conversations
      .map((c) => `${c.role.toUpperCase()}: ${c.message}`)
      .join("\n\n");

    // Call LLM to generate report
    const reportPrompt = `Based on the following conversation history with an NCEA student, generate a comprehensive progress report for their parent/teacher.

Include:
1. Topics Covered: What subjects, topics and standards were discussed
2. Standards Practiced: Which NCEA standards were covered (identify the subject and level)
3. Strengths: What the student is doing well
4. Areas for Improvement: What needs more work
5. Suggested Next Steps: Actionable recommendations

Use professional, supportive language suitable for a parent/teacher audience.

CONVERSATION HISTORY:
${conversationSummary.slice(-8000)}

Generate the report in JSON format with these exact keys:
{
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
        messages: [
          { role: "user", content: reportPrompt },
        ],
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
      reportId: report.id,
      report: reportData,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
