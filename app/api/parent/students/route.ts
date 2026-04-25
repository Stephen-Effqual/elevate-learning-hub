import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const links = await prisma.studentParentLink.findMany({
      where: { parentId: user.id },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            createdAt: true,
          },
        },
      },
    });

    const students = links.map((link) => link.student);

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Student list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
