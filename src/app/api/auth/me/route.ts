import { NextRequest, NextResponse } from 'next/server';
import { validateCustomerSession } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const cookieToken = req.cookies.get('ph_customer_session')?.value;
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json({ authenticated: false, customer: null }, { status: 401 });
    }

    const sessionValidation = await validateCustomerSession(token);
    if (!sessionValidation.valid || !sessionValidation.customer) {
      return NextResponse.json({ authenticated: false, customer: null }, { status: 401 });
    }

    // Never return password_hash to the client
    const safeCustomer = { ...sessionValidation.customer };
    delete safeCustomer.password_hash;

    return NextResponse.json({
      authenticated: true,
      customer: safeCustomer,
      expiresAt: sessionValidation.session?.expires_at,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to verify customer authentication session.' },
      { status: 500 }
    );
  }
}
