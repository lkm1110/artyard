/**
 * 공통 타입 정의
 */

// 사용자 프로필
export interface Profile {
  id: string;
  handle: string;
  school: string;
  department: string;
  bio: string;
  avatar_url: string | null;
  is_verified_school: boolean;
  location_country?: string;
  location_state?: string;
  location_city?: string;
  location_full?: string;
  created_at: string;
}

// 판매 상태
export type SaleStatus = 'available' | 'sold' | 'reserved' | 'not_for_sale';

// 작품 정보
export interface Artwork {
  id: string;
  author_id: string;
  title: string;
  description: string;
  material: string;
  size: string;
  year: number;
  edition: string;
  price: string;
  sale_status: SaleStatus;
  sold_at?: string;
  buyer_id?: string;
  images: string[];
  likes_count: number;
  comments_count: number;
  is_hidden: boolean;
  // 위치 정보 (작품 생성 장소)
  location_latitude?: number;
  location_longitude?: number;
  location_country?: string;
  location_state?: string;
  location_city?: string;
  location_district?: string;
  location_street?: string;
  location_name?: string;
  location_full?: string;
  location_accuracy?: number;
  location_timestamp?: number;
  created_at: string;
  // 조인된 데이터
  author?: Profile;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

// Price bands
export type PriceBand = 'Under $10' | '$10-50' | '$50-100' | '$100-300' | '$300+' | 'Negotiable';

// Material categories  
export type Material = 'Illustration' | 'Photography' | 'Printmaking' | 'Craft' | 'Design Poster' | 'Drawing' | 'Other';

// 좋아요
export interface Like {
  user_id: string;
  artwork_id: string;
  created_at: string;
}

// 댓글
export interface Comment {
  id: string;
  artwork_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

// 북마크
export interface Bookmark {
  user_id: string;
  artwork_id: string;
  created_at: string;
}

// 채팅방
export interface Chat {
  id: string;
  a: string; // 사용자 A ID
  b: string; // 사용자 B ID
  created_at: string;
  // 조인된 데이터
  other_user?: Profile;
  last_message?: Message;
}

// 메시지
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
  // 수정/삭제 관련 필드
  is_edited?: boolean;
  edited_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  original_body?: string;
  // 읽음 처리 필드
  is_read?: boolean;
}

// 메시지 이력
export interface MessageHistory {
  id: string;
  message_id: string;
  action_type: 'edit' | 'delete' | 'restore';
  old_content?: string;
  new_content?: string;
  performed_by: string;
  performed_at: string;
  reason?: string;
}

// 챌린지
export interface Challenge {
  id: string;
  title: string;
  topic: string;
  deadline: string;
  created_at: string;
}

// 챌린지 참여
export interface ChallengeEntry {
  challenge_id: string;
  artwork_id: string;
  author_id: string;
  created_at: string;
  artwork?: Artwork;
  author?: Profile;
}

// 신고
export interface Report {
  id: string;
  target_type: 'artwork' | 'comment' | 'user';
  target_id: string;
  reporter_id: string;
  reason: string;
  handled: boolean;
  created_at: string;
}

// 광고 슬롯
export interface AdSlot {
  id: string;
  position: 'home_top' | 'detail_bottom';
  image_url: string;
  link_url: string;
  active: boolean;
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// 페이지네이션
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  has_more: boolean;
}

// 인증 상태
export interface AuthState {
  user: Profile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// 소셜 로그인 제공자
export type SocialProvider = 'google' | 'naver' | 'kakao';

// 위치 정보
export interface LocationInfo {
  country: string;
  state: string;
  city: string;
  full: string;
  latitude?: number;
  longitude?: number;
}

