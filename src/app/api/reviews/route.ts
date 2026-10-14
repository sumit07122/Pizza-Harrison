import { NextRequest, NextResponse } from 'next/server';
import { submitCustomerReview, fetchApprovedReviews } from '@/lib/data/store';

export async function GET() {
  const reviews = await fetchApprovedReviews();
  return NextResponse.json({ success: true, reviews });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await submitCustomerReview(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit review.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Review submitted for moderation! Thank you for supporting Pizza Harrison Mathura.' },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error while submitting review.' },
      { status: 500 }
    );
  }
}
