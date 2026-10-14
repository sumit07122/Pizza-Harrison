import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllProductsAdmin,
  toggleProductAvailability,
  updateProductPricePaise,
  createProduct,
  updateProduct,
  deleteProduct,
  verifyProductPrice,
} from '@/lib/data/store';

export async function GET() {
  const products = await fetchAllProductsAdmin();
  return NextResponse.json({ success: true, products });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { createdBy, ...productData } = body;

    const res = await createProduct(productData, createdBy || 'Admin');
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, product: res.product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, updates, updatedBy } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const res = await updateProduct(id, updates || {}, updatedBy || 'Admin');
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, product: res.product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const res = await deleteProduct(id, 'Admin');
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, productId, isAvailable, variantSizeName, newPricePaise, isVerified, updatedBy } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    if (action === 'toggle-availability') {
      const ok = await toggleProductAvailability(productId, Boolean(isAvailable));
      return NextResponse.json({ success: ok });
    }

    if (action === 'update-price') {
      const price = Math.max(0, Math.round(Number(newPricePaise) || 0));
      const ok = await updateProductPricePaise(productId, variantSizeName || null, price);
      return NextResponse.json({ success: ok });
    }

    if (action === 'verify-price') {
      const res = await verifyProductPrice(productId, Boolean(isVerified), updatedBy || 'Staff');
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
