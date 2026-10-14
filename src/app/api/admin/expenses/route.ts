import { NextRequest, NextResponse } from 'next/server';
import { fetchStoreExpenses, recordStoreExpense } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const expenses = await fetchStoreExpenses(dateFrom, dateTo);
    const totalExpensesPaise = expenses.reduce((sum, e) => sum + e.amount_paise, 0);

    return NextResponse.json({
      success: true,
      expenses,
      totalExpensesPaise,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch store expenses.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await recordStoreExpense({
      category: body.category,
      description: body.description,
      amount_paise: Number(body.amount_paise),
      payment_method: body.payment_method || 'cash',
      receipt_number: body.receipt_number,
      date: body.date,
      recorded_by: body.recorded_by || 'Staff',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, expense: result.expense });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to record store expense.' },
      { status: 500 }
    );
  }
}
