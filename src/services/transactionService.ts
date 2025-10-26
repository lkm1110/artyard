/**
 * 거래 관리 서비스
 */

import { supabase } from './supabase';
import {
  Transaction,
  TransactionStatus,
  TransactionHistory,
  CreatePaymentRequest,
  CreatePaymentResponse,
  StartShippingRequest,
  calculateFees,
  calculateShippingFee,
  ArtworkShippingSettings,
} from '../types/complete-system';

/**
 * 결제 Intent 생성
 */
export const createPaymentIntent = async (
  request: CreatePaymentRequest
): Promise<CreatePaymentResponse> => {
  try {
    console.log('💳 결제 Intent 생성 시작:', request);
    
    // 1. 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('로그인이 필요합니다');
    }
    
    // 2. 작품 정보 가져오기
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(*)
      `)
      .eq('id', request.artwork_id)
      .single();
    
    if (artworkError || !artwork) {
      throw new Error('작품을 찾을 수 없습니다');
    }
    
    // 판매 가능 확인
    if (artwork.sale_status !== 'available') {
      throw new Error('이 작품은 현재 판매 중이 아닙니다');
    }
    
    // 자기 작품 구매 방지
    if (artwork.author_id === user.id) {
      throw new Error('자신의 작품은 구매할 수 없습니다');
    }
    
    // 3. 배송지 정보
    let shippingAddress;
    
    if (request.shipping_address_id) {
      // 기존 배송지 사용
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('id', request.shipping_address_id)
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        throw new Error('배송지를 찾을 수 없습니다');
      }
      shippingAddress = data;
    } else if (request.new_shipping_address) {
      // 새 배송지 생성
      const { data, error } = await supabase
        .from('shipping_addresses')
        .insert({
          user_id: user.id,
          ...request.new_shipping_address,
        })
        .select()
        .single();
      
      if (error || !data) {
        throw new Error('배송지 저장 실패');
      }
      shippingAddress = data;
    } else {
      throw new Error('배송지 정보가 필요합니다');
    }
    
    // 4. 작품 가격 파싱
    const artworkPrice = parseInt(artwork.price.replace(/\D/g, ''));
    if (isNaN(artworkPrice) || artworkPrice <= 0) {
      throw new Error('작품 가격이 올바르지 않습니다');
    }
    
    // 5. 배송 설정 가져오기
    let shippingSettings: ArtworkShippingSettings | null = null;
    const { data: settings } = await supabase
      .from('artwork_shipping_settings')
      .select('*')
      .eq('artwork_id', artwork.id)
      .single();
    
    if (settings) {
      shippingSettings = settings;
    } else {
      // 기본 배송 설정 생성
      const { data: newSettings } = await supabase
        .from('artwork_shipping_settings')
        .insert({
          artwork_id: artwork.id,
          domestic_enabled: true,
          domestic_fee: 3000,
          domestic_free_threshold: 100000,
          international_enabled: false,
        })
        .select()
        .single();
      
      shippingSettings = newSettings;
    }
    
    if (!shippingSettings) {
      throw new Error('배송 설정을 가져올 수 없습니다');
    }
    
    // 6. 배송비 계산
    const shippingFee = calculateShippingFee(
      shippingAddress.country,
      artworkPrice,
      shippingSettings,
      request.express_shipping || false
    );
    
    // 7. 수수료 계산 (10%)
    const fees = calculateFees(artworkPrice, 0.10);
    
    // 8. Transaction 생성
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        artwork_id: artwork.id,
        buyer_id: user.id,
        seller_id: artwork.author_id,
        amount: artworkPrice,
        shipping_fee: shippingFee,
        platform_fee: fees.platform_fee,
        seller_amount: fees.seller_amount,
        payment_method: 'stripe_card',
        status: 'pending',
        
        // 배송 주소 스냅샷
        shipping_recipient: shippingAddress.recipient_name,
        shipping_phone: shippingAddress.phone,
        shipping_postal_code: shippingAddress.postal_code,
        shipping_address: shippingAddress.address,
        shipping_address_detail: shippingAddress.address_detail,
        shipping_country: shippingAddress.country,
        shipping_memo: shippingAddress.delivery_memo,
        shipping_zone: shippingAddress.country === 'KR' ? 'domestic' : 'international',
      })
      .select()
      .single();
    
    if (transactionError || !transaction) {
      console.error('Transaction 생성 실패:', transactionError);
      throw new Error('거래 생성 실패');
    }
    
    // 9. Stripe Payment Intent 생성 (Supabase Edge Function 호출)
    const { data: paymentIntent, error: stripeError } = await supabase.functions.invoke(
      'create-payment-intent',
      {
        body: {
          transaction_id: transaction.id,
          amount: artworkPrice + shippingFee,
          currency: 'krw',
          metadata: {
            transaction_id: transaction.id,
            artwork_id: artwork.id,
            buyer_id: user.id,
            seller_id: artwork.author_id,
          },
        },
      }
    );
    
    if (stripeError || !paymentIntent) {
      console.error('Stripe Payment Intent 생성 실패:', stripeError);
      // Transaction 삭제
      await supabase.from('transactions').delete().eq('id', transaction.id);
      throw new Error('결제 준비 실패');
    }
    
    // 10. Transaction에 Stripe ID 업데이트
    await supabase
      .from('transactions')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', transaction.id);
    
    console.log('✅ 결제 Intent 생성 완료:', transaction.id);
    
    return {
      client_secret: paymentIntent.client_secret,
      transaction_id: transaction.id,
      amount: artworkPrice,
      shipping_fee: shippingFee,
      total_amount: artworkPrice + shippingFee,
    };
    
  } catch (error: any) {
    console.error('❌ 결제 Intent 생성 오류:', error);
    throw error;
  }
};

/**
 * 결제 완료 처리
 */
export const confirmPayment = async (
  transactionId: string,
  paymentIntentId: string
): Promise<boolean> => {
  try {
    console.log('✅ 결제 완료 처리:', transactionId);
    
    // Transaction 상태 업데이트
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        auto_confirm_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
      })
      .eq('id', transactionId)
      .eq('stripe_payment_intent_id', paymentIntentId);
    
    if (error) {
      console.error('결제 확인 실패:', error);
      return false;
    }
    
    // 판매자에게 알림
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, artwork:artworks(*), seller:profiles!transactions_seller_id_fkey(*)')
      .eq('id', transactionId)
      .single();
    
    if (transaction) {
      await supabase.from('notifications').insert({
        user_id: transaction.seller_id,
        type: 'new_sale',
        title: '새로운 주문이 있습니다! 🎉',
        message: `${transaction.artwork.title} 작품이 판매되었습니다.`,
        link: `/sales/${transactionId}`,
      });
    }
    
    console.log('✅ 결제 완료 처리 성공');
    return true;
    
  } catch (error: any) {
    console.error('❌ 결제 완료 처리 오류:', error);
    return false;
  }
};

/**
 * 내 주문 목록 조회
 */
export const getMyOrders = async (): Promise<Transaction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        artwork:artworks(*),
        seller:profiles!transactions_seller_id_fkey(*)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
    
  } catch (error: any) {
    console.error('내 주문 조회 오류:', error);
    throw error;
  }
};

/**
 * 내 판매 목록 조회
 */
export const getMySales = async (): Promise<Transaction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        artwork:artworks(*),
        buyer:profiles!transactions_buyer_id_fkey(*)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false});
    
    if (error) throw error;
    return data || [];
    
  } catch (error: any) {
    console.error('내 판매 조회 오류:', error);
    throw error;
  }
};

/**
 * 거래 상세 조회
 */
export const getTransactionDetail = async (id: string): Promise<Transaction> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        artwork:artworks(*),
        buyer:profiles!transactions_buyer_id_fkey(*),
        seller:profiles!transactions_seller_id_fkey(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('거래를 찾을 수 없습니다');
    
    return data;
    
  } catch (error: any) {
    console.error('거래 상세 조회 오류:', error);
    throw error;
  }
};

/**
 * 배송 시작
 */
export const startShipping = async (request: StartShippingRequest): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    // 판매자 확인
    const { data: transaction } = await supabase
      .from('transactions')
      .select('seller_id')
      .eq('id', request.transaction_id)
      .single();
    
    if (!transaction || transaction.seller_id !== user.id) {
      throw new Error('권한이 없습니다');
    }
    
    // 배송 시작
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'shipped',
        carrier: request.carrier,
        tracking_number: request.tracking_number,
        shipped_at: new Date().toISOString(),
      })
      .eq('id', request.transaction_id);
    
    if (error) throw error;
    
    // 구매자에게 알림
    const { data: updatedTransaction } = await supabase
      .from('transactions')
      .select('*, buyer:profiles!transactions_buyer_id_fkey(*)')
      .eq('id', request.transaction_id)
      .single();
    
    if (updatedTransaction) {
      await supabase.from('notifications').insert({
        user_id: updatedTransaction.buyer_id,
        type: 'shipping_started',
        title: '배송이 시작되었습니다! 📦',
        message: `송장 번호: ${request.tracking_number}`,
        link: `/orders/${request.transaction_id}`,
      });
    }
    
    console.log('✅ 배송 시작 완료');
    return true;
    
  } catch (error: any) {
    console.error('❌ 배송 시작 오류:', error);
    throw error;
  }
};

/**
 * 수령 확인
 */
export const confirmReceipt = async (transactionId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    // 구매자 확인
    const { data: transaction } = await supabase
      .from('transactions')
      .select('buyer_id, seller_id, seller_amount')
      .eq('id', transactionId)
      .single();
    
    if (!transaction || transaction.buyer_id !== user.id) {
      throw new Error('권한이 없습니다');
    }
    
    // 수령 확인
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', transactionId);
    
    if (error) throw error;
    
    // 판매자에게 정산 알림
    await supabase.from('notifications').insert({
      user_id: transaction.seller_id,
      type: 'payout_ready',
      title: '정산이 완료되었습니다! 💰',
      message: `${transaction.seller_amount.toLocaleString()}원이 정산되었습니다.`,
      link: `/sales/${transactionId}`,
    });
    
    console.log('✅ 수령 확인 완료');
    return true;
    
  } catch (error: any) {
    console.error('❌ 수령 확인 오류:', error);
    throw error;
  }
};

/**
 * 환불 요청
 */
export const requestRefund = async (
  transactionId: string,
  reason: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    // 구매자 확인
    const { data: transaction } = await supabase
      .from('transactions')
      .select('buyer_id')
      .eq('id', transactionId)
      .single();
    
    if (!transaction || transaction.buyer_id !== user.id) {
      throw new Error('권한이 없습니다');
    }
    
    // 분쟁 상태로 변경
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'disputed',
      })
      .eq('id', transactionId);
    
    if (error) throw error;
    
    // 관리자에게 알림 (나중에 구현)
    console.log('환불 요청:', transactionId, reason);
    
    console.log('✅ 환불 요청 완료');
    return true;
    
  } catch (error: any) {
    console.error('❌ 환불 요청 오류:', error);
    throw error;
  }
};

