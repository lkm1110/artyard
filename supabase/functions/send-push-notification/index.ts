/**
 * Supabase Edge Function: Send Push Notification
 * Sends Expo Push Notifications for comments, purchases, and reviews
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushNotificationPayload {
  userId: string // 알람을 받을 사용자 ID
  title: string
  body: string
  data?: {
    type: 'comment' | 'purchase' | 'review'
    artworkId?: string
    commentId?: string
    transactionId?: string
    reviewId?: string
  }
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', { 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        } 
      })
    }

    // Request body 파싱
    const payload: PushNotificationPayload = await req.json()
    console.log('📨 Push notification request:', payload)

    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 사용자의 Push Token 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('expo_push_token, handle')
      .eq('id', payload.userId)
      .single()

    if (profileError || !profile) {
      console.error('❌ Failed to get user profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!profile.expo_push_token) {
      console.log('⚠️ User has no push token, skipping notification')
      return new Response(
        JSON.stringify({ message: 'User has no push token' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Expo Push Token 유효성 검사
    if (!profile.expo_push_token.startsWith('ExponentPushToken[')) {
      console.error('❌ Invalid push token format:', profile.expo_push_token)
      return new Response(
        JSON.stringify({ error: 'Invalid push token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Expo Push Notification 전송
    const message = {
      to: profile.expo_push_token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      priority: 'high',
      channelId: payload.data?.type === 'purchase' ? 'sales' : 
                 payload.data?.type === 'comment' ? 'social' :
                 'default',
    }

    console.log('📤 Sending push notification:', message)

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json()
    console.log('✅ Expo push response:', result)

    if (result.data && result.data[0] && result.data[0].status === 'error') {
      console.error('❌ Expo push error:', result.data[0])
      return new Response(
        JSON.stringify({ error: result.data[0].message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notification sent',
        result 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

