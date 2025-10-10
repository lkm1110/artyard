/**
 * 북마크 관련 React Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { getUserBookmarks } from '../services/bookmarkService';
import { useAuthStore } from '../store/authStore';
import type { Artwork } from '../types';

/**
 * 사용자의 북마크된 작품들을 가져오는 훅
 */
export const useBookmarkedArtworks = () => {
  const { user } = useAuthStore();

  return useQuery<Artwork[], Error>({
    queryKey: ['bookmarks', user?.id],
    queryFn: () => getUserBookmarks(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5분
  });
};
