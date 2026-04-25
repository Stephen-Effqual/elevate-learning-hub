import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { checkUsageLimit } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await checkUsageLimit(user.id);

    return NextResponse.json({
      remaining: usage.remaining,
      limit: 120,
    });
  } catch (error) {
    console.error("Usage check error:", error);
    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 }
    );
  }
}
