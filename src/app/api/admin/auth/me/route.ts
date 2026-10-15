import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
  PRIMARY_ADMIN_EMAIL,
} from '@/lib/security/admin-auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      admin: null,
    });
  }

  const verification = verifyAdminSessionToken(token);

  if (!verification.valid || !verification.payload) {
    return NextResponse.json({
      authenticated: false,
      admin: null,
      error: verification.error,
    });
  }

  // Ensure email matches sumitdevthakur@gmail.com
  if (verification.payload.email.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({
      authenticated: false,
      admin: null,
      error: 'Unauthorized email.',
    });
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      email: PRIMARY_ADMIN_EMAIL,
      name: verification.payload.name || 'Sumit Dev Thakur',
      role: 'admin',
    },
  });
}
