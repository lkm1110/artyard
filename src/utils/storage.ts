/**
 * 크로스 플랫폼 저장소 유틸리티 (Supabase 호환)
 * 웹: localStorage 사용
 * 모바일: AsyncStorage 사용 (Supabase는 동기적 storage를 기대함)
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

// 메모리 캐시 (동기적 접근을 위해)
let memoryCache: { [key: string]: string } = {};
let cacheInitialized = false;

// 앱 시작 시 캐시 초기화
const initializeCache = async () => {
  if (cacheInitialized || isWeb) return;
  
  try {
    // Supabase 세션 키만 미리 로드
    const sessionKey = 'sb-bkvycanciimgyftdtqpx-auth-token';
    const value = await AsyncStorage.getItem(sessionKey);
    if (value) {
      memoryCache[sessionKey] = value;
    }
    cacheInitialized = true;
    console.log('✅ Storage cache initialized');
  } catch (error) {
    console.warn('Cache initialization failed:', error);
  }
};

// 즉시 초기화 시작
if (!isWeb) {
  initializeCache();
}

export const storage = {
  /**
   * 값을 저장합니다 (동기적으로 반환)
   */
  setItem(key: string, value: string): void {
    try {
      if (isWeb) {
        // 웹 환경: localStorage 사용
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } else {
        // 네이티브 환경: 메모리 캐시 + AsyncStorage
        memoryCache[key] = value;
        // 백그라운드에서 저장
        AsyncStorage.setItem(key, value).catch((error) => {
          console.warn(`저장 실패 (${key}):`, error);
        });
      }
    } catch (error) {
      console.warn(`저장 실패 (${key}):`, error);
    }
  },

  /**
   * 값을 가져옵니다 (동기적으로 반환)
   */
  getItem(key: string): string | null {
    try {
      if (isWeb) {
        // 웹 환경: localStorage 사용
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      } else {
        // 네이티브 환경: 메모리 캐시에서 반환
        const cached = memoryCache[key];
        
        // 캐시에 없으면 백그라운드에서 로드
        if (cached === undefined) {
          AsyncStorage.getItem(key).then((value) => {
            if (value) {
              memoryCache[key] = value;
            }
          }).catch((error) => {
            console.warn(`읽기 실패 (${key}):`, error);
          });
          return null;
        }
        
        return cached;
      }
    } catch (error) {
      console.warn(`읽기 실패 (${key}):`, error);
      return null;
    }
  },

  /**
   * 값을 삭제합니다 (동기적으로 반환)
   */
  removeItem(key: string): void {
    try {
      if (isWeb) {
        // 웹 환경: localStorage 사용
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } else {
        // 네이티브 환경: 메모리 캐시 + AsyncStorage
        delete memoryCache[key];
        // 백그라운드에서 삭제
        AsyncStorage.removeItem(key).catch((error) => {
          console.warn(`삭제 실패 (${key}):`, error);
        });
      }
    } catch (error) {
      console.warn(`삭제 실패 (${key}):`, error);
    }
  },
};

export default storage;
