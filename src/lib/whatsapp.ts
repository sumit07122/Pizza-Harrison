// Pizza Harrison - WhatsApp Handoff & Customer Communication
// Uses verified restaurant phone line: 7451800502
// IMPORTANT: WhatsApp communication NEVER constitutes order acceptance.
// Orders are independently persisted and managed in the database.

import { Order, Booking } from './types';
import { formatINR } from './pricing';

export const RESTAURANT_PHONE = '7451800502';
export const RESTAURANT_WHATSAPP = '917451800502'; // Country code +91 for India

/**
 * Returns direct tel: link for click-to-call action.
 */
export function getClickToCallUrl(phoneNumber?: string): string {
  const target = phoneNumber ? phoneNumber.replace(/\D/g, '') : RESTAURANT_PHONE;
  return `tel:${target}`;
}

/**
 * Generates an authorized, clean, URL-encoded WhatsApp message for sharing an order summary.
 */
export function generateWhatsAppOrderUrl(order: Order): string {
  const branchName =
    order.branch === 'gla_university'
      ? 'GLA University Campus Branch'
      : 'Pali Khera (Main Outlet)';

  const lines: string[] = [
    `🍕 *PIZZA HARRISON MATHURA - ORDER UPDATE*`,
    `----------------------------------------`,
    `*Order Reference:* ${order.order_number}`,
    `*Customer:* ${order.customer_name}`,
    `*Outlet:* ${branchName}`,
    `*Fulfillment:* ${order.order_type === 'delivery' ? '🛵 Home/Hostel Delivery' : '🛍️ Counter Takeaway / Pickup'}`,
    ``,
    `*Order Items:*`,
  ];

  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      let itemLine = `${index + 1}. *${item.product_name}* x${item.quantity}`;
      if (item.variant_name) itemLine += ` (${item.variant_name})`;
      if (item.crust_name && item.crust_name !== 'New Hand Tossed') itemLine += ` [Crust: ${item.crust_name}]`;
      lines.push(itemLine);

      if (item.addons_json && item.addons_json.length > 0) {
        const addonsStr = item.addons_json.map((a) => a.name).join(', ');
        lines.push(`   └ Extras: ${addonsStr}`);
      }
    });
  }

  lines.push(``);
  lines.push(`*Total Amount:* ${formatINR(order.total_paise)}`);
  lines.push(`*Payment Mode:* ${order.payment_method.toUpperCase()} (${order.payment_status.toUpperCase()})`);

  if (order.order_type === 'delivery' && order.delivery_address) {
    lines.push(`*Deliver To:* ${order.delivery_address}`);
    if (order.delivery_landmark) lines.push(`*Landmark:* ${order.delivery_landmark}`);
  }

  if (order.notes) {
    lines.push(`*Special Instructions:* ${order.notes}`);
  }

  lines.push(``);
  lines.push(`_Note: This message is a customer receipt summary. Order acceptance & kitchen status are officially managed in the Pizza Harrison system._`);

  const fullText = lines.join('\n');
  return `https://wa.me/${RESTAURANT_WHATSAPP}?text=${encodeURIComponent(fullText)}`;
}

/**
 * Generates WhatsApp reservation inquiry link.
 */
export function generateWhatsAppBookingUrl(booking: Booking): string {
  const branchName =
    booking.branch === 'gla_university'
      ? 'GLA University Campus Branch'
      : 'Pali Khera (Main Outlet)';

  const text = [
    `🪑 *TABLE RESERVATION INQUIRY - PIZZA HARRISON*`,
    `----------------------------------------`,
    `*Booking Ref:* ${booking.booking_reference}`,
    `*Guest Name:* ${booking.customer_name}`,
    `*Guests:* ${booking.guest_count} Persons`,
    `*Date & Time:* ${booking.booking_date} at ${booking.booking_time}`,
    `*Branch:* ${branchName}`,
    `*Seating:* ${booking.seating_preference}`,
    booking.special_requests ? `*Occasion/Note:* ${booking.special_requests}` : '',
    ``,
    `Hi Pizza Harrison Team! I have submitted a table booking request online. Please confirm availability at your earliest convenience.`,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${RESTAURANT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
