# 🔐 2Checkout Integration Guide for ArtYard

## 📋 Overview

ArtYard uses **2Checkout** (now Verifone) as the payment gateway for global transactions. This guide covers the complete integration process.

---

## 🎯 Key Features

- ✅ **Global Payment Support**: Accept payments worldwide in USD
- ✅ **Secure Escrow**: Funds held for 7 days for buyer protection
- ✅ **Multiple Payment Methods**: Credit cards, PayPal, etc.
- ✅ **Automatic Currency Conversion**: 2Checkout handles currency conversion
- ✅ **Seller Protection**: Escrow system protects both parties

---

## ✅ **Your 2Checkout Credentials**

**Already configured! Here are your credentials:**

```
Merchant Code: 255745102572
Secret Key: _~xp(*6XV4mU!PcJMld0
Publishable Key: 7C1C2F71-1F96-413B-8A97-D25A8F3D4454
Private Key: 4EF7362F-0A0A-4F61-823A-58CF1A9D70F0
Product ID: 52070072
```

---

## 🚀 Setup Steps

### 1️⃣ **Configure Environment Variables** ⚠️ **DO THIS FIRST!**

Create a `.env` file in your project root (`C:\project\canvaspop\.env`):

```bash
# =====================================
# 2CHECKOUT 설정
# =====================================
EXPO_PUBLIC_2CHECKOUT_ACCOUNT=255745102572
EXPO_PUBLIC_2CHECKOUT_SECRET_KEY=_~xp(*6XV4mU!PcJMld0
EXPO_PUBLIC_2CHECKOUT_PUBLISHABLE_KEY=7C1C2F71-1F96-413B-8A97-D25A8F3D4454
EXPO_PUBLIC_2CHECKOUT_PRIVATE_KEY=4EF7362F-0A0A-4F61-823A-58CF1A9D70F0
EXPO_PUBLIC_2CHECKOUT_PRODUCT_ID=52070072

# =====================================
# SUPABASE 설정
# =====================================
EXPO_PUBLIC_SUPABASE_URL=https://bkvycanciimgyftdtqpx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdnljYW5jaWltZ3lmdGR0cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MjcxMjUsImV4cCI6MjA1MDEwMzEyNX0.OXlpgEqVUo-1L0khEZE3-uy0d3K5KmJi55FlNVGTWis

# =====================================
# KAKAO 설정
# =====================================
EXPO_PUBLIC_KAKAO_APP_KEY=4d49bb1ab7c3308b68b8d4eb0e05ced3
```

**⚠️ IMPORTANT: Restart Expo after creating .env file!**
```bash
# Stop Expo (Ctrl+C)
npm start
```

### 2️⃣ **Configure Return URLs in 2Checkout Dashboard**

Login to your 2Checkout dashboard and set these URLs:

```
Path: Setup → Ordering Options → Return URLs

Success URL: artyard://payment-success
Cancel URL: artyard://payment-cancel
Decline URL: artyard://payment-decline
```

### 3️⃣ **Enable Payment Methods**

In 2Checkout Dashboard:

```
Path: Setup → Payment Methods

Enable:
✅ Credit Cards (Visa, Mastercard, Amex)
✅ PayPal (optional but recommended)
```

### 4️⃣ **Verify Test Mode**

```
Path: Setup → General Settings

✅ Test Mode: ON (for testing)
❌ Production Mode: OFF (enable after testing)
```

---

## 💻 Implementation

### 📱 **Client-Side Integration**

Our current implementation in `src/services/paymentService.ts`:

