import { NextRequest, NextResponse } from 'next/server';
import { fetchRestaurantSettings, updateRestaurantSettings } from '@/lib/data/store';

export async function GET() {
  try {
    const settings = await fetchRestaurantSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates, requesterRole, requesterName } = body;

    const res = await updateRestaurantSettings(
      updates || {},
      requesterRole || 'owner',
      requesterName || 'Admin'
    );

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, settings: res.settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
