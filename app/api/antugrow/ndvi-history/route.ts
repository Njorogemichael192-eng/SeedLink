import { NextResponse } from 'next/server';
import { getCurrentDbUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getNdviHistory } from '@/lib/antugrow-service';

/**
 * GET /api/antugrow/ndvi-history
 * 
 * Retrieves satellite vegetation health data (NDVI) for a Growth Tracker entry.
 * This provides objective data on tree survival verification.
 * 
 * Query Parameters:
 * - growthTrackerEntryId: The ID of the Growth Tracker entry
 * 
 * Response:
 * - NDVI time-series data with timestamps
 * - NDVI values > 0.5 indicate dense vegetation (healthy tree)
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

    // Call Antugrow API to get NDVI history
    const result = await getNdviHistory(
      entry.latitude,
      entry.longitude,
      entry.plantingDate
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to retrieve NDVI data' },
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
      plantingDate: entry.plantingDate,
    });
  } catch (error) {
    console.error('NDVI history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
