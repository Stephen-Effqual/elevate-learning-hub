import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { studentId: params.studentId },
      orderBy: { timestamp: "asc" },
    });

    const student = await prisma.user.findUnique({
      where: { id: params.studentId },
      select: { username: true, role: true },
    });

    return NextResponse.json({
      student,
      conversations,
    });
  } catch (error) {
    console.error("Conversation fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
