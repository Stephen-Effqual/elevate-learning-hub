import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cloud_storage_path, filename, fileSize, contentType } = await request.json();

    if (!cloud_storage_path || !filename) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save file record to database
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        studentId: user.id,
        filename,
        cloudStoragePath: cloud_storage_path,
        isPublic: false,
        fileSize,
        contentType,
      },
    });

    return NextResponse.json({
      message: "File uploaded successfully",
      file: uploadedFile,
    });
  } catch (error) {
    console.error("Upload completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete upload" },
      { status: 500 }
    );
  }
}
