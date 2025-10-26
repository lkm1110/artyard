/**
 * ArtYard 완전한 시스템 타입 정의
 * 결제, 배송, 리뷰, Challenge, 대시보드
 */

import { Profile, Artwork } from './index';

// ============================================
// 배송 관련
// ============================================

export interface ShippingAddress {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  postal_code: string;
  address: string;
  address_detail?: string;
  country: string;
  state?: string;
  city?: string;
  delivery_memo?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArtworkShippingSettings {
  id: string;
  artwork_id: string;
  domestic_enabled: boolean;
  domestic_fee: number;
  domestic_free_threshold: number;
  international_enabled: boolean;
  asia_fee: number;
  north_america_fee: number;
  europe_fee: number;
  fragile: boolean;
  requires_signature: boolean;
  insurance_required: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// 거래 관련
// ============================================

export type TransactionStatus = 
  | 'pending'      // 결제 대기
  | 'paid'         // 결제 완료 (에스크로)
  | 'preparing'    // 배송 준비
  | 'shipped'      // 배송 중
  | 'delivered'    // 배송 완료
  | 'confirmed'    // 구매 확인 (정산)
  | 'refunded'     // 환불
  | 'disputed'     // 분쟁
  | 'cancelled';   // 취소

export interface Transaction {
  id: string;
  
  // 기본 정보
  artwork_id: string;
  buyer_id: string;
  seller_id: string;
  
  // 금액
  amount: number;
  shipping_fee: number;
  platform_fee: number;
  seller_amount: number;
  payment_method: string;
  
  // Stripe
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  stripe_transfer_id?: string;
  
  // 상태
  status: TransactionStatus;
  
  // 배송 정보 (스냅샷)
  shipping_recipient: string;
  shipping_phone: string;
  shipping_postal_code: string;
  shipping_address: string;
  shipping_address_detail?: string;
  shipping_country: string;
  shipping_memo?: string;
  
  // 배송 추적
  tracking_number?: string;
  carrier?: string;
  shipping_zone: string;
  
  // 타임스탬프
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  confirmed_at?: string;
  auto_confirm_at?: string;
  refunded_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // 조인 데이터
  artwork?: Artwork;
  buyer?: Profile;
  seller?: Profile;
}

export interface TransactionHistory {
  id: string;
  transaction_id: string;
  old_status?: TransactionStatus;
  new_status: TransactionStatus;
  changed_by?: string;
  note?: string;
  created_at: string;
}

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
  failed_reason?: string;
  created_at: string;
}

// ============================================
// 리뷰 관련
// ============================================

export interface TransactionReview {
  id: string;
  transaction_id: string;
  reviewer_id: string;
  reviewee_id: string;
  role: 'buyer' | 'seller';
  
  // 평점 (1-5)
  rating: 1 | 2 | 3 | 4 | 5;
  communication_rating?: number;
  accuracy_rating?: number;
  shipping_rating?: number;
  
  // 내용
  comment?: string;
  images?: string[];
  
  // 유용성
  helpful_count: number;
  
  created_at: string;
  updated_at: string;
  
  // 조인 데이터
  reviewer?: Profile;
  reviewee?: Profile;
  transaction?: Transaction;
}

// ============================================
// Challenge 관련
// ============================================

export type ChallengeStatus = 'upcoming' | 'active' | 'ended' | 'archived';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  topic: string;
  
  // 기간
  start_date: string;
  end_date: string;
  
  // 규칙
  rules?: string;
  max_entries_per_user: number;
  
  // 보상
  prize_description?: string;
  winner_badge?: string;
  
  // 상태
  status: ChallengeStatus;
  
  // 통계
  entries_count: number;
  participants_count: number;
  
  // 생성자
  created_by?: string;
  
  created_at: string;
  updated_at: string;
  
  // 조인 데이터
  creator?: Profile;
  entries?: ChallengeEntry[];
}

export interface ChallengeEntry {
  id: string;
  challenge_id: string;
  artwork_id: string;
  author_id: string;
  
  description?: string;
  
  // 순위
  rank?: number;
  is_winner: boolean;
  
  // 통계
  votes_count: number;
  
  created_at: string;
  
  // 조인 데이터
  challenge?: Challenge;
  artwork?: Artwork;
  author?: Profile;
}

// ============================================
// 대시보드/분석 관련
// ============================================

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

export interface ArtistAnalytics {
  id: string;
  user_id: string;
  period: AnalyticsPeriod;
  date: string;
  
  // 조회수
  views_count: number;
  unique_visitors: number;
  
  // 인게이지먼트
  likes_received: number;
  comments_received: number;
  bookmarks_received: number;
  shares_count: number;
  
  // 판매
  sales_count: number;
  revenue: number;
  
  // 팔로워
  new_followers: number;
  total_followers: number;
  
  created_at: string;
}

export interface ArtworkView {
  id: string;
  artwork_id: string;
  viewer_id?: string;
  session_id?: string;
  referrer?: string;
  device_type?: string;
  viewed_at: string;
}

// ============================================
// 대시보드 요약 (계산된 데이터)
// ============================================

export interface DashboardSummary {
  // 기간
  period: AnalyticsPeriod;
  start_date: string;
  end_date: string;
  
  // 조회수
  total_views: number;
  unique_visitors: number;
  views_change: number; // 이전 기간 대비 %
  
  // 인게이지먼트
  total_likes: number;
  total_comments: number;
  total_bookmarks: number;
  engagement_rate: number; // %
  
