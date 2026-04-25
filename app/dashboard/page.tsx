import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Route to appropriate dashboard based on role
  switch (user.role) {
    case "admin":
    case "ADMIN":
      redirect("/admin");
    case "PARENT":
      redirect("/parent");
    case "STUDENT":
      redirect("/student");
    default:
      redirect("/redeem");
  }
}
