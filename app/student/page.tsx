import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import StudentDashboard from "./_components/student-dashboard";

export default async function StudentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <StudentDashboard user={user} />;
}