  // 판매
  total_sales: number;
  total_revenue: number;
  average_sale_price: number;
  conversion_rate: number; // 조회 대비 판매 %
  
  // 팔로워
  total_followers: number;
  new_followers: number;
  followers_change: number; // %
  
  // 인기 작품
  top_artworks: Array<{
    artwork: Artwork;
    views: number;
    likes: number;
    revenue: number;
  }>;
  
  // 트렌드
  daily_stats: Array<{
    date: string;
    views: number;
    sales: number;
    revenue: number;
  }>;
}

// ============================================
// API 요청/응답 타입
// ============================================

// 결제 생성 요청
export interface CreatePaymentRequest {
  artwork_id: string;
  shipping_address_id?: string;
  new_shipping_address?: Omit<ShippingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  express_shipping?: boolean;
}

// 결제 생성 응답
export interface CreatePaymentResponse {
  client_secret: string;
  transaction_id: string;
  amount: number;
  shipping_fee: number;
  total_amount: number;
}

// 배송 시작 요청
export interface StartShippingRequest {
  transaction_id: string;
  carrier: string;
  tracking_number: string;
  shipping_photos?: string[]; // 포장 사진
}

// 리뷰 작성 요청
export interface CreateReviewRequest {
  transaction_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  communication_rating?: number;
  accuracy_rating?: number;
  shipping_rating?: number;
  comment?: string;
  images?: string[];
}

// Challenge 참여 요청
export interface JoinChallengeRequest {
  challenge_id: string;
  artwork_id: string;
  description?: string;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 수수료 계산
 */
export function calculateFees(artworkPrice: number, platformFeeRate: number = 0.10) {
  const platform_fee = Math.round(artworkPrice * platformFeeRate);
  const stripe_fee = Math.round(artworkPrice * 0.029) + 300;
  const seller_amount = artworkPrice - platform_fee - stripe_fee;
  
  return {
    artwork_price: artworkPrice,
    platform_fee_rate: platformFeeRate,
    platform_fee,
    stripe_fee,
    seller_amount,
    buyer_pays: artworkPrice, // 구매자는 작품 가격만
  };
}

/**
 * 배송비 계산
 */
export function calculateShippingFee(
  country: string,
  artworkPrice: number,
  settings: ArtworkShippingSettings,
  expressShipping: boolean = false
): number {
  if (country === 'KR') {
    // 무료 배송 조건
    if (artworkPrice >= settings.domestic_free_threshold) {
      return 0;
    }
    
    let fee = settings.domestic_fee;
    if (expressShipping) {
      fee += 2000;
    }
    return fee;
  }
  
  // 국제 배송
  if (!settings.international_enabled) {
    throw new Error('이 작품은 국제 배송을 지원하지 않습니다');
  }
  
  // 국가별 배송비 (간단한 버전)
  if (['JP', 'CN', 'TW', 'HK'].includes(country)) {
    return settings.asia_fee;
  }
  if (['US', 'CA'].includes(country)) {
    return settings.north_america_fee;
  }
  if (['GB', 'DE', 'FR', 'IT', 'ES'].includes(country)) {
    return settings.europe_fee;
  }
  
  throw new Error('해당 국가로는 배송할 수 없습니다');
}

/**
 * 거래 상태 레이블
 */
export function getTransactionStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    pending: '결제 대기',
    paid: '결제 완료',
    preparing: '배송 준비 중',
    shipped: '배송 중',
    delivered: '배송 완료',
    confirmed: '거래 완료',
    refunded: '환불 완료',
    disputed: '분쟁 중',
    cancelled: '취소됨',
  };
  return labels[status];
}

/**
 * 거래 상태 색상
 */
export function getTransactionStatusColor(status: TransactionStatus): string {
  const colors: Record<TransactionStatus, string> = {
    pending: '#FFA500',    // 주황
    paid: '#4169E1',       // 파랑
    preparing: '#9370DB',  // 보라
    shipped: '#1E90FF',    // 하늘
    delivered: '#32CD32',  // 연두
    confirmed: '#228B22',  // 초록
    refunded: '#DC143C',   // 빨강
    disputed: '#FF6347',   // 토마토
    cancelled: '#808080',  // 회색
  };
  return colors[status];
}

/**
 * Challenge 상태 레이블
 */
export function getChallengeStatusLabel(status: ChallengeStatus): string {
  const labels: Record<ChallengeStatus, string> = {
    upcoming: '시작 예정',
    active: '진행 중',
    ended: '종료',
    archived: '보관됨',
  };
  return labels[status];
}

/**
 * 평점 별 아이콘
 */
export function getRatingStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  return '⭐'.repeat(fullStars) + 
         (halfStar ? '✨' : '') + 
         '☆'.repeat(emptyStars);
}

/**
 * 날짜 범위 생성
 */
export function getDateRange(period: AnalyticsPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case 'daily':
      start.setDate(end.getDate() - 7); // 최근 7일
      break;
    case 'weekly':
      start.setDate(end.getDate() - 30); // 최근 4주
      break;
    case 'monthly':
      start.setMonth(end.getMonth() - 6); // 최근 6개월
      break;
  }
  
  return { start, end };
}

/**
 * 퍼센트 변화 계산
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * 가격 포맷
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }
  
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);
}

/**
 * 숫자 축약
 */
export function formatNumber(num: number | undefined | null): string {
  // undefined/null 체크
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * 상대 시간
 */
export function getRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}

