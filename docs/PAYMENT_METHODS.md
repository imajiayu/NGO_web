# Payment Methods Configuration Guide

This guide explains how to configure and customize payment methods for your NGO donation platform using Stripe.

## Current Configuration

The platform is currently configured with **Global Payment Methods** (recommended for international NGOs):

✅ **Active Payment Methods:**
- 💳 Credit/Debit Cards (Visa, Mastercard, Amex, Discover, etc.)
- 🍎 Apple Pay (automatically shown on supported devices)
- 🤖 Google Pay (automatically shown on supported browsers)
- 🔗 Link (Stripe's one-click payment solution)

## How It Works

### 1. Payment Intent Configuration
Location: `app/actions/donation.ts`

```typescript
automatic_payment_methods: {
  enabled: true,
  allow_redirects: 'never',
}
```

- `enabled: true` - Automatically enables all compatible payment methods
- `allow_redirects: 'never'` - Only allows direct payment methods (no redirects to external pages)

### 2. Payment Element UI
Location: `app/[locale]/donate/payment-form.tsx`

```typescript
<PaymentElement
  options={{
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
    fields: {
      billingDetails: {
        email: 'never', // Already collected in donation form
      }
    },
    terms: {
      card: 'never', // Clean UI without redundant terms
    }
  }}
/>
```

## Customization Options

### Option 1: Card Payments Only (Simplest)

**Use Case:** You want the simplest setup with traditional card payments only.

**Changes needed in `app/actions/donation.ts`:**
```typescript
// Replace automatic_payment_methods with:
payment_method_types: ['card'],
```

**Pros:**
- Simplest and most universal
- No additional setup required
- Lowest processing complexity

**Cons:**
- Misses mobile wallet users (Apple Pay, Google Pay)
- Lower conversion rates on mobile devices

---

### Option 2: Global Methods (Current - Recommended)

**Use Case:** International NGO accepting donations from worldwide donors.

**Already configured!** No changes needed.

**Pros:**
- Best conversion rates globally
- Optimized for mobile and desktop
- No redirects (smooth user experience)
- Standard Stripe processing fees

**Cons:**
- None for international use cases

---

### Option 3: Add Chinese Payment Methods

**Use Case:** You want to accept donations from Chinese donors using Alipay and WeChat Pay.

**Changes needed in `app/actions/donation.ts`:**
```typescript
automatic_payment_methods: {
  enabled: true,
  allow_redirects: 'always', // ⚠️ Changed from 'never'
},
```

**Additional Stripe Dashboard Setup:**
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Settings** → **Payment methods**
3. Enable **Alipay** and **WeChat Pay**
4. Complete verification (may require business documents)

**Changes in `payment-form.tsx`:**
```typescript
paymentMethodOrder: ['card', 'alipay', 'wechat_pay', 'apple_pay', 'google_pay'],
```

**Pros:**
- Access to Chinese donor market
- Popular payment methods in Asia

**Cons:**
- Requires redirects (leaves your website temporarily)
- Additional setup and verification required
- Higher processing fees (~3.5%)
- Longer settlement times

---

### Option 4: Add European Local Methods

**Use Case:** You want to offer local payment methods popular in Europe.

**Changes needed in `app/actions/donation.ts`:**
```typescript
automatic_payment_methods: {
  enabled: true,
  allow_redirects: 'always', // Some EU methods need redirects
},
```

**Additional Stripe Dashboard Setup:**
1. Go to **Settings** → **Payment methods**
2. Enable desired methods:
   - **SEPA Direct Debit** (Europe-wide bank transfers)
   - **iDEAL** (Netherlands)
   - **Bancontact** (Belgium)
   - **Giropay** (Germany)
   - **EPS** (Austria)
   - **Przelewy24** (Poland)

**Changes in `payment-form.tsx`:**
```typescript
paymentMethodOrder: [
  'card',
  'apple_pay',
  'google_pay',
  'sepa_debit',
  'ideal',
  'bancontact'
],
```

**Pros:**
- Lower fees for European payments
- Popular local methods increase trust
- Better conversion in Europe

**Cons:**
- More complex setup
- Some methods require redirects
- Different settlement times per method

---

### Option 5: Custom Payment Method List

**Use Case:** You want full control over exactly which methods to show.

**Changes needed in `app/actions/donation.ts`:**
```typescript
// Replace automatic_payment_methods with:
payment_method_types: [
  'card',
  'apple_pay',
  'google_pay',
  'link',
  // Add any others from list below
],
```

**Available payment_method_types:**
```typescript
// Global
'card', 'link', 'apple_pay', 'google_pay'

// Asia-Pacific
'alipay', 'wechat_pay', 'grabpay', 'paynow', 'promptpay'

// Europe
'sepa_debit', 'ideal', 'bancontact', 'giropay', 'eps',
'przelewy24', 'sofort', 'bacs_debit'

// North America
'affirm', 'afterpay_clearpay', 'cashapp'

// Other
'boleto' (Brazil), 'konbini' (Japan), 'klarna'
```

---

## Testing Payment Methods

### Test Mode
All payment methods can be tested using Stripe's test mode:

1. Use test card numbers:
   - **Success:** 4242 4242 4242 4242
   - **Decline:** 4000 0000 0000 0002
   - **3D Secure:** 4000 0027 6000 3184

2. Test digital wallets:
   - Apple Pay/Google Pay work in test mode on real devices
   - Use test cards in your wallet

3. View test: [Stripe Test Cards](https://stripe.com/docs/testing)

### Going Live
1. Complete your [Stripe account activation](https://dashboard.stripe.com/account/onboarding)
2. Switch environment variables from test to live keys
3. Enable desired payment methods in live mode
4. Test with small real donations first

---

## Processing Fees

### Standard Stripe Fees (USD):
- **Cards:** 2.9% + $0.30 per transaction
- **Apple Pay / Google Pay:** 2.9% + $0.30 per transaction
- **Link:** 2.9% + $0.30 per transaction

### International/Alternative Methods:
- **Alipay / WeChat Pay:** 3.4% + $0.30
- **SEPA Direct Debit:** 0.8% + $0.30 (capped at €5)
- **iDEAL:** 0.8% + $0.30
- **Most EU methods:** 1.4% + $0.30

**Note:** Fees vary by region. Check [Stripe Pricing](https://stripe.com/pricing) for your location.

---

## Recommendations by Use Case

### For International NGO (Like Yours - Ukraine Relief):
✅ **Recommended:** Current configuration (Global Methods)
- Card + Apple Pay + Google Pay + Link
- Best conversion rates
- Supports donors worldwide
- Standard fees

### For China-Focused Campaigns:
✅ **Recommended:** Option 3 (Add Chinese Methods)
- All global methods + Alipay + WeChat Pay
- Critical for Chinese donor base

### For European NGO:
✅ **Recommended:** Option 4 (Add EU Methods)
- All global methods + SEPA + local methods
- Lower fees for European donors
- Higher trust with local options

### For US-Only Small Charity:
✅ **Recommended:** Option 1 (Card Only)
- Simplest setup
- Most universal in US
- Lowest complexity

---

## Making Changes

### To Change Payment Methods:

1. **Update Server Code:**
   Edit `app/actions/donation.ts` (lines 58-62)

2. **Update UI (Optional):**
   Edit `app/[locale]/donate/payment-form.tsx` (lines 104)

3. **Configure Stripe Dashboard:**
   Enable desired methods at [dashboard.stripe.com/settings/payment_methods](https://dashboard.stripe.com/settings/payment_methods)

4. **Test Changes:**
   ```bash
   npm run dev
   # Test donation flow with test cards
   ```

5. **Deploy:**
   ```bash
   git add .
   git commit -m "Update payment methods configuration"
   git push
   ```

---

## Monitoring Payment Methods

### Stripe Dashboard
View payment method performance:
- Go to [Payments](https://dashboard.stripe.com/payments)
- Filter by payment method type
- Track conversion rates
- Monitor failure rates

### Analytics
Track which methods donors prefer:
- Successful payments by method
- Abandoned payments by method
- Average donation by method

---

## Troubleshooting

### Payment Method Not Showing?

1. **Check Stripe Dashboard:**
   - Is the method enabled in settings?
   - Is your account verified for that method?

2. **Check Browser/Device:**
   - Apple Pay only shows on Apple devices with Safari or compatible browsers
   - Google Pay requires Chrome or compatible browsers
   - Test on different devices

3. **Check Currency:**
   - Some methods only work with specific currencies
   - Your platform uses USD by default

4. **Check Country:**
   - Some methods are region-restricted
   - Alipay/WeChat Pay require Chinese IP or VPN

### Webhook Issues?
If payments succeed but don't appear in database:
- Check webhook endpoint: `/api/webhooks/stripe`
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check Stripe Dashboard → Webhooks → Recent deliveries

---

## Additional Resources

- [Stripe Payment Element Docs](https://stripe.com/docs/payments/payment-element)
- [Stripe Payment Methods Guide](https://stripe.com/docs/payments/payment-methods/overview)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Payment Methods by Country](https://stripe.com/docs/payments/payment-methods/payment-method-support)

---

**Last Updated:** 2025-12-18
**Current Configuration:** Global Payment Methods (Card + Digital Wallets)
