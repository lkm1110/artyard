/**
 * 작품 관련 React Query 훅
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getArtworks,
  getArtworkDetail,
  toggleArtworkLike,
  toggleArtworkBookmark,
  uploadArtwork,
  updateArtwork,
  deleteArtwork,
} from '../services/artworkService';
import type { Artwork } from '../types';

/**
 * 작품 목록 조회 훅 (기존 - 페이지네이션)
 */
export const useArtworks = (
  page: number = 1,
  limit: number = 10,
  filter?: {
    material?: string;
    price?: string;
    search?: string;
    priceRange?: { min: number; max: number };
    sizeRange?: { min: number; max: number };
    categories?: string[];
  }
) => {
  return useQuery({
    queryKey: ['artworks', page, limit, filter],
    queryFn: () => getArtworks(page, limit, filter),
    staleTime: 1000 * 60 * 5, // 5분
  });
};

/**
 * 작품 목록 무한 스크롤 훅
 */
export const useInfiniteArtworks = (
  limit: number = 20,
  filter?: {
    material?: string;
    price?: string;
    search?: string;
    priceRange?: { min: number; max: number };
    sizeRange?: { min: number; max: number };
    categories?: string[];
  }
) => {
  return useInfiniteQuery({
    queryKey: ['artworks-infinite', limit, filter],
    queryFn: ({ pageParam = 1 }) => getArtworks(pageParam, limit, filter),
    getNextPageParam: (lastPage, allPages) => {
      // 마지막 페이지의 데이터가 limit보다 적으면 더 이상 페이지 없음
      if (lastPage.data.length < limit) {
        return undefined;
      }
      // 다음 페이지 번호 반환
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

/**
 * 작품 상세 조회 훅
 */
export const useArtworkDetail = (artworkId: string, userId?: string) => {
  return useQuery({
    queryKey: ['artwork', artworkId, userId],
    queryFn: () => getArtworkDetail(artworkId, userId),
    enabled: !!artworkId,
  });
};

/**
 * 작품 좋아요 토글 훅
 */
export const useToggleArtworkLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleArtworkLike,
    
    onSuccess: (isLiked, artworkId) => {
      console.log('✅ Like toggled successfully:', isLiked);
      
      // ✅ 서버에서 최신 데이터를 가져와서 UI 업데이트
      // invalidate만 하고 자동 refetch는 staleTime에 의해 제어됨
      queryClient.invalidateQueries({ queryKey: ['artworks-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['artworkDetail', artworkId] });
    },
    
    onError: (error) => {
      console.error('❌ Like toggle error:', error);
    },
  });
};

/**
 * 작품 북마크 토글 훅
 */
export const useToggleArtworkBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleArtworkBookmark,
    
    // ✅ Optimistic Update: UI 즉시 업데이트
    onMutate: async (artworkId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['artworks-infinite'] });
      
      // 이전 데이터 백업
      const previousData = queryClient.getQueryData(['artworks-infinite']);
      
      // 즉시 UI 업데이트
      queryClient.setQueryData(['artworks-infinite'], (old: any) => {
        if (!old?.pages) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            artworks: page.artworks.map((artwork: any) =>
              artwork.id === artworkId
                ? { ...artwork, is_bookmarked: !artwork.is_bookmarked }
                : artwork
            ),
          })),
        };
      });
      
      return { previousData };
    },
    
    onError: (error, artworkId, context: any) => {
      console.error('❌ Bookmark toggle error:', error);
      // 에러 시 이전 데이터로 롤백
      if (context?.previousData) {
        queryClient.setQueryData(['artworks-infinite'], context.previousData);
      }
    },
    
    onSettled: (isBookmarked, error, artworkId) => {
      // ✅ 즉시 모든 관련 쿼리 refetch (invalidate보다 확실함)
      queryClient.refetchQueries({ queryKey: ['artworks-infinite'] });
      queryClient.refetchQueries({ queryKey: ['artworkDetail', artworkId] });
      // 북마크 페이지도 갱신
      queryClient.refetchQueries({ queryKey: ['bookmarks'] });
    },
  });
};

/**
 * 작품 업로드 훅
 */
export const useUploadArtwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadArtwork,
    onSuccess: (newArtwork) => {
      // 작품 목록 무효화하여 새 작품이 나타나도록 함
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artworks-infinite'] });
      console.log('✅ Artwork uploaded successfully:', newArtwork.title);
      console.log('🔄 Main feed will refresh automatically');
    },
    onError: (error) => {
      console.error('❌ Artwork upload error:', error);
    },
  });
};

/**
 * 작품 수정 훅
 */
export const useUpdateArtwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ artworkId, updateData }: {
      artworkId: string;
      updateData: {
        title?: string;
        description?: string;
        material?: string;
        size?: string;
        year?: number;
        edition?: string;
        price?: string;
      };
    }) => updateArtwork(artworkId, updateData),
    onSuccess: (updatedArtwork) => {
      // 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artwork', updatedArtwork.id] });
      queryClient.invalidateQueries({ queryKey: ['userArtworks'] });
      console.log('작품 수정 성공:', updatedArtwork.title);
    },
    onError: (error) => {
      console.error('작품 수정 오류:', error);
    },
  });
};

/**
 * 작품 삭제 훅
 */
export const useDeleteArtwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteArtwork,
    onSuccess: (_, artworkId) => {
      // ✅ 즉시 모든 관련 쿼리 refetch (invalidate보다 확실함)
      queryClient.refetchQueries({ queryKey: ['artworks'] });
      queryClient.refetchQueries({ queryKey: ['artworks-infinite'] }); // 메인 피드
      queryClient.refetchQueries({ queryKey: ['artwork', artworkId] });
      queryClient.refetchQueries({ queryKey: ['userArtworks'] }); // 프로필 작품 목록
      queryClient.refetchQueries({ queryKey: ['bookmarks'] }); // 북마크 목록
      console.log('✅ 작품 삭제 성공:', artworkId);
      console.log('✅ 모든 화면 갱신 완료');
    },
    onError: (error) => {
      console.error('❌ 작품 삭제 오류:', error);
    },
  });
};

