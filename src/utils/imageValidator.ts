/**
 * 이미지 검증 및 압축
 * 20MB 제한 + 자동 압축
 */

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

export interface ImageConstraints {
  maxSizeBytes: number;
  maxWidth: number;
  maxHeight: number;
  minWidth: number;
  minHeight: number;
  allowedFormats: string[];
  autoCompressThreshold: number; // 이 크기 이상이면 자동 압축
  targetCompressSize: number; // 목표 압축 크기
}

export const IMAGE_CONSTRAINTS: ImageConstraints = {
  maxSizeBytes: 20 * 1024 * 1024, // 20MB
  maxWidth: 15000, // 초고해상도 허용 (전문 카메라/스캔 대응)
  maxHeight: 15000,
  minWidth: 600,
  minHeight: 600,
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  autoCompressThreshold: 5 * 1024 * 1024, // 5MB 이상이면 압축
  targetCompressSize: 3 * 1024 * 1024, // 목표: 3MB
};

/**
 * 파일 정보 가져오기
 */
async function getFileInfo(uri: string) {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return {
      exists: fileInfo.exists,
      size: fileInfo.exists ? (fileInfo as any).size : 0,
      uri: fileInfo.uri,
    };
  } catch (error) {
    console.error('Failed to get file info:', error);
    throw new Error('Unable to read image file');
  }
}

/**
 * 이미지 크기 (해상도) 가져오기
 */
async function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
    });
    
    // ImageManipulator는 원본 크기를 반환
    // Image.getSize를 사용할 수도 있지만, 이미 ImageManipulator를 사용 중
    return { width: result.width, height: result.height };
  } catch (error) {
    console.error('Failed to get image dimensions:', error);
    throw new Error('Unable to read image dimensions');
  }
}

/**
 * MIME 타입 추측 (확장자 기반)
 */
function guessMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  
  return mimeTypes[extension || ''] || 'image/jpeg';
}

/**
 * 이미지 검증
 */
export async function validateImage(uri: string): Promise<{
  valid: boolean;
  error?: string;
  fileSize: number;
  width: number;
  height: number;
}> {
  try {
    // 1. 파일 크기 체크
    const { size, exists } = await getFileInfo(uri);
    
    if (!exists) {
      return {
        valid: false,
        error: 'Image file not found',
        fileSize: 0,
        width: 0,
        height: 0,
      };
    }
    
    if (size > IMAGE_CONSTRAINTS.maxSizeBytes) {
      const sizeMB = (size / (1024 * 1024)).toFixed(1);
      const maxMB = IMAGE_CONSTRAINTS.maxSizeBytes / (1024 * 1024);
      return {
        valid: false,
        error: `Image too large (${sizeMB}MB). Maximum: ${maxMB}MB`,
        fileSize: size,
        width: 0,
        height: 0,
      };
    }
    
    // 2. 해상도 체크
    const { width, height } = await getImageDimensions(uri);
    
    if (width > IMAGE_CONSTRAINTS.maxWidth || height > IMAGE_CONSTRAINTS.maxHeight) {
      return {
        valid: false,
        error: `Resolution too high (${width}x${height}). Maximum: ${IMAGE_CONSTRAINTS.maxWidth}x${IMAGE_CONSTRAINTS.maxHeight}`,
        fileSize: size,
        width,
        height,
      };
    }
    
    if (width < IMAGE_CONSTRAINTS.minWidth || height < IMAGE_CONSTRAINTS.minHeight) {
      return {
        valid: false,
        error: `Resolution too low (${width}x${height}). Minimum: ${IMAGE_CONSTRAINTS.minWidth}x${IMAGE_CONSTRAINTS.minHeight}`,
        fileSize: size,
        width,
        height,
      };
    }
    
    // 3. 파일 형식 체크
    const mimeType = guessMimeType(uri);
    if (!IMAGE_CONSTRAINTS.allowedFormats.includes(mimeType)) {
      return {
        valid: false,
        error: 'Invalid format. Allowed: JPEG, PNG, WebP',
        fileSize: size,
        width,
        height,
      };
    }
    
    // 모든 검증 통과
    return {
      valid: true,
      fileSize: size,
      width,
      height,
    };
    
  } catch (error: any) {
    console.error('Image validation error:', error);
    return {
      valid: false,
      error: error.message || 'Failed to validate image',
      fileSize: 0,
      width: 0,
      height: 0,
    };
  }
}

/**
 * 이미지 자동 압축
 * 5MB 이상이면 자동으로 압축 (목표: 3MB)
 */
