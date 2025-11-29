/**
 * 앱 버전 체크 서비스
 * 강제 업데이트 및 권장 업데이트 관리
 */

import { Platform, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

interface AppVersion {
  platform: string;
  version: string;
  build_number: number;
  min_supported_version: string;
  min_supported_build: number;
  force_update: boolean;
  recommended_update: boolean;
  release_notes: string;
  release_notes_ko: string;
  download_url: string;
  rollout_percentage: number;
}

class VersionCheckService {
  private currentVersion: string;
  private currentBuild: number;
  private platform: string;

  constructor() {
    this.currentVersion = Constants.expoConfig?.version || '1.0.0';
    this.currentBuild = this.getCurrentBuild();
    this.platform = Platform.OS === 'ios' ? 'ios' : 'android';
  }

  /**
   * 현재 빌드 번호 가져오기
   */
  private getCurrentBuild(): number {
    if (Platform.OS === 'ios') {
      return parseInt(Constants.expoConfig?.ios?.buildNumber || '1', 10);
    } else if (Platform.OS === 'android') {
      return Constants.expoConfig?.android?.versionCode || 1;
    }
    return 1;
  }

  /**
   * 버전 비교 (semantic versioning)
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  }

  /**
   * 최신 버전 정보 가져오기
   */
  async getLatestVersion(): Promise<AppVersion | null> {
    try {
      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .eq('platform', this.platform)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as AppVersion;
    } catch (error) {
      console.error('Failed to fetch latest version:', error);
      return null;
    }
  }

  /**
   * 업데이트 필요 여부 체크
   */
  async checkForUpdate(): Promise<{
    updateRequired: boolean;
    forceUpdate: boolean;
    latestVersion?: AppVersion;
  }> {
    const latestVersion = await this.getLatestVersion();
    
    if (!latestVersion) {
      return { updateRequired: false, forceUpdate: false };
    }

    // 버전 비교
    const versionComparison = this.compareVersions(
      this.currentVersion,
      latestVersion.version
    );

    // 최소 지원 버전 체크
    const minVersionComparison = this.compareVersions(
      this.currentVersion,
      latestVersion.min_supported_version
    );

    const buildComparison = this.currentBuild - latestVersion.build_number;

    // 강제 업데이트 필요
    if (latestVersion.force_update && (versionComparison < 0 || buildComparison < 0)) {
      return {
        updateRequired: true,
        forceUpdate: true,
        latestVersion,
      };
    }

    // 최소 지원 버전 미만
    if (minVersionComparison < 0 || this.currentBuild < latestVersion.min_supported_build) {
      return {
        updateRequired: true,
        forceUpdate: true,
        latestVersion,
      };
    }

    // 권장 업데이트
    if (latestVersion.recommended_update && (versionComparison < 0 || buildComparison < 0)) {
      // 롤아웃 퍼센티지 체크 (점진적 배포)
      if (this.shouldShowUpdate(latestVersion.rollout_percentage)) {
        return {
          updateRequired: true,
          forceUpdate: false,
          latestVersion,
        };
      }
    }

    return { updateRequired: false, forceUpdate: false };
  }

  /**
   * 롤아웃 퍼센티지에 따라 업데이트 표시 여부 결정
   */
  private shouldShowUpdate(rolloutPercentage: number): boolean {
    // 사용자 ID 기반 해시로 결정 (일관성 유지)
    // 여기서는 간단히 랜덤 사용
    return Math.random() * 100 < rolloutPercentage;
  }

  /**
   * 업데이트 프롬프트 표시
   */
  async promptUpdate(): Promise<void> {
    const result = await this.checkForUpdate();
    
    if (!result.updateRequired || !result.latestVersion) {
      return;
    }

    const { forceUpdate, latestVersion } = result;
    const releaseNotes = latestVersion.release_notes_ko || latestVersion.release_notes;

    if (forceUpdate) {
      // 강제 업데이트
      Alert.alert(
        '업데이트 필요',
        `ArtYard ${latestVersion.version}으로 업데이트가 필요합니다.\n\n${releaseNotes}`,
        [
          {
            text: '업데이트',
            onPress: () => this.openStore(latestVersion.download_url),
          },
        ],
        { cancelable: false }
      );
    } else {
      // 권장 업데이트
      Alert.alert(
        '새 버전 사용 가능',
        `ArtYard ${latestVersion.version}이(가) 출시되었습니다.\n\n${releaseNotes}`,
        [
          {
            text: '나중에',
            style: 'cancel',
          },
          {
            text: '업데이트',
            onPress: () => this.openStore(latestVersion.download_url),
          },
        ]
      );
    }
  }

  /**
   * 앱 스토어 열기
   */
  private openStore(url: string): void {
    if (url) {
      Linking.openURL(url);
    } else {
      // 기본 스토어 URL
      const storeUrl = Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/artyard' // 실제 App Store ID로 변경
        : 'https://play.google.com/store/apps/details?id=com.artyard'; // 실제 패키지명으로 변경
      
      Linking.openURL(storeUrl);
    }
  }

  /**
   * 현재 앱 정보 가져오기
   */
  getCurrentInfo() {
    return {
      version: this.currentVersion,
      build: this.currentBuild,
      platform: this.platform,
    };
  }
}

export const versionCheck = new VersionCheckService();

// 편의 함수
export const checkAppVersion = () => versionCheck.promptUpdate();
export const getCurrentAppInfo = () => versionCheck.getCurrentInfo();

