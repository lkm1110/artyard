/**
 * 댓글 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getArtworkComments, createComment, updateComment, deleteComment } from '../services/commentService';
import type { Comment } from '../types';

/**
 * 특정 작품의 댓글 목록 조회
 */
export const useArtworkComments = (artworkId: string) => {
  return useQuery({
    queryKey: ['comments', artworkId],
    queryFn: () => getArtworkComments(artworkId),
    enabled: !!artworkId,
    staleTime: 30 * 1000, // 30초 동안 fresh 상태 유지
  });
};

/**
 * 댓글 작성 뮤테이션
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ artworkId, content }: { artworkId: string; content: string }) =>
      createComment(artworkId, content),
    
    onSuccess: (newComment: Comment) => {
      console.log('댓글 작성 성공, 캐시 업데이트:', newComment.id);

      // 댓글 목록 캐시 업데이트 (Optimistic Update)
      queryClient.setQueryData(
        ['comments', newComment.artwork_id],
        (oldComments: Comment[] = []) => [...oldComments, newComment]
      );

      // 작품 목록 캐시도 업데이트 (댓글 수 증가)
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artwork', newComment.artwork_id] });
    },

    onError: (error) => {
      console.error('댓글 작성 실패:', error);
    },
  });
};

/**
 * 댓글 수정 뮤테이션
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateComment(commentId, content),
    
    onSuccess: (updatedComment: Comment) => {
      console.log('댓글 수정 성공, 캐시 업데이트:', updatedComment.id);

      // 댓글 목록 캐시 업데이트
      queryClient.setQueryData(
        ['comments', updatedComment.artwork_id],
        (oldComments: Comment[] = []) =>
          oldComments.map(comment =>
            comment.id === updatedComment.id ? updatedComment : comment
          )
      );
    },

    onError: (error) => {
      console.error('댓글 수정 실패:', error);
    },
  });
};

/**
 * 댓글 삭제 뮤테이션
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, artworkId }: { commentId: string; artworkId: string }) =>
      deleteComment(commentId, artworkId),
    
    onSuccess: (_, { commentId, artworkId }) => {
      console.log('댓글 삭제 성공, 캐시 업데이트:', commentId);

      // 댓글 목록 캐시 업데이트
      queryClient.setQueryData(
        ['comments', artworkId],
        (oldComments: Comment[] = []) =>
          oldComments.filter(comment => comment.id !== commentId)
      );

      // 작품 목록 캐시도 업데이트 (댓글 수 감소)
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artwork', artworkId] });
    },

    onError: (error) => {
      console.error('댓글 삭제 실패:', error);
    },
  });
};
