/**
 * 이미지 업로드 서비스 - Supabase Storage 연동
 */

import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';

/**
 * 이미지 압축 유틸리티 (웹 전용)
 */
const compressImage = async (file: Blob, quality: number = 0.8, maxWidth: number = 1920): Promise<Blob> => {
  // 웹 환경이 아니거나 document가 없으면 원본 반환
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    console.log('⚠️ Canvas API not available (mobile), skipping compression');
    return file;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // 비율 유지하며 크기 조정
      const aspectRatio = img.width / img.height;
      let { width, height } = img;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);
      
      // Blob으로 변환
      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      console.warn('⚠️ Image compression failed, using original');
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 이미지를 Supabase Storage에 업로드
 */
export const uploadImagesToStorage = async (imageUris: string[]): Promise<string[]> => {
  console.log('🚀 uploadImagesToStorage 함수 시작!');
  console.log('📋 Input imageUris:', imageUris);
  
  try {
    console.log('🔐 사용자 인증 확인 중...');
    
    // 인증 확인에 타임아웃 추가 (10초)
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Authentication timeout after 10 seconds')), 10000)
    );
    
    console.log('⏱️ 인증 API 호출 시작...');
    let authResult: any;
    let user: any = null;
    let authError: any = null;
    
    try {
      authResult = await Promise.race([authPromise, timeoutPromise]) as any;
      console.log('📨 인증 API 응답 받음:', {
        hasData: !!authResult.data,
        hasUser: !!authResult.data?.user,
        hasError: !!authResult.error,
        userId: authResult.data?.user?.id
      });
      
      user = authResult.data?.user;
      authError = authResult.error;
    } catch (timeoutError) {
      console.warn('⏰ 인증 API 타임아웃, AuthStore에서 세션 확인 시도...');
      
      // AuthStore에서 현재 세션 정보 가져오기 (fallback)
      const authState = useAuthStore.getState();
      console.log('📂 AuthStore 상태:', {
        isAuthenticated: authState.isAuthenticated,
        hasUser: !!authState.user,
        hasSession: !!authState.session,
        userId: authState.user?.id
      });
      
      // authStore에서 user 정보 가져오기 (session.user 또는 user.id)
      if (authState.isAuthenticated && (authState.session?.user || authState.user?.id)) {
        console.log('✅ AuthStore에서 세션 정보 획득');
        user = authState.session?.user || {
          id: authState.user?.id,
          email: authState.user?.id, // fallback
        };
      } else {
        console.error('❌ AuthStore에도 유효한 세션이 없습니다');
        throw new Error('인증 오류: 로그인이 필요합니다');
      }
    }
    
    // user가 있으면 성공 (authError 무시)
    if (!user) {
      console.error('❌ 인증 오류: user 정보 없음');
      if (authError) {
        console.error('❌ 인증 오류 상세:', {
          message: authError.message,
          statusCode: authError.status,
          statusText: authError.statusText
        });
      }
      throw new Error('인증 오류: 로그인이 필요합니다');
    }
    
    console.log('✅ 사용자 인증 완료:', user.id);
    console.log('✅ 사용자 정보:', {
      id: user.id,
      email: user.email,
      createdAt: user.created_at
    });

    const uploadedUrls: string[] = [];

    console.log('📸 Starting image upload...', imageUris.length, 'images');

    for (let i = 0; i < imageUris.length; i++) {
      const imageUri = imageUris[i];
      console.log(`⬆️ Uploading image ${i + 1}/${imageUris.length}:`, imageUri.substring(0, 50) + '...');

      try {
        // 파일명 생성 (중복 방지)
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileName = `${user.id}/${timestamp}_${randomId}.jpg`;
        console.log('📝 Generated filename:', fileName);

        let fileData: Blob | File | ArrayBuffer;

        console.log('🔄 Converting image to blob...');
        console.log('📋 Image URI details:', {
          type: imageUri.startsWith('data:') ? 'base64' : 'uri',
          length: imageUri.length,
          preview: imageUri.substring(0, 100) + '...'
        });
        
        if (imageUri.startsWith('data:')) {
          // Base64 데이터 (웹에서 업로드한 경우)
          console.log('📄 Processing base64 image');
          console.log('⏳ Fetching base64 data...');
          const response = await fetch(imageUri);
          console.log('✅ Fetch response received, converting to blob...');
          fileData = await response.blob();
          console.log('✅ Base64 to blob conversion complete, size:', fileData.size, 'bytes');
          
          // 큰 이미지 압축 (1MB 이상일 경우)
          if (fileData.size > 1024 * 1024) {
            console.log('📉 Large image detected, compressing...');
            fileData = await compressImage(fileData, 0.8, 1920); // 80% 품질, 최대 1920px
            console.log('✅ Image compressed to:', fileData.size, 'bytes');
          }
        } else {
          // 파일 URI (모바일에서 촬영/선택한 경우)
          console.log('📱 Processing mobile URI');
          console.log('⏳ Reading file from URI...');
          
          // React Native에서는 ArrayBuffer를 직접 사용 (Blob polyfill 문제 회피)
          try {
            const response = await fetch(imageUri);
            console.log('✅ Fetch response received');
            
            // ArrayBuffer로 변환 (Supabase Storage가 ArrayBuffer를 지원함)
            fileData = await response.arrayBuffer();
            console.log('✅ ArrayBuffer conversion complete, size:', fileData.byteLength, 'bytes');
            
          } catch (error) {
            console.error('❌ Failed to convert URI to ArrayBuffer:', error);
            throw new Error(`Failed to read image file: ${error}`);
          }
        }

        console.log('📊 File data details:', {
          size: fileData instanceof ArrayBuffer ? fileData.byteLength : fileData.size,
          type: fileData instanceof ArrayBuffer ? 'ArrayBuffer (image/jpeg)' : fileData.type,
          validSize: (fileData instanceof ArrayBuffer ? fileData.byteLength : fileData.size) > 0
        });

        // contentType 결정 (ArrayBuffer는 type이 없으므로 명시적으로 설정)
        const contentType = fileData instanceof ArrayBuffer ? 'image/jpeg' : (fileData.type || 'image/jpeg');
        
        console.log('📝 Uploading to storage path:', fileName);
        console.log('🪣 Storage bucket: artworks');
        console.log('📤 Upload options:', {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType
        });

        console.log('⏳ Starting Supabase Storage upload...');
        
        // 타임아웃과 재시도 로직 추가
        const uploadWithTimeout = async (retries = 3): Promise<{ data: any; error: any }> => {
          for (let attempt = 1; attempt <= retries; attempt++) {
            console.log(`🔄 Upload attempt ${attempt}/${retries}`);
            
            try {
              // Promise.race로 30초 타임아웃 설정
              const uploadPromise = supabase.storage
                .from('artworks')
                .upload(fileName, fileData, {
                  cacheControl: '3600',
                  upsert: false,
                  contentType: contentType,
                });

              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Upload timeout after 30s')), 30000)
              );

              const result = await Promise.race([uploadPromise, timeoutPromise]);
              console.log(`✅ Upload attempt ${attempt} completed`);
              return result as { data: any; error: any };
              
            } catch (error: any) {
              console.log(`⚠️ Upload attempt ${attempt} failed:`, error.message);
              if (attempt === retries) {
                return { data: null, error: { message: `Upload failed after ${retries} attempts: ${error.message}` } };
              }
              // 재시도 전 잠시 대기
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          return { data: null, error: { message: 'Unexpected error' } };
        };

        const { data: uploadData, error: uploadError } = await uploadWithTimeout();

        console.log('📨 Storage upload response:', {
          data: uploadData,
          error: uploadError
        });

        if (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          console.error('📋 Upload details:', {
            fileName,
            fileSize: fileData.size,
            fileType: fileData.type,
            bucketName: 'artworks',
            errorCode: uploadError.statusCode,
            errorMessage: uploadError.message
          });
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        console.log('✅ Image uploaded successfully:', uploadData.path);

        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from('artworks')
          .getPublicUrl(uploadData.path);

        const publicUrl = urlData.publicUrl;
        uploadedUrls.push(publicUrl);
        
        console.log('🔗 Public URL generated:', publicUrl);

      } catch (error) {
        console.error(`💥 Image ${i + 1} upload failed:`, error);
        console.error(`💥 Error details for image ${i + 1}:`, {
          imageUri: imageUri.substring(0, 100) + '...',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : null,
          step: 'Image processing or upload'
        });
        throw error;
      }
    }

    console.log('🎉 All images uploaded successfully!', uploadedUrls.length, 'URLs');
    return uploadedUrls;

  } catch (error) {
    console.error('💥 Image upload service error:', error);
    console.error('💥 Complete error context:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorType: typeof error,
      errorStack: error instanceof Error ? error.stack : null,
      inputImageCount: imageUris.length,
      function: 'uploadImagesToStorage'
    });
    throw error;
  }
};

/**
 * 이미지 삭제 (필요시 사용)
 */
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    // URL에서 파일 경로 추출
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folderPath = pathParts.slice(-2, -1)[0]; // user ID 폴더
    const filePath = `${folderPath}/${fileName}`;

    console.log('🗑️ Deleting image from storage:', filePath);

    const { error } = await supabase.storage
      .from('artworks')
      .remove([filePath]);

    if (error) throw error;
    
    console.log('✅ Image deleted successfully');
  } catch (error) {
    console.error('❌ Image deletion failed:', error);
    throw error;
  }
};
