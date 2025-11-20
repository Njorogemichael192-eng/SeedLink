/**
 * Antugrow API Service Layer
 * 
 * Secure server-side service for interacting with the Antugrow API.
 * All API calls use the X-API-KEY header with credentials stored in environment variables.
 * This module should ONLY be used in Next.js API routes (server-side).
 */

export interface AntugrowApiOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

export interface AntugrowApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Make a secure API call to Antugrow
 * Automatically includes X-API-KEY header using ANTUGROW_API_KEY environment variable
 */
export async function callAntugrowApi<T = any>(
  options: AntugrowApiOptions
): Promise<AntugrowApiResponse<T>> {
  const {
    endpoint,
    method = 'GET',
    params,
    body,
    headers = {},
  } = options;

  const apiKey = process.env.ANTUGROW_API_KEY;
  const baseUrl = process.env.ANTUGROW_BASE_URL || 'https://api.antugrow.com/v1';

  if (!apiKey) {
    return {
      success: false,
      error: 'ANTUGROW_API_KEY is not configured',
    };
  }

  try {
    // Build URL with query parameters
    let url = `${baseUrl}${endpoint}`;
    if (params && method === 'GET') {
      const queryString = new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          },
          {} as Record<string, string>
        )
      ).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const requestHeaders: HeadersInit = {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
      ...headers,
    };

    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      ...(body && { body: JSON.stringify(body) }),
    };

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Antugrow API error: ${response.statusCode}`,
        statusCode: response.status,
        data,
      };
    }

    return {
      success: true,
      data,
      statusCode: response.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Antugrow API request failed: ${errorMessage}`,
    };
  }
}

/**
 * Specialized function for retrieving NDVI history
 * Used for satellite health score verification
 */
export async function getNdviHistory(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate?: Date
): Promise<AntugrowApiResponse> {
  const params: Record<string, any> = {
    lat: latitude,
    lng: longitude,
    start_date: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    many: true, // Retrieve historical time-series data
  };

  if (endDate) {
    params.end_date = endDate.toISOString().split('T')[0];
  }

  return callAntugrowApi({
    endpoint: '/ndvi',
    method: 'GET',
    params,
  });
}

/**
 * Retrieve local climate conditions and environmental data
 * Includes precipitation, temperature, and soil information
 */
export async function getLocalConditions(
  latitude: number,
  longitude: number
): Promise<AntugrowApiResponse> {
  try {
    // Make parallel requests for all environmental data
    const [precipResult, tempResult, soilPhResult, clayResult] = await Promise.all([
      callAntugrowApi({
        endpoint: '/precipitation',
        method: 'GET',
        params: {
          lat: latitude,
          lng: longitude,
          years: 3,
        },
      }),
      callAntugrowApi({
        endpoint: '/temperature',
        method: 'GET',
        params: {
          lat: latitude,
          lng: longitude,
          years: 2,
        },
      }),
      callAntugrowApi({
        endpoint: '/soil-ph',
        method: 'GET',
        params: {
          lat: latitude,
          lng: longitude,
        },
      }),
      callAntugrowApi({
        endpoint: '/clay',
        method: 'GET',
        params: {
          lat: latitude,
          lng: longitude,
        },
      }),
    ]);

    // Aggregate results
    const aggregated = {
      precipitation: precipResult.data,
      temperature: tempResult.data,
      soilPh: soilPhResult.data,
      clay: clayResult.data,
    };

    return {
      success:
        precipResult.success &&
        tempResult.success &&
        soilPhResult.success &&
        clayResult.success,
      data: aggregated,
      error:
        !precipResult.success || !tempResult.success || !soilPhResult.success
          ? 'One or more environmental data requests failed'
          : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to retrieve local conditions: ${errorMessage}`,
    };
  }
}

/**
 * Analyze a growth image for health diagnostics
 * Supports both file uploads and ImageKit URLs
 */
export async function analyzeGrowthImage(
  imageUrl: string,
  growthTrackerEntryId: string
): Promise<AntugrowApiResponse> {
  try {
    const formData = new FormData();
    formData.append('image_url', imageUrl);

    const apiKey = process.env.ANTUGROW_API_KEY;
    const baseUrl = process.env.ANTUGROW_BASE_URL || 'https://api.antugrow.com/v1';

    if (!apiKey) {
      return {
        success: false,
        error: 'ANTUGROW_API_KEY is not configured',
      };
    }

    const response = await fetch(`${baseUrl}/analyze-image`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
      },
      body: formData,
    });

    // Handle rate limiting
    if (response.status === 429) {
      return {
        success: false,
        error:
          'Image analysis rate limit exceeded. Please try again in a moment. (1 request per minute limit)',
        statusCode: 429,
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Antugrow API error: ${response.status}`,
        statusCode: response.status,
        data,
      };
    }

    return {
      success: true,
      data,
      statusCode: response.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Image analysis request failed: ${errorMessage}`,
    };
  }
}
