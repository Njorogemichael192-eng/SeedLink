import { requireSuperAdmin } from "@/lib/auth-helpers";
import AdminClient from "@/components/admin/admin-client";

export default async function AdminPage() {
  try {
    await requireSuperAdmin();
  } catch {
    return (
      <div className="min-h-screen w-full grid place-items-center bg-linear-to-br from-emerald-900 via-emerald-700/40 to-sky-900/50 p-6">
        <div className="rounded-2xl backdrop-blur-xl bg-white/20 border border-white/20 p-8 text-emerald-100 text-center">
          403 — Admin access only
        </div>
      </div>
    );
  }
  return <AdminClient />;
}

