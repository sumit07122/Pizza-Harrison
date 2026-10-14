import { NextRequest, NextResponse } from 'next/server';
import { computeAnalytics } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get('dateRange') as any) || 'today';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const data = computeAnalytics(dateRange, startDate, endDate);
    return NextResponse.json({ success: true, analytics: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
