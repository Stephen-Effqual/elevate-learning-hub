import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, parentId } = await request.json();

    if (!studentId || !parentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify student and parent exist and have correct roles
    const [student, parent] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId } }),
      prisma.user.findUnique({ where: { id: parentId } }),
    ]);

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Invalid student" },
        { status: 400 }
      );
    }

    if (!parent || parent.role !== "PARENT") {
      return NextResponse.json(
        { error: "Invalid parent" },
        { status: 400 }
      );
    }

    // Check if link already exists
    const existingLink = await prisma.studentParentLink.findUnique({
      where: {
        studentId_parentId: {
          studentId,
          parentId,
        },
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: "Link already exists" },
        { status: 400 }
      );
    }

    // Create link
    await prisma.studentParentLink.create({
      data: {
        studentId,
        parentId,
      },
    });

    return NextResponse.json(
      { message: "Student and parent linked successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Link creation error:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, parentId } = await request.json();

    if (!studentId || !parentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await prisma.studentParentLink.delete({
      where: {
        studentId_parentId: {
          studentId,
          parentId,
        },
      },
    });

    return NextResponse.json({ message: "Link removed successfully" });
  } catch (error) {
    console.error("Link deletion error:", error);
    return NextResponse.json(
      { error: "Failed to remove link" },
      { status: 500 }
    );
  }
}
