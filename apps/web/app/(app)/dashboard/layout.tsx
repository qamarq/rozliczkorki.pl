import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { DashboardNav } from "./nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <DashboardNav userName={session.user.name} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
