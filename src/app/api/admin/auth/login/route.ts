import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminCredentials,
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  PRIMARY_ADMIN_EMAIL,
} from '@/lib/security/admin-auth';
import { rateLimiter } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate limit: 5 login attempts per minute per IP
    const rateCheck = rateLimiter.check(`admin-login:${ip}`, 5, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please wait ${Math.ceil(
            rateCheck.resetMs / 1000
          )} seconds before retrying.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Strictly authenticate sumitdevthakur@gmail.com
    const verification = verifyAdminCredentials(email, password);
    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: 403 }
      );
    }

    // Success! Generate signed admin session token
    const token = createAdminSessionToken(PRIMARY_ADMIN_EMAIL, 'Sumit Dev Thakur');

    const res = NextResponse.json({
      success: true,
      message: 'Admin session established successfully.',
      admin: {
        email: PRIMARY_ADMIN_EMAIL,
        name: 'Sumit Dev Thakur',
        role: 'admin',
      },
    });

    // Set HTTP-only secure cookie for edge middleware and browser requests
    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
