import { NextRequest, NextResponse } from 'next/server';
import {
  fetchOrderByNumber,
  cancelOrder,
  addOrderInternalNote,
  updateOrderStatus,
  confirmPendingOrder,
  rejectPendingOrder,
} from '@/lib/data/store';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const order = await fetchOrderByNumber(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { action, reason, cancelledBy, note, updatedBy, status, changedBy } = body;

    if (action === 'cancel') {
      if (!reason || reason.trim().length < 3) {
        return NextResponse.json(
          { error: 'A specific cancellation reason is required (min 3 characters).' },
          { status: 400 }
        );
      }
      const res = await cancelOrder(id, reason, cancelledBy || 'Staff');
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, order: res.order });
    }

    if (action === 'note') {
      if (!note || note.trim().length === 0) {
        return NextResponse.json({ error: 'Note text cannot be empty.' }, { status: 400 });
      }
      const res = await addOrderInternalNote(id, note, updatedBy || 'Staff');
      if (!res.success) {
        return NextResponse.json({ error: 'Failed to add internal note.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, order: res.order });
    }

    if (action === 'confirm_cod') {
      const res = await confirmPendingOrder(id, changedBy || 'Staff');
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, order: res.order });
    }

    if (action === 'reject_cod') {
      const res = await rejectPendingOrder(
        id,
        reason || 'Unconfirmed COD order rejected by staff',
        cancelledBy || 'Staff'
      );
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, order: res.order });
    }

    if (action === 'status' || status) {
      const res = await updateOrderStatus(id, status, changedBy || 'Staff');
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, order: res.order });
    }

    return NextResponse.json({ error: 'Unrecognized action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
