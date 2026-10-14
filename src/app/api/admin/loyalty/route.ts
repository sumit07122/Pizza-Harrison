import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLoyaltyConfig,
  updateLoyaltyConfig,
  getLoyaltyAccountByPhone,
  redeemLoyaltyReward,
  recordLoyaltyAdjustment,
  fetchLoyaltyLedger,
  memoryStore,
} from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    const config = await fetchLoyaltyConfig();

    if (phone) {
      const data = await getLoyaltyAccountByPhone(phone);
      return NextResponse.json({ success: true, ...data });
    }

    const ledger = await fetchLoyaltyLedger();
    const accounts = memoryStore.loyaltyAccounts;

    return NextResponse.json({
      success: true,
      config,
      accounts,
      ledger: ledger.slice(0, 50),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch loyalty program data.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await updateLoyaltyConfig(body.config, body.updatedBy || 'Owner');

    return NextResponse.json({ success: true, config: result.config });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update loyalty config.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === 'redeem_reward') {
      const result = await redeemLoyaltyReward({
        customer_phone: payload.customer_phone,
        order_number: payload.order_number,
        staff_name: payload.staff_name || 'Staff',
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, rewardPizzaName: result.rewardPizzaName });
    }

    if (action === 'manual_adjustment') {
      const result = await recordLoyaltyAdjustment({
        customer_phone: payload.customer_phone,
        stamps_delta: Number(payload.stamps_delta),
        reason: payload.reason,
        recorded_by: payload.recorded_by || 'Staff',
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, account: result.account });
    }

    return NextResponse.json({ error: 'Invalid action specified. Must be "redeem_reward" or "manual_adjustment".' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process loyalty action.' },
      { status: 500 }
    );
  }
}
