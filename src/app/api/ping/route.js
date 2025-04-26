import { NextResponse } from 'next/server';

/**
 * Simple ping endpoint for connection monitoring
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}