/**
 * 고급 필터링 및 아티스트 팔로우 시스템 타입 정의
 */

// 팔로우 관계
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: Profile;
  following?: Profile;
}

// 알림 시스템
export interface Notification {
  id: string;
  user_id: string;
  type: 'new_artwork' | 'new_follower' | 'like' | 'comment' | 'purchase';
  title: string;
  message: string;
  data?: {
    artwork_id?: string;
    artist_id?: string;
    artist_handle?: string;
    follower_id?: string;
    follower_handle?: string;
  };
  is_read: boolean;
  created_at: string;
}

// 작품 스타일
export interface ArtworkStyle {
  id: string;
  name: string;
  name_ko?: string;
  description?: string;
  created_at: string;
}

// 작품-스타일 관계
export interface ArtworkStyleRelation {
  id: string;
  artwork_id: string;
  style_id: string;
  confidence_score: number;
  created_at: string;
  style?: ArtworkStyle;
}

// 작품 색상 정보
export interface ArtworkColor {
  id: string;
  artwork_id: string;
  color_hex: string;
  color_name?: string;
  percentage: number;
  is_dominant: boolean;
  created_at: string;
}

// 고급 필터 옵션
export interface AdvancedFilter {
  // 가격 범위
  priceRange?: {
    min: number;
    max: number;
  };
  
  // 작품 크기 (cm)
  sizeRange?: {
    width?: { min: number; max: number };
    height?: { min: number; max: number };
  };
  
  // 색상 팔레트
  colors?: string[]; // hex 색상 배열
  
  // 스타일
  styles?: string[]; // 스타일 ID 배열
  
  // 제작 연도
  yearRange?: {
    min: number;
    max: number;
  };
  
  // 재료
  materials?: string[];
  
  // 정렬 옵션
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular' | 'trending';
}

// 확장된 작품 정보 (크기 정보 포함)
export interface ExtendedArtwork extends Artwork {
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  weight_kg?: number;
  styles?: ArtworkStyleRelation[];
  colors?: ArtworkColor[];
  is_following_artist?: boolean;
}

// 아티스트 프로필 확장
export interface ExtendedProfile extends Profile {
  follower_count?: number;
  following_count?: number;
  is_following?: boolean;
  recent_artworks?: ExtendedArtwork[];
}

// 팔로우 통계
export interface FollowStats {
  follower_count: number;
  following_count: number;
  is_following: boolean;
}

// 색상 팔레트 분석 결과
export interface ColorAnalysis {
  dominant_colors: {
    hex: string;
    name: string;
    percentage: number;
  }[];
  color_harmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'mixed';
  brightness: 'dark' | 'medium' | 'bright';
  saturation: 'muted' | 'moderate' | 'vibrant';
}

// 스타일 분석 결과
export interface StyleAnalysis {
  detected_styles: {
    style_id: string;
    style_name: string;
    confidence: number;
  }[];
  primary_style: string;
  style_confidence: number;
}

// 검색 결과 (페이지네이션 포함)
export interface AdvancedSearchResult {
  artworks: ExtendedArtwork[];
  total_count: number;
  page: number;
  has_more: boolean;
  filters_applied: AdvancedFilter;
  search_time_ms: number;
}

// 아티스트 컬렉션
export interface ArtistCollection {
  artist: ExtendedProfile;
  artworks: ExtendedArtwork[];
  total_artworks: number;
  avg_price: number;
  most_popular_style: string;
  latest_artwork_date: string;
}
