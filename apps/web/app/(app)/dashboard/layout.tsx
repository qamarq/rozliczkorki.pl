import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AndroidAppBanner } from "./android-app-banner";
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
      <SidebarInset>
        <DashboardHeader />
        <div className="max-w-352 mx-auto w-full flex-1 p-4 pt-0 lg:p-8 lg:pt-0">
          <AndroidAppBanner />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