```typescript
export const create2CheckoutPayment = async (
  request: CreatePaymentRequest
): Promise<CreatePaymentResponse> => {
  try {
    // 1. Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Login required');
    }

    // 2. Get artwork details
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('id, title, price, author_id, sale_status, artist_name, author:profiles(handle)')
      .eq('id', request.artwork_id)
      .single();

    if (artworkError || !artwork) {
      throw new Error('Artwork not found');
    }

    // 3. Validate sale status
    if (artwork.sale_status !== 'available') {
      throw new Error('This artwork is not available for sale');
    }

    // 4. Calculate fees (platform covers payment gateway fees)
    const salePrice = parseInt(artwork.price.replace(/\D/g, ''));
    const fees = calculateFees(salePrice);

    // 5. Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        artwork_id: artwork.id,
        buyer_id: user.id,
        seller_id: artwork.author_id,
        amount: salePrice,
        platform_fee: fees.platform_fee,
        payment_fee: fees.payment_fee,
        seller_amount: fees.seller_amount,
        payment_method: '2checkout',
        status: 'pending',
        buyer_name: request.contact_name,
        buyer_phone: request.contact_phone,
        buyer_address: request.contact_address,
        delivery_notes: request.delivery_notes,
      })
      .select()
      .single();

    if (transactionError || !transaction) {
      throw new Error('Failed to create transaction');
    }

    // 6. Generate 2Checkout payment URL
    const merchantCode = process.env.EXPO_PUBLIC_2CHECKOUT_ACCOUNT || 'YOUR_MERCHANT_CODE';
    const returnUrl = `artyard://payment-success?transactionId=${transaction.id}`;
    const cancelUrl = `artyard://payment-cancel?transactionId=${transaction.id}`;

    // 7. Create payment link (redirects to 2Checkout hosted page)
    const paymentUrl = `https://secure.2checkout.com/checkout/buy?` +
      `merchant=${merchantCode}` +
      `&ttype=12` +  // 12 = Single Product Sale
      `&prod=${encodeURIComponent(artwork.title)}` +
      `&price=${salePrice}` +
      `&qty=1` +
      `&currency=USD` +
      `&return-url=${encodeURIComponent(returnUrl)}` +
      `&cancel-url=${encodeURIComponent(cancelUrl)}` +
      `&order-ext-ref=${transaction.id}` +  // Our transaction ID
      `&test=${process.env.EXPO_PUBLIC_2CHECKOUT_SANDBOX === 'true' ? '1' : '0'}`;

    return {
      payment_url: paymentUrl,
      transaction_id: transaction.id,
      amount: salePrice,
      platform_fee: fees.platform_fee,
      payment_fee: fees.payment_fee,
      seller_amount: fees.seller_amount,
      platform_net: fees.platform_net,
    };

  } catch (error: any) {
    console.error('❌ 2Checkout payment creation error:', error);
    throw error;
  }
};
```

### 🔄 **Webhook Handler (Backend Required)**

You'll need to create a Supabase Edge Function or separate backend endpoint:

```typescript
// supabase/functions/2checkout-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 1. Verify webhook signature
    const signature = req.headers.get('x-2checkout-signature');
    const body = await req.text();
    
    // Verify signature using your secret key
    if (!verifySignature(body, signature)) {
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(body);
    const { event, order } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 2. Handle different webhook events
    switch (event) {
      case 'ORDER_CREATED':
        // Payment successful
        await supabase
          .from('transactions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_intent_id: order.reference,
            auto_confirm_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          })
          .eq('id', order.order_ext_ref);

        // Update artwork status
        await supabase
          .from('artworks')
          .update({ sale_status: 'sold' })
          .eq('id', order.product_id);

        // Notify seller
        await supabase.from('notifications').insert({
          user_id: order.seller_id,
          type: 'new_sale',
          title: 'New Order! 🎉',
          message: `Your artwork has been sold for $${order.amount}!`,
        });
        break;

      case 'REFUND_ISSUED':
        // Handle refund
        await supabase
          .from('transactions')
          .update({ status: 'refunded' })
          .eq('payment_intent_id', order.reference);
        break;
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
});
```

---

## 🧪 Testing

### Test Card Information

Use these test cards in your 2Checkout test environment:

**Success Card:**
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25 (any future date)
Name: Test User
Address: Any address
```

