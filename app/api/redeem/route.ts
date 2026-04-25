import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface CodePayload {
  userId: string;
  days: number;
  jti: string;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const code = body?.code as string | undefined;
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  let payload: CodePayload;
  try {
    payload = jwt.verify(code, process.env.ACCESS_CODE_SECRET!) as CodePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid or unrecognised code" },
      { status: 400 }
    );
  }

  if (payload.userId !== userId) {
    return NextResponse.json(
      { error: "This code was issued for a different account" },
      { status: 400 }
    );
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const redeemedJtis = (user.privateMetadata?.redeemedCodeJtis as string[]) ?? [];
  if (redeemedJtis.includes(payload.jti)) {
    return NextResponse.json({ error: "Code has already been used" }, { status: 400 });
  }

  // Extend from current accessUntil if still in the future, otherwise from now
  const currentAccessUntil = user.publicMetadata?.accessUntil as string | undefined;
  const base =
    currentAccessUntil && new Date(currentAccessUntil) > new Date()
      ? new Date(currentAccessUntil)
      : new Date();
  base.setDate(base.getDate() + payload.days);

  await client.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      accessUntil: base.toISOString(),
    },
    privateMetadata: {
      ...user.privateMetadata,
      redeemedCodeJtis: [...redeemedJtis, payload.jti],
    },
  });

  return NextResponse.json({ accessUntil: base.toISOString() });
}
