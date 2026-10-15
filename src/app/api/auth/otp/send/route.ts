import { NextRequest, NextResponse } from 'next/server';
import { createPhoneOtpRequest } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone?.replace(/\D/g, '') || '';

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit Indian mobile number is required.' },
        { status: 400 }
      );
    }

    const result = await createPhoneOtpRequest(phone);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send OTP.' },
        { status: result.provider === 'rate_limited' ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to +91-${phone}.`,
      provider: result.provider,
      expiresAt: result.expiresAt,
      verificationId: result.verificationId,
      // Provide OTP in response so local test scripts and seamless auto-fill operate smoothly
      sandboxOtp: result.provider === 'sandbox' ? result.otp : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error processing OTP request.' },
      { status: 500 }
    );
  }
}
