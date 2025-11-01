/**
 * 위치 정보 수집 서비스
 * Android/iOS 위치 권한 처리 및 정보 수집
 */

import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

/**
 * 웹용 무료 Reverse Geocoding (OpenStreetMap Nominatim)
 */
export const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<any> => {
  try {
    console.log('🗺️ OpenStreetMap Nominatim API 호출:', { latitude, longitude });
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'ArtYard-App/1.0 (contact: support@artyard.app)',
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('🗺️ Nominatim 응답:', data);
    
    if (data && data.address) {
      const addr = data.address;
      return {
        country: addr.country,
        state: addr.state || addr.province || addr.region,
        city: addr.city || addr.town || addr.village || addr.municipality,
        district: addr.county || addr.district,
        street: addr.road || addr.street,
        name: data.display_name,
        postalCode: addr.postcode,
      };
    }
    
    return {};
  } catch (error) {
    console.error('💥 Nominatim API 오류:', error);
    
    // 웹에서 CORS 에러가 발생하면 기본값 반환
    if (Platform.OS === 'web' && (error.message?.includes('CORS') || error.message?.includes('Failed to fetch'))) {
      console.log('⚠️ 웹 환경에서 CORS 에러 - 기본 위치 정보 사용');
      return {
        country: 'South Korea',
        city: 'Seoul',
        name: 'Location information unavailable on web',
      };
    }
    
    return {};
  }
};

export interface LocationInfo {
  latitude: number;
  longitude: number;
  country?: string;
  state?: string;
  city?: string;
  district?: string;
  street?: string;
  name?: string;
  postalCode?: string;
  accuracy?: number;
  timestamp: number;
}

/**
 * 한국어 지명을 영어로 번역
 */
const translateLocationToEnglish = (text: string | undefined): string | undefined => {
  if (!text) return text;

  const translations: Record<string, string> = {
    '대한민국': 'South Korea', '한국': 'South Korea',
    '서울특별시': 'Seoul', '서울': 'Seoul',
    '부산광역시': 'Busan', '부산': 'Busan',
    '대구광역시': 'Daegu', '대구': 'Daegu',
    '인천광역시': 'Incheon', '인천': 'Incheon',
    '광주광역시': 'Gwangju', '광주': 'Gwangju',
    '대전광역시': 'Daejeon', '대전': 'Daejeon',
    '울산광역시': 'Ulsan', '울산': 'Ulsan',
    '세종특별자치시': 'Sejong', '세종': 'Sejong',
    '경기도': 'Gyeonggi', '경기': 'Gyeonggi',
    '강원도': 'Gangwon', '강원': 'Gangwon',
    '충청북도': 'North Chungcheong', '충북': 'North Chungcheong',
    '충청남도': 'South Chungcheong', '충남': 'South Chungcheong',
    '전라북도': 'North Jeolla', '전북': 'North Jeolla',
    '전라남도': 'South Jeolla', '전남': 'South Jeolla',
    '경상북도': 'North Gyeongsang', '경북': 'North Gyeongsang',
    '경상남도': 'South Gyeongsang', '경남': 'South Gyeongsang',
    '제주특별자치도': 'Jeju', '제주': 'Jeju',
    // 경기도 주요 도시
    '수원시': 'Suwon', '수원': 'Suwon',
    '성남시': 'Seongnam', '성남': 'Seongnam',
    '고양시': 'Goyang', '고양': 'Goyang',
    '용인시': 'Yongin', '용인': 'Yongin',
    '부천시': 'Bucheon', '부천': 'Bucheon',
    '안산시': 'Ansan', '안산': 'Ansan',
    '남양주시': 'Namyangju', '남양주': 'Namyangju',
    '화성시': 'Hwaseong', '화성': 'Hwaseong',
    '평택시': 'Pyeongtaek', '평택': 'Pyeongtaek',
    '의정부시': 'Uijeongbu', '의정부': 'Uijeongbu',
  };

  return translations[text] || text;
};

export interface LocationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

/**
 * 위치 권한 요청
 */
export const requestLocationPermission = async (): Promise<LocationPermissionResult> => {
  try {
    console.log('📍 위치 권한 요청 시작...');

    // 현재 권한 상태 확인
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    console.log('📍 현재 위치 권한 상태:', existingStatus);

    if (existingStatus === 'granted') {
      return {
        granted: true,
        canAskAgain: true,
        status: existingStatus
      };
    }

    // 권한 요청
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    console.log('📍 위치 권한 요청 결과:', { status, canAskAgain });

    return {
      granted: status === 'granted',
      canAskAgain,
      status
    };
  } catch (error) {
    console.error('💥 위치 권한 요청 오류:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'error'
    };
  }
};

