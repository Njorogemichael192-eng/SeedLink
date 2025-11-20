import { NextResponse } from 'next/server';
import { getCurrentDbUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getLocalConditions } from '@/lib/antugrow-service';

/**
 * GET /api/antugrow/local-conditions
 * 
 * Retrieves localized climate and environmental data for a Growth Tracker entry.
 * Includes precipitation, temperature, soil pH, and clay composition.
 * 
 * Query Parameters:
 * - growthTrackerEntryId: The ID of the Growth Tracker entry
 * 
 * Response:
 * - precipitation: 3-year historical data
 * - temperature: 2-year historical max/min data
 * - soilPh: Local soil pH measurements
 * - clay: Local clay composition
 */
export async function GET(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const growthTrackerEntryId = searchParams.get('growthTrackerEntryId');

    if (!growthTrackerEntryId) {
      return NextResponse.json(
        { error: 'growthTrackerEntryId is required' },
        { status: 400 }
      );
    }

    // Fetch the Growth Tracker entry
    const entry = await prisma.growthTrackerEntry.findUnique({
      where: { id: growthTrackerEntryId },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Growth Tracker entry not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (entry.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Call Antugrow API to get local conditions
    const result = await getLocalConditions(
      entry.latitude,
      entry.longitude
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to retrieve local conditions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      entryId: growthTrackerEntryId,
      location: {
        latitude: entry.latitude,
        longitude: entry.longitude,
      },
      title: entry.title,
      plantingDate: entry.plantingDate,
    });
  } catch (error) {
    console.error('Local conditions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
