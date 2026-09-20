import { cookies } from "next/headers";
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

  // Read on the server so a collapsed sidebar does not flash open on first paint.
  const sidebarState = (await cookies()).get("sidebar_state")?.value;

  return (
    <SidebarProvider defaultOpen={sidebarState !== "false"}>
      <AppSidebar
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image}
      />
      <SidebarInset className="isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden md:rounded-xl"
        >
          <div className="bg-primary absolute -left-20 -top-32 size-96 rounded-full opacity-20 blur-[90px]" />
          <div className="bg-success absolute -right-24 top-1/3 size-[26rem] rounded-full opacity-[0.14] blur-[100px]" />
          <div className="bg-primary absolute -bottom-40 left-1/3 size-96 rounded-full opacity-[0.18] blur-[100px]" />
          <div className="bg-success absolute -bottom-32 -left-24 size-80 rounded-full opacity-10 blur-[90px]" />
        </div>

        <DashboardHeader />
        <div className="max-w-352 mx-auto w-full flex-1 p-4 pt-0 lg:p-8 lg:pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
