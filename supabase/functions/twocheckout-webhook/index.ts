// 2Checkout IPN Webhook Handler - Full Version with Seller Payout
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  console.log('📨 2Checkout IPN Webhook received');

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse IPN data
    const contentType = req.headers.get('content-type');
    let ipnData: any = {};

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        ipnData[key] = value.toString();
      }
    } else {
      const text = await req.text();
      if (text) {
        ipnData = JSON.parse(text);
      }
    }

    console.log('📋 IPN Data:', JSON.stringify(ipnData, null, 2));

    // Extract important fields
    const messageType = ipnData.MESSAGE_TYPE || ipnData.message_type;
    const transactionId = ipnData.merchant_order_id || ipnData.REFNOEXT;
    const saleId = ipnData.order_number || ipnData.REFNO;
    const orderStatus = ipnData.ORDERSTATUS || ipnData.order_status;
    const sellerId = ipnData.custom_field_1; // 판매자 ID
    const artworkId = ipnData.custom_field_2; // 작품 ID
    const totalAmount = parseFloat(ipnData.invoice_list_amount || ipnData.TOTAL || '0');
    const shippingAddress = {
      name: ipnData.ship_name || ipnData.CUSTOMERFIRSTNAME + ' ' + ipnData.CUSTOMERLASTNAME,
      street: ipnData.ship_street_address || ipnData.CUSTOMERADDRESS,
      city: ipnData.ship_city || ipnData.CUSTOMERCITY,
      state: ipnData.ship_state || ipnData.CUSTOMERSTATE,
      zip: ipnData.ship_zip || ipnData.CUSTOMERZIP,
      country: ipnData.ship_country || ipnData.CUSTOMERCOUNTRY,
    };

    // Handle ORDER_CREATED or COMPLETE status
    if (messageType === 'ORDER_CREATED' || orderStatus === 'COMPLETE') {
      console.log('✅ Payment confirmed, processing...');

      // 1. Update transaction status
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .update({
          status: 'paid',
          payment_intent_id: saleId,
          paid_at: new Date().toISOString(),
          // Store shipping info
          shipping_info: shippingAddress,
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (txError) {
        console.error('❌ Transaction update failed:', txError);
        throw txError;
      }

      console.log('✅ Transaction updated:', transaction);

      // 2. Update artwork status to 'sold' with blur effect
      const { error: artworkError } = await supabase
        .from('artworks')
        .update({
          sale_status: 'sold',
          sold_at: new Date().toISOString(),
          buyer_id: transaction.buyer_id,
        })
        .eq('id', artworkId);

      if (artworkError) {
        console.error('❌ Artwork update failed:', artworkError);
      } else {
        console.log('✅ Artwork marked as SOLD');
      }

      // 3. Calculate seller payout (총액 - 플랫폼 수수료 10%)
      const platformFee = totalAmount * 0.10; // 10% 플랫폼 수수료
      const sellerAmount = totalAmount - platformFee;

      console.log(`💰 Total: $${totalAmount}, Platform Fee: $${platformFee}, Seller: $${sellerAmount}`);

      // 4. Create payout record for seller
      const { error: payoutError } = await supabase
        .from('seller_payouts')
        .insert({
          seller_id: sellerId,
          transaction_id: transactionId,
          artwork_id: artworkId,
          total_amount: totalAmount,
          platform_fee: platformFee,
          seller_amount: sellerAmount,
          status: 'pending', // Admin이 수동으로 'paid'로 변경
          created_at: new Date().toISOString(),
          // 배송 주소도 함께 저장
          shipping_address: shippingAddress,
        });

      if (payoutError) {
        console.log('⚠️ Payout record creation failed (table may not exist yet):', payoutError);
      } else {
        console.log('✅ Payout record created for seller');
      }

      // 5. Send notification to seller (optional)
      console.log(`📧 TODO: Send email to seller ${sellerId} with shipping address`);
    }

    // Always return 200 OK
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'IPN processed successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Webhook Error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 200, // Return 200 to acknowledge receipt
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
