import { auth, currentUser } from "@clerk/nextjs/server";

export async function getCurrentUser() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  // role is injected via custom JWT template in Clerk → Configure → Sessions
  const role = (sessionClaims?.role as string) ?? "STUDENT";

  return {
    id: userId,
    clerkId: userId,
    role,
    username: user.username ?? user.emailAddresses[0]?.emailAddress ?? "",
    name: user.fullName ?? "",
    email: user.emailAddresses[0]?.emailAddress ?? "",
  };
}

export async function requireAuth(allowedRoles?: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
