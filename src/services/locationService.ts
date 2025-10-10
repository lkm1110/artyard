/**
 * 위치 기반 서비스
 * Google Maps Geocoding API를 사용한 위치 정보 처리
 */

import { LocationInfo } from '../types';
import { Platform } from 'react-native';

// Google Maps API Key (환경변수에서 가져오기)
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/**
 * 현재 위치 좌표 가져오기 (GPS)
 */
export const getCurrentPosition = (): Promise<{latitude: number, longitude: number}> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      // 웹에서는 브라우저 Geolocation API 사용
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error('Geolocation 오류:', error);
            reject(error);
          },
          {
            enableHighAccuracy: false, // 정확도보다 속도 우선
            timeout: 10000, // 10초 타임아웃
            maximumAge: 300000 // 5분간 캐시 사용
          }
        );
      } else {
        reject(new Error('Geolocation을 지원하지 않는 브라우저입니다'));
      }
    } else {
      // 모바일에서는 expo-location 사용
      (async () => {
        try {
          const Location = require('expo-location');
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            throw new Error('위치 권한이 거부되었습니다');
          }

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // 균형잡힌 정확도
          });

          resolve({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        } catch (error) {
          reject(error);
        }
      })();
    }
  });
};

/**
 * 좌표를 주소로 변환 (Reverse Geocoding)
 */
export const getAddressFromCoordinates = async (
  latitude: number, 
  longitude: number,
  language: string = 'en' // 'ko' for Korean, 'en' for English
): Promise<LocationInfo> => {
  try {
    // 좌표 기반 간단한 국가/지역 판별 (Google API 불필요)
    const locationInfo = getLocationByCoordinates(latitude, longitude);
    if (locationInfo) {
      console.log('📍 좌표 기반 위치 판별:', locationInfo);
      return {
        ...locationInfo,
        latitude,
        longitude
      };
    }

    // Google Maps API 키가 없으면 fallback 처리
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') {
      console.log('⚠️ Google Maps API 키가 설정되지 않음, 기본 위치 정보 사용');
      return {
        country: 'South Korea',
        state: 'Seoul',
        city: 'Seoul',
        full: 'Seoul, South Korea',
        latitude,
        longitude
      };
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=${language}`
    );

    if (!response.ok) {
      throw new Error(`Google Maps API 오류: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results.length) {
      throw new Error('주소를 찾을 수 없습니다');
    }

    const result = data.results[0];
    const addressComponents = result.address_components;

    // 주소 구성 요소 파싱
    let country = '';
    let state = '';
    let city = '';

    for (const component of addressComponents) {
      const types = component.types;

      if (types.includes('country')) {
        country = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = component.long_name;
      }
    }

    // 전체 주소는 간단하게 구성
    const full = `${city ? city + ', ' : ''}${state ? state + ', ' : ''}${country}`.replace(/, $/, '');

    return {
      country,
      state,
      city,
      full,
      latitude,
      longitude
    };

  } catch (error) {
    console.error('Reverse Geocoding 오류:', error);
    
    // 기본값 반환 (좌표만)
    return {
      country: 'Unknown',
      state: 'Unknown', 
      city: 'Unknown',
      full: 'Unknown Location',
      latitude,
      longitude
    };
  }
};

/**
 * 현재 위치 정보 가져오기 (좌표 → 주소 변환 포함)
 */
export const getCurrentLocationInfo = async (language: string = 'en'): Promise<LocationInfo> => {
  try {
    console.log('📍 현재 위치 정보 요청 시작...');
    
    // 1단계: GPS 좌표 가져오기
    const coordinates = await getCurrentPosition();
    console.log('📍 좌표 획득:', coordinates);

    // 2단계: 좌표를 주소로 변환
    const locationInfo = await getAddressFromCoordinates(
      coordinates.latitude, 
      coordinates.longitude, 
      language
    );
    console.log('📍 주소 변환 완료:', locationInfo);

    return locationInfo;

  } catch (error) {
    console.error('위치 정보 가져오기 실패:', error);
    throw error;
  }
};

/**
 * 위치 기반 작품 검색을 위한 거리 계산
 */
export const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // km 단위

  return distance;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * 위치 권한 확인
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    // 웹에서는 권한 체크 없이 true 반환
    return 'geolocation' in navigator;
  }

  try {
    if (Platform.OS === 'web') {
      return true; // 웹에서는 항상 true
    }
    const Location = require('expo-location');
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('위치 권한 확인 실패:', error);
    return false;
  }
};

/**
 * 위치 문자열 포맷팅
 */
export const formatLocationString = (locationInfo: LocationInfo, short: boolean = false): string => {
  if (short) {
    // 짧은 형태: "Seoul, South Korea" 또는 "New York, USA"
    return `${locationInfo.city || 'Unknown'}, ${locationInfo.country || 'Unknown'}`;
  } else {
    // 전체 형태: "Seoul, Gyeonggi-do, South Korea"
    return locationInfo.full || 'Unknown Location';
  }
};

/**
 * 좌표 기반 간단한 위치 판별 (Google API 불필요)
 */
