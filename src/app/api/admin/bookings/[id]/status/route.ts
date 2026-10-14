import { NextRequest, NextResponse } from 'next/server';
import { updateBookingStatus } from '@/lib/data/store';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status, staffNotes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required.' }, { status: 400 });
    }

    const result = await updateBookingStatus(id, status, staffNotes);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, booking: result.booking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
