/**
 * 거래 시스템 타입 정의
 * Note: Shipping is arranged directly between buyer and seller
 */

// ============================================
// Contact Info (for buyer-seller communication)
// ============================================
export interface ContactInfo {
  id: string;
  user_id: string;
  
  // Basic info
  recipient_name: string;
  phone: string;
  
  // Address (optional, for reference only)
  postal_code?: string;
  address?: string;
  address_detail?: string;
  country?: string;
  
  // Notes
  delivery_memo?: string;
  
  // Settings
  is_default: boolean;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Transaction Status
// ============================================
export type TransactionStatus = 
  | 'pending'      // Payment pending
  | 'paid'         // Payment complete (in escrow)
  | 'confirmed'    // Delivery confirmed (settled to seller)
  | 'refunded'     // Refunded
  | 'disputed'     // In dispute
  | 'cancelled';   // Cancelled
  
// Note: No shipping/delivery status - handled by buyer and seller directly

// ============================================
// Transaction
// ============================================
export interface Transaction {
  id: string;
  
  // Related info
  artwork_id: string;
  buyer_id: string;
  seller_id: string;
  
  // Amount (includes 10% platform fee)
  amount: number;              // Full sale price (buyer pays this)
  platform_fee: number;        // Platform fee (10% of amount)
  seller_amount: number;       // Seller receives (amount - platform_fee - payment_fee)
  payment_method: string;      // '2checkout', etc.
  payment_fee: number;         // Payment gateway fee (e.g., 2Checkout 3.5%)
  
  // Payment gateway IDs
  payment_intent_id?: string;  // 2Checkout order reference
  charge_id?: string;
  transfer_id?: string;
  
  // Status
  status: TransactionStatus;
  
  // Contact info (optional, for reference only)
  buyer_name?: string;
  buyer_phone?: string;
  buyer_address?: string;
  delivery_notes?: string;     // Buyer's notes for seller
  
  // Timestamps
  paid_at?: string;
  confirmed_at?: string;
  auto_confirm_at?: string;    // Auto-confirm after 7 days
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  artwork?: any;
  buyer?: any;
  seller?: any;
}

// ============================================
// 거래 이력
// ============================================
export interface TransactionHistory {
  id: string;
  transaction_id: string;
  old_status?: TransactionStatus;
  new_status: TransactionStatus;
  changed_by?: string;
  note?: string;
  created_at: string;
}

// ============================================
// 정산
// ============================================
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Payout {
  id: string;
  seller_id: string;
  transaction_id: string;
  amount: number;
  stripe_transfer_id?: string;
  stripe_payout_id?: string;
  status: PayoutStatus;
  completed_at?: string;
  created_at: string;
}

// ============================================
// 리뷰
// ============================================
export interface TransactionReview {
  id: string;
  transaction_id: string;
  reviewer_id: string;
  reviewee_id: string;
  role: 'buyer' | 'seller';
  
  // 평점
  rating: 1 | 2 | 3 | 4 | 5;
  communication_rating?: number;
  accuracy_rating?: number;
  shipping_rating?: number;
  payment_rating?: number;
  
  // 내용
  comment?: string;
  images?: string[];
  
  created_at: string;
  updated_at: string;
  
  // 조인 데이터
  reviewer?: any;
  reviewee?: any;
  transaction?: Transaction;
}

// ============================================
// Payment Request Data
// ============================================
export interface CreatePaymentRequest {
  artwork_id: string;
  // Optional contact info for seller reference
  contact_name?: string;
  contact_phone?: string;
  contact_address?: string;
  delivery_notes?: string;
}

// ============================================
// Fee Calculation
// Note: Platform fee is INCLUDED in the sale price
// Payment gateway fees are covered by the platform
// ============================================
export interface FeeCalculation {
  sale_price: number;          // Total sale price (buyer pays)
  platform_fee_rate: number;   // Fee rate (0.10 = 10%)
  platform_fee: number;        // Platform fee (10% of sale price)
  payment_fee_rate: number;    // 2Checkout fee rate (0.035 = 3.5%)
  payment_fee: number;         // Payment gateway fee (platform covers this)
  seller_amount: number;       // Amount seller receives (90% of sale price)
  platform_net: number;        // Platform's net earnings (after payment fees)
}

/**
 * Calculate fees for a transaction
 * Platform covers payment gateway fees, seller receives exactly 90%
 * @param salePrice - Total sale price (includes platform fee)
 * @param platformFeeRate - Platform fee rate (default 0.10 = 10%)
 * @param paymentFeeRate - Payment gateway fee rate (default 0.035 = 3.5% for 2Checkout)
 */
export function calculateFees(
  salePrice: number, 
  platformFeeRate: number = 0.10,
  paymentFeeRate: number = 0.035
): FeeCalculation {
  const platform_fee = Math.round(salePrice * platformFeeRate);
  const seller_amount = salePrice - platform_fee;  // Seller gets exactly 90%
  const payment_fee = Math.round(salePrice * paymentFeeRate);  // Platform pays this
  const platform_net = platform_fee - payment_fee;  // Platform's actual earnings
  
  return {
    sale_price: salePrice,
    platform_fee_rate: platformFeeRate,
    platform_fee,
    payment_fee_rate: paymentFeeRate,
    payment_fee,
    seller_amount,
    platform_net,
  };
}

// ============================================
// Usage Example
// ============================================
/*
const fees = calculateFees(50000); // Sale price: ₩50,000

console.log(`
Sale Price: ₩${fees.sale_price.toLocaleString()}
Platform Fee (10%): -₩${fees.platform_fee.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Seller Receives: ₩${fees.seller_amount.toLocaleString()} (90%)

Platform Breakdown:
  Collected: ₩${fees.platform_fee.toLocaleString()}
  Payment Fee: -₩${fees.payment_fee.toLocaleString()}
  Net Earnings: ₩${fees.platform_net.toLocaleString()} (6.5%)
`);

// Output:
// Sale Price: ₩50,000
// Platform Fee (10%): -₩5,000
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// Seller Receives: ₩45,000 (90%) ✅
//
// Platform Breakdown:
//   Collected: ₩5,000
//   Payment Fee: -₩1,750
//   Net Earnings: ₩3,250 (6.5%)

// Note: Buyer pays ₩50,000 (no additional fees)
// Seller gets exactly 90%
// Platform covers payment gateway fees
*/

