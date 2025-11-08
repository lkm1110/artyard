# 🏪 ArtYard Marketplace Model

## Overview

ArtYard operates as a **marketplace platform** connecting artists and buyers. The platform facilitates payments and provides tools for communication, but **shipping/delivery is arranged directly between buyer and seller**.

---

## 💰 Fee Structure

### Platform Fee: 10% (Included in Sale Price)

```
Sale Price: ₩50,000
├─ Platform Fee (10%): -₩5,000
├─ Payment Fee (3.5%): -₩1,750
└─ Seller Receives: ₩43,250 (86.5%)

Buyer Pays: ₩50,000 (no additional fees)
```

**Key Points:**
- ✅ Platform fee is **included** in the artwork's listed price
- ✅ Buyer sees final price upfront (no surprises)
- ✅ Seller knows exactly what they'll receive
- ✅ No separate shipping fees charged by platform

---

## 📦 Shipping & Delivery

### Direct Arrangement Model

```
┌─────────────────────────────────────────────────┐
│ Platform Role: Payment & Communication Only     │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. Buyer purchases artwork                      │
│    └─ Payment held in escrow (7 days)          │
│                                                 │
│ 2. Buyer & Seller communicate via chat          │
│    └─ Discuss shipping method                  │
│    └─ Arrange delivery details                 │
│    └─ Share contact info if needed             │
│                                                 │
│ 3. Seller ships artwork                         │
│    └─ Seller's responsibility                  │
│    └─ Seller chooses shipping method           │
│    └─ Costs handled directly                   │
│                                                 │
│ 4. Buyer confirms receipt                       │
│    └─ Funds released to seller                 │
│    └─ Or auto-confirm after 7 days             │
│                                                 │
│ If issues arise:                                │
│    └─ Open dispute                             │
│    └─ Platform mediates                        │
│    └─ Refund if necessary                      │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Escrow System

### What is Escrow?

**Escrow = Secure "holding account" for safe transactions**

```
Without Escrow (Risky):
Buyer → 💰 → Seller (might not ship!)
    or
Buyer ← 📦 ← Seller ← 💰 (might not pay!)

With Escrow (Safe):
1. Buyer pays
   Buyer → 💰 → [Escrow 🔒]

2. Money held securely
   [Escrow 🔒] (7 days)
   ├─ Seller knows: payment guaranteed
   └─ Buyer knows: already paid

3. Seller ships
   Seller → 📦 → Buyer

4. Buyer confirms
   Buyer: "Received!" ✅

5. Payout!
   [Escrow] → 💰 → Seller
```

### Benefits:
- ✅ Protects both parties
- ✅ Prevents scams
- ✅ Dispute resolution possible
- ✅ Builds trust

---

## ⚖️ Platform Liability

### What Platform IS Responsible For:
- ✅ Secure payment processing (2Checkout)
- ✅ Holding funds in escrow
- ✅ Facilitating buyer-seller communication
- ✅ Dispute mediation and resolution
- ✅ Refunds (when justified)

### What Platform is NOT Responsible For:
- ❌ Shipping arrangements
- ❌ Delivery times
- ❌ Shipping costs
- ❌ Packaging quality
- ❌ Carrier selection
- ❌ Customs fees (international)
- ❌ Delivery failures (carrier issue)

**Terms of Service clearly state:**
> "Shipping is arranged directly between buyer and seller. ArtYard facilitates payment only and is not responsible for delivery. Platform may mediate disputes but final shipping responsibility lies with the seller."

---

## 🌍 International Sales

### Supported Regions:
- 🇰🇷 **South Korea (Full Support)**
  - Physical artwork sales ✅
  - Direct seller-buyer shipping
  
- 🌍 **Global (Future Plans)**
  - Phase 1: Digital downloads
  - Phase 2: Print-on-demand
  - Phase 3: Optional international shipping

---

## 💳 Payment Processing

### 2Checkout Integration

```typescript
Payment Flow:
1. Buyer clicks "Purchase"
2. Platform creates transaction (pending)
3. Redirect to 2Checkout
4. Buyer completes payment
5. 2Checkout returns to app
6. Platform confirms payment (escrow)
7. Seller notified
8. Money held for 7 days
9. Auto-release or buyer confirmation
10. Seller paid
```

**2Checkout Advantages:**
- ✅ Global payment support (200+ countries)
- ✅ Multi-currency (87 currencies)
- ✅ Automatic conversion
- ✅ Local payment methods
- ✅ Tax/VAT handling

---

## 📊 Transaction States

```
pending    → Payment not completed yet
paid       → Payment complete, in escrow
confirmed  → Delivery confirmed, settled to seller
refunded   → Refunded to buyer
disputed   → Issue reported, under review
cancelled  → Cancelled before payment
```

**Note:** No `shipped` or `delivered` states - platform doesn't track shipping.

---

## 🛡️ Dispute Resolution

### Process:

```
1. Buyer/Seller opens dispute
   └─ Provide reason & evidence

2. Platform reviews
   └─ Check chat history
   └─ Review evidence
   └─ Contact both parties

3. Decision
   ├─ Seller fault → Refund buyer
   ├─ Buyer fault → Release to seller
   └─ Shared → Partial refund

4. Resolution
   └─ Funds distributed accordingly
