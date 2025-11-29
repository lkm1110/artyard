/**
 * 빌드 후 Supabase에 버전 정보 동기화
 * 
 * 사용법:
 * node scripts/sync-version.js ios
 * node scripts/sync-version.js android
 */

const { createClient } = require('@supabase/supabase-js');
const appConfig = require('../app.json');

const SUPABASE_URL = process.env.SUPABASE_URL || appConfig.expo.extra.supabaseUrl;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // 서비스 키 필요!

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY 환경 변수가 필요합니다!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const platform = process.argv[2]; // 'ios' or 'android'

if (!platform || !['ios', 'android'].includes(platform)) {
  console.error('❌ 플랫폼을 지정해주세요: node sync-version.js ios|android');
  process.exit(1);
}

async function syncVersion() {
  const version = appConfig.expo.version;
  const buildNumber = platform === 'ios' 
    ? parseInt(appConfig.expo.ios.buildNumber, 10)
    : appConfig.expo.android.versionCode;

  console.log(`\n🔄 버전 동기화 시작...`);
  console.log(`   플랫폼: ${platform}`);
  console.log(`   버전: ${version}`);
  console.log(`   빌드: ${buildNumber}\n`);

  try {
    // 기존 버전 비활성화
    const { error: updateError } = await supabase
      .from('app_versions')
      .update({ is_active: false })
      .eq('platform', platform);

    if (updateError) throw updateError;

    // 새 버전 추가
    const { data, error: insertError } = await supabase
      .from('app_versions')
      .insert({
        platform: platform,
        version: version,
        build_number: buildNumber,
        min_supported_version: '1.0.0',
        min_supported_build: 1,
        force_update: false,
        recommended_update: true,
        release_notes: 'Bug fixes and performance improvements',
        release_notes_ko: '버그 수정 및 성능 개선',
        download_url: platform === 'ios'
          ? 'https://apps.apple.com/app/artyard'
          : 'https://play.google.com/store/apps/details?id=com.artyard.app',
        is_active: true,
        rollout_percentage: 100,
      });

    if (insertError) throw insertError;

    console.log(`✅ 버전 동기화 완료!`);
    console.log(`   ${platform} ${version} (Build ${buildNumber}) 등록됨\n`);

  } catch (error) {
    console.error('❌ 동기화 실패:', error.message);
    process.exit(1);
  }
}

syncVersion();

