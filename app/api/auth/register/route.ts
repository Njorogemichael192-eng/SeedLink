import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
 HEAD
import { AccountType } from "@/generated/prisma-client/client";
import { ensureDbUser } from "@/lib/auth-bootstrap";

import { AccountType, Role } from "@/generated/prisma-client/client";
 f4233fa70ce840996c1dc78ade2a6e7c927bdcd9

const kenyaPhoneRegex = /^(?:\+254|0)(7\d{8})$/;

const IndividualSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().regex(kenyaPhoneRegex),
  clubMembership: z.enum(["yes", "no"]),
  clubName: z.string().optional(),
  institutionName: z.string().optional(),
  county: z.string().min(1),
  otherDetails: z.string().max(2000).optional(),
});

const InstitutionSchema = z.object({
  institutionName: z.string().min(1),
  clubName: z.string().optional(),
  email: z.string().email(),
  institutionEmail: z.string().email(),
  clubEmail: z.string().email(),
  phoneNumber: z.string().regex(kenyaPhoneRegex),
  county: z.string().min(1),
  otherDetails: z.string().max(2000).optional(),
});

const OrganizationSchema = z.object({
  organizationName: z.string().min(1),
  seedsDonatedCount: z.number().int().positive(),
  distributionArea: z.string().min(1),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
});

const PayloadSchema = z.discriminatedUnion("accountType", [
  z.object({ accountType: z.literal("INDIVIDUAL"), data: IndividualSchema }),
  z.object({ accountType: z.literal("INSTITUTION"), data: InstitutionSchema }),
  z.object({ accountType: z.literal("ORGANIZATION"), data: OrganizationSchema }),
]);

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { accountType, data } = parsed.data;

<<<<<<< HEAD
  let dbUser = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!dbUser) {
    dbUser = await ensureDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }
=======
  const dbUser = await prisma.user.findFirst({ where: { clerkId: userId } });
  
  // Auto-create user record if it doesn't exist (handles fresh signups)
  let user = dbUser;
  if (!user) {
    // Extract email based on account type
    const email = 
      accountType === "INDIVIDUAL" ? data.email :
      accountType === "INSTITUTION" ? data.email :
      data.contactEmail || "";
    
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        accountType: AccountType.INDIVIDUAL,
        role: Role.INDIVIDUAL,
      },
    });
>>>>>>> f4233fa70ce840996c1dc78ade2a6e7c927bdcd9
  }

  if (accountType === "INDIVIDUAL") {
    const isClub = data.clubMembership === "yes";
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        accountType: AccountType.INDIVIDUAL,
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        county: data.county,
        otherDetails: data.otherDetails ?? null,
        clubMembership: isClub,
        clubName: isClub ? data.clubName ?? null : null,
        institutionName: isClub ? data.institutionName ?? null : null,
      },
    });
    return NextResponse.json({ user: updated }, { status: 200 });
  }

  if (accountType === "INSTITUTION") {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        accountType: AccountType.INSTITUTION,
        email: data.email,
        phoneNumber: data.phoneNumber,
        county: data.county,
        otherDetails: data.otherDetails ?? null,
        institutionName: data.institutionName,
        clubName: data.clubName ?? null,
        organizationName: data.institutionName,
        institutionEmail: data.institutionEmail,
        clubEmail: data.clubEmail,
        isVerified: false,
      },
    });
    return NextResponse.json({ user: updated }, { status: 200 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      accountType: AccountType.ORGANIZATION,
      organizationName: data.organizationName,
      seedsDonatedCount: data.seedsDonatedCount,
      distributionArea: data.distributionArea,
      email: data.contactEmail && data.contactEmail.length > 0 ? data.contactEmail : user.email,
      phoneNumber: data.contactPhone && data.contactPhone.length > 0 ? data.contactPhone : user.phoneNumber,
      isVerified: true,
    },
  });
  return NextResponse.json({ user: updated }, { status: 200 });
}
