import { NextRequest, NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/supabase/db';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, PRIMARY_ADMIN_EMAIL } from '@/lib/security/admin-auth';

export async function GET(req: NextRequest) {
  // Check admin session
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const verification = verifyAdminSessionToken(token);

  if (!verification.valid || verification.payload?.email !== PRIMARY_ADMIN_EMAIL) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin access required.' },
      { status: 403 }
    );
  }

  const status = await testDatabaseConnection();

  return NextResponse.json({
    success: true,
    database: status,
    timestamp: new Date().toISOString(),
  });
}
