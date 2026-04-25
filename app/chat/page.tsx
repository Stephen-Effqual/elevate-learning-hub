import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import StudentDashboard from "@/app/student/_components/student-dashboard";

export default async function ChatPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <StudentDashboard user={user} />;
}
