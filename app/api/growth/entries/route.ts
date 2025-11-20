import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDbUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const CreateGrowthEntrySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  photoUrl: z.string().url().optional(),
  plantingDate: z.string().datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * POST /api/growth/entries
 * 
 * Creates a new Growth Tracker entry with geospatial data.
 * This is required for Antugrow integration and tree survival verification.
 */
export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateGrowthEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { title, description, photoUrl, plantingDate, latitude, longitude } = parsed.data;

  try {
    const entry = await prisma.growthTrackerEntry.create({
      data: {
        userId: user.id,
        title,
        description: description || null,
        photoUrl: photoUrl || null,
        plantingDate: new Date(plantingDate),
        latitude,
        longitude,
      },
    });

    return NextResponse.json(
      {
        entry: {
          id: entry.id,
          title: entry.title,
          description: entry.description,
          photoUrl: entry.photoUrl,
          plantingDate: entry.plantingDate.toISOString(),
          latitude: entry.latitude,
          longitude: entry.longitude,
          createdAt: entry.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating growth entry:", error);
    return NextResponse.json(
      { error: "Failed to create growth entry" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/growth/entries
 * 
 * Retrieves all Growth Tracker entries for the authenticated user.
 * Returns entries with full geospatial and health data.
 */
export async function GET() {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const entries = await prisma.growthTrackerEntry.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      entries: entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        description: entry.description,
        photoUrl: entry.photoUrl,
        plantingDate: entry.plantingDate.toISOString(),
        latitude: entry.latitude,
        longitude: entry.longitude,
        aiHealthDiagnosis: entry.aiHealthDiagnosis ? JSON.parse(entry.aiHealthDiagnosis) : null,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching growth entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch growth entries" },
      { status: 500 }
    );
  }
}
