/**
 * Analytics Service
 * Basic event tracking for business metrics
 * 
 * Integrated with Amplitude for production analytics
 */

import * as amplitude from '@amplitude/analytics-react-native';

interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
  timestamp: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionStart: number = Date.now();
  private enabled: boolean = true;
  private initialized: boolean = false;
  private apiKey: string = '';

  /**
   * Amplitude 초기화
   */
  async initialize(apiKey: string) {
    if (this.initialized || __DEV__) return;

    if (!apiKey) {
      console.warn('⚠️ Amplitude API Key가 없습니다');
      return;
    }

    this.apiKey = apiKey;

    try {
      await amplitude.init(apiKey).promise;
      this.initialized = true;
      console.log('✅ Amplitude 초기화 완료');
    } catch (error) {
      console.warn('Amplitude 초기화 실패:', error);
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, params?: Record<string, any>) {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      params: {
        ...params,
        session_duration: Date.now() - this.sessionStart,
      },
      timestamp: Date.now(),
    };

    this.events.push(event);
    
    // Log to console in development
    if (__DEV__) {
      console.log('📊 Analytics Event:', event.name, event.params);
    }

    // Production: Send to Amplitude
    if (!__DEV__) {
      this.sendToAmplitude(eventName, params);
    }
  }

  /**
   * Amplitude로 전송 (프로덕션)
   */
  private async sendToAmplitude(eventName: string, params?: Record<string, any>) {
    try {
      if (!this.initialized && this.apiKey) {
        await this.initialize(this.apiKey);
      }

      if (this.initialized) {
        amplitude.track(eventName, params);
      }
    } catch (error) {
      console.warn('Analytics failed:', error);
    }
  }

  /**
   * User Events
   */
  trackUserSignup(method: 'google' | 'naver' | 'kakao' | 'apple') {
    this.trackEvent('user_signup', { method });
  }

  trackUserLogin(method: 'google' | 'naver' | 'kakao' | 'apple') {
    this.trackEvent('user_login', { method });
  }

  trackProfileEdit(fields: string[]) {
    this.trackEvent('profile_edit', { fields_changed: fields });
  }

  /**
   * Artwork Events
   */
  trackArtworkView(artworkId: string, category?: string) {
    this.trackEvent('artwork_view', { artwork_id: artworkId, category });
  }

  trackArtworkUpload(artworkId: string, material: string, priceRange: string) {
    this.trackEvent('artwork_upload', {
      artwork_id: artworkId,
      material,
      price_range: priceRange,
    });
  }

  trackArtworkLike(artworkId: string) {
    this.trackEvent('artwork_like', { artwork_id: artworkId });
  }

  trackArtworkBookmark(artworkId: string) {
    this.trackEvent('artwork_bookmark', { artwork_id: artworkId });
  }

  trackArtworkShare(artworkId: string, method: string) {
    this.trackEvent('artwork_share', { artwork_id: artworkId, method });
  }

  /**
   * Commerce Events
   */
  trackPurchaseInitiated(artworkId: string, price: number) {
    this.trackEvent('purchase_initiated', {
      artwork_id: artworkId,
      value: price,
      currency: 'KRW',
    });
  }

  trackPurchaseCompleted(transactionId: string, artworkId: string, amount: number) {
    this.trackEvent('purchase_completed', {
      transaction_id: transactionId,
      artwork_id: artworkId,
      value: amount,
      currency: 'KRW',
    });
  }

  trackPaymentFailed(artworkId: string, reason: string) {
    this.trackEvent('payment_failed', {
      artwork_id: artworkId,
      reason,
    });
  }

  /**
   * Engagement Events
   */
  trackSearch(query: string, resultsCount: number) {
    this.trackEvent('search', {
      search_term: query,
      results_count: resultsCount,
    });
  }

  trackFilterApplied(filters: Record<string, any>) {
    this.trackEvent('filter_applied', filters);
  }

  trackChatInitiated(recipientId: string) {
    this.trackEvent('chat_initiated', { recipient_id: recipientId });
  }

  trackChatMessageSent(chatId: string) {
    this.trackEvent('chat_message_sent', { chat_id: chatId });
  }

  /**
   * Screen Views
   */
  trackScreenView(screenName: string) {
    this.trackEvent('screen_view', { screen_name: screenName });
  }

  /**
   * Error Tracking
   */
  trackError(errorCode: string, errorMessage: string, context?: string) {
    this.trackEvent('error', {
      error_code: errorCode,
      error_message: errorMessage,
      context,
    });
  }

  /**
   * Get analytics summary (for debugging)
   */
  getSummary() {
    const eventCounts: Record<string, number> = {};
    this.events.forEach(event => {
      eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
    });
    
      return {
      total_events: this.events.length,
      session_duration: Date.now() - this.sessionStart,
      event_counts: eventCounts,
      recent_events: this.events.slice(-10),
    };
  }

  /**
   * Clear events (useful for testing)
   */
  clear() {
    this.events = [];
    this.sessionStart = Date.now();
  }

  /**
   * Disable analytics (for privacy)
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Enable analytics
   */
  enable() {
    this.enabled = true;
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Convenience exports with proper 'this' binding
export const trackEvent = (eventName: string, params?: Record<string, any>) => 
  analytics.trackEvent(eventName, params);

export const trackUserSignup = (method: 'google' | 'naver' | 'kakao' | 'apple') => 
  analytics.trackUserSignup(method);

export const trackUserLogin = (method: 'google' | 'naver' | 'kakao' | 'apple') => 
  analytics.trackUserLogin(method);

export const trackProfileEdit = (fields: string[]) => 
  analytics.trackProfileEdit(fields);

export const trackArtworkView = (artworkId: string, category?: string) => 
  analytics.trackArtworkView(artworkId, category);

export const trackArtworkUpload = (artworkId: string, material: string, priceRange: string) => 
  analytics.trackArtworkUpload(artworkId, material, priceRange);

export const trackArtworkLike = (artworkId: string) => 
  analytics.trackArtworkLike(artworkId);

export const trackArtworkBookmark = (artworkId: string) => 
  analytics.trackArtworkBookmark(artworkId);

export const trackArtworkShare = (artworkId: string, method: string) => 
  analytics.trackArtworkShare(artworkId, method);

export const trackPurchaseInitiated = (artworkId: string, price: number) => 
  analytics.trackPurchaseInitiated(artworkId, price);

export const trackPurchaseCompleted = (transactionId: string, artworkId: string, amount: number) => 
  analytics.trackPurchaseCompleted(transactionId, artworkId, amount);

export const trackPaymentFailed = (artworkId: string, reason: string) => 
  analytics.trackPaymentFailed(artworkId, reason);

export const trackSearch = (query: string, resultsCount: number) => 
  analytics.trackSearch(query, resultsCount);

export const trackFilterApplied = (filters: Record<string, any>) => 
  analytics.trackFilterApplied(filters);

export const trackChatInitiated = (recipientId: string) => 
  analytics.trackChatInitiated(recipientId);

export const trackChatMessageSent = (chatId: string) => 
  analytics.trackChatMessageSent(chatId);

export const trackScreenView = (screenName: string) => 
  analytics.trackScreenView(screenName);

export const trackError = (errorCode: string, errorMessage: string, context?: string) => 
  analytics.trackError(errorCode, errorMessage, context);

/**
 * Get Dashboard Summary (for Artist Dashboard)
 * TODO: Implement actual dashboard analytics
 */
export const getDashboardSummary = async (period: 'daily' | 'weekly' | 'monthly' = 'weekly') => {
  // Import supabase dynamically to avoid circular dependencies
  const { supabase } = await import('./supabase');
  const { useAuthStore } = await import('../store/authStore');
  
  console.log(`📊 Dashboard Summary requested for period: ${period}`);
  
  try {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // 1. Get user's artworks
    const { data: artworks, error: artworksError } = await supabase
      .from('artworks')
      .select('id, title, price, created_at, likes_count, comments_count')
      .eq('author_id', user.id);
    
    if (artworksError) throw artworksError;

    // 2. Get sales data (transactions)
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('artwork_id, amount, created_at, status')
      .eq('seller_id', user.id)
      .gte('created_at', startDate.toISOString())
      .in('status', ['completed', 'confirmed']);
    
    if (transactionsError) throw transactionsError;

    // 3. Calculate metrics
    const totalLikes = artworks?.reduce((sum, art) => sum + (art.likes_count || 0), 0) || 0;
    const totalComments = artworks?.reduce((sum, art) => sum + (art.comments_count || 0), 0) || 0;
    const totalSales = transactions?.length || 0;
    const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;
    const conversionRate = artworks?.length > 0 ? ((totalSales / artworks.length) * 100).toFixed(2) : '0.00';

    // 4. Get top artworks by engagement (likes + comments)
    const topArtworks = (artworks || [])
      .sort((a, b) => {
        const scoreA = (a.likes_count || 0) * 2 + (a.comments_count || 0);
        const scoreB = (b.likes_count || 0) * 2 + (b.comments_count || 0);
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map(artwork => ({
        artwork: {
          id: artwork.id,
          title: artwork.title,
        },
        likes: artwork.likes_count || 0,
        comments: artwork.comments_count || 0,
      }));

    // 5. Generate daily stats (last 7 days for display)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
      
      const dayTransactions = transactions?.filter(t => 
        t.created_at.startsWith(dateStr)
      ) || [];
      
      dailyStats.push({
        date: dateStr,
        sales: dayTransactions.length,
        revenue: dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        likes: Math.floor(totalLikes / 7), // Simplified: distribute likes evenly
      });
    }

    // 6. Get followers count (if followers table exists, otherwise 0)
    let totalFollowers = 0;
    try {
      const { count } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      totalFollowers = count || 0;
    } catch (error) {
      console.warn('Followers table not available:', error);
    }
    
    return {
      period,
      // Core metrics
      total_likes: totalLikes,
      total_comments: totalComments,
      total_sales: totalSales,
      average_sale_price: averageSalePrice,
      total_revenue: totalRevenue,
      conversion_rate: parseFloat(conversionRate),
      total_followers: totalFollowers,
      total_artworks: artworks?.length || 0,
      
      // Top Artworks
      top_artworks: topArtworks,
      
      // Daily Stats (Trends: likes per day)
      daily_stats: dailyStats,
    };
  } catch (error) {
    console.error('❌ Failed to load dashboard summary:', error);
    
    // Return empty data on error
    return {
      period,
      total_likes: 0,
      total_comments: 0,
      total_sales: 0,
      average_sale_price: 0,
      total_revenue: 0,
      conversion_rate: 0,
      total_followers: 0,
      total_artworks: 0,
      top_artworks: [],
      daily_stats: [],
    };
  }
};
