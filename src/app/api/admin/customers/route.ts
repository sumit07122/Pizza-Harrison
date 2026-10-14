import { NextRequest, NextResponse } from 'next/server';
import { fetchCustomersDirectory } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;

    const customers = fetchCustomersDirectory(search);
    return NextResponse.json({
      success: true,
      customers,
      totalCount: customers.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
