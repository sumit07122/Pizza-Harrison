import { NextRequest, NextResponse } from 'next/server';
import { fetchAllBookingsAdmin, exportBookingsToCSV } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    let bookings = await fetchAllBookingsAdmin();

    if (status && status !== 'all') {
      bookings = bookings.filter((b) => b.status === status);
    }
    if (date) {
      bookings = bookings.filter((b) => b.booking_date === date);
    }

    if (format === 'csv') {
      const csv = exportBookingsToCSV(bookings);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pizza_harrison_bookings_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, bookings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
