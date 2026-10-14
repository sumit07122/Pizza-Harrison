'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShoppingBag,
  Sparkles,
  Heart,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  RotateCcw,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useCustomerAuth } from '@/lib/store/customer-auth-context';
import { useCart } from '@/lib/store/cart-context';
import { formatINR } from '@/lib/pricing';
import { Order, CustomerAddress, Product } from '@/lib/types';
import { INITIAL_PRODUCTS as MENU_ITEMS } from '@/lib/data/mock-data';

export default function AccountPage() {
  const router = useRouter();
  const {
    customer,
    isAuthenticated,
    loading: authLoading,
    logout,
    updateProfile,
    saveAddress,
    deleteAddress,
    toggleFavorite,
  } = useCustomerAuth();
  const { addItem, openCartDrawer } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'loyalty' | 'favorites' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit profile state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add address modal/form state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrType, setAddrType] = useState<'home' | 'work' | 'other'>('home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrCity, setAddrCity] = useState('Mathura');
  const [addrPincode, setAddrPincode] = useState('281001');
  const [addrDefault, setAddrDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Reorder feedback state
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/account');
    }
  }, [authLoading, isAuthenticated, router]);

  // Sync profile fields
  useEffect(() => {
    if (customer) {
      setEditName(customer.full_name || customer.name || '');
      setEditEmail(customer.email || '');
    }
  }, [customer]);

  // Fetch orders
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomerOrders();
    }
  }, [isAuthenticated]);

  const fetchCustomerOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/customer/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    const res = await updateProfile({
      name: editName.trim(),
      email: editEmail.trim() || undefined,
    });
    setSavingProfile(false);

    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    if (!addrStreet.trim() || !addrArea.trim()) {
      setAddressError('Please fill in both street/flat details and area/locality.');
      return;
    }

    setSavingAddress(true);
    const res = await saveAddress({
      label: addrType as any,
      type: addrType,
      address_line: addrStreet.trim(),
      street: addrStreet.trim(),
      landmark: addrLandmark.trim() || undefined,
      area: addrArea.trim(),
      city: addrCity.trim(),
      pincode: addrPincode.trim(),
      is_default: addrDefault,
    });
    setSavingAddress(false);

    if (res.success) {
      setShowAddressModal(false);
      setAddrStreet('');
      setAddrLandmark('');
      setAddrArea('');
    } else {
      setAddressError(res.error || 'Failed to save address.');
    }
  };

  const handleReorder = (order: Order) => {
    let reorderedCount = 0;
    const orderItems = order.items || [];
    for (const item of orderItems) {
      // Find matching product in menu
      const product = (MENU_ITEMS as Product[]).find((p: Product) => p.id === item.product_id);
      if (product && product.is_available) {
        const matchingVariant = product.variants?.find((v) => v.size_name === item.variant_name || v.size_name === item.variant);
        addItem({
          product,
          selectedVariant: matchingVariant,
          selectedCrust: undefined,
          selectedAddons: [],
          specialInstructions: item.special_instructions,
          unitPricePaise: item.unit_price_paise,
          quantity: item.quantity,
        });
        reorderedCount++;
      }
    }

    if (reorderedCount > 0) {
      setReorderNotice(`Added ${reorderedCount} available item(s) from Order #${order.id} to your cart!`);
      openCartDrawer();
      setTimeout(() => setReorderNotice(null), 4000);
    } else {
      alert('Items from this order are currently unavailable or not in current menu.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (authLoading || !customer) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F7F4ED]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-forest border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-bold text-forest">Loading customer portal...</p>
        </div>
      </div>
    );
  }

  // Favorite products
  const favoriteProducts = (MENU_ITEMS as Product[]).filter((item: Product) =>
    (customer.favorites || []).includes(item.id)
  );

  return (
    <div className="min-h-screen bg-[#F7F4ED] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E8E2D2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest text-warm-cream flex items-center justify-center text-2xl font-black shadow-md border-2 border-primary-green">
              {(customer.full_name || customer.name || 'User').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
                  {customer.full_name || customer.name || 'Valued Guest'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3" /> Verified Phone
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-gray mt-1">
                <span className="flex items-center gap-1 font-semibold text-charcoal">
                  <Phone className="w-3.5 h-3.5 text-primary-green" /> +91 {customer.phone}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-muted-gray" /> {customer.email}
                  </span>
                )}
                <span className="text-[11px] text-muted-gray">
                  Member since {new Date(customer.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-tomato border border-red-200 hover:bg-red-50 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-[#E8E2D2] shadow-2xs">
            <div className="flex items-center justify-between text-muted-gray text-xs font-semibold mb-1">
              <span>Orders Placed</span>
              <ShoppingBag className="w-4 h-4 text-primary-green" />
            </div>
            <div className="text-2xl font-black text-forest">{customer.total_orders || orders.length}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E8E2D2] shadow-2xs">
            <div className="flex items-center justify-between text-muted-gray text-xs font-semibold mb-1">
              <span>Loyalty Stamps</span>
              <Award className="w-4 h-4 text-tomato" />
            </div>
            <div className="text-2xl font-black text-tomato">
              {(customer.loyalty_stamps || 0) % 6}/6
              <span className="text-xs text-muted-gray font-normal ml-1">
                ({customer.loyalty_stamps || 0} total)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E8E2D2] shadow-2xs">
            <div className="flex items-center justify-between text-muted-gray text-xs font-semibold mb-1">
              <span>Saved Addresses</span>
              <MapPin className="w-4 h-4 text-forest" />
            </div>
            <div className="text-2xl font-black text-forest">{customer.saved_addresses.length}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E8E2D2] shadow-2xs">
            <div className="flex items-center justify-between text-muted-gray text-xs font-semibold mb-1">
              <span>Favorites</span>
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-black text-forest">{customer.favorites?.length || 0}</div>
          </div>
        </div>

        {/* Reorder Global Toast */}
        {reorderNotice && (
          <div className="p-4 rounded-2xl bg-emerald-700 text-white shadow-lg flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <span>{reorderNotice}</span>
            </div>
            <button
              onClick={openCartDrawer}
              className="text-xs font-bold underline hover:text-emerald-200 cursor-pointer"
            >
              View Cart →
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto scrollbar-none gap-2 border-b border-[#E8E2D2] pb-3">
          {[
            { id: 'orders', label: 'Order History', icon: ShoppingBag, count: orders.length },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin, count: customer.saved_addresses.length },
            { id: 'loyalty', label: 'Loyalty Rewards', icon: Award },
            { id: 'favorites', label: 'Saved Favorites', icon: Heart, count: customer.favorites?.length || 0 },
            { id: 'profile', label: 'Profile Settings', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-forest text-warm-cream shadow-xs'
                    : 'bg-white text-charcoal hover:bg-[#EFE9DF] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-warm-cream' : 'text-primary-green'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-primary-green text-white' : 'bg-[#EFE9DF] text-charcoal'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {loadingOrders ? (
              <div className="bg-white rounded-3xl p-12 text-center text-muted-gray text-sm">
                Loading your order history...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E2D2] space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F6EFE6] text-forest flex items-center justify-center mx-auto text-2xl">
                  🍕
                </div>
                <h3 className="text-lg font-bold text-forest">No orders placed yet</h3>
                <p className="text-xs text-muted-gray max-w-sm mx-auto">
                  Explore our handcrafted Neapolitan pizzas, freshly baked garlic breads, and student combos.
                </p>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-green text-white font-bold text-sm hover:bg-forest transition shadow-sm"
                >
                  Browse Menu & Order Now
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D2] shadow-2xs space-y-4 hover:shadow-xs transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EBE0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-forest">
                          Order #{order.id}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            order.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                        {order.confirmation_status === 'pending_confirmation' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Awaiting Phone Confirmation
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-gray mt-1">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} • {order.order_type.toUpperCase()} ({(order.branch || order.branch_id || '').replace('_', ' ')})
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-lg font-black text-forest">
                        {formatINR(order.total_paise || order.pricing?.total_paise || 0)}
                      </div>
                      <span className="text-[11px] font-semibold text-muted-gray uppercase">
                        {order.payment_method.toUpperCase()} • {order.payment_status}
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1.5 text-xs text-charcoal">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div>
                          <strong className="font-semibold">
                            {item.quantity}x {item.product_name}
                          </strong>
                          {item.variant_name && (
                            <span className="text-muted-gray ml-1">({item.variant_name})</span>
                          )}
                          {item.crust_name && (
                            <span className="text-muted-gray text-[11px] ml-1">[{item.crust_name}]</span>
                          )}
                        </div>
                        <span className="text-muted-gray font-mono">
                          {formatINR(item.item_total_paise || item.total_paise || 0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0EBE0]">
                    <Link
                      href={`/order-tracking/${order.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-green hover:text-forest transition"
                    >
                      Track Live Progress <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleReorder(order)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F6EFE6] text-forest hover:bg-forest hover:text-white transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reorder All Items
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Saved Addresses */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-forest">Delivery Addresses</h3>
                <p className="text-xs text-muted-gray">
                  Save your hostel, PG, college department or home address in Mathura
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddressModal(true);
                  setAddressError(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-forest text-warm-cream hover:bg-forest/90 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </button>
            </div>

            {customer.saved_addresses.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#E8E2D2] space-y-3">
                <MapPin className="w-10 h-10 text-muted-gray mx-auto" />
                <h4 className="text-sm font-bold text-forest">No saved delivery addresses</h4>
                <p className="text-xs text-muted-gray max-w-sm mx-auto">
                  Add your primary delivery address for 1-click lightning checkout on future orders.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.saved_addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white rounded-2xl p-5 border border-[#E8E2D2] shadow-2xs relative space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#F6EFE6] text-forest">
                        {addr.label || addr.type || 'Address'}
                      </span>
                      {addr.is_default && (
                        <span className="text-[10px] font-extrabold text-primary-green bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Default Address
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-charcoal leading-relaxed pt-1">
                      <p className="font-semibold text-forest">{addr.address_line || addr.street}</p>
                      {addr.landmark && (
                        <p className="text-muted-gray">Landmark: {addr.landmark}</p>
                      )}
                      {(addr.area || addr.city) && (
                        <p>
                          {[addr.area, addr.city, addr.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#F0EBE0] flex justify-end">
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="text-xs text-tomato hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal for adding address */}
            {showAddressModal && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border-warm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border-warm">
                    <h4 className="font-black text-forest font-serif">Add Delivery Address</h4>
                    <button
                      onClick={() => setShowAddressModal(false)}
                      className="text-muted-gray hover:text-forest text-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {addressError && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-tomato shrink-0" />
                      <span>{addressError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveAddress} className="space-y-3">
                    <div className="flex gap-2">
                      {(['home', 'work', 'other'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAddrType(t)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                            addrType === t
                              ? 'bg-forest text-white'
                              : 'bg-[#F7F4ED] text-charcoal hover:bg-[#EAE4D7]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-forest mb-1">
                        Flat / House / Hostel & Street *
                      </label>
                      <input
                        type="text"
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        placeholder="e.g. Room 304, Block C, GLA Hostel"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-border-warm text-xs text-forest focus:outline-hidden focus:border-primary-green"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-forest mb-1">
                        Landmark / Nearby
                      </label>
                      <input
                        type="text"
                        value={addrLandmark}
                        onChange={(e) => setAddrLandmark(e.target.value)}
                        placeholder="e.g. Near Gate 1 / Canteen"
                        className="w-full px-3 py-2 rounded-xl border border-border-warm text-xs text-forest focus:outline-hidden focus:border-primary-green"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-forest mb-1">
                          Area / Locality *
                        </label>
                        <input
                          type="text"
                          value={addrArea}
                          onChange={(e) => setAddrArea(e.target.value)}
                          placeholder="e.g. Pali Khera / Chaumuhan"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-border-warm text-xs text-forest focus:outline-hidden focus:border-primary-green"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-forest mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={addrPincode}
                          onChange={(e) => setAddrPincode(e.target.value)}
                          placeholder="281001"
                          maxLength={6}
                          required
                          className="w-full px-3 py-2 rounded-xl border border-border-warm text-xs text-forest focus:outline-hidden focus:border-primary-green"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addrDefault}
                        onChange={(e) => setAddrDefault(e.target.checked)}
                        className="rounded text-primary-green focus:ring-primary-green"
                      />
                      <span className="text-xs font-semibold text-charcoal">
                        Set as my default delivery address
                      </span>
                    </label>

                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(false)}
                        className="flex-1 py-2.5 rounded-xl border border-border-warm text-xs font-bold text-charcoal hover:bg-[#F7F4ED] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="flex-1 py-2.5 rounded-xl bg-forest text-warm-cream text-xs font-bold hover:bg-forest/90 cursor-pointer disabled:opacity-50"
                      >
                        {savingAddress ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Loyalty Rewards */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D2] shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-forest font-serif">
                    Pizza Harrison Rewards Card
                  </h3>
                  <p className="text-xs text-muted-gray">
                    Collect 6 stamps to unlock 1 Free Handcrafted Pizza!
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#F6EFE6] px-4 py-2 rounded-full border border-border-warm">
                  <Award className="w-5 h-5 text-tomato" />
                  <span className="text-xs font-bold text-forest">
                    {6 - ((customer.loyalty_stamps || 0) % 6)} stamps until your next free pizza
                  </span>
                </div>
              </div>

              {/* Stamp Card Visualization */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
                {[1, 2, 3, 4, 5, 6].map((idx) => {
                  const currentCycle = (customer.loyalty_stamps || 0) % 6;
                  const isEarned = idx <= currentCycle;
                  return (
                    <div
                      key={idx}
                      className={`h-28 rounded-2xl border-2 flex flex-col items-center justify-center p-3 text-center transition ${
                        isEarned
                          ? 'border-primary-green bg-emerald-50 text-forest shadow-xs'
                          : 'border-dashed border-border-warm bg-[#FDFBF7] text-muted-gray'
                      }`}
                    >
                      <span className="text-2xl mb-1">{isEarned ? '🍕' : '⚪'}</span>
                      <span className="text-[11px] font-bold">
                        {idx === 6 ? 'Free Pizza 🎉' : `Stamp #${idx}`}
                      </span>
                      <span className="text-[10px] text-muted-gray">
                        {isEarned ? 'Earned' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold text-forest">
                  <span>Current Progress</span>
                  <span>{Math.round((((customer.loyalty_stamps || 0) % 6) / 6) * 100)}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#F0EBE0] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-green to-tomato transition-all duration-500 rounded-full"
                    style={{ width: `${(((customer.loyalty_stamps || 0) % 6) / 6) * 100}%` }}
                  />
                </div>
              </div>

              {/* Rules Explainer */}
              <div className="p-4 rounded-2xl bg-[#F6EFE6] text-xs text-charcoal space-y-2 border border-border-warm">
                <h5 className="font-bold text-forest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-tomato" /> Reward Rules:
                </h5>
                <ul className="list-disc list-inside space-y-1 text-muted-gray text-[11px] leading-relaxed">
                  <li>Earn 1 stamp for each qualifying completed order with subtotal ₹299 or above.</li>
                  <li>Delivery fees, taxes and coupon deductions do not count towards the ₹299 threshold.</li>
                  <li>Cancelled or refunded orders do not earn stamps.</li>
                  <li>Stamps are automatically credited upon successful delivery.</li>
                </ul>
              </div>

              <div className="pt-2">
                <Link
                  href="/rewards"
                  className="text-xs font-bold text-primary-green hover:underline inline-flex items-center gap-1"
                >
                  View full Rewards terms and redemption options →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Favorites */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-forest">Your Favorite Pizzas & Treats</h3>
            {favoriteProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#E8E2D2] space-y-3">
                <Heart className="w-10 h-10 text-muted-gray mx-auto" />
                <h4 className="text-sm font-bold text-forest">No favorites saved yet</h4>
                <p className="text-xs text-muted-gray max-w-sm mx-auto">
                  Click the heart icon on any pizza in our menu to save it here for fast 1-click reordering.
                </p>
                <Link
                  href="/menu"
                  className="inline-block px-5 py-2.5 rounded-full bg-forest text-warm-cream font-bold text-xs hover:bg-forest/90"
                >
                  Explore Menu
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteProducts.map((prod: Product) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl p-4 border border-[#E8E2D2] shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{prod.image_url ? '🍕' : '🍕'}</span>
                        <button
                          onClick={() => toggleFavorite(prod.id)}
                          className="text-red-500 hover:scale-110 transition cursor-pointer"
                          title="Remove from favorites"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                      <h4 className="font-bold text-forest text-sm mt-2">{prod.name}</h4>
                      <p className="text-[11px] text-muted-gray line-clamp-2 mt-0.5">
                        {prod.description}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-[#F0EBE0] mt-3">
                      <span className="font-black text-forest text-sm">
                        {formatINR(prod.base_price_paise)}
                      </span>
                      <button
                        onClick={() => {
                          addItem({
                            product: prod,
                            selectedVariant: prod.variants?.[0],
                            selectedAddons: [],
                            unitPricePaise: prod.base_price_paise,
                            quantity: 1,
                          });
                          openCartDrawer();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary-green hover:bg-forest text-white text-xs font-bold transition cursor-pointer"
                      >
                        + Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Profile Settings */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D2] shadow-2xs max-w-xl">
            <h3 className="text-base font-bold text-forest mb-4">Edit Profile Information</h3>

            {profileMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-tomato shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border-warm text-xs text-forest font-semibold focus:outline-hidden focus:border-primary-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-1">
                  Verified Mobile Number (Immutable)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={`+91 ${customer.phone}`}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-warm text-xs text-muted-gray font-semibold bg-gray-50 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-muted-gray mt-1">
                  Phone number is verified and tied to your account identity.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="aman@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border-warm text-xs text-forest font-semibold focus:outline-hidden focus:border-primary-green"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest/90 text-warm-cream font-bold text-xs shadow-sm hover:shadow transition cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