/**
 * 현재 위치 정보 가져오기
 */
export const getCurrentLocation = async (options?: {
  timeout?: number;
  accuracy?: Location.Accuracy;
}): Promise<LocationInfo | null> => {
  try {
    console.log('🌍 현재 위치 정보 수집 시작...');

    // 위치 권한 확인
    const permission = await requestLocationPermission();
    if (!permission.granted) {
      console.log('❌ 위치 권한이 거부되었습니다.');
      return null;
    }

    // 위치 정보 가져오기
    const location = await Location.getCurrentPositionAsync({
      accuracy: options?.accuracy || Location.Accuracy.Balanced,
      timeout: options?.timeout || 10000,
      mayShowUserSettingsDialog: true,
    });

    console.log('📍 GPS 위치 정보:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy
    });

    // 역지오코딩 (좌표 → 주소)
    let addressInfo = {};
    try {
      if (Platform.OS === 'web') {
        // 웹에서는 Google Maps Geocoding API 사용
        console.log('🌐 웹 환경에서 Google Geocoding API 사용');
        addressInfo = await getAddressFromCoordinates(
          location.coords.latitude, 
          location.coords.longitude
        );
      } else {
        // 모바일에서는 expo-location 사용
        console.log('📱 모바일 환경에서 expo-location 사용');
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode && reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          addressInfo = {
            country: translateLocationToEnglish(address.country),
            state: translateLocationToEnglish(address.region?.trim()), // 공백 제거 및 영어 변환
            city: translateLocationToEnglish(address.city),
            district: translateLocationToEnglish(address.district),
            street: address.street, // 거리명은 그대로 유지
            name: address.name,
            postalCode: address.postalCode,
          };
        }
      }
      console.log('🏠 주소 정보:', addressInfo);
    } catch (geocodeError) {
      console.warn('⚠️ 역지오코딩 실패:', geocodeError);
      // 실패시 기본값 설정
      addressInfo = {
        country: 'Unknown Country',
        city: 'Unknown City',
      };
    }

    const locationInfo: LocationInfo = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: Math.floor(location.timestamp), // iOS float → integer 변환
      ...addressInfo,
    };

    console.log('✅ 위치 정보 수집 완료:', locationInfo);
    return locationInfo;

  } catch (error: any) {
    console.error('💥 위치 정보 수집 오류:', error);
    
    // 사용자 친화적 에러 메시지
    if (error.code === 'E_LOCATION_TIMEOUT') {
      console.log('⏰ 위치 정보 수집 타임아웃');
    } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
      console.log('📡 위치 서비스 사용 불가');
    }
    
    return null;
  }
};

/**
 * 위치 정보 수집 여부 확인 (사용자 선택)
 */
export const askForLocationConsent = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      // 웹에서는 간단한 confirm 대화상자
      const consent = window.confirm(
        'Would you like to add location information to your artwork?\n\nAdding location helps other users see where your artwork was created.'
      );
      resolve(consent);
    } else {
      // 모바일에서는 React Native Alert
      Alert.alert(
        '📍 Add Location',
        'Would you like to add location information to your artwork?\n\nAdding location helps other users see where your artwork was created.',
        [
          {
            text: 'Skip',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: '📍 Add Location',
            onPress: () => resolve(true),
          },
        ]
      );
    }
  });
};

/**
 * 위치 정보를 읽기 쉬운 텍스트로 변환
 */
export const formatLocationText = (location: LocationInfo): string => {
  const parts = [];
  
  if (location.city) parts.push(location.city);
  if (location.state && location.state !== location.city) parts.push(location.state);
  if (location.country) parts.push(location.country);
  
  return parts.join(', ') || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
};

/**
 * 위치 정보 프라이버시 처리 (정확한 위치를 약간 흐리게)
 */
export const sanitizeLocationForPrivacy = (location: LocationInfo): LocationInfo => {
  // 소수점 3자리까지만 (약 100m 정확도)
  return {
    ...location,
    latitude: Math.round(location.latitude * 1000) / 1000,
    longitude: Math.round(location.longitude * 1000) / 1000,
  };
};