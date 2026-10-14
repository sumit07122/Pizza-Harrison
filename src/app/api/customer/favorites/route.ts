import { NextRequest, NextResponse } from 'next/server';
import { validateCustomerSession, toggleCustomerFavorite } from '@/lib/data/store';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const productId = body.productId;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const result = await toggleCustomerFavorite(sessionRes.customer.id, productId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update favorites.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      favorites: result.favorites,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal error updating favorites.' }, { status: 500 });
  }
}
