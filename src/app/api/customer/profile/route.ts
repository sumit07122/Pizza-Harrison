import { NextRequest, NextResponse } from 'next/server';
import { validateCustomerSession, updateCustomerProfile } from '@/lib/data/store';

export async function PATCH(req: NextRequest) {
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
    const updateRes = await updateCustomerProfile(sessionRes.customer.id, {
      full_name: body.full_name,
      email: body.email,
    });

    if (!updateRes.success || !updateRes.customer) {
      return NextResponse.json({ error: updateRes.error || 'Failed to update profile.' }, { status: 400 });
    }

    const safeCustomer = { ...updateRes.customer };
    delete safeCustomer.password_hash;

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      customer: safeCustomer,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal error updating profile.' }, { status: 500 });
  }
}
