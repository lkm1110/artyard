/**
 * 사용자 작품 관련 React Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { getUserArtworks } from '../services/userArtworkService';
import { useAuthStore } from '../store/authStore';
import type { Artwork } from '../types';

/**
 * 사용자가 업로드한 작품들을 가져오는 훅
 */
export const useUserArtworks = () => {
  const { user } = useAuthStore();

  return useQuery<Artwork[], Error>({
    queryKey: ['userArtworks', user?.id],
    queryFn: () => getUserArtworks(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5분
  });
};
