import { auth0 } from '@/lib/auth0';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
  try {
    const { token } = await auth0.getAccessToken();
    const { cityId } = await params;
    const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

    const res = await fetch(`${apiBaseUrl}/api/v1/weather/cities/${cityId}/temperature-trend`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Proxy temperature trend query failed:", error);
    return NextResponse.json(
      { detail: "Invalid authentication credentials" },
      { status: 401 }
    );
  }
}
