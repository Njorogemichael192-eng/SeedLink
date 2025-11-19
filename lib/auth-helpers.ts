import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentDbUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findFirst({ where: { clerkId: userId } });
  return user;
}

export async function requireSuperAdmin() {
  const user = await getCurrentDbUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return user;
}
