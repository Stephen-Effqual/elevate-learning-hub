import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import AdminDashboard from "./_components/admin-dashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminDashboard user={user} />;
}
