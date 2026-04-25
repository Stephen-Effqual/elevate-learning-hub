import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getFileUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const files = await prisma.uploadedFile.findMany({
      where: { studentId: user.id },
      orderBy: { uploadedAt: "desc" },
    });

    // Generate signed URLs for files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await getFileUrl(file.cloudStoragePath, file.isPublic);
        return {
          ...file,
          url,
        };
      })
    );

    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    console.error("File list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
