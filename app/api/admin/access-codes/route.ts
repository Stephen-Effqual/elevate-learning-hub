import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export async function POST(req: Request) {
  const { userId: adminId, sessionClaims } = await auth();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (sessionClaims?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { targetUserId, days } = body as { targetUserId?: string; days?: number };

  if (!targetUserId || ![30, 60].includes(days ?? 0)) {
    return NextResponse.json(
      { error: "targetUserId and days (30 or 60) are required" },
      { status: 400 }
    );
  }

  const client = await clerkClient();
  try {
    await client.users.getUser(targetUserId);
  } catch {
    return NextResponse.json({ error: "Clerk user not found" }, { status: 404 });
  }

  const code = jwt.sign(
    { userId: targetUserId, days, jti: crypto.randomUUID() },
    process.env.ACCESS_CODE_SECRET!,
    { algorithm: "HS256" }
  );

  return NextResponse.json({ code });
}
