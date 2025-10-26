/**
 * 배송 관련 타입 정의
 */

// ============================================
// 배송 국가/지역
// ============================================
export type ShippingCountry = 'KR' | 'US' | 'JP' | 'CN' | 'GB' | 'DE' | 'FR';

export interface ShippingZone {
  id: string;
  name: string; // '국내', '아시아', '북미', '유럽'
  countries: ShippingCountry[];
  base_fee: number; // 기본 배송비
  estimated_days_min: number;
  estimated_days_max: number;
  description?: string;
}

// ============================================
// 배송 옵션
// ============================================
export interface ShippingOption {
  id: string;
  name: string; // '일반 배송', '빠른 배송', 'EMS'
  carrier: string; // '우체국택배', 'CJ대한통운', 'EMS'
  fee: number;
  estimated_days: number;
  tracking_available: boolean;
  insurance_included: boolean;
}

// ============================================
// 작품별 배송 설정 (판매자가 설정)
// ============================================
export interface ArtworkShippingSettings {
  artwork_id: string;
  
  // 국내 배송 (필수)
  domestic_enabled: boolean;
  domestic_fee: number; // 기본 3,000원
  domestic_free_threshold?: number; // 10만원 이상 무료
  
  // 국제 배송 (선택)
  international_enabled: boolean;
  international_zones?: {
    zone: 'asia' | 'north_america' | 'europe' | 'oceania';
    enabled: boolean;
    fee: number;
  }[];
  
  // 배송 제외 국가
  excluded_countries?: ShippingCountry[];
  
  // 특수 사항
  fragile: boolean; // 파손 주의
  requires_signature: boolean; // 서명 필수
  insurance_required: boolean; // 보험 필수
  
  created_at: string;
  updated_at: string;
}

// ============================================
// 배송비 계산 결과
// ============================================
export interface ShippingCalculation {
  base_fee: number; // 기본 배송비
  insurance_fee: number; // 보험료
  express_fee: number; // 빠른 배송 추가 요금
  total_fee: number; // 총 배송비
  
  estimated_delivery_date: string; // 예상 도착일
  tracking_available: boolean;
  
  // 국제 배송 시
  customs_warning?: string; // "관세가 부과될 수 있습니다"
  no_return_warning?: boolean; // "국제 배송은 반품 불가"
}

// ============================================
// 기본 배송 존 (국내만)
// ============================================
export const DEFAULT_SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'domestic',
    name: '국내 배송',
    countries: ['KR'],
    base_fee: 3000,
    estimated_days_min: 2,
    estimated_days_max: 3,
    description: '전국 택배 배송',
  },
];

// ============================================
// 글로벌 배송 존 (Phase 2에서 사용)
// ============================================
export const GLOBAL_SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'domestic',
    name: '국내',
    countries: ['KR'],
    base_fee: 3000,
    estimated_days_min: 2,
    estimated_days_max: 3,
  },
  {
    id: 'asia',
    name: '아시아',
    countries: ['JP', 'CN'],
    base_fee: 12000,
    estimated_days_min: 5,
    estimated_days_max: 10,
    description: '일본, 중국, 대만, 홍콩',
  },
  {
    id: 'north_america',
    name: '북미',
    countries: ['US'],
    base_fee: 18000,
    estimated_days_min: 7,
    estimated_days_max: 14,
    description: '미국, 캐나다',
  },
  {
    id: 'europe',
    name: '유럽',
    countries: ['GB', 'DE', 'FR'],
    base_fee: 25000,
    estimated_days_min: 10,
    estimated_days_max: 21,
    description: '영국, 독일, 프랑스 등',
  },
];

// ============================================
// 배송비 계산 함수
// ============================================
export function calculateShippingFee(
  artworkPrice: number,
  destinationCountry: ShippingCountry,
  shippingSettings: ArtworkShippingSettings,
  expressShipping: boolean = false
): ShippingCalculation {
  
  // 국내 배송
  if (destinationCountry === 'KR') {
    let baseFee = shippingSettings.domestic_fee || 3000;
    
    // 무료 배송 조건 확인
    if (
      shippingSettings.domestic_free_threshold &&
      artworkPrice >= shippingSettings.domestic_free_threshold
    ) {
      baseFee = 0;
    }
    
    // 빠른 배송 추가 요금
    const expressFee = expressShipping ? 2000 : 0;
    
    // 보험료 (5만원 이상 자동 추가)
    const insuranceFee = artworkPrice > 50000 ? 2000 : 0;
    
    const totalFee = baseFee + expressFee + insuranceFee;
    
    const deliveryDays = expressShipping ? 1 : 3;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    
    return {
      base_fee: baseFee,
      insurance_fee: insuranceFee,
      express_fee: expressFee,
      total_fee: totalFee,
      estimated_delivery_date: deliveryDate.toISOString(),
      tracking_available: true,
    };
  }
  
  // 국제 배송
  if (!shippingSettings.international_enabled) {
    throw new Error('이 작품은 국제 배송을 지원하지 않습니다');
  }
  
  // 배송 존 찾기
  const zone = GLOBAL_SHIPPING_ZONES.find(z => 
    z.countries.includes(destinationCountry)
  );
  
  if (!zone) {
    throw new Error('해당 국가로는 배송할 수 없습니다');
  }
  
  const baseFee = zone.base_fee;
  const insuranceFee = Math.round(artworkPrice * 0.05); // 5%
  const totalFee = baseFee + insuranceFee;
  
  const deliveryDays = zone.estimated_days_max;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
  
  return {
    base_fee: baseFee,
    insurance_fee: insuranceFee,
    express_fee: 0,
    total_fee: totalFee,
    estimated_delivery_date: deliveryDate.toISOString(),
    tracking_available: true,
    customs_warning: '관세가 부과될 수 있습니다. 관세는 구매자 부담입니다.',
    no_return_warning: true,
  };
}

// ============================================
// 사용 예시
// ============================================
/*
const settings: ArtworkShippingSettings = {
  artwork_id: 'abc123',
  domestic_enabled: true,
  domestic_fee: 3000,
  domestic_free_threshold: 100000,
  international_enabled: false,
  fragile: true,
  requires_signature: false,
  insurance_required: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// 국내 배송비 계산
const domestic = calculateShippingFee(50000, 'KR', settings, false);
console.log(domestic);
// {
//   base_fee: 3000,
//   insurance_fee: 0,
//   express_fee: 0,
//   total_fee: 3000,
//   estimated_delivery_date: '2024-10-25T...',
//   tracking_available: true,
// }

// 10만원 이상 → 무료 배송!
const domesticFree = calculateShippingFee(120000, 'KR', settings, false);
console.log(domesticFree.total_fee); // 0

// 국제 배송 (활성화 시)
settings.international_enabled = true;
const international = calculateShippingFee(50000, 'US', settings, false);
console.log(international);
// {
//   base_fee: 18000,
//   insurance_fee: 2500,
//   total_fee: 20500,
//   customs_warning: '관세가 부과될 수 있습니다...',
//   no_return_warning: true,
// }
*/

