import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, DashboardHeader } from "./nav";

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
    <SidebarProvider>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="bg-primary absolute -left-20 -top-32 size-96 rounded-full opacity-30 blur-[90px]" />
        <div className="bg-primary absolute right-0 top-1/2 size-[28rem] rounded-full opacity-25 blur-[100px]" />
        <div className="bg-primary absolute -bottom-40 left-1/3 size-96 rounded-full opacity-25 blur-[100px]" />
      </div>
      <AppSidebar userName={session.user.name} userEmail={session.user.email} />
      <SidebarInset>
        <DashboardHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 pt-0 lg:p-8 lg:pt-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
