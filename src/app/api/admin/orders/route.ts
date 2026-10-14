import { NextRequest, NextResponse } from 'next/server';
import { filterOrders, exportOrdersToCSV } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const branch = searchParams.get('branch') || undefined;
    const orderType = searchParams.get('orderType') || undefined;
    const dateRange = searchParams.get('dateRange') || 'all';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const format = searchParams.get('format');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '15', 10));

    const matchedOrders = filterOrders({
      search,
      status,
      branch,
      orderType,
      dateRange,
      startDate,
      endDate,
    });

    if (format === 'csv') {
      const csv = exportOrdersToCSV(matchedOrders);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pizza_harrison_orders_${Date.now()}.csv"`,
        },
      });
    }

    const totalCount = matchedOrders.length;
    const startIndex = (page - 1) * limit;
    const paginatedOrders = matchedOrders.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      orders: paginatedOrders,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch orders.' },
      { status: 500 }
    );
  }
}
