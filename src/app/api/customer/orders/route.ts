import { NextRequest, NextResponse } from 'next/server';
import { validateCustomerSession, getCustomerOrders } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const cookieToken = req.cookies.get('ph_customer_session')?.value;
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const sessionRes = await validateCustomerSession(token);
    if (!sessionRes.valid || !sessionRes.customer) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
    }

    // Retrieve only orders matching this verified customer
    const orders = await getCustomerOrders(sessionRes.customer.phone);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal error loading customer orders.' }, { status: 500 });
  }
}
