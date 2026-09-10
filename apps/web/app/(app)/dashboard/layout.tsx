import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { DashboardSidebar, DashboardTopbar } from "./nav";

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
    <div className="relative isolate flex min-h-svh">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="bg-primary absolute -top-32 -left-20 size-96 rounded-full opacity-30 blur-[90px]" />
        <div className="bg-primary absolute top-1/2 right-0 size-[28rem] rounded-full opacity-25 blur-[100px]" />
        <div className="bg-primary absolute -bottom-40 left-1/3 size-96 rounded-full opacity-25 blur-[100px]" />
      </div>
      <DashboardSidebar userName={session.user.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar userName={session.user.name} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
