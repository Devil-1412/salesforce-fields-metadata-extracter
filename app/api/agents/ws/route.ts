import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error:
        'The Oracle desktop agent now uses the Supabase-backed polling flow. Use /api/agents/poll and /api/agents/result instead of WebSockets.',
    },
    { status: 410 }
  );
}
