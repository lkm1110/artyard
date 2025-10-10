/**
 * 댓글 관련 API 서비스
 */

import { supabase } from './supabase';
import type { Comment } from '../types';
import AIOrchestrationService from './ai/aiOrchestrationService';

/**
 * 특정 작품의 댓글 목록 가져오기
 */
export const getArtworkComments = async (artworkId: string): Promise<Comment[]> => {
  try {
    console.log('댓글 목록 조회 시작:', artworkId);

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        artwork_id,
        author_id,
        body,
        created_at,
        author:profiles!comments_author_id_fkey(
          id,
          handle,
          avatar_url,
          school,
          department
        )
      `)
      .eq('artwork_id', artworkId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('댓글 조회 에러:', error);
      throw error;
    }

    // body → content 매핑 (기존 인터페이스 호환)
    const commentsWithContent = comments?.map(comment => ({
      ...comment,
      content: comment.body, // body를 content로 매핑
    })) || [];

    console.log('댓글 조회 성공:', commentsWithContent.length);
    return commentsWithContent as Comment[];

  } catch (error) {
    console.error('댓글 목록 가져오기 실패:', error);
    throw error;
  }
};

/**
 * 새 댓글 작성
 */
export const createComment = async (artworkId: string, content: string): Promise<Comment> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    console.log('댓글 작성 시작:', { artworkId, content: content.substring(0, 50) });

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        artwork_id: artworkId,
        author_id: user.id,
        body: content.trim(), // body 컬럼 사용
      })
      .select(`
        id,
        artwork_id,
        author_id,
        body,
        created_at,
        author:profiles!comments_author_id_fkey(
          id,
          handle,
          avatar_url,
          school,
          department
        )
      `)
      .single();

    if (error) {
      console.error('댓글 작성 실패:', error);
      throw error;
    }

    // 작품의 댓글 수 업데이트
    await supabase.rpc('increment_comments_count', { artwork_id: artworkId });

    // AI 시스템에 사용자 행동 알림
    try {
      await AIOrchestrationService.handleUserAction(
        user.id,
        'comment',
        artworkId,
        { 
          commentId: comment.id,
          content: content.substring(0, 100), // 처음 100자만 전달
          timestamp: new Date().toISOString()
        },
        'comment_interaction'
      );
    } catch (error) {
      console.warn('AI 시스템 연동 실패:', error);
    }

    // body → content 매핑하여 반환
    const commentWithContent = {
      ...comment,
      content: comment.body,
    };

    console.log('댓글 작성 완료:', commentWithContent.id);
    return commentWithContent as Comment;

  } catch (error) {
    console.error('댓글 작성 실패:', error);
    throw error;
  }
};

/**
 * 댓글 수정
 */
export const updateComment = async (commentId: string, content: string): Promise<Comment> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    console.log('댓글 수정 시작:', commentId);

    const { data: comment, error } = await supabase
      .from('comments')
      .update({ body: content.trim() })
      .eq('id', commentId)
      .eq('author_id', user.id) // 본인 댓글만 수정 가능
      .select(`
        id,
        artwork_id,
        author_id,
        body,
        created_at,
        author:profiles!comments_author_id_fkey(
          id,
          handle,
          avatar_url,
          school,
          department
        )
      `)
      .single();

    if (error) {
      console.error('댓글 수정 실패:', error);
      throw error;
    }

    const commentWithContent = {
      ...comment,
      content: comment.body,
    };

    console.log('댓글 수정 완료:', commentWithContent.id);
    return commentWithContent as Comment;

  } catch (error) {
    console.error('댓글 수정 실패:', error);
    throw error;
  }
};

/**
 * 댓글 삭제
 */
export const deleteComment = async (commentId: string, artworkId: string): Promise<void> => {
  try {
    console.log('🗑️ 댓글 삭제 서비스 시작:', { commentId, artworkId });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ 인증 오류:', authError);
      throw authError;
    }
    
    if (!user) {
      console.error('❌ 사용자 인증 실패');
      throw new Error('로그인이 필요합니다.');
    }

    console.log('✅ 사용자 인증 성공:', user.id);

    // 댓글 소유자 확인
    console.log('🔍 댓글 소유자 확인 중...');
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('author_id, body')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('❌ 댓글 조회 오류:', fetchError);
      throw fetchError;
    }

    if (!comment) {
      console.error('❌ 댓글을 찾을 수 없음');
      throw new Error('댓글을 찾을 수 없습니다.');
    }

    console.log('📊 댓글 정보:', {
      commentId,
      authorId: comment.author_id,
      currentUserId: user.id,
      content: comment.body?.substring(0, 50) + '...',
      isOwner: comment.author_id === user.id
    });

    if (comment.author_id !== user.id) {
      console.error('❌ 권한 없음 - 댓글 작성자가 아님');
      throw new Error('자신의 댓글만 삭제할 수 있습니다.');
    }

    console.log('✅ 권한 확인 완료 - 댓글 삭제 진행');

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('author_id', user.id); // 본인 댓글만 삭제 가능

    if (deleteError) {
      console.error('❌ 댓글 삭제 오류:', deleteError);
      console.error('❌ 삭제 오류 상세:', {
        message: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint
      });
      throw deleteError;
    }

    console.log('✅ 댓글 삭제 완료');

    // 작품의 댓글 수 업데이트
    console.log('📉 작품 댓글 수 감소 처리 중...');
    const { error: countError } = await supabase.rpc('decrement_comments_count', { 
      artwork_id: artworkId 
    });

    if (countError) {
      console.error('⚠️ 댓글 수 업데이트 오류 (댓글은 삭제됨):', countError);
    } else {
      console.log('✅ 댓글 수 감소 완료');
    }

    console.log('🎉 댓글 삭제 프로세스 완료:', commentId);

  } catch (error) {
    console.error('💥 댓글 삭제 서비스 오류:', error);
    console.error('💥 오류 상세 정보:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    throw error;
  }
};