export async function compressImageIfNeeded(uri: string): Promise<{
  uri: string;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
}> {
  try {
    const { size } = await getFileInfo(uri);
    
    // 5MB 미만이면 압축 안 함
    if (size < IMAGE_CONSTRAINTS.autoCompressThreshold) {
      return {
        uri,
        compressed: false,
        originalSize: size,
        compressedSize: size,
      };
    }
    
    console.log(`🗜️ Compressing image... Original: ${(size / (1024 * 1024)).toFixed(2)}MB`);
    
    // 압축 품질 계산 (목표 크기에 맞춤)
    // 5MB → 목표 3MB → 품질 0.6
    // 10MB → 목표 3MB → 품질 0.3
    const targetRatio = IMAGE_CONSTRAINTS.targetCompressSize / size;
    let quality = Math.max(0.3, Math.min(0.9, targetRatio));
    
    // 1단계 압축 (고해상도는 3000px로 리사이즈)
    let result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 3000 } }], // 최대 3000px로 리사이즈
      { 
        compress: quality, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );
    
    let resultSize = (await getFileInfo(result.uri)).size;
    
    // 여전히 너무 크면 한 번 더 압축
    if (resultSize > IMAGE_CONSTRAINTS.targetCompressSize && quality > 0.4) {
      quality = quality * 0.7;
      result = await ImageManipulator.manipulateAsync(
        result.uri,
        [],
        { 
          compress: quality, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      
      resultSize = (await getFileInfo(result.uri)).size;
    }
    
    console.log(`✅ Compressed: ${(size / (1024 * 1024)).toFixed(2)}MB → ${(resultSize / (1024 * 1024)).toFixed(2)}MB`);
    
    return {
      uri: result.uri,
      compressed: true,
      originalSize: size,
      compressedSize: resultSize,
    };
    
  } catch (error) {
    console.error('Compression failed:', error);
    // 압축 실패 시 원본 반환
    return {
      uri,
      compressed: false,
      originalSize: (await getFileInfo(uri)).size,
      compressedSize: (await getFileInfo(uri)).size,
    };
  }
}

/**
 * 이미지 검증 + 압축 (통합 함수)
 */
export async function validateAndCompressImage(uri: string): Promise<{
  valid: boolean;
  uri: string;
  error?: string;
  stats?: {
    width: number;
    height: number;
    originalSize: number;
    finalSize: number;
    compressed: boolean;
  };
}> {
  try {
    // 1. 파일 존재 및 크기만 먼저 체크
    const { size, exists } = await getFileInfo(uri);
    
    if (!exists) {
      return {
        valid: false,
        uri,
        error: 'Image file not found',
      };
    }
    
    // 2. 해상도 확인
    const { width, height } = await getImageDimensions(uri);
    
    // 3. 최소 해상도 체크
    if (width < IMAGE_CONSTRAINTS.minWidth || height < IMAGE_CONSTRAINTS.minHeight) {
      return {
        valid: false,
        uri,
        error: `Resolution too low (${width}x${height}). Minimum: ${IMAGE_CONSTRAINTS.minWidth}x${IMAGE_CONSTRAINTS.minHeight}`,
      };
    }
    
    // 4. 고해상도이거나 큰 파일이면 자동 압축
    const needsCompression = 
      width > IMAGE_CONSTRAINTS.maxWidth || 
      height > IMAGE_CONSTRAINTS.maxHeight ||
      size > IMAGE_CONSTRAINTS.autoCompressThreshold;
    
    let finalUri = uri;
    let finalSize = size;
    let compressed = false;
    
    if (needsCompression) {
      console.log(`📐 High resolution (${width}x${height}) or large file. Auto-compressing...`);
      const compression = await compressImageIfNeeded(uri);
      finalUri = compression.uri;
      finalSize = compression.compressedSize;
      compressed = compression.compressed;
    }
    
    // 5. 압축 후에도 너무 크면 거부
    if (finalSize > IMAGE_CONSTRAINTS.maxSizeBytes) {
      return {
        valid: false,
        uri,
        error: 'Image too large even after compression. Please use a smaller image.',
      };
    }
    
    // 6. 파일 형식 체크
    const mimeType = guessMimeType(uri);
    if (!IMAGE_CONSTRAINTS.allowedFormats.includes(mimeType)) {
      return {
        valid: false,
        uri,
        error: 'Invalid format. Allowed: JPEG, PNG, WebP',
      };
    }
    
    return {
      valid: true,
      uri: finalUri,
      stats: {
        width,
        height,
        originalSize: size,
        finalSize: finalSize,
        compressed: compressed,
      },
    };
    
  } catch (error: any) {
    console.error('Image validation error:', error);
    return {
      valid: false,
      uri,
      error: error.message || 'Failed to validate image',
    };
  }
}

/**
 * 여러 이미지 일괄 처리
 */
export async function validateAndCompressImages(
  uris: string[],
  onProgress?: (current: number, total: number) => void
): Promise<{
  valid: boolean;
  uris: string[];
  errors: string[];
  stats: {
    totalOriginalSize: number;
    totalFinalSize: number;
    compressedCount: number;
  };
}> {
  const validUris: string[] = [];
  const errors: string[] = [];
  let totalOriginalSize = 0;
  let totalFinalSize = 0;
  let compressedCount = 0;
  
  for (let i = 0; i < uris.length; i++) {
    if (onProgress) {
      onProgress(i + 1, uris.length);
    }
    
    const result = await validateAndCompressImage(uris[i]);
    
    if (result.valid && result.stats) {
      validUris.push(result.uri);
      totalOriginalSize += result.stats.originalSize;
      totalFinalSize += result.stats.finalSize;
      if (result.stats.compressed) {
        compressedCount++;
      }
    } else {
      errors.push(result.error || 'Unknown error');
    }
  }
  
  return {
    valid: errors.length === 0,
    uris: validUris,
    errors,
    stats: {
      totalOriginalSize,
      totalFinalSize,
      compressedCount,
    },
  };
}

