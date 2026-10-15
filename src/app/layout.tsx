import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/store/cart-context';
import { CustomerAuthProvider } from '@/lib/store/customer-auth-context';
import { CartDrawer } from '@/components/storefront/CartDrawer';
import { MobileBottomBar } from '@/components/storefront/MobileBottomBar';

export const metadata: Metadata = {
  title: 'Pizza Harrison Mathura | Artisan Pizzas, Combos & Fast Delivery',
  description:
    'Order fresh hand-tossed artisan pizzas, stuffed garlic breads, burgers, and thick shakes from Pizza Harrison in Mathura. Fast 30-min delivery to Pali Khera, GLA University campus, and Mathura city.',
  keywords: [
    'Pizza Harrison',
    'Pizza Harrison Mathura',
    'Pizza delivery Mathura',
    'GLA University food delivery',
    'Pali Khera pizza',
    'Best pizza in Mathura',
    'Pure veg pizza Mathura',
  ],
  authors: [{ name: 'Pizza Harrison' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#123D2B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-warm-cream text-charcoal pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <CustomerAuthProvider>
          <CartProvider>
            {children}
            <CartDrawer />
            <MobileBottomBar />
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
