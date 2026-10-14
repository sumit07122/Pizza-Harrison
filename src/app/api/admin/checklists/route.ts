import { NextRequest, NextResponse } from 'next/server';
import {
  fetchDailyChecklists,
  toggleDailyChecklistItem,
  submitDailyChecklist,
} from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || undefined;

    const checklists = await fetchDailyChecklists(dateStr);
    return NextResponse.json({ success: true, checklists });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch checklists.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, checklistId, itemId, staffName } = body;

    if (action === 'toggle_item') {
      if (!checklistId || !itemId) {
        return NextResponse.json(
          { error: 'checklistId and itemId are required.' },
          { status: 400 }
        );
      }
      const res = await toggleDailyChecklistItem(checklistId, itemId, staffName || 'Staff');
      if (res.success) {
        return NextResponse.json({ success: true, record: res.record });
      } else {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
    }

    if (action === 'submit_checklist') {
      if (!checklistId) {
        return NextResponse.json({ error: 'checklistId is required.' }, { status: 400 });
      }
      const res = await submitDailyChecklist(checklistId, staffName || 'Staff');
      if (res.success) {
        return NextResponse.json({ success: true, record: res.record });
      } else {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process checklist update.' },
      { status: 500 }
    );
  }
}
