import { NextRequest, NextResponse } from 'next/server';
import { fetchAuditLogsAdmin } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');

    let logs = await fetchAuditLogsAdmin();
    if (entityType && entityType !== 'all') {
      logs = logs.filter((l) => l.entity_type === entityType);
    }

    return NextResponse.json({ success: true, auditLogs: logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
