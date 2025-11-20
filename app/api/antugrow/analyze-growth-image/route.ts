import { NextResponse } from 'next/server';
import { getCurrentDbUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { analyzeGrowthImage } from '@/lib/antugrow-service';

/**
 * POST /api/antugrow/analyze-growth-image
 * 
 * Analyzes a growth image for health diagnostics using Antugrow AI.
 * Stores the diagnostic result in the Growth Tracker entry.
 * 
 * Request Body:
 * - growthTrackerEntryId: The ID of the Growth Tracker entry
 * - imageUrl: URL to the image (from ImageKit CDN or direct URL)
 * 
 * Response:
 * - aiHealthDiagnosis: Raw response from Antugrow AI analysis
 * - entryId: The updated Growth Tracker entry ID
 * 
 * Rate Limit:
 * - 1 request per minute (enforced by Antugrow API)
 */
export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { growthTrackerEntryId, imageUrl } = body;

    if (!growthTrackerEntryId || !imageUrl) {
      return NextResponse.json(
        { error: 'growthTrackerEntryId and imageUrl are required' },
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

    // Call Antugrow API to analyze image
    const result = await analyzeGrowthImage(imageUrl, growthTrackerEntryId);

    // Handle rate limiting
    if (result.statusCode === 429) {
      return NextResponse.json(
        {
          error: result.error,
          rateLimitInfo: {
            message: 'Image analysis limit reached',
            resetTime: 'Please try again in 1 minute',
          },
        },
        { status: 429 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to analyze image' },
        { status: 500 }
      );
    }

    // Store the AI diagnosis in the database
    const diagnosticData = JSON.stringify(result.data);
    const updatedEntry = await prisma.growthTrackerEntry.update({
      where: { id: growthTrackerEntryId },
      data: {
        aiHealthDiagnosis: diagnosticData,
      },
    });

    return NextResponse.json({
      success: true,
      entryId: updatedEntry.id,
      aiHealthDiagnosis: result.data,
      message: 'Image analyzed and diagnosis stored successfully',
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
