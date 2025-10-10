/**
 * 작품 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
 * 작품 목록 조회 훅
 */
export const useArtworks = (
  page: number = 1,
  limit: number = 10,
  filter?: {
    material?: string;
    price?: string;
    search?: string;
  }
) => {
  return useQuery({
    queryKey: ['artworks', page, limit, filter],
    queryFn: () => getArtworks(page, limit, filter),
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
      // 관련 쿼리들 무효화하여 최신 데이터 반영
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artwork', artworkId] });
      
      // 옵티미스틱 업데이트도 가능하지만 일단은 간단하게 구현
    },
    onError: (error) => {
      console.error('좋아요 토글 오류:', error);
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
    onSuccess: (isBookmarked, artworkId) => {
      // 관련 쿼리들 무효화하여 최신 데이터 반영
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artwork', artworkId] });
    },
    onError: (error) => {
      console.error('북마크 토글 오류:', error);
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
      console.log('작품 업로드 성공:', newArtwork.title);
    },
    onError: (error) => {
      console.error('작품 업로드 오류:', error);
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
      // 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artwork', artworkId] });
      queryClient.invalidateQueries({ queryKey: ['userArtworks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      console.log('작품 삭제 성공:', artworkId);
    },
    onError: (error) => {
      console.error('작품 삭제 오류:', error);
    },
  });
};

