import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { generatePresignedUploadUrl } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, contentType, fileSize } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check file size (max 100MB for single-part)
    if (fileSize && fileSize > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Use multipart upload for files > 100MB" },
        { status: 400 }
      );
    }

    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      false // Private files for students
    );

    return NextResponse.json({
      uploadUrl,
      cloud_storage_path,
    });
  } catch (error) {
    console.error("Upload URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
