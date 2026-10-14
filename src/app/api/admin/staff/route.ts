import { NextRequest, NextResponse } from 'next/server';
import {
  fetchStaffMembers,
  createStaffMember,
  updateStaffRole,
} from '@/lib/data/store';

export async function GET() {
  try {
    const staff = await fetchStaffMembers();
    return NextResponse.json({ success: true, staff });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, phone, email, role, requesterRole, requesterName } = body;

    const res = await createStaffMember(
      { full_name, phone, email, role: role || 'order_staff', is_active: true },
      requesterRole || 'owner',
      requesterName || 'Harrison Sharma (Owner)'
    );

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, staff: res.staff });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { staffId, newRole, requesterRole, requesterName } = body;

    if (!staffId || !newRole) {
      return NextResponse.json(
        { error: 'Staff ID and new role are required.' },
        { status: 400 }
      );
    }

    const res = await updateStaffRole(
      staffId,
      newRole,
      requesterRole || 'owner',
      requesterName || 'Harrison Sharma (Owner)'
    );

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, staff: res.staff });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
