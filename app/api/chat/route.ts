import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { searchDocuments } from "@/lib/embeddings";
import { getFileUrl } from "@/lib/s3";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an expert NCEA tutor (NZ) with 25+ years experience across all subjects and Levels 1–3.

TONE: Manaakitanga — warm, rigorous, concise. Use NZ English. Max 3–5 sentences per response unless explaining a concept.

SESSION START: Ask the student's first name, NCEA level, and subject/standard — ONE question at a time, ONCE only. Never repeat these questions once answered. Reference what you know (e.g. "For your Level 2 History...").

ANTI-REPETITION: Track questions already asked this session. Never re-ask. Never ask more than ONE question per response. If student gave a partial answer, acknowledge it and advance — don't re-ask.

CORE RULES:
- Socratic method: guide with questions, don't give answers directly
- NZQA aligned — never fabricate standards, criteria, or data. If unsure, say so.
- Safeguarding: if student shows distress, respond supportively and refer to a trusted adult or counsellor.
- Achievement Standards: Not Achieved / Achieved / Merit / Excellence. Unit Standards: Not Achieved / Achieved only.

SCAFFOLDS (track progress, never repeat a completed step):
- PEEL (English): Point → Evidence → Explanation → Link
- RUCSAC (Maths): Read → Underline → Choose → Solve → Answer → Check
- SHD (History): Specific Detail → Historical Significance → Development

ASSESSMENT FEEDBACK: Tell student their current grade level (A/M/E) and exactly how to move up one level.

REPORTING: On request, generate a Parent/Teacher Progress Summary covering topics covered, strengths, areas for improvement, and next steps.`;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Save user message (non-fatal if DB not set up for Clerk IDs yet)
    try {
      await prisma.conversation.create({
        data: {
          studentId: user.id,
          message,
          role: "user",
        },
      });
    } catch (e) {
      console.error("Failed to save user message:", e);
    }

    // Get conversation history (last 40 messages for full session awareness)
    let historyMessages: { role: string; content: string }[] = [];
    try {
      const conversationHistory = await prisma.conversation.findMany({
        where: { studentId: user.id },
        orderBy: { timestamp: "desc" },
        take: 15,
      });

      historyMessages = conversationHistory
        .reverse()
        .map((msg) => ({
          role: msg.role,
          content: msg.message,
        }));
    } catch (e) {
      console.error("Failed to fetch conversation history:", e);
    }

    // Load all NZQA knowledge bases (History, Literacy, Numeracy)
    let nzqaContext = "";
    try {
      const historyKb = await readFile(join(process.cwd(), "public/data/nzqa_level2_history_kb.md"), "utf-8").catch(() => "");
      const literacyKb = await readFile(join(process.cwd(), "public/data/nzqa_level2_literacy_kb.md"), "utf-8").catch(() => "");
      const numeracyKb = await readFile(join(process.cwd(), "public/data/nzqa_level2_numeracy_kb.md"), "utf-8").catch(() => "");
      
      nzqaContext = `=== HISTORY KB ===\n${historyKb.slice(0, 1500)}\n\n=== LITERACY KB ===\n${literacyKb.slice(0, 1000)}\n\n=== NUMERACY KB ===\n${numeracyKb.slice(0, 1000)}`;
    } catch (error) {
      console.error("Failed to load NZQA KBs:", error);
    }

    // Get student's uploaded files and perform RAG
    let ragContext = "";
    try {
      const studentFiles = await prisma.uploadedFile.findMany({
        where: { studentId: user.id },
        orderBy: { uploadedAt: "desc" },
      });

      if (studentFiles.length > 0) {
        // For simplicity, we'll include file names and search based on message content
        const fileContext = studentFiles
          .map((f) => `- ${f.filename}`);
        ragContext = `\n\nStudent's uploaded files:\n${fileContext.join("\n")}`;
      }
    } catch (error) {
      console.error("Failed to load student files:", error);
    }

    // Construct messages for LLM
    const messages = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n=== NZQA KNOWLEDGE BASE ===\n${nzqaContext.slice(0, 3500)}\n\n=== STUDENT CONTEXT ===\n${ragContext}`,
      },
      ...historyMessages.slice(-14), // Last 14 messages + current
      { role: "user", content: message },
    ];

    // Call LLM API with streaming
    const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        stream: true,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error("LLM API request failed");
    }

    // Stream response back to client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let fullResponse = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || "";
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(chunk));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Save assistant response
          if (fullResponse) {
            try {
              await prisma.conversation.create({
                data: {
                  studentId: user.id,
                  message: fullResponse,
                  role: "assistant",
                },
              });
            } catch (e) {
              console.error("Failed to save assistant message:", e);
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