**Other Test Cards:**
| Card Number | Result |
|-------------|--------|
| `4111111111111111` | Success |
| `4000000000000002` | Decline |
| `4000000000000069` | Expired Card |

### Test Flow

1. Upload artwork
2. Set price (e.g., $100)
3. Click "Purchase"
4. Fill checkout form
5. Click "Proceed to Payment"
6. Redirected to 2Checkout page
7. Use test card `4111111111111111`
8. Complete payment
9. Redirected back to app
10. Verify transaction status

---

## 🔒 Security Best Practices

### ✅ Do's

- ✅ **Always verify webhooks** - Check signature before processing
- ✅ **Use HTTPS** - All webhook URLs must use HTTPS
- ✅ **Store credentials securely** - Use environment variables, never commit to Git
- ✅ **Validate amounts** - Always recalculate on server-side
- ✅ **Implement idempotency** - Handle duplicate webhook events

### ❌ Don'ts

- ❌ **Never expose secret keys** in client-side code
- ❌ **Don't trust client amounts** - Always verify server-side
- ❌ **Don't skip webhook verification** - Attackers can fake requests
- ❌ **Don't use GET for webhooks** - Always use POST

---

## 💰 Fee Structure

```
Sale Price: $100
├─ Platform Fee (10%): $10 (included in price)
├─ Payment Fee (3.5%): $3.50 (platform covers this)
└─ Seller Receives: $90 (exactly 90%)

Platform Net Earnings: $10 - $3.50 = $6.50
```

---

## 🌍 Currency Support

2Checkout supports 100+ currencies, but ArtYard uses **USD** as the base:

```typescript
currency: 'USD'  // All prices displayed in dollars
```

**Why USD?**
- ✅ Global standard for art marketplaces
- ✅ No confusion about exchange rates
- ✅ 2Checkout handles buyer's local currency conversion
- ✅ Simpler for international transactions

---

## 📞 Support & Troubleshooting

### Common Issues

**1. Payment URL not redirecting**
- Check merchant code is correct
- Verify return URLs are properly encoded
- Ensure test mode is set correctly

**2. Webhook not receiving events**
- Verify webhook URL is accessible (use ngrok for local testing)
- Check webhook signature verification
- Ensure HTTPS is used (2Checkout requires it)

**3. Transaction not updating**
- Check Supabase RLS policies
- Verify webhook handler is deployed
- Check Supabase Edge Function logs

### Get Help

- **2Checkout Support**: https://support.2checkout.com/
- **2Checkout Docs**: https://developers.2checkout.com/
- **Community Forum**: https://community.2checkout.com/

---

## 🚀 Production Checklist

Before going live:

- [ ] `.env` file created with all credentials
- [ ] Return URLs configured in 2Checkout Dashboard
- [ ] Payment methods enabled (Credit Cards, PayPal)
- [ ] Test payment successful with test card
- [ ] Disable Test Mode (enable Production Mode)
- [ ] Test real payment with small amount ($1)
- [ ] Verify transaction appears in Dashboard
- [ ] Test refund flow
- [ ] Enable 2FA on 2Checkout account
- [ ] Set up monitoring/alerts for failed payments
- [ ] Review 2Checkout's production requirements
- [ ] Set up automatic payout schedule

---

## 📊 Monitoring

Track these metrics:

- **Payment Success Rate**: % of successful transactions
- **Average Transaction Value**: Mean sale price
- **Refund Rate**: % of transactions refunded
- **Webhook Failure Rate**: Failed webhook processing

Use 2Checkout Dashboard and Supabase Analytics for monitoring.

---

## 🔄 Next Steps

1. **Deploy webhook handler** to Supabase Edge Functions
2. **Test payment flow** end-to-end in sandbox
3. **Set up monitoring** for production
4. **Review 2Checkout's terms** and compliance requirements
5. **Plan for scale** - consider rate limits and volume

---

**Need Help?** Contact 2Checkout support or check their comprehensive documentation at https://developers.2checkout.com/

Good luck with your integration! 🚀

