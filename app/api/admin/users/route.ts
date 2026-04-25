import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        linkedParents: {
          select: {
            parent: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        linkedStudents: {
          select: {
            student: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("User list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, password, role, parentId } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // If linking to a parent, verify the parent exists and is a PARENT role
    if (parentId) {
      const parentUser = await prisma.user.findUnique({
        where: { id: parentId },
      });

      if (!parentUser || parentUser.role !== "PARENT") {
        return NextResponse.json(
          { error: "Invalid parent selected" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role.toUpperCase() as UserRole,
      },
    });

    // If creating a student and a parent is selected, create the link
    if (role.toUpperCase() === "STUDENT" && parentId) {
      await prisma.studentParentLink.create({
        data: {
          studentId: newUser.id,
          parentId: parentId,
        },
      });
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
        },
        linkedParent: parentId ? true : false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
