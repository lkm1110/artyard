/**
 * Payment Service - 2Checkout Integration
 */

import { supabase } from './supabase';

// 2Checkout Configuration
const TWOCHECKOUT_ACCOUNT = process.env.EXPO_PUBLIC_2CHECKOUT_ACCOUNT;
const TWOCHECKOUT_SECRET = process.env.EXPO_PUBLIC_2CHECKOUT_SECRET_KEY;
const TWOCHECKOUT_PRODUCT_ID = process.env.EXPO_PUBLIC_2CHECKOUT_PRODUCT_ID;

export interface PaymentRequest {
  transaction_id: string;
  amount: number;
  currency: string;
  buyer_email: string;
  buyer_name: string;
  artwork_title: string;
  artwork_id: string;
  artwork_image_url?: string;
  seller_id: string;
  shipping_address?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface PaymentResponse {
  payment_url: string;
  order_reference: string;
}

/**
 * Create 2Checkout payment link
 */
export const create2CheckoutPayment = async (
  request: PaymentRequest
): Promise<PaymentResponse> => {
  try {
    console.log('💳 Creating 2Checkout payment:', request);
    
    // Validate environment variables
    if (!TWOCHECKOUT_ACCOUNT) {
      throw new Error('2Checkout Account ID is not configured');
    }
    
    console.log('🔑 Using 2Checkout Account:', TWOCHECKOUT_ACCOUNT);
    console.log('💰 Payment amount:', request.amount, request.currency);
    console.log('🎨 Artwork title:', request.artwork_title);
    console.log('📧 Buyer email:', request.buyer_email);
    
    // 2Checkout ConvertPlus Checkout parameters
    // https://knowledgecenter.2checkout.com/Documentation/07Commerce/ConvertPlus
    const params: Record<string, string> = {
      // Required - Seller/Merchant ID
      'sid': TWOCHECKOUT_ACCOUNT,
      
      // Mode
      'mode': '2CO',
      
      // Product information (using li_ prefix for line items)
      'li_0_type': 'product',
      'li_0_name': request.artwork_title,
      'li_0_price': request.amount.toFixed(2), // "1.00" 형식
      'li_0_quantity': '1',
      'li_0_tangible': 'Y',
      'li_0_product_url': `https://artyard.app/artwork/${request.artwork_id}`,
      'li_0_image': request.artwork_image_url || '', // ✅ 이미지 URL 추가
      
      // Currency
      'currency_code': request.currency,
      
      // Transaction info
      'merchant_order_id': request.transaction_id,
      
      // Buyer info
      'card_holder_name': request.buyer_name || 'Buyer',
      'email': request.buyer_email,
      
      // Custom fields for seller info (will be in IPN)
      'custom_field_1': request.seller_id, // 판매자 ID
      'custom_field_2': request.artwork_id, // 작품 ID
      
      // Return URL
      'x_receipt_link_url': `artyard://payment-success?txId=${request.transaction_id}`,
      
      // Test mode
      'demo': 'Y', // 테스트 모드
    };
    
    // Add shipping address if provided
    if (request.shipping_address) {
      params['ship_name'] = request.shipping_address.name;
      params['ship_street_address'] = request.shipping_address.street;
      params['ship_city'] = request.shipping_address.city;
      params['ship_state'] = request.shipping_address.state;
      params['ship_zip'] = request.shipping_address.zip;
      params['ship_country'] = request.shipping_address.country;
    }
    
    const urlParams = new URLSearchParams(params);
    
    const payment_url = `https://www.2checkout.com/checkout/purchase?${urlParams.toString()}`;
    
    console.log('🌐 Generated Payment URL:');
    console.log(payment_url);
    console.log('');
    console.log('📋 URL Parameters:');
    urlParams.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    return {
      payment_url,
      order_reference: request.transaction_id,
    };
    
  } catch (error: any) {
    console.error('❌ 2Checkout payment creation error:', error);
    throw error;
  }
};

/**
 * Verify 2Checkout payment (called from webhook or return URL)
 */
export const verify2CheckoutPayment = async (
  orderReference: string,
  paymentStatus: string
): Promise<boolean> => {
  try {
    console.log('🔍 Verifying 2Checkout payment:', orderReference, paymentStatus);
    
    // In production, verify with 2Checkout API
    // For now, accept if status is 'approved' or 'pending'
    const isValid = ['approved', 'pending', 'success'].includes(paymentStatus.toLowerCase());
    
    if (!isValid) {
      console.error('❌ Invalid payment status:', paymentStatus);
      return false;
    }
    
    console.log('✅ Payment verified');
    return true;
    
  } catch (error: any) {
    console.error('❌ Payment verification error:', error);
    return false;
  }
};

/**
 * Process 2Checkout webhook (optional - for automatic payment confirmation)
 */
export const handle2CheckoutWebhook = async (webhookData: any): Promise<void> => {
  try {
    console.log('📨 Processing 2Checkout webhook:', webhookData);
    
    // TODO: Implement webhook signature verification
    // TODO: Parse webhook data
    // TODO: Update transaction status
    
    const transactionId = webhookData.merchant_order_id;
    const status = webhookData.message_type;
    
    if (status === 'ORDER_CREATED') {
      await supabase
        .from('transactions')
        .update({
          status: 'paid',
          payment_intent_id: webhookData.sale_id,
          paid_at: new Date().toISOString(),
        })
        .eq('id', transactionId);
      
      console.log('✅ Transaction updated from webhook');
    }
    
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    throw error;
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, currency: string = 'KRW'): string => {
  const currencySymbols: Record<string, string> = {
    KRW: '₩',
    USD: '$',
    EUR: '€',
    JPY: '¥',
  };
  
  const symbol = currencySymbols[currency] || currency;
  const formatted = amount.toLocaleString();
  
  if (currency === 'KRW' || currency === 'JPY') {
    return `${symbol}${formatted}`;
  }
  
  return `${symbol}${(amount / 100).toFixed(2)}`;
};

/**
 * Get currency for country
 */
export const getCurrencyForCountry = (countryCode: string): string => {
  const currencyMap: Record<string, string> = {
    KR: 'KRW',
    US: 'USD',
    JP: 'JPY',
    GB: 'GBP',
    EU: 'EUR',
    CN: 'CNY',
  };
  
  return currencyMap[countryCode] || 'USD';
};

/**
 * Convert amount between currencies (simplified)
 * In production, use real exchange rates
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Simplified conversion rates (use real API in production)
  const rates: Record<string, number> = {
    KRW: 1,
    USD: 1300,
    EUR: 1400,
    JPY: 10,
  };
  
  const baseAmount = amount / (rates[fromCurrency] || 1);
  return Math.round(baseAmount * (rates[toCurrency] || 1));
};

