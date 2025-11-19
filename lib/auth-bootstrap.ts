import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function ensureDbUser() {
  const cu = await currentUser();
  if (!cu) return null;
  const email = cu.emailAddresses?.[0]?.emailAddress;
  const fullName = [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() || cu.username || email || "";
  const profilePictureUrl = cu.imageUrl || undefined;

  try {
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
  } catch (error: any) {
    // If email already exists with a different clerkId, just update the existing user's clerkId
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email! },
      });
      if (existingUser) {
        return await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            clerkId: cu.id,
            fullName,
            profilePictureUrl,
          },
        });
      }
    }
    throw error;
  }
}
