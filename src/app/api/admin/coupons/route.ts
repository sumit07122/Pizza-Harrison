import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllCouponsAdmin,
  createCoupon,
  updateCoupon,
  toggleCouponActive,
} from '@/lib/data/store';

export async function GET() {
  try {
    const coupons = await fetchAllCouponsAdmin();
    return NextResponse.json({ success: true, coupons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { createdBy, ...couponData } = body;

    const res = await createCoupon(couponData, createdBy || 'Admin');
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, coupon: res.coupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, isActive, updates, updatedBy } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }

    if (action === 'toggle-active') {
      const ok = await toggleCouponActive(id, Boolean(isActive), updatedBy || 'Admin');
      return NextResponse.json({ success: ok });
    }

    if (updates) {
      const res = await updateCoupon(id, updates, updatedBy || 'Admin');
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, coupon: res.coupon });
    }

    return NextResponse.json({ error: 'Unrecognized action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
