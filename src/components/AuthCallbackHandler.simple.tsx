/**
 * 간소화된 OAuth 콜백 핸들러 (오프라인 로그인 완전 차단)
 */

import React, { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthCallbackHandlerSimple: React.FC = () => {
  // ⚠️ 이 컴포넌트는 더 이상 사용되지 않습니다!
  // nativeOAuth.ts의 WebBrowser.openAuthSessionAsync가 자동으로 콜백을 처리합니다.
  // 이 컴포넌트를 활성화하면 authorization code가 두 번 사용되어 에러가 발생합니다.
  
  console.log('⚠️ AuthCallbackHandlerSimple이 렌더링되었지만, 비활성화되어 있습니다.');
  console.log('⚠️ OAuth는 nativeOAuth.ts의 WebBrowser.openAuthSessionAsync가 처리합니다.');
  
  return null; // UI 없음, 아무 작업도 하지 않음
};