```

### Common Issues:
- Item not received → Check shipping proof
- Item damaged → Check packaging photos
- Not as described → Compare listing
- Buyer changed mind → Seller's discretion

---

## 📱 UI/UX Guidelines

### Checkout Screen

```
┌─────────────────────────────────────┐
│ Purchase Artwork                    │
├─────────────────────────────────────┤
│ [Artwork Preview]                   │
│                                     │
│ Sale Price: ₩50,000                 │
│ (includes 10% platform fee)         │
│                                     │
│ ⚠️ SHIPPING NOTICE                  │
│ Shipping will be arranged directly  │
│ with the artist after payment.      │
│ Please discuss via chat.            │
│                                     │
│ Optional Contact Info:              │
│ Name: [____________________]        │
│ Phone: [____________________]       │
│ Address: [____________________]     │
│                                     │
│ [Proceed to Payment]                │
│                                     │
│ By purchasing, you agree that       │
│ shipping is between you and the     │
│ artist. ArtYard facilitates         │
│ payment only.                       │
└─────────────────────────────────────┘
```

### After Payment Success

```
┌─────────────────────────────────────┐
│ Payment Successful! 🎉              │
├─────────────────────────────────────┤
│ Your payment is held securely       │
│ in escrow until delivery.           │
│                                     │
│ Next Steps:                         │
│                                     │
│ 1️⃣ Chat with artist                 │
│    [Start Chat] →                   │
│    • Discuss shipping method        │
│    • Share delivery address         │
│    • Arrange pickup/delivery        │
│                                     │
│ 2️⃣ Artist ships artwork             │
│                                     │
│ 3️⃣ Confirm receipt                  │
│    When delivered, click:           │
│    [Confirm Receipt]                │
│                                     │
│ 4️⃣ Artist gets paid! 💰             │
│                                     │
│ 💡 Shipping Guide:                  │
│ • Courier: ₩3,000-5,000             │
│ • Express: ₩10,000+                 │
│ • Local pickup: Free                │
└─────────────────────────────────────┘
```

### Seller Dashboard

```
┌─────────────────────────────────────┐
│ New Sale! 🎉                        │
├─────────────────────────────────────┤
│ Artwork: "Spring Day"               │
│ Sale Price: ₩50,000                 │
│ Your Earnings: ₩43,250              │
│                                     │
│ Buyer Info:                         │
│ Name: 김철수                        │
│ Phone: 010-1234-5678                │
│ Address: 서울시 강남구...           │
│                                     │
│ [Chat with Buyer]                   │
│                                     │
│ ⚠️ Next Steps:                       │
│ 1. Contact buyer to arrange         │
│    shipping/delivery                │
│ 2. Pack and ship artwork            │
│ 3. Buyer confirms receipt           │
│ 4. You get paid!                    │
│                                     │
│ Payment Status: In Escrow 🔒        │
│ (Released after buyer confirms)     │
└─────────────────────────────────────┘
```

---

## 🚀 Implementation Checklist

### Completed ✅
- [x] Remove shipping fee calculation
- [x] Update fee structure (10% included)
- [x] Simplify transaction types
- [x] Remove shipping address requirements
- [x] Update transaction service
- [x] Change payment method to 2Checkout

### To Do 📝
- [ ] Update CheckoutScreen UI
- [ ] Add shipping disclaimer notices
- [ ] Emphasize chat for coordination
- [ ] Update Terms of Service
- [ ] Add liability disclaimers
- [ ] Update order/sales screens
- [ ] Add escrow explanation UI
- [ ] Test 2Checkout integration
- [ ] Update documentation

---

## 📄 Legal Disclaimers (To Add)

### Terms of Service Section:

```
SHIPPING AND DELIVERY

1. Platform Role
   ArtYard acts solely as a marketplace platform 
   connecting buyers and sellers. We facilitate 
   payment processing but do not handle shipping 
   or delivery.

2. Seller Responsibility
   Sellers are solely responsible for:
   - Packaging artwork appropriately
   - Selecting shipping method and carrier
   - Paying shipping costs
   - Providing tracking information
   - Ensuring timely delivery
   - Insurance (if applicable)

3. Buyer-Seller Agreement
   Shipping arrangements are made directly between 
   buyer and seller via the platform's messaging 
   system.

4. Platform Limitations
   ArtYard is not liable for:
   - Delayed deliveries
   - Lost or damaged items in transit
   - Carrier errors or failures
   - Customs fees or import duties
   - Incorrect shipping addresses provided by buyer
   - Packaging quality issues

5. Dispute Resolution
   In case of shipping disputes, ArtYard may mediate 
   but the primary responsibility lies with the seller. 
   Refunds may be issued at platform's discretion based 
   on evidence provided by both parties.

6. Escrow Protection
   Payments are held in escrow for 7 days after payment. 
   Funds are released to seller only after:
   - Buyer confirms receipt, OR
   - 7 days pass without dispute

7. International Sales
   For international transactions, buyers are responsible 
   for all customs duties, taxes, and import fees. Sellers 
   must clearly communicate these potential costs.
```

---

## 💡 Best Practices

### For Sellers:
- ✅ Respond quickly to buyer inquiries
- ✅ Provide accurate shipping estimates
- ✅ Pack artworks securely
- ✅ Use trackable shipping when possible
- ✅ Communicate shipping updates
- ✅ Take photos before packing (proof)

### For Buyers:
- ✅ Provide accurate contact information
- ✅ Communicate preferred delivery method
- ✅ Confirm receipt promptly when delivered
- ✅ Open disputes quickly if issues arise
- ✅ Take photos if item damaged (evidence)

### For Platform:
- ✅ Clear communication about shipping model
- ✅ Easy access to chat system
- ✅ Escrow period clearly displayed
- ✅ Dispute process well-documented
- ✅ Terms of Service easily accessible
- ✅ Regular reminders about responsibilities

---

## Summary

✅ **Simple, Clear, Safe**
- Platform handles payments (escrow)
- Sellers handle shipping
- Chat facilitates coordination
- Disputes can be mediated
- Everyone knows their responsibilities

🎯 **Benefits:**
- Lower platform liability
- Flexible shipping options
- Faster implementation
- Scalable globally
- Clear fee structure

🚀 **Ready for Launch!**


