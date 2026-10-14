import { NextRequest, NextResponse } from 'next/server';
import {
  createCustomerAccount,
  createCustomerSession,
  verifyCustomerPhoneOwnership,
} from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone?.replace(/\D/g, '') || '';
    const fullName = body.full_name?.trim() || '';
    const email = body.email?.trim() || undefined;
    const password = body.password || undefined;
    const verificationToken = body.verificationToken || undefined;

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit Indian mobile number is required.' },
        { status: 400 }
      );
    }
    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name (minimum 2 characters).' },
        { status: 400 }
      );
    }
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Verify phone ownership before account creation
    const isVerified = await verifyCustomerPhoneOwnership(phone, undefined, verificationToken);
    if (!isVerified) {
      return NextResponse.json(
        { error: 'Mobile number must be verified via OTP before registration.' },
        { status: 403 }
      );
    }

    const result = await createCustomerAccount({
      phone,
      full_name: fullName,
      email,
      password,
    });

    if (!result.success || !result.customer) {
      return NextResponse.json(
        { error: result.error || 'Failed to create customer account.' },
        { status: 400 }
      );
    }

    const session = await createCustomerSession(result.customer.id, result.customer.phone);

    const res = NextResponse.json({
      success: true,
      message: 'Account created successfully. Welcome to Pizza Harrison!',
      customer: result.customer,
      sessionToken: session.token,
    }, { status: 201 });

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
      { error: err.message || 'Internal error registering customer account.' },
      { status: 500 }
    );
  }
}
