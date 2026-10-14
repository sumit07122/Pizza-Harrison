import { NextRequest, NextResponse } from 'next/server';
import {
  validateCustomerSession,
  saveCustomerAddress,
  deleteCustomerAddress,
} from '@/lib/data/store';

export async function POST(req: NextRequest) {
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
    if (!body.address_line || body.address_line.trim().length < 5) {
      return NextResponse.json(
        { error: 'Complete address line is required (minimum 5 characters).' },
        { status: 400 }
      );
    }

    const result = await saveCustomerAddress(sessionRes.customer.id, {
      id: body.id,
      label: body.label || 'Home',
      address_line: body.address_line.trim(),
      landmark: body.landmark?.trim() || undefined,
      is_default: Boolean(body.is_default),
    });

    if (!result.success || !result.customer) {
      return NextResponse.json({ error: result.error || 'Failed to save address.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Address saved successfully.',
      addresses: result.customer.saved_addresses,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal error saving delivery address.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');
    if (!addressId) {
      return NextResponse.json({ error: 'Address ID is required.' }, { status: 400 });
    }

    const result = await deleteCustomerAddress(sessionRes.customer.id, addressId);
    if (!result.success || !result.customer) {
      return NextResponse.json({ error: result.error || 'Failed to delete address.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Address removed successfully.',
      addresses: result.customer.saved_addresses,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal error deleting address.' }, { status: 500 });
  }
}
