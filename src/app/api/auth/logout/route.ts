import { NextRequest, NextResponse } from 'next/server';
import { revokeCustomerSession } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const cookieToken = req.cookies.get('ph_customer_session')?.value;
    const token = bearerToken || cookieToken;

    if (token) {
      await revokeCustomerSession(token);
    }

    const res = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    res.cookies.set('ph_customer_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Internal error during logout.' },
      { status: 500 }
    );
  }
}
