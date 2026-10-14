import { NextRequest, NextResponse } from 'next/server';
import { validateCouponCode } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, subtotalPaise } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, discountPaise: 0, message: 'Coupon code is required.' },
        { status: 400 }
      );
    }

    const subtotal = Math.max(0, Number(subtotalPaise) || 0);
    const result = await validateCouponCode(code, subtotal);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, discountPaise: 0, message: 'Server error validating coupon.' },
      { status: 500 }
    );
  }
}
