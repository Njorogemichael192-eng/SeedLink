import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function ensureDbUser() {
  const cu = await currentUser();
  if (!cu) return null;
  const email = cu.emailAddresses?.[0]?.emailAddress;
  const fullName = [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() || cu.username || email || "";
  const profilePictureUrl = cu.imageUrl || undefined;

  const user = await prisma.user.upsert({
    where: { clerkId: cu.id },
    create: {
      clerkId: cu.id,
      email: email!,
      fullName,
      profilePictureUrl,
      accountType: "INDIVIDUAL",
      role: "INDIVIDUAL",
      isVerified: false,
    },
    update: {
      email: email!,
      fullName,
      profilePictureUrl,
    },
  });
  return user;
}
