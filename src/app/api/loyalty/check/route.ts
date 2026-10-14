import { NextRequest, NextResponse } from 'next/server';
import { getLoyaltyAccountByPhone, fetchLoyaltyConfig } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      const config = await fetchLoyaltyConfig();
      return NextResponse.json({
        success: true,
        config: {
          is_active: config.is_active,
          min_order_paise: config.min_order_paise,
          stamps_required: config.stamps_required,
          reward_pizza_name: config.reward_pizza_name,
          terms: config.terms,
        },
      });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const { account, ledger, config } = await getLoyaltyAccountByPhone(cleanPhone);

    // Privacy Masking: Mask order numbers and sanitize details
    const sanitizedLedger = ledger.map((entry) => ({
      id: entry.id,
      event_type: entry.event_type,
      stamps_delta: entry.stamps_delta,
      order_number_masked: entry.order_number
        ? `${entry.order_number.slice(0, 11)}****`
        : undefined,
      order_subtotal_paise: entry.order_subtotal_paise,
      reason: entry.reason,
      created_at: entry.created_at,
    }));

    return NextResponse.json({
      success: true,
      found: !!account,
      account: account
        ? {
            customer_name: account.customer_name.split(' ')[0], // First name only for privacy
            stamps_count: account.stamps_count,
            total_stamps_earned: account.total_stamps_earned,
            available_rewards_count: account.available_rewards_count,
            rewards_redeemed_count: account.rewards_redeemed_count,
          }
        : null,
      ledger: sanitizedLedger,
      config: {
        is_active: config.is_active,
        min_order_paise: config.min_order_paise,
        stamps_required: config.stamps_required,
        reward_pizza_name: config.reward_pizza_name,
        terms: config.terms,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve loyalty progress.' },
      { status: 500 }
    );
  }
}
