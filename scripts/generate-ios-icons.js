/**
 * iOS 앱 아이콘 생성 스크립트
 * Artyard 로고를 iOS에 필요한 모든 크기로 변환
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// iOS에서 요구하는 모든 아이콘 크기
const IOS_ICON_SIZES = [
  // iPhone
  { size: 20, scale: 2, name: 'Icon-20@2x.png' },
  { size: 20, scale: 3, name: 'Icon-20@3x.png' },
  { size: 29, scale: 2, name: 'Icon-29@2x.png' },
  { size: 29, scale: 3, name: 'Icon-29@3x.png' },
  { size: 40, scale: 2, name: 'Icon-40@2x.png' },
  { size: 40, scale: 3, name: 'Icon-40@3x.png' },
  { size: 60, scale: 2, name: 'Icon-60@2x.png' },
  { size: 60, scale: 3, name: 'Icon-60@3x.png' },
  
  // iPad
  { size: 20, scale: 1, name: 'Icon-20.png' },
  { size: 29, scale: 1, name: 'Icon-29.png' },
  { size: 40, scale: 1, name: 'Icon-40.png' },
  { size: 76, scale: 1, name: 'Icon-76.png' },
  { size: 76, scale: 2, name: 'Icon-76@2x.png' },
  { size: 83.5, scale: 2, name: 'Icon-83.5@2x.png' },
  
  // App Store
  { size: 1024, scale: 1, name: 'Icon-1024.png' },
];

// Expo에서 요구하는 아이콘 크기
const EXPO_ICONS = [
  { size: 48, name: 'icon-48.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 1024, name: 'icon.png' },
];

const SOURCE_LOGO = path.join(__dirname, '../assets/artyard_logo_512.png');
const IOS_OUTPUT_DIR = path.join(__dirname, '../assets/ios');
const ASSETS_DIR = path.join(__dirname, '../assets');

async function generateIcons() {
  console.log('🎨 Starting iOS icon generation...\n');
  
  // iOS 아이콘 디렉토리 생성
  if (!fs.existsSync(IOS_OUTPUT_DIR)) {
    fs.mkdirSync(IOS_OUTPUT_DIR, { recursive: true });
  }

  // 로고 파일 확인
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error('❌ Error: Source logo not found at', SOURCE_LOGO);
    process.exit(1);
  }

  console.log('✅ Source logo found:', SOURCE_LOGO);
  console.log('📁 Output directory:', IOS_OUTPUT_DIR);
  console.log('');

  // iOS 아이콘 생성
  console.log('📱 Generating iOS icons...');
  for (const icon of IOS_ICON_SIZES) {
    const actualSize = Math.round(icon.size * icon.scale);
    const outputPath = path.join(IOS_OUTPUT_DIR, icon.name);
    
    try {
      await sharp(SOURCE_LOGO)
        .resize(actualSize, actualSize, {
          fit: 'contain',
          background: { r: 236, g: 72, b: 153, alpha: 1 } // #EC4899 (ArtYard 핑크)
        })
        .png()
        .toFile(outputPath);
      
      console.log(`  ✓ ${icon.name} (${actualSize}x${actualSize})`);
    } catch (error) {
      console.error(`  ✗ Failed to generate ${icon.name}:`, error.message);
    }
  }

  // Expo 기본 아이콘 생성
  console.log('\n🌟 Generating Expo icons...');
  for (const icon of EXPO_ICONS) {
    const outputPath = path.join(ASSETS_DIR, icon.name);
    
    try {
      await sharp(SOURCE_LOGO)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 236, g: 72, b: 153, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`  ✗ Failed to generate ${icon.name}:`, error.message);
    }
  }

  // adaptive-icon도 업데이트
  console.log('\n🤖 Updating Android adaptive icon...');
  try {
    await sharp(SOURCE_LOGO)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // 투명 배경
      })
      .png()
      .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
    console.log('  ✓ adaptive-icon.png (1024x1024)');
  } catch (error) {
    console.error('  ✗ Failed to generate adaptive-icon:', error.message);
  }

  console.log('\n✨ All icons generated successfully!\n');
  console.log('📝 Next steps:');
  console.log('   1. Run: npx expo prebuild --clean');
  console.log('   2. Build iOS: eas build --platform ios');
  console.log('   3. Submit to App Store\n');
}

// 실행
generateIcons().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

