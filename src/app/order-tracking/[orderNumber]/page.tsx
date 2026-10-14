'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Flame,
  Bike,
  Store,
  Phone,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';
import { Order, OrderStatus } from '@/lib/types';
import { formatINR } from '@/lib/pricing';
import { generateWhatsAppOrderUrl, getClickToCallUrl, RESTAURANT_PHONE } from '@/lib/whatsapp';

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export default function OrderTrackingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const orderNumber = resolvedParams.orderNumber;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrder = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Unable to locate order.');
      }
    } catch (e: any) {
      setError('Network error checking order status.');
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Auto-poll status every 10 seconds for live kitchen updates
    const interval = setInterval(() => {
      fetchOrder();
    }, 10000);
    return () => clearInterval(interval);
  }, [orderNumber]);

  const stages: Array<{ key: OrderStatus; label: string; desc: string; icon: any }> = [
    {
      key: 'placed',
      label: 'Order Placed',
      desc: 'Received by Pizza Harrison kitchen team',
      icon: Clock,
    },
    {
      key: 'confirmed',
      label: 'Kitchen Confirmed',
      desc: 'Dough proofed and chef preparing toppings',
      icon: CheckCircle2,
    },
    {
      key: 'preparing',
      label: 'Baking in Oven',
      desc: 'Baking at 350°C in our stone pizza oven',
      icon: Flame,
    },
    {
      key: order?.order_type === 'pickup' ? 'ready_for_pickup' : 'out_for_delivery',
      label: order?.order_type === 'pickup' ? 'Ready at Counter' : 'Out for Delivery',
      desc: order?.order_type === 'pickup' ? 'Hot & packed for counter takeaway' : 'Rider on the road to your location',
      icon: order?.order_type === 'pickup' ? Store : Bike,
    },
    {
      key: 'completed',
      label: order?.order_type === 'pickup' ? 'Collected' : 'Delivered',
      desc: 'Enjoy your hot handcrafted artisan pizza!',
      icon: ShieldCheck,
    },
  ];

  const getStageIndex = (status: OrderStatus) => {
    if (status === 'placed') return 0;
    if (status === 'confirmed') return 1;
    if (status === 'preparing') return 2;
    if (status === 'out_for_delivery' || status === 'ready_for_pickup') return 3;
    if (status === 'completed') return 4;
    return -1; // cancelled
  };

  const currentIndex = order ? getStageIndex(order.status) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Header */}
        <div className="bg-forest text-warm-cream py-8 border-b border-primary-green/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-yellow-400">
                Live Kitchen Tracking
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white font-serif mt-1">
                Order Reference: {orderNumber}
              </h1>
            </div>

            <button
              onClick={() => fetchOrder(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 bg-primary-green/40 hover:bg-primary-green text-white text-xs font-bold px-4 py-2 rounded-xl border border-primary-green transition self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          {loading ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary-green border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-muted-gray">Connecting to kitchen telemetry...</p>
            </div>
          ) : error || !order ? (
            <div className="bg-white rounded-3xl p-8 border border-border-warm text-center space-y-4 max-w-md mx-auto shadow-xs">
              <AlertCircle className="w-12 h-12 text-tomato mx-auto" />
              <h2 className="text-lg font-black text-forest">Order Not Found</h2>
              <p className="text-xs text-muted-gray">
                We could not find an active order matching <strong>{orderNumber}</strong>. Please check your spelling or verify your contact number.
              </p>
              <Link
                href="/order-tracking/search"
                className="inline-block bg-primary-green text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-forest transition"
              >
                Search Another Order
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Order Status Timeline Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-warm shadow-md">
                
                {/* Status Header Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border-warm gap-3">
                  <div>
                    <span className="text-xs text-muted-gray font-medium">Current Status:</span>
                    <h2 className="text-2xl font-black text-forest capitalize font-serif mt-0.5">
                      {order.status === 'cancelled'
                        ? 'Cancelled'
                        : stages[currentIndex]?.label || order.status}
                    </h2>
                    <p className="text-xs text-muted-gray mt-0.5">
                      {stages[currentIndex]?.desc}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-muted-gray">Last verified at:</span>
                    <div className="text-xs font-bold text-charcoal">
                      {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <span className="text-[10px] text-accent-green font-semibold">
                      Live sync active (auto-polls every 10s)
                    </span>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                {order.status !== 'cancelled' ? (
                  <div className="py-8">
                    <div className="relative">
                      {/* Gray Track */}
                      <div className="absolute top-5 left-6 right-6 h-1 bg-neutral-200 -z-0" />
                      {/* Green Progress */}
                      <div
                        className="absolute top-5 left-6 h-1 bg-primary-green transition-all duration-700 -z-0"
                        style={{
                          width: `${(currentIndex / (stages.length - 1)) * 92}%`,
                        }}
                      />

                      <div className="grid grid-cols-5 gap-2 relative z-10">
                        {stages.map((stage, idx) => {
                          const isDone = idx <= currentIndex;
                          const isCurrent = idx === currentIndex;
                          const Icon = stage.icon;

                          return (
                            <div key={stage.key} className="flex flex-col items-center text-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                  isCurrent
                                    ? 'bg-primary-green text-white ring-4 ring-primary-green/20 shadow-md scale-110'
                                    : isDone
                                    ? 'bg-forest text-white'
                                    : 'bg-white border-2 border-neutral-300 text-neutral-400'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <span
                                className={`text-[11px] font-bold mt-2 hidden sm:block ${
                                  isCurrent ? 'text-primary-green font-black' : isDone ? 'text-forest' : 'text-neutral-400'
                                }`}
                              >
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-tomato bg-red-50 rounded-2xl border border-red-200 mt-4">
                    <p className="font-bold text-xs">
                      This order has been cancelled: {order.cancellation_reason || 'Out of stock or customer requested'}.
                    </p>
                  </div>
                )}

                {/* Fast Action Buttons: WhatsApp & Call */}
                <div className="pt-6 border-t border-border-warm flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-muted-gray text-center sm:text-left">
                    Questions about your pizza? Speak directly to our kitchen staff.
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <a
                      href={getClickToCallUrl()}
                      className="flex-1 sm:flex-initial bg-warm-cream hover:bg-neutral-100 text-forest border border-border-warm text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-primary-green" />
                      <span>Call Kitchen ({RESTAURANT_PHONE})</span>
                    </a>

                    <a
                      href={generateWhatsAppOrderUrl(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Share on WhatsApp</span>
                    </a>
                  </div>
                </div>

              </div>

              {/* Order Invoice & Item Details */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-warm shadow-xs space-y-4">
                <h3 className="text-base font-black text-forest font-serif">
                  Order Invoice Snapshot
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pb-4 border-b border-border-warm">
                  <div>
                    <span className="text-muted-gray">Customer:</span>
                    <div className="font-bold text-charcoal">
                      {order.customer_name} (+91 {order.customer_phone.slice(0, 2)}******{order.customer_phone.slice(-2)})
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-gray">Fulfillment:</span>
                    <div className="font-bold text-charcoal capitalize">
                      {order.order_type === 'delivery' ? '🛵 Home / Hostel Delivery' : '🛍️ Counter Takeaway'}
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-gray">Destination:</span>
                      <div className="font-semibold text-charcoal">
                        {order.delivery_address}
                        {order.delivery_landmark && ` (Landmark: ${order.delivery_landmark})`}
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="space-y-3 pt-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs py-1 border-b border-dashed border-border-warm">
                      <div>
                        <div className="font-bold text-charcoal">
                          {item.product_name} <span className="text-primary-green font-extrabold">x{item.quantity}</span>
                        </div>
                        <div className="text-[11px] text-muted-gray">
                          {item.variant_name && `${item.variant_name} `}
                          {item.crust_name && `• Crust: ${item.crust_name} `}
                          {item.addons_json && item.addons_json.length > 0 && (
                            <span>• Extras: {item.addons_json.map((a) => a.name).join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-forest">{formatINR(item.item_total_paise)}</span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="pt-4 space-y-1.5 text-xs text-charcoal">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold">{formatINR(order.subtotal_paise)}</span>
                  </div>

                  {order.discount_paise > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount ({order.applied_coupon_code})</span>
                      <span>-{formatINR(order.discount_paise)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-bold">
                      {order.delivery_fee_paise === 0 ? 'FREE' : formatINR(order.delivery_fee_paise)}
                    </span>
                  </div>

                  {order.packaging_fee_paise > 0 && (
                    <div className="flex justify-between text-muted-gray">
                      <span>Packaging Fee</span>
                      <span>{formatINR(order.packaging_fee_paise)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-gray">
                    <span>GST (5%)</span>
                    <span>{formatINR(order.tax_paise)}</span>
                  </div>

                  <div className="pt-2 border-t border-border-warm flex justify-between text-base font-black text-forest">
                    <span>Total Paid / Payable</span>
                    <span>{formatINR(order.total_paise)}</span>
                  </div>

                  <div className="text-[11px] text-muted-gray pt-1">
                    Payment Method: <strong className="uppercase text-charcoal">{order.payment_method}</strong> ({order.payment_status.toUpperCase()})
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      <Footer />
    </div>
  );
}
