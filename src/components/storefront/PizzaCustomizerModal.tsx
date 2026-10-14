'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Check, Flame, Sparkles } from 'lucide-react';
import { Product, ProductVariant, CrustOption, Addon, CartItemAddon } from '@/lib/types';
import { INITIAL_CRUSTS, INITIAL_ADDONS } from '@/lib/data/mock-data';
import { formatINR, calculateItemUnitPricePaise } from '@/lib/pricing';
import { useCart } from '@/lib/store/cart-context';

interface PizzaCustomizerModalProps {
  product: Product | null;
  onClose: () => void;
}

export function PizzaCustomizerModal({ product, onClose }: PizzaCustomizerModalProps) {
  const { addItem } = useCart();

  if (!product) return null;

  const isPizza = Boolean(product.variants && product.variants.length > 0);

  // Initialize selected variant
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    isPizza ? product.variants?.find((v) => v.is_default) || product.variants?.[0] : undefined
  );

  // Initialize selected crust (only for pizza)
  const [selectedCrust, setSelectedCrust] = useState<CrustOption | undefined>(
    isPizza ? INITIAL_CRUSTS.find((c) => c.is_default) || INITIAL_CRUSTS[0] : undefined
  );

  // Initialize selected addons
  const [selectedAddons, setSelectedAddons] = useState<CartItemAddon[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);

  // Filter available addons based on product type
  const availableAddons: Addon[] = isPizza
    ? INITIAL_ADDONS
    : INITIAL_ADDONS.filter((a) => a.category === 'dips');

  const toggleAddon = (addon: Addon) => {
    const exists = selectedAddons.some((a) => a.id === addon.id);
    if (exists) {
      setSelectedAddons((prev) => prev.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons((prev) => [
        ...prev,
        { id: addon.id, name: addon.name, price_paise: addon.price_paise },
      ]);
    }
  };

  const currentBasePrice = selectedVariant ? selectedVariant.price_paise : product.base_price_paise;
  const crustPrice = selectedCrust ? selectedCrust.price_paise : 0;
  const addonPrices = selectedAddons.map((a) => a.price_paise);
  const unitPrice = calculateItemUnitPricePaise(currentBasePrice, crustPrice, addonPrices);
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem({
      product,
      selectedVariant,
      selectedCrust,
      selectedAddons,
      specialInstructions: specialInstructions.trim() || undefined,
      unitPricePaise: unitPrice,
      quantity,
    });
    setIsAddedSuccess(true);
    setTimeout(() => {
      setIsAddedSuccess(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div className="relative bg-[#FFFDF9] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-border-warm z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header Media */}
        <div className="relative h-48 sm:h-56 bg-neutral-900 w-full overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 500px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍕</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/75 transition cursor-pointer"
            aria-label="Close customizer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badges on Image */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={product.is_veg ? 'veg-badge bg-white' : 'non-veg-badge bg-white'}>
                  <span className={product.is_veg ? 'veg-dot' : 'non-veg-dot'} />
                </span>
                {product.is_bestseller && (
                  <span className="bg-yellow-400 text-charcoal text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Bestseller
                  </span>
                )}
                {product.is_spicy && (
                  <span className="bg-tomato text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                    <Flame className="w-3 h-3" /> Spicy
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-white font-serif">{product.name}</h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-5">
          <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
            {product.description}
          </p>

          {/* Sold out alert */}
          {product.is_available === false && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>This item is temporarily sold out and cannot be ordered at this time.</span>
            </div>
          )}

          {/* Combo Deal Details */}
          {product.combo_items && product.combo_items.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#F7F4ED] border border-border-warm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-forest">
                  Included in This Combo Deal
                </span>
                {product.combo_savings_paise && (
                  <span className="bg-tomato text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    Save {formatINR(product.combo_savings_paise)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {product.combo_items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs font-semibold text-charcoal bg-white p-2 rounded-xl border border-border-warm"
                  >
                    <span className="text-primary-green font-black">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Ingredients & Allergens Information */}
          {(product.ingredients?.length || product.allergens?.length || product.spice_level) && (
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5">
              {product.spice_level && (
                <div className="flex items-center gap-2 text-charcoal">
                  <span className="font-bold text-muted-gray uppercase text-[10px] tracking-wider">Spice Level:</span>
                  <span className="font-extrabold text-forest capitalize">
                    {product.spice_level === 'hot' ? '🌶️ Hot & Spicy' : product.spice_level === 'medium' ? '🌶️ Medium Kick' : '🌿 Mild & Herbaceous'}
                  </span>
                </div>
              )}
              {product.ingredients && product.ingredients.length > 0 && (
                <div className="text-charcoal leading-relaxed">
                  <span className="font-bold text-muted-gray uppercase text-[10px] tracking-wider block">Ingredients:</span>
                  <span>{product.ingredients.join(', ')}</span>
                </div>
              )}
              {product.allergens && product.allergens.length > 0 && (
                <div className="text-amber-800 leading-relaxed font-medium">
                  <span className="font-bold uppercase text-[10px] tracking-wider text-amber-900 block">Allergen Notice:</span>
                  <span>Contains or may contain: {product.allergens.join(', ')}. Freshly baked in a kitchen that handles wheat gluten and dairy.</span>
                </div>
              )}
            </div>
          )}

          {/* 1. Size Selection (Pizzas Only) */}
          {isPizza && product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-forest">
                  1. Select Size
                </span>
                <span className="text-[11px] text-muted-gray">Required</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary-green bg-primary-green/10 text-forest shadow-xs font-bold'
                          : 'border-border-warm bg-white text-charcoal hover:border-primary-green/40'
                      }`}
                    >
                      <span className="text-xs font-bold block">{v.size_name}</span>
                      <span className="text-xs font-extrabold text-primary-green mt-1">
                        {formatINR(v.price_paise)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Crust Selection (Pizzas Only) */}
          {isPizza && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-forest">
                  2. Choose Crust
                </span>
                <span className="text-[11px] text-muted-gray">Select One</span>
              </div>
              <div className="space-y-1.5">
                {INITIAL_CRUSTS.map((c) => {
                  const isSelected = selectedCrust?.id === c.id;
                  return (
                    <label
                      key={c.id}
                      onClick={() => setSelectedCrust(c)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-primary-green bg-emerald-50 text-forest'
                          : 'border-border-warm bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-primary-green bg-primary-green text-white'
                              : 'border-muted-gray bg-white'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{c.name}</div>
                          {c.description && (
                            <div className="text-[10px] text-muted-gray">{c.description}</div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-forest">
                        {c.price_paise === 0 ? 'Included' : `+${formatINR(c.price_paise)}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Add-ons & Extra Toppings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-forest">
                {isPizza ? '3. Extra Gourmet Toppings & Dips' : 'Add Dips & Accompaniments'}
              </span>
              <span className="text-[11px] text-muted-gray">Optional</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableAddons.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'border-primary-green bg-emerald-50 text-forest font-bold'
                        : 'border-border-warm bg-white text-charcoal hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                          isSelected
                            ? 'bg-primary-green border-primary-green text-white'
                            : 'border-neutral-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>{addon.name}</span>
                    </div>
                    <span className="text-primary-green font-bold text-[11px]">
                      +{formatINR(addon.price_paise)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Special Preparation Note */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal block">
              Special Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Extra oregano, crispy crust, or Jain friendly (no onion/garlic)"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full text-xs p-2.5 border border-border-warm rounded-xl bg-white focus:outline-hidden focus:border-primary-green"
              maxLength={120}
            />
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 bg-warm-cream border-t border-border-warm flex items-center justify-between gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-white border border-border-warm rounded-xl p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 text-charcoal transition cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center text-sm font-black text-charcoal">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 text-charcoal transition cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button with Live Total */}
          {product.is_available === false ? (
            <div className="flex-1 bg-neutral-200 text-neutral-500 py-3 px-4 rounded-xl font-black text-sm text-center cursor-not-allowed">
              Item Sold Out
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddedSuccess}
              className="flex-1 bg-primary-green hover:bg-forest text-white py-3 px-4 rounded-xl font-black text-sm flex items-center justify-between shadow-md transition transform active:scale-98 cursor-pointer"
            >
              <span>{isAddedSuccess ? '✓ Added to Cart!' : 'Add to Order'}</span>
              <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-xs font-extrabold tracking-wide">
                {formatINR(totalPrice)}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
