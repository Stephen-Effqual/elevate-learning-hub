import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import ParentDashboard from "./_components/parent-dashboard";

export default async function ParentPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "PARENT") {
    redirect("/login");
  }

  return <ParentDashboard user={user} />;
}
