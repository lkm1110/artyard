/**
 * 거래/배송 시스템 타입 정의
 */

// ============================================
// 배송 주소
// ============================================
export interface ShippingAddress {
  id: string;
  user_id: string;
  
  // 기본 정보
  recipient_name: string;
  phone: string;
  
  // 주소
  postal_code: string;
  address: string;
  address_detail?: string;
  
  // 국제 주소
  country: string; // 'KR', 'US', etc.
  state?: string;
  city?: string;
  
  // 배송 메모
  delivery_memo?: string;
  
  // 설정
  is_default: boolean;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// 거래 상태
// ============================================
export type TransactionStatus = 
  | 'pending'      // 결제 대기
  | 'paid'         // 결제 완료 (에스크로)
  | 'preparing'    // 배송 준비 중
  | 'shipped'      // 배송 중
  | 'delivered'    // 배송 완료
  | 'confirmed'    // 구매 확인 (정산 완료)
  | 'refunded'     // 환불됨
  | 'disputed'     // 분쟁 중
  | 'cancelled';   // 취소됨

// ============================================
// 거래
// ============================================
export interface Transaction {
  id: string;
  
  // 관련 정보
  artwork_id: string;
  buyer_id: string;
  seller_id: string;
  
  // 금액
  amount: number;              // 작품 가격
  platform_fee: number;        // 플랫폼 수수료
  seller_amount: number;       // 판매자 수령액
  payment_method: string;      // 'stripe_card', 'toss_transfer'
  
  // Stripe
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  stripe_transfer_id?: string;
  
  // 상태
  status: TransactionStatus;
  
  // 배송 주소 (스냅샷)
  shipping_recipient: string;
  shipping_phone: string;
  shipping_postal_code: string;
  shipping_address: string;
  shipping_address_detail?: string;
  shipping_memo?: string;
  
  // 배송 정보
  tracking_number?: string;
  carrier?: string; // '우체국택배', 'CJ대한통운'
  
  // 타임스탬프
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  confirmed_at?: string;
  auto_confirm_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // 조인 데이터
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
// 결제 요청 데이터
// ============================================
export interface CreatePaymentRequest {
  artwork_id: string;
  shipping_address_id: string; // 기존 주소 사용
  // OR
  shipping_address?: Omit<ShippingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>; // 새 주소
}

// ============================================
// 플랫폼 수수료 계산
// ============================================
export interface FeeCalculation {
  artwork_price: number;      // 작품 가격
  platform_fee_rate: number;  // 수수료율 (0.1 = 10%)
  platform_fee: number;       // 플랫폼 수수료
  seller_amount: number;      // 판매자 수령액
  stripe_fee: number;         // Stripe 수수료 (2.9% + 30¢)
  final_seller_amount: number; // 최종 판매자 수령액
}

export function calculateFees(artworkPrice: number, platformFeeRate: number = 0.10): FeeCalculation {
  const platform_fee = Math.round(artworkPrice * platformFeeRate);
  const seller_amount = artworkPrice - platform_fee;
  
  // Stripe 수수료: 2.9% + 300원
  const stripe_fee = Math.round(artworkPrice * 0.029) + 300;
  const final_seller_amount = seller_amount - stripe_fee;
  
  return {
    artwork_price: artworkPrice,
    platform_fee_rate: platformFeeRate,
    platform_fee,
    seller_amount,
    stripe_fee,
    final_seller_amount
  };
}

// ============================================
// 사용 예시
// ============================================
/*
const fees = calculateFees(50000, 0.05);
console.log(`
작품 가격: ${fees.artwork_price}원
플랫폼 수수료 (5%): ${fees.platform_fee}원
Stripe 수수료: ${fees.stripe_fee}원
━━━━━━━━━━━━━━━━━━━━━━━━━━
판매자 수령액: ${fees.final_seller_amount}원
`);

// 출력:
// 작품 가격: 50,000원
// 플랫폼 수수료 (10%): 5,000원
// Stripe 수수료: 1,750원
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// 판매자 수령액: 43,250원
*/

