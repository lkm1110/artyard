/**
 * 크로스 플랫폼 저장소 유틸리티
 * 웹: localStorage 사용
 * 모바일: SecureStore 사용
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

export const storage = {
  /**
   * 값을 저장합니다
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        // 웹 환경: localStorage 사용
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } else {
        // 네이티브 환경: SecureStore 사용
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn(`저장 실패 (${key}):`, error);
    }
  },

  /**
   * 값을 가져옵니다
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        // 웹 환경: localStorage 사용
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      } else {
        // 네이티브 환경: SecureStore 사용
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.warn(`읽기 실패 (${key}):`, error);
      return null;
    }
  },

  /**
   * 값을 삭제합니다
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        // 웹 환경: localStorage 사용
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } else {
        // 네이티브 환경: SecureStore 사용
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.warn(`삭제 실패 (${key}):`, error);
    }
  },
};

export default storage;
