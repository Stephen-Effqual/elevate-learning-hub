import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import AdminDashboard from "./_components/admin-dashboard";

export default async function AdminPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (sessionClaims?.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminDashboard user={{ id: userId }} />;
}
