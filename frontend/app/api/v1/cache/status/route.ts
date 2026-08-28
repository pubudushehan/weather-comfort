import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';
import { WeatherComfortClient } from '@/lib/api-codegen';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { token } = await auth0.getAccessToken();
    const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

    const client = new WeatherComfortClient({
      BASE: apiBaseUrl,
      TOKEN: token,
    });

    const data = await client.default.getCacheStatusApiV1CacheStatusGet();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { body?: { detail?: string }; message?: string; status?: number };
    console.error("Proxy cache status query failed:", err);
    return NextResponse.json(
      { detail: err.body?.detail || err.message || "Invalid authentication credentials" },
      { status: err.status || 401 }
    );
  }
}
