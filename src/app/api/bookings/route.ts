import { NextRequest, NextResponse } from 'next/server';
import { createTableBooking, fetchAllBookingsAdmin } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createTableBooking(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit table booking.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, booking: result.booking },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error while processing booking.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const bookings = await fetchAllBookingsAdmin();
  return NextResponse.json({ success: true, bookings });
}
