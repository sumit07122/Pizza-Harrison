import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateCustomerWithPassword,
  verifyPhoneOtp,
  createCustomerSession,
  findCustomerByPhone,
} from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone?.replace(/\D/g, '') || '';
    const password = body.password;
    const otp = body.otp?.trim();

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit Indian mobile number is required.' },
        { status: 400 }
      );
    }

    let customer = null;

    // A. Password login flow
    if (password) {
      const authResult = await authenticateCustomerWithPassword(phone, password);
      if (!authResult.success || !authResult.customer) {
        return NextResponse.json(
          { error: authResult.error || 'Invalid mobile number or password.' },
          { status: 401 }
        );
      }
      customer = authResult.customer;
    }
    // B. OTP login flow
    else if (otp) {
      const otpResult = await verifyPhoneOtp(phone, otp);
      if (!otpResult.success) {
        return NextResponse.json(
          { error: otpResult.error || 'Invalid verification code.' },
          { status: 401 }
        );
      }
      if (otpResult.customer) {
        customer = otpResult.customer;
      } else {
        // Find or prompt registration
        customer = await findCustomerByPhone(phone);
        if (!customer) {
          return NextResponse.json({
            success: true,
            needsRegistration: true,
            verificationToken: otpResult.verificationToken,
            phone,
            message: 'Phone verified. Please complete your name to finish account creation.',
          });
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Please provide either a password or OTP code to sign in.' },
        { status: 400 }
      );
    }

    const session = await createCustomerSession(customer.id, customer.phone);

    const res = NextResponse.json({
      success: true,
      message: `Welcome back, ${customer.full_name}!`,
      customer,
      sessionToken: session.token,
    });

    res.cookies.set('ph_customer_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error during login.' },
      { status: 500 }
    );
  }
}
