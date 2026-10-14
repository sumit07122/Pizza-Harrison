# Pizza Harrison - Comprehensive Test Plan

## 1. Testing Strategy Overview

This test plan defines validation procedures across unit, integration, and end-to-end dimensions to guarantee production stability, pricing accuracy, security isolation, and reliable kitchen operations.

---

## 2. Unit Testing Matrix

### 2.1 Pricing & Calculation Engine (`lib/pricing/engine.test.ts`)

| Test Case ID | Test Description | Input Data | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-PRICE-01` | Single item calculation | Margherita Regular (₹199), Hand Tossed (₹0), Qty 1 | Subtotal = 19900 paise (₹199.00) |
| `TC-PRICE-02` | Item with crust & multiple add-ons | Veggie Lover Medium (₹349), Cheese Burst (+₹99), Extra Cheese (+₹49), Olives (+₹35), Qty 2 | Unit = ₹532; Total = 106400 paise (₹1064.00) |
| `TC-PRICE-03` | Percentage coupon with cap | Subtotal ₹800, Coupon 20% off, Cap ₹100 | Raw = ₹160; Discount = 10000 paise (₹100.00) |
| `TC-PRICE-04` | Flat discount coupon with min order | Subtotal ₹450, Coupon `GLA100` (Min ₹499) | Throws `ValidationError: Minimum order amount not met` |
| `TC-PRICE-05` | Free delivery threshold | Subtotal ₹550 (Threshold ₹499) | Delivery Fee = 0 paise |
| `TC-PRICE-06` | Below delivery threshold | Subtotal ₹350 (Threshold ₹499) | Delivery Fee = 4000 paise (₹40.00) |
| `TC-PRICE-07` | GST 5% rounding | Taxable Subtotal ₹475.00 | Tax = 2375 paise (₹23.75) |

---

## 3. Integration Testing Matrix

### 3.1 Order API (`/api/orders`)

| Test Case ID | Scenario | Verification |
| :--- | :--- | :--- |
| `TC-API-ORD-01` | Valid checkout submission | Server recomputes totals, inserts into `orders`, `order_items`, returns 201 with `PH-YYYYMMDD-XXXX`. |
| `TC-API-ORD-02` | Client price tampering attempt | Client submits `total_paise: 100`. Server ignores client total, calculates actual total, saves accurate amount. |
| `TC-API-ORD-03` | Invalid coupon code | Client submits non-existent code `FAKE50`. Server returns 400 with descriptive error message. |
| `TC-API-ORD-04` | Out of stock product | Client submits item marked `is_available = false`. Server rejects order with 409 Conflict. |

### 3.2 Table Reservation API (`/api/bookings`)

| Test Case ID | Scenario | Verification |
| :--- | :--- | :--- |
| `TC-API-BK-01` | Valid reservation submission | Record created with status `requested`, reference `TB-YYYYMMDD-XXXX`, guest count validated. |
| `TC-API-BK-02` | Excessive party size (>50) | Returns 400 with error requiring phone consultation. |

---

## 4. End-to-End User Journey Tests

### 4.1 Customer Food Ordering Flow
1. Navigate to `/menu`.
2. Filter by "Pizzas" -> Select "Paneer Makhani Pizza".
3. In Customizer modal: Choose "Medium 9"", "Cheese Burst", add "Extra Jalapenos".
4. Add to cart -> Verify cart drawer opens with exact item price.
5. Proceed to `/checkout`.
6. Enter customer name, Mathura phone number, address near GLA University.
7. Enter coupon `GLA100` -> Verify instant deduction of ₹100.
8. Select "Cash on Delivery" -> Click "Place Order".
9. Redirects to `/order-tracking/[code]`. Verify real-time status indicates "Order Received".

### 4.2 Kitchen Order Management Flow
1. Log in at `/admin/login` using staff credentials.
2. Navigate to `/admin/orders`.
3. Verify newly placed order appears under "New Orders" column.
4. Click "Accept & Send to Kitchen" -> Status updates to `confirmed`.
5. Click "Start Baking" -> Status updates to `preparing`.
6. Switch back to customer tracking window -> Status automatically advances to `preparing`.
7. Dispatch rider -> Status advances to `out_for_delivery`.
8. Complete order -> Status advances to `completed`.

### 4.3 Table Reservation Flow
1. Customer visits `/book-table`.
2. Selects "Pali Khera Outlet", party of 4, tomorrow at 7:30 PM.
3. Submits booking -> Receives reference token.
4. Staff views `/admin/bookings`, sees request with guest details, clicks "Confirm Booking".
5. Status changes to `confirmed`.

---

## 5. Security & Permission Tests

| Test Case ID | Test Target | Verification |
| :--- | :--- | :--- |
| `TC-SEC-01` | Unauthorized admin access | Direct HTTP GET `/admin/settings` without auth cookie redirects to `/admin/login`. |
| `TC-SEC-02` | Role escalation prevention | Staff account attempting to access `/admin/audit-logs` receives 403 Forbidden. |
| `TC-SEC-03` | RLS isolation | Anonymous request attempting `SELECT * FROM orders` without specific tracking number returns zero rows. |
| `TC-SEC-04` | Secret protection | Verify client-side bundles contain zero instances of `SUPABASE_SERVICE_ROLE_KEY`. |
