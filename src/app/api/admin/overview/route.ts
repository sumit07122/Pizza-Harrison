import { NextRequest, NextResponse } from 'next/server';
import { computeAnalytics, filterOrders } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get('dateRange') as any) || 'today';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const analytics = computeAnalytics(dateRange, startDate, endDate);
    const recentOrders = filterOrders({ dateRange: 'all' }).slice(0, 10);

    return NextResponse.json({
      success: true,
      analytics,
      recentOrders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch overview metrics.' },
      { status: 500 }
    );
  }
}
