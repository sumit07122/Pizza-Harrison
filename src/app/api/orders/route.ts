import { NextRequest, NextResponse } from 'next/server';
import { createOrderServerTrusted, fetchOrderByNumber } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createOrderServerTrusted(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create order.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, order: result.order },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while processing order.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber');
    const phone = searchParams.get('phone') || undefined;

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order reference number is required.' },
        { status: 400 }
      );
    }

    const order = await fetchOrderByNumber(orderNumber, phone);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or phone number does not match.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve order details.' },
      { status: 500 }
    );
  }
}
