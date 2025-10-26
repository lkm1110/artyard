/**
 * 리뷰 관리 서비스
 */

import { supabase } from './supabase';
import {
  TransactionReview,
  CreateReviewRequest,
} from '../types/complete-system';

/**
 * 리뷰 작성
 */
export const createReview = async (
  request: CreateReviewRequest
): Promise<TransactionReview> => {
  try {
    console.log('✍️ 리뷰 작성 시작:', request);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    // 1. 거래 확인
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', request.transaction_id)
      .single();
    
    if (transactionError || !transaction) {
      throw new Error('거래를 찾을 수 없습니다');
    }
    
    // 2. 거래 완료 확인
    if (transaction.status !== 'confirmed') {
      throw new Error('거래가 완료된 후 리뷰를 작성할 수 있습니다');
    }
    
    // 3. 역할 확인 (구매자 or 판매자)
    let role: 'buyer' | 'seller';
    let revieweeId: string;
    
    if (transaction.buyer_id === user.id) {
      role = 'buyer';
      revieweeId = transaction.seller_id;
    } else if (transaction.seller_id === user.id) {
      role = 'seller';
      revieweeId = transaction.buyer_id;
    } else {
      throw new Error('이 거래의 참여자가 아닙니다');
    }
    
    // 4. 이미 리뷰 작성했는지 확인
    const { data: existingReview } = await supabase
      .from('transaction_reviews')
      .select('id')
      .eq('transaction_id', request.transaction_id)
      .eq('reviewer_id', user.id)
      .single();
    
    if (existingReview) {
      throw new Error('이미 리뷰를 작성했습니다');
    }
    
    // 5. 리뷰 생성
    const { data: review, error: reviewError } = await supabase
      .from('transaction_reviews')
      .insert({
        transaction_id: request.transaction_id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        role,
        rating: request.rating,
        communication_rating: request.communication_rating,
        accuracy_rating: request.accuracy_rating,
        shipping_rating: role === 'buyer' ? request.shipping_rating : null,
        comment: request.comment,
        images: request.images,
        helpful_count: 0,
      })
      .select(`
        *,
        reviewer:profiles!transaction_reviews_reviewer_id_fkey(*),
        reviewee:profiles!transaction_reviews_reviewee_id_fkey(*)
      `)
      .single();
    
    if (reviewError || !review) {
      console.error('리뷰 생성 실패:', reviewError);
      throw new Error('리뷰 작성 실패');
    }
    
    // 6. 상대방에게 알림
    await supabase.from('notifications').insert({
      user_id: revieweeId,
      type: 'new_review',
      title: '새로운 리뷰가 작성되었습니다! ⭐',
      message: `${request.rating}점 리뷰를 받았습니다.`,
      link: `/reviews/${review.id}`,
    });
    
    console.log('✅ 리뷰 작성 완료:', review.id);
    return review;
    
  } catch (error: any) {
    console.error('❌ 리뷰 작성 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 받은 리뷰 조회
 */
export const getUserReviews = async (
  userId: string,
  role?: 'buyer' | 'seller'
): Promise<TransactionReview[]> => {
  try {
    let query = supabase
      .from('transaction_reviews')
      .select(`
        *,
        reviewer:profiles!transaction_reviews_reviewer_id_fkey(*),
        transaction:transactions(*)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
    
  } catch (error: any) {
    console.error('리뷰 조회 오류:', error);
    throw error;
  }
};

/**
 * 거래의 리뷰 조회
 */
export const getTransactionReviews = async (
  transactionId: string
): Promise<TransactionReview[]> => {
  try {
    const { data, error } = await supabase
      .from('transaction_reviews')
      .select(`
        *,
        reviewer:profiles!transaction_reviews_reviewer_id_fkey(*),
        reviewee:profiles!transaction_reviews_reviewee_id_fkey(*)
      `)
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
    
  } catch (error: any) {
    console.error('거래 리뷰 조회 오류:', error);
    throw error;
  }
};

/**
 * 리뷰 유용성 투표
 */
export const voteReviewHelpful = async (reviewId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    // 유용성 카운트 증가
    const { error } = await supabase.rpc('increment_review_helpful', {
      review_id: reviewId,
    });
    
    if (error) {
      // RPC 함수가 없으면 직접 업데이트
      const { data: review } = await supabase
        .from('transaction_reviews')
        .select('helpful_count')
        .eq('id', reviewId)
        .single();
      
      if (review) {
        await supabase
          .from('transaction_reviews')
          .update({ helpful_count: (review.helpful_count || 0) + 1 })
          .eq('id', reviewId);
      }
    }
    
    return true;
    
  } catch (error: any) {
    console.error('유용성 투표 오류:', error);
    throw error;
  }
};

/**
 * 리뷰 수정
 */
export const updateReview = async (
  reviewId: string,
  updates: Partial<CreateReviewRequest>
): Promise<TransactionReview> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    const { data: review, error } = await supabase
      .from('transaction_reviews')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('reviewer_id', user.id)
      .select(`
        *,
        reviewer:profiles!transaction_reviews_reviewer_id_fkey(*),
        reviewee:profiles!transaction_reviews_reviewee_id_fkey(*)
      `)
      .single();
    
    if (error || !review) {
      throw new Error('리뷰 수정 실패');
    }
    
    return review;
    
  } catch (error: any) {
    console.error('리뷰 수정 오류:', error);
    throw error;
  }
};

/**
 * 리뷰 삭제
 */
export const deleteReview = async (reviewId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    const { error } = await supabase
      .from('transaction_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('reviewer_id', user.id);
    
    if (error) throw error;
    
    return true;
    
  } catch (error: any) {
    console.error('리뷰 삭제 오류:', error);
    throw error;
  }
};

/**
 * 내가 작성한 리뷰 조회
 */
export const getMyReviews = async (): Promise<TransactionReview[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    const { data, error } = await supabase
      .from('transaction_reviews')
      .select(`
        *,
        reviewee:profiles!transaction_reviews_reviewee_id_fkey(*),
        transaction:transactions(*, artwork:artworks(*))
      `)
      .eq('reviewer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
    
  } catch (error: any) {
    console.error('내 리뷰 조회 오류:', error);
    throw error;
  }
};

/**
 * 리뷰 작성 가능한 거래 조회
 */
export const getReviewableTransactions = async (): Promise<string[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    // 1. 완료된 거래 조회
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('status', 'confirmed')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
    
    if (!transactions || transactions.length === 0) return [];
    
    // 2. 이미 작성한 리뷰 조회
    const { data: reviews } = await supabase
      .from('transaction_reviews')
      .select('transaction_id')
      .eq('reviewer_id', user.id);
    
    const reviewedIds = new Set(reviews?.map(r => r.transaction_id) || []);
    
    // 3. 리뷰 안 한 거래만 필터링
    return transactions
      .filter(t => !reviewedIds.has(t.id))
      .map(t => t.id);
    
  } catch (error: any) {
    console.error('리뷰 가능 거래 조회 오류:', error);
    throw error;
  }
};

