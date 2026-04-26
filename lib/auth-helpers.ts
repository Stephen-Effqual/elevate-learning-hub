import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    id: session.user.id as string,
    role: session.user.role as string,
    username: session.user.username as string,
    name: (session.user.name as string) ?? "",
    email: (session.user.email as string) ?? "",
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
