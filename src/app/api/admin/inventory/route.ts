import { NextRequest, NextResponse } from 'next/server';
import {
  fetchInventoryItems,
  fetchStockMovements,
  addStockPurchase,
  adjustStockQuantity,
} from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId') || undefined;

    const items = await fetchInventoryItems();
    const movements = await fetchStockMovements(itemId);

    return NextResponse.json({
      success: true,
      items,
      movements,
      lowStockCount: items.filter((i) => i.current_quantity <= i.low_stock_threshold).length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch inventory records.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === 'purchase') {
      const result = await addStockPurchase({
        item_id: payload.item_id,
        quantity: Number(payload.quantity),
        purchase_cost_paise: Number(payload.purchase_cost_paise),
        supplier_name: payload.supplier_name,
        recorded_by: payload.recorded_by || 'Staff',
        reason: payload.reason,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, item: result.item });
    }

    if (action === 'adjustment') {
      const result = await adjustStockQuantity({
        item_id: payload.item_id,
        quantity_delta: Number(payload.quantity_delta),
        movement_type: payload.movement_type || 'adjustment',
        reason: payload.reason,
        recorded_by: payload.recorded_by || 'Staff',
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, item: result.item });
    }

    return NextResponse.json({ error: 'Invalid action specified. Must be "purchase" or "adjustment".' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process inventory update.' },
      { status: 500 }
    );
  }
}
