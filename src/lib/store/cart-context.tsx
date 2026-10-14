'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Coupon, OrderType, BranchId, Product, ProductVariant, CrustOption, CartItemAddon } from '../types';
import { calculateFullPricing, DEFAULT_FEE_SETTINGS } from '../pricing';

interface CartContextType {
  items: CartItem[];
  orderType: OrderType;
  branch: BranchId;
  appliedCoupon: Coupon | null;
  couponError: string | null;
  isCartDrawerOpen: boolean;
  itemCount: number;
  subtotalPaise: number;
  discountPaise: number;
  deliveryFeePaise: number;
  packagingFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  addItem: (item: {
    product: Product;
    selectedVariant?: ProductVariant;
    selectedCrust?: CrustOption;
    selectedAddons: CartItemAddon[];
    specialInstructions?: string;
    unitPricePaise: number;
    quantity: number;
  }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setBranch: (branch: BranchId) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'pizza_harrison_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [branch, setBranch] = useState<BranchId>('pali_khera');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (parsed.orderType) setOrderType(parsed.orderType);
        if (parsed.branch) setBranch(parsed.branch);
        if (parsed.appliedCoupon) setAppliedCoupon(parsed.appliedCoupon);
      }
    } catch (e) {
      console.warn('Could not read cart from localStorage', e);
    }
    setHydrated(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, orderType, branch, appliedCoupon })
      );
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }, [items, orderType, branch, appliedCoupon, hydrated]);

  const addItem = (itemInput: {
    product: Product;
    selectedVariant?: ProductVariant;
    selectedCrust?: CrustOption;
    selectedAddons: CartItemAddon[];
    specialInstructions?: string;
    unitPricePaise: number;
    quantity: number;
  }) => {
    const qty = Math.max(1, itemInput.quantity || 1);
    const unitPrice = itemInput.unitPricePaise;
    const totalPrice = unitPrice * qty;

    // Check if an identical configured item exists in cart
    const existingIndex = items.findIndex((it) => {
      const sameProduct = it.product.id === itemInput.product.id;
      const sameVariant = it.selectedVariant?.id === itemInput.selectedVariant?.id;
      const sameCrust = it.selectedCrust?.id === itemInput.selectedCrust?.id;
      const sameAddons =
        it.selectedAddons.length === itemInput.selectedAddons.length &&
        it.selectedAddons.every((a) => itemInput.selectedAddons.some((b) => b.id === a.id));
      const sameInstructions = it.specialInstructions === itemInput.specialInstructions;
      return sameProduct && sameVariant && sameCrust && sameAddons && sameInstructions;
    });

    if (existingIndex > -1) {
      const updated = [...items];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + qty;
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPricePaise: existing.unitPricePaise * newQty,
      };
      setItems(updated);
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product: itemInput.product,
        selectedVariant: itemInput.selectedVariant,
        selectedCrust: itemInput.selectedCrust,
        selectedAddons: itemInput.selectedAddons,
        specialInstructions: itemInput.specialInstructions,
        unitPricePaise: unitPrice,
        quantity: qty,
        totalPricePaise: totalPrice,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setIsCartDrawerOpen(true);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              quantity: newQty,
              totalPricePaise: it.unitPricePaise * newQty,
            }
          : it
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    setCouponError(null);
    try {
      const currentSubtotal = items.reduce((sum, it) => sum + it.unitPricePaise * it.quantity, 0);
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalPaise: currentSubtotal }),
      });
      const data = await res.json();
      if (data.valid && data.coupon) {
        setAppliedCoupon(data.coupon);
        setCouponError(null);
        return { success: true, message: data.message };
      } else {
        setCouponError(data.message || 'Invalid coupon.');
        return { success: false, message: data.message || 'Invalid coupon.' };
      }
    } catch (e: any) {
      setCouponError('Network error verifying coupon.');
      return { success: false, message: 'Network error verifying coupon.' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Pricing calculations
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const pricing = calculateFullPricing(
    items.map((it) => ({ unitPricePaise: it.unitPricePaise, quantity: it.quantity })),
    orderType,
    appliedCoupon
  );

  return (
    <CartContext.Provider
      value={{
        items,
        orderType,
        branch,
        appliedCoupon,
        couponError: pricing.coupon_error || couponError,
        isCartDrawerOpen,
        itemCount,
        subtotalPaise: pricing.subtotal_paise,
        discountPaise: pricing.discount_paise,
        deliveryFeePaise: pricing.delivery_fee_paise,
        packagingFeePaise: pricing.packaging_fee_paise,
        taxPaise: pricing.tax_paise,
        totalPaise: pricing.total_paise,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setOrderType,
        setBranch,
        applyCoupon,
        removeCoupon,
        openCartDrawer: () => setIsCartDrawerOpen(true),
        closeCartDrawer: () => setIsCartDrawerOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
