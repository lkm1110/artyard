/**
 * 분석/대시보드 서비스
 */

import { supabase } from './supabase';
import {
  ArtistAnalytics,
  DashboardSummary,
  AnalyticsPeriod,
  getDateRange,
  calculatePercentageChange,
} from '../types/complete-system';

/**
 * 작품 조회 기록
 */
export const recordArtworkView = async (
  artworkId: string,
  referrer?: string
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('artwork_views').insert({
      artwork_id: artworkId,
      viewer_id: user?.id || null,
      session_id: user?.id || `anon_${Date.now()}`,
      referrer,
      device_type: 'mobile', // 실제로는 디바이스 감지 로직 추가
      viewed_at: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('조회 기록 오류:', error);
    // 실패해도 사용자 경험에 영향 없음
  }
};

/**
 * 대시보드 요약 조회
 */
export const getDashboardSummary = async (
  period: AnalyticsPeriod = 'weekly'
): Promise<DashboardSummary> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    
    const { start, end } = getDateRange(period);
    
    // 1. 기본 프로필 통계
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!profile) throw new Error('프로필을 찾을 수 없습니다');
    
    // 먼저 작가의 모든 작품 ID 조회
    const { data: artworkIdData } = await supabase
      .from('artworks')
      .select('id')
      .eq('author_id', user.id);
    
    const artworkIds = artworkIdData?.map(a => a.id) || [];
    
    // 작품이 없으면 빈 통계 반환
    if (artworkIds.length === 0) {
      return {
        period,
        total_sales: 0,
        total_revenue: 0,
        average_price: 0,
        total_views: 0,
        unique_visitors: 0,
        engagement_rate: 0,
        total_likes: 0,
        total_comments: 0,
        total_bookmarks: 0,
        sales_growth: 0,
        revenue_growth: 0,
        views_growth: 0,
        top_artworks: [],
        revenue_by_date: [],
      };
    }
    
    // 2. 조회수 통계
    const { data: views } = await supabase
      .from('artwork_views')
      .select('id, artwork_id, viewer_id, viewed_at')
      .gte('viewed_at', start.toISOString())
      .lte('viewed_at', end.toISOString())
      .in('artwork_id', artworkIds);
    
    const totalViews = views?.length || 0;
    const uniqueVisitors = new Set(views?.map(v => v.viewer_id).filter(Boolean)).size;
    
    // 3. 인게이지먼트 통계
    const { data: likes } = await supabase
      .from('likes')
      .select('id')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .in('artwork_id', artworkIds);
    
    const { data: comments } = await supabase
      .from('comments')
      .select('id')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .in('artwork_id', artworkIds);
    
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('id')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .in('artwork_id', artworkIds);
    
    const totalLikes = likes?.length || 0;
    const totalComments = comments?.length || 0;
    const totalBookmarks = bookmarks?.length || 0;
    
    const engagementRate = totalViews > 0 
      ? Math.round(((totalLikes + totalComments + totalBookmarks) / totalViews) * 100)
      : 0;
    
    // 4. 판매 통계
    const { data: sales } = await supabase
      .from('transactions')
      .select('id, amount, seller_amount, confirmed_at')
      .eq('seller_id', user.id)
      .eq('status', 'confirmed')
      .gte('confirmed_at', start.toISOString())
      .lte('confirmed_at', end.toISOString());
    
    const totalSales = sales?.length || 0;
    const totalRevenue = sales?.reduce((sum, s) => sum + s.seller_amount, 0) || 0;
    const averageSalePrice = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
    
    const conversionRate = totalViews > 0
      ? Math.round((totalSales / totalViews) * 100)
      : 0;
    
    // 5. 팔로워 통계
    const { data: follows } = await supabase
      .from('follows')
      .select('id, created_at')
      .eq('following_id', user.id);
    
    const totalFollowers = follows?.length || 0;
    
    const newFollowers = follows?.filter(f => {
      const followDate = new Date(f.created_at);
      return followDate >= start && followDate <= end;
    }).length || 0;
    
    // 6. 이전 기간 데이터 (변화율 계산용)
    const previousStart = new Date(start);
    const previousEnd = new Date(end);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    previousStart.setDate(previousStart.getDate() - daysDiff);
    previousEnd.setDate(previousEnd.getDate() - daysDiff);
    
    const { data: previousViews } = await supabase
      .from('artwork_views')
      .select('id')
      .gte('viewed_at', previousStart.toISOString())
      .lte('viewed_at', previousEnd.toISOString())
      .in('artwork_id', artworkIds);
    
    const viewsChange = calculatePercentageChange(totalViews, previousViews?.length || 0);
    
    const { data: previousFollows } = await supabase
      .from('follows')
      .select('id')
      .eq('following_id', user.id)
      .gte('created_at', previousStart.toISOString())
      .lte('created_at', previousEnd.toISOString());
    
    const followersChange = calculatePercentageChange(newFollowers, previousFollows?.length || 0);
    
    // 7. 인기 작품 (조회수, 좋아요, 매출 기준)
    const { data: popularArtworks } = await supabase
      .from('artworks')
      .select(`
        *,
        views:artwork_views(count),
        likes:likes(count)
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    const topArtworks = (popularArtworks || [])
      .map(artwork => {
        const viewsCount = Array.isArray(artwork.views) ? artwork.views.length : 0;
        const likesCount = Array.isArray(artwork.likes) ? artwork.likes.length : 0;
        
        return {
          artwork,
          views: viewsCount,
          likes: likesCount,
          revenue: 0, // 나중에 거래 데이터에서 계산
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    
    // 8. 일별 트렌드
    const dailyStats = await Promise.all(
      Array.from({ length: period === 'daily' ? 7 : period === 'weekly' ? 30 : 180 }, (_, i) => {
        const date = new Date(end);
        date.setDate(date.getDate() - i);
        return date;
      }).reverse().map(async (date) => {
        const dateStr = date.toISOString().split('T')[0];
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const { data: dayViews } = await supabase
          .from('artwork_views')
          .select('id')
          .gte('viewed_at', date.toISOString())
          .lt('viewed_at', nextDate.toISOString())
          .in('artwork_id', artworkIds);
        
        const { data: daySales } = await supabase
          .from('transactions')
          .select('id, seller_amount')
          .eq('seller_id', user.id)
          .eq('status', 'confirmed')
          .gte('confirmed_at', date.toISOString())
          .lt('confirmed_at', nextDate.toISOString());
        
        return {
          date: dateStr,
          views: dayViews?.length || 0,
          sales: daySales?.length || 0,
          revenue: daySales?.reduce((sum, s) => sum + s.seller_amount, 0) || 0,
        };
      })
    );
    
    return {
      period,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      
      total_views: totalViews,
      unique_visitors: uniqueVisitors,
      views_change: viewsChange,
      
      total_likes: totalLikes,
      total_comments: totalComments,
      total_bookmarks: totalBookmarks,
      engagement_rate: engagementRate,
      
      total_sales: totalSales,
      total_revenue: totalRevenue,
      average_sale_price: averageSalePrice,
      conversion_rate: conversionRate,
      
      total_followers: totalFollowers,
      new_followers: newFollowers,
      followers_change: followersChange,
      
      top_artworks: topArtworks,
      daily_stats: dailyStats,
    };
    
  } catch (error: any) {
    console.error('대시보드 요약 조회 오류:', error);
    throw error;
  }
};

/**
 * 간단한 통계 (프로필 화면용)
 */
export const getSimpleStats = async (userId: string) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_sales, total_revenue, seller_rating, seller_reviews_count')
      .eq('id', userId)
      .single();
    
    const { data: artworks } = await supabase
      .from('artworks')
      .select('id')
      .eq('author_id', userId);
    
    const { data: followers } = await supabase
      .from('follows')
      .select('id')
      .eq('following_id', userId);
    
    return {
      total_artworks: artworks?.length || 0,
      total_sales: profile?.total_sales || 0,
      total_revenue: profile?.total_revenue || 0,
      total_followers: followers?.length || 0,
      rating: profile?.seller_rating || 0,
      reviews_count: profile?.seller_reviews_count || 0,
    };
    
  } catch (error: any) {
    console.error('간단한 통계 조회 오류:', error);
    throw error;
  }
};

/**
 * 작품별 상세 통계
 */
export const getArtworkAnalytics = async (artworkId: string) => {
  try {
    // 조회수
    const { data: views } = await supabase
      .from('artwork_views')
      .select('id, viewed_at, viewer_id')
      .eq('artwork_id', artworkId);
    
    // 좋아요
    const { data: likes } = await supabase
      .from('likes')
      .select('id, created_at')
      .eq('artwork_id', artworkId);
    
    // 댓글
    const { data: comments } = await supabase
      .from('comments')
      .select('id, created_at')
      .eq('artwork_id', artworkId);
    
    // 북마크
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('id, created_at')
      .eq('artwork_id', artworkId);
    
    // 거래
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('artwork_id', artworkId)
      .eq('status', 'confirmed')
      .single();
    
    const totalViews = views?.length || 0;
    const uniqueVisitors = new Set(views?.map(v => v.viewer_id).filter(Boolean)).size;
    
    return {
      total_views: totalViews,
      unique_visitors: uniqueVisitors,
      total_likes: likes?.length || 0,
      total_comments: comments?.length || 0,
      total_bookmarks: bookmarks?.length || 0,
      sold: !!transaction,
      sale_price: transaction?.amount || 0,
      sold_at: transaction?.confirmed_at || null,
    };
    
  } catch (error: any) {
    console.error('작품 통계 조회 오류:', error);
    throw error;
  }
};

