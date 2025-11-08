/**
 * Transaction Service
 * Simplified for marketplace model - shipping arranged between buyer/seller
 */

import { supabase } from './supabase';
import {
  Transaction,
  TransactionStatus,
  CreatePaymentRequest,
  calculateFees,
} from '../types/transaction';

/**
 * Create payment intent (2Checkout integration point)
 */
export const createPaymentIntent = async (
  request: CreatePaymentRequest
): Promise<{
  transaction_id: string;
  sale_price: number;
  platform_fee: number;
  payment_fee: number;
  seller_amount: number;
}> => {
  try {
    console.log('💳 Creating payment intent:', request);
    
    // 1. Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Login required');
    }
    
    // 2. Get artwork info
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select(`
        *,
        author:profiles!artworks_author_id_fkey(*)
      `)
      .eq('id', request.artwork_id)
      .single();
    
    if (artworkError || !artwork) {
      throw new Error('Artwork not found');
    }
    
    // Check availability
    if (artwork.sale_status !== 'available') {
      throw new Error('This artwork is not available for sale');
    }
    
    // Prevent self-purchase
    if (artwork.author_id === user.id) {
      throw new Error('Cannot purchase your own artwork');
    }
    
    // 3. Parse sale price
    const salePrice = parseInt(artwork.price.replace(/\D/g, ''));
    if (isNaN(salePrice) || salePrice <= 0) {
      throw new Error('Invalid artwork price');
    }
    
    // 4. Calculate fees (platform fee included in sale price)
    const fees = calculateFees(salePrice);
    
    // 5. Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        artwork_id: artwork.id,
        buyer_id: user.id,
        seller_id: artwork.author_id,
        amount: salePrice,
        platform_fee: fees.platform_fee,
        payment_fee: fees.payment_fee,
        seller_amount: fees.seller_amount,
        payment_method: '2checkout',
        status: 'pending',
        
        // Optional contact info (for seller reference)
        buyer_name: request.contact_name,
        buyer_phone: request.contact_phone,
        buyer_address: request.contact_address,
        delivery_notes: request.delivery_notes,
      })
      .select()
      .single();
    
    if (transactionError || !transaction) {
      console.error('Transaction creation failed:', transactionError);
      throw new Error('Failed to create transaction');
    }
    
    console.log('✅ Payment intent created:', transaction.id);
    
    return {
      transaction_id: transaction.id,
      sale_price: salePrice,
      platform_fee: fees.platform_fee,
      payment_fee: fees.payment_fee,
      seller_amount: fees.seller_amount,
    };
    
  } catch (error: any) {
    console.error('❌ Payment intent creation error:', error);
    throw error;
  }
};

/**
 * Confirm payment (called after 2Checkout success)
 */
export const confirmPayment = async (
  transactionId: string,
  paymentReference: string
): Promise<boolean> => {
  try {
    console.log('✅ Confirming payment:', transactionId);
    
    // Update transaction status
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'paid',
        payment_intent_id: paymentReference,
        paid_at: new Date().toISOString(),
        auto_confirm_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Auto-confirm after 7 days
      })
      .eq('id', transactionId);
    
    if (error) {
      console.error('Payment confirmation failed:', error);
      return false;
    }
    
    // Notify seller
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, artwork:artworks(*), seller:profiles!transactions_seller_id_fkey(*)')
      .eq('id', transactionId)
      .single();
    
    if (transaction) {
      await supabase.from('notifications').insert({
        user_id: transaction.seller_id,
        type: 'new_sale',
        title: 'New Order! 🎉',
        message: `Your artwork "${transaction.artwork.title}" has been sold.`,
        link: `/sales/${transactionId}`,
      });
    }
    
    console.log('✅ Payment confirmed successfully');
    return true;
    
  } catch (error: any) {
    console.error('❌ Payment confirmation error:', error);
    return false;
  }
};

/**
 * Get my orders (as buyer)
 */
export const getMyOrders = async (): Promise<Transaction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login required');
    
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
    console.error('Error fetching orders:', error);
    throw error;
  }
};

/**
 * Get my sales (as seller)
 */
export const getMySales = async (): Promise<Transaction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login required');
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        artwork:artworks(*),
        buyer:profiles!transactions_buyer_id_fkey(*)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
    
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

/**
 * Get transaction details
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
    if (!data) throw new Error('Transaction not found');
    
    return data;
    
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
};

/**
 * Confirm receipt (buyer confirms delivery)
 * This releases funds from escrow to seller
 */
export const confirmReceipt = async (transactionId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login required');
    
    // Verify buyer
    const { data: transaction } = await supabase
      .from('transactions')
      .select('buyer_id, seller_id, seller_amount')
      .eq('id', transactionId)
      .single();
    
    if (!transaction || transaction.buyer_id !== user.id) {
      throw new Error('Unauthorized');
    }
    
    // Confirm receipt
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', transactionId);
    
    if (error) throw error;
    
    // Notify seller about payout
    await supabase.from('notifications').insert({
      user_id: transaction.seller_id,
      type: 'payout_ready',
      title: 'Payment Released! 💰',
      message: `₩${transaction.seller_amount.toLocaleString()} has been released to your account.`,
      link: `/sales/${transactionId}`,
    });
    
    console.log('✅ Receipt confirmed');
    return true;
    
  } catch (error: any) {
    console.error('❌ Receipt confirmation error:', error);
    throw error;
  }
};

/**
 * Request refund / Open dispute
 */
export const requestRefund = async (
  transactionId: string,
  reason: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login required');
    
    // Verify buyer
    const { data: transaction } = await supabase
      .from('transactions')
      .select('buyer_id, seller_id')
      .eq('id', transactionId)
      .single();
    
    if (!transaction || transaction.buyer_id !== user.id) {
      throw new Error('Unauthorized');
    }
    
    // Open dispute
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'disputed',
      })
      .eq('id', transactionId);
    
    if (error) throw error;
    
    // Notify seller
    await supabase.from('notifications').insert({
      user_id: transaction.seller_id,
      type: 'dispute_opened',
      title: 'Dispute Opened',
      message: reason,
      link: `/sales/${transactionId}`,
    });
    
    // TODO: Notify admin for mediation
    
    console.log('✅ Refund requested');
    return true;
    
  } catch (error: any) {
    console.error('❌ Refund request error:', error);
    throw error;
  }
};

/**
 * Cancel transaction (before payment)
 */
export const cancelTransaction = async (transactionId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login required');
    
    // Verify it's pending
    const { data: transaction } = await supabase
      .from('transactions')
      .select('buyer_id, status')
      .eq('id', transactionId)
      .single();
    
    if (!transaction || transaction.buyer_id !== user.id) {
      throw new Error('Unauthorized');
    }
    
    if (transaction.status !== 'pending') {
      throw new Error('Cannot cancel paid transaction');
    }
    
    // Cancel
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
      })
      .eq('id', transactionId);
    
    if (error) throw error;
    
    console.log('✅ Transaction cancelled');
    return true;
    
  } catch (error: any) {
    console.error('❌ Transaction cancellation error:', error);
    throw error;
  }
};
