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
    if (!user || user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify parent is linked to this student
    const link = await prisma.studentParentLink.findFirst({
      where: {
        studentId: params.studentId,
        parentId: user.id,
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reports = await prisma.report.findMany({
      where: { studentId: params.studentId },
      orderBy: { generatedAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
