/**
 * 좋아요 관련 React Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { getUserLikes } from '../services/likeService';
import { useAuthStore } from '../store/authStore';
import type { Artwork } from '../types';

/**
 * 사용자가 좋아요한 작품들을 가져오는 훅
 */
export const useLikedArtworks = () => {
  const { user } = useAuthStore();

  return useQuery<Artwork[], Error>({
    queryKey: ['likes', user?.id],
    queryFn: () => getUserLikes(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

