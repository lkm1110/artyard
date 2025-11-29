/**
 * ArtYard 메인 앱
 * 대학생 아트 커뮤니티 + 직거래 플랫폼
 */

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
// import * as Sentry from '@sentry/react-native'; // Hermes 호환성 문제로 배포 후 추가
import { queryClient } from './src/utils/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import AIOrchestrationService from './src/services/ai/aiOrchestrationService';
import { PermissionsHandler } from './src/components/PermissionsHandler';
import { PushNotificationConsent } from './src/components/PushNotificationConsent';
import { NetworkStatus } from './src/components/NetworkStatus';

// Sentry는 RN 업그레이드 후 추가 예정
// (현재 RN 0.81.4의 Hermes가 Sentry 6.x와 호환 안 됨)

// Expo Go 환경 체크
const isExpoGo = Constants.appOwnership === 'expo';

export default function App() {
  // 앱 버전 체크
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const { checkAppVersion } = await import('./src/services/versionCheckService');
        await checkAppVersion();
      } catch (error) {
        console.warn('버전 체크 실패:', error);
      }
    };

    // 앱 시작 5초 후 체크 (UX 개선)
    setTimeout(checkVersion, 5000);
  }, []);

  // Analytics 초기화 (프로덕션)
  useEffect(() => {
    const initializeAnalytics = async () => {
      if (!__DEV__) {
        try {
          const amplitudeApiKey = Constants.expoConfig?.extra?.amplitudeApiKey;
          if (amplitudeApiKey) {
            const { analytics } = await import('./src/services/analyticsService');
            await analytics.initialize(amplitudeApiKey);
            console.log('✅ Analytics 초기화 완료');
          }
        } catch (error) {
          console.warn('⚠️ Analytics 초기화 실패:', error);
        }
      }
    };
    initializeAnalytics();
  }, []);

  // AI 시스템 초기화
  useEffect(() => {
    const initializeAI = async () => {
      try {
        console.log('🤖 ArtYard AI 시스템 초기화 중...');
        
        await AIOrchestrationService.initialize({
          features: {
            spamDetection: true,
            contentModeration: true,
            personalizedRecommendations: true,
            trendingAnalysis: true,
            userGrowth: true,
            batchProcessing: true
          },
          performance: {
            maxConcurrentAnalyses: 3,
            analysisTimeout: 20000, // 20초
            cacheEnabled: true,
            cacheTTL: 300 // 5분
          },
          monitoring: {
            logLevel: 'info',
            performanceTracking: true,
            errorReporting: true
          }
        });
        
        console.log('✅ ArtYard AI 시스템 초기화 완료!');
      } catch (error) {
        console.error('💥 AI 시스템 초기화 실패:', error);
      }
    };

    initializeAI();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <NetworkStatus />
      <PermissionsHandler />
      {/* Expo Go에서는 푸시 알림 미지원 (SDK 53+) */}
      {!isExpoGo && <PushNotificationConsent />}
      <RootNavigator />
    </QueryClientProvider>
  );
}
