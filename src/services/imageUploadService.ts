/**
 * 이미지 업로드 서비스 - Supabase Storage 연동
 */

import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';

/**
 * 이미지 압축 유틸리티
 */
const compressImage = async (file: Blob, quality: number = 0.8, maxWidth: number = 1920): Promise<Blob> => {
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
      
      if (authState.isAuthenticated && authState.session?.user) {
        console.log('✅ AuthStore에서 세션 정보 획득');
        user = authState.session.user;
      } else {
        console.error('❌ AuthStore에도 유효한 세션이 없습니다');
        throw new Error('Authentication timeout and no valid session in store');
      }
    }
    
    if (authError && !user) {
      console.error('❌ 인증 오류:', authError);
      console.error('❌ 인증 오류 상세:', {
        message: authError.message,
        statusCode: authError.status,
        statusText: authError.statusText
      });
      throw new Error(`인증 오류: ${authError.message}`);
    }
    
    if (!user) {
      console.error('❌ 로그인된 사용자가 없습니다');
      console.error('❌ Auth data 상세:', {
        data: authResult?.data,
        user: authResult?.data?.user,
        session: authResult?.data?.session
      });
      throw new Error('로그인이 필요합니다.');
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

        let fileData: Blob | File;

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
          console.log('⏳ Fetching mobile URI data...');
          const response = await fetch(imageUri);
          console.log('✅ Fetch response received, converting to blob...');
          fileData = await response.blob();
          console.log('✅ URI to blob conversion complete, size:', fileData.size, 'bytes');
          
          // 큰 이미지 압축 (1MB 이상일 경우)
          if (fileData.size > 1024 * 1024) {
            console.log('📉 Large image detected, compressing...');
            fileData = await compressImage(fileData, 0.8, 1920); // 80% 품질, 최대 1920px
            console.log('✅ Image compressed to:', fileData.size, 'bytes');
          }
        }

        console.log('📊 File data details:', {
          size: fileData.size,
          type: fileData.type,
          validSize: fileData.size > 0
        });

        console.log('📝 Uploading to storage path:', fileName);
        console.log('🪣 Storage bucket: artworks');
        console.log('📤 Upload options:', {
          cacheControl: '3600',
          upsert: false,
          contentType: fileData.type
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
                  contentType: fileData.type || 'image/jpeg',
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
