import { auth } from "@clerk/nextjs/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ensureDbUser } from "@/lib/auth-bootstrap";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";

export default async function DashboardPage() {
  await auth();
  await ensureDbUser();

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40 p-4 sm:p-8">
      <DashboardLayoutClient />

      <DashboardClient />
    </div>
  );
}