export const getLocationByCoordinates = (latitude: number, longitude: number): LocationInfo | null => {
  console.log('🗺️ 좌표 기반 위치 판별:', { latitude, longitude });
  
  // 한국 (대략적인 좌표 범위)
  if (latitude >= 33 && latitude <= 38.6 && longitude >= 124 && longitude <= 132) {
    // 서울 (더 정확한 범위)
    if (latitude >= 37.45 && latitude <= 37.70 && longitude >= 126.85 && longitude <= 127.15) {
      console.log('📍 서울로 판별됨');
      return {
        country: 'South Korea',
        state: 'Seoul',
        city: 'Seoul',
        full: 'Seoul, South Korea'
      };
    }
    // 경기도 (서울 주변 지역)
    else if (latitude >= 37.0 && latitude <= 38.2 && longitude >= 126.4 && longitude <= 127.8) {
      console.log('📍 경기도로 판별됨');
      return {
        country: 'South Korea',
        state: 'Gyeonggi-do',
        city: 'Gyeonggi',
        full: 'Gyeonggi-do, South Korea'
      };
    }
    // 인천
    else if (latitude >= 37.2 && latitude <= 37.6 && longitude >= 126.3 && longitude <= 126.8) {
      console.log('📍 인천으로 판별됨');
      return {
        country: 'South Korea',
        state: 'Incheon',
        city: 'Incheon',
        full: 'Incheon, South Korea'
      };
    }
    // 부산
    else if (latitude >= 35.0 && latitude <= 35.3 && longitude >= 128.9 && longitude <= 129.2) {
      console.log('📍 부산으로 판별됨');
      return {
        country: 'South Korea',
        state: 'Busan',
        city: 'Busan',
        full: 'Busan, South Korea'
      };
    }
    // 대구
    else if (latitude >= 35.7 && latitude <= 36.0 && longitude >= 128.4 && longitude <= 128.8) {
      console.log('📍 대구로 판별됨');
      return {
        country: 'South Korea',
        state: 'Daegu',
        city: 'Daegu',
        full: 'Daegu, South Korea'
      };
    }
    // 대전
    else if (latitude >= 36.2 && latitude <= 36.5 && longitude >= 127.3 && longitude <= 127.5) {
      console.log('📍 대전으로 판별됨');
      return {
        country: 'South Korea',
        state: 'Daejeon',
        city: 'Daejeon',
        full: 'Daejeon, South Korea'
      };
    }
    // 광주
    else if (latitude >= 35.1 && latitude <= 35.2 && longitude >= 126.8 && longitude <= 127.0) {
      console.log('📍 광주로 판별됨');
      return {
        country: 'South Korea',
        state: 'Gwangju',
        city: 'Gwangju',
        full: 'Gwangju, South Korea'
      };
    }
    // 기타 한국 지역
    else {
      console.log('📍 기타 한국 지역으로 판별됨');
      return {
        country: 'South Korea',
        state: 'Korea',
        city: 'Korea',
        full: 'South Korea'
      };
    }
  }
  
  // 일본
  if (latitude >= 30 && latitude <= 46 && longitude >= 129 && longitude <= 146) {
    if (latitude >= 35.5 && latitude <= 35.8 && longitude >= 139.6 && longitude <= 139.8) {
      return {
        country: 'Japan',
        state: 'Tokyo',
        city: 'Tokyo',
        full: 'Tokyo, Japan'
      };
    } else {
      return {
        country: 'Japan',
        state: 'Japan',
        city: 'Japan',
        full: 'Japan'
      };
    }
  }
  
  // 미국
  if (latitude >= 25 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
    if (latitude >= 40.6 && latitude <= 40.9 && longitude >= -74.1 && longitude <= -73.9) {
      return {
        country: 'United States',
        state: 'New York',
        city: 'New York',
        full: 'New York, USA'
      };
    } else if (latitude >= 34 && latitude <= 34.1 && longitude >= -118.3 && longitude <= -118.2) {
      return {
        country: 'United States',
        state: 'California',
        city: 'Los Angeles',
        full: 'Los Angeles, USA'
      };
    } else {
      return {
        country: 'United States',
        state: 'USA',
        city: 'USA',
        full: 'United States'
      };
    }
  }
  
  // 중국
  if (latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135) {
    return {
      country: 'China',
      state: 'China',
      city: 'China',
      full: 'China'
    };
  }
  
  // 유럽 (대략적)
  if (latitude >= 35 && latitude <= 71 && longitude >= -10 && longitude <= 40) {
    return {
      country: 'Europe',
      state: 'Europe',
      city: 'Europe',
      full: 'Europe'
    };
  }
  
  // 기타 지역
  return null;
};

/**
 * 시뮬레이션용 위치 정보 (개발/테스트용)
 */
export const getSimulatedLocation = (region: 'korea' | 'usa' | 'japan'): LocationInfo => {
  const locations = {
    korea: {
      country: 'South Korea',
      state: 'Gyeonggi-do',
      city: 'Seongnam-si',
      full: 'Seongnam-si, Gyeonggi-do, South Korea',
      latitude: 37.4449168,
      longitude: 127.1388684
    },
    usa: {
      country: 'United States',
      state: 'New York',
      city: 'New York',
      full: 'New York, NY, USA',
      latitude: 40.7589,
      longitude: -73.9851
    },
    japan: {
      country: 'Japan',
      state: 'Tokyo',
      city: 'Shibuya',
      full: 'Shibuya, Tokyo, Japan',
      latitude: 35.6580,
      longitude: 139.7016
    }
  };

  return locations[region];
};
