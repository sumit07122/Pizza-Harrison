import { NextRequest, NextResponse } from 'next/server';
import { verifyPhoneOtp, createCustomerSession } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone?.replace(/\D/g, '') || '';
    const otp = body.otp?.trim() || '';

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit mobile number is required.' },
        { status: 400 }
      );
    }
    if (!otp || otp.length < 4) {
      return NextResponse.json(
        { error: 'Valid numeric OTP code is required.' },
        { status: 400 }
      );
    }

    const result = await verifyPhoneOtp(phone, otp);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Verification failed.' },
        { status: 400 }
      );
    }

    let sessionToken: string | undefined = undefined;
    if (result.customer) {
      const session = await createCustomerSession(result.customer.id, result.customer.phone);
      sessionToken = session.token;
    }

    const res = NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully.',
      verificationToken: result.verificationToken,
      customer: result.customer,
      sessionToken,
    });

    // If customer session was established, set HTTP-only cookie for secure persistence
    if (sessionToken) {
      res.cookies.set('ph_customer_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error verifying OTP.' },
      { status: 500 }
    );
  }
}
