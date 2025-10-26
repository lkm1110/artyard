-- ====================================================================
-- AI/ML 시스템을 위한 고급 데이터베이스 스키마
-- 20년차 머신러닝 개발자의 정교한 시스템 설계
-- ====================================================================

-- 사용자 행동 분석 테이블
CREATE TABLE IF NOT EXISTS user_behaviors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  
  -- 행동 타입 (view, like, bookmark, share, comment, scroll, search, etc.)
  behavior_type TEXT NOT NULL,
  
  -- 행동 세부사항 (JSON으로 유연한 데이터 저장)
  behavior_data JSONB DEFAULT '{}'::jsonb,
  
  -- 행동 강도 (1-10, 시청시간/스크롤깊이 등으로 계산)
  intensity_score FLOAT DEFAULT 1.0,
  
  -- 세션 정보
  session_id TEXT,
  device_type TEXT,
  user_agent TEXT,
  
  -- 위치 및 시간 정보
  ip_address INET,
  location_data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT now(),
  
  -- 인덱스
  CONSTRAINT valid_behavior_type CHECK (behavior_type IN (
    'view', 'like', 'unlike', 'bookmark', 'unbookmark', 'share', 
    'comment', 'search', 'scroll', 'upload', 'download', 'report',
    'profile_view', 'follow', 'unfollow'
  )),
  CONSTRAINT valid_intensity CHECK (intensity_score >= 0 AND intensity_score <= 10)
);

-- 스팸/도배 탐지 테이블
CREATE TABLE IF NOT EXISTS spam_detection (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID, -- artwork_id 또는 comment_id
  content_type TEXT NOT NULL CHECK (content_type IN ('artwork', 'comment', 'message')),
  
  -- 콘텐츠 해시 (중복 탐지용)
  content_hash TEXT,
  text_hash TEXT,
  image_hash TEXT,
  
  -- 스팸 점수 및 분류
  spam_score FLOAT DEFAULT 0.0,
  is_spam BOOLEAN DEFAULT FALSE,
  spam_type TEXT, -- 'duplicate', 'flood', 'inappropriate', 'bot', etc.
  
  -- 탐지 알고리즘 정보
  detection_method TEXT,
  confidence FLOAT DEFAULT 0.0,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES profiles(id),
  
  CONSTRAINT valid_spam_score CHECK (spam_score >= 0 AND spam_score <= 1),
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- 사용자 제재 시스템
CREATE TABLE IF NOT EXISTS user_moderation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES profiles(id),
  
  -- 제재 타입 및 레벨
  action_type TEXT NOT NULL CHECK (action_type IN (
    'warning', 'shadow_ban', 'temp_ban', 'permanent_ban', 'content_removal'
  )),
  severity_level INTEGER DEFAULT 1 CHECK (severity_level >= 1 AND severity_level <= 5),
  
  -- 제재 이유
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb,
  
  -- 자동 vs 수동 제재
  is_automated BOOLEAN DEFAULT FALSE,
  automation_confidence FLOAT DEFAULT 0.0,
  
  -- 제재 기간
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  
  -- 상태
  is_active BOOLEAN DEFAULT TRUE,
  appeal_status TEXT DEFAULT 'none' CHECK (appeal_status IN ('none', 'pending', 'approved', 'rejected')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자 선호도 프로필
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 선호도 벡터 (고차원 임베딩)
  preference_vector FLOAT[] DEFAULT ARRAY[]::FLOAT[],
  
  -- 카테고리별 선호도 점수
  material_preferences JSONB DEFAULT '{}'::jsonb,
  color_preferences JSONB DEFAULT '{}'::jsonb,
  style_preferences JSONB DEFAULT '{}'::jsonb,
  artist_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- 행동 패턴 분석
  activity_pattern JSONB DEFAULT '{}'::jsonb,
  engagement_score FLOAT DEFAULT 0.0,
  
  -- 개인화 메타데이터
  last_updated TIMESTAMPTZ DEFAULT now(),
  update_count INTEGER DEFAULT 0,
  confidence_score FLOAT DEFAULT 0.0,
  
  -- 유니크 제약
  UNIQUE(user_id),
  CONSTRAINT valid_engagement CHECK (engagement_score >= 0 AND engagement_score <= 1),
  CONSTRAINT valid_confidence_pref CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- 작품 특성 분석 테이블
CREATE TABLE IF NOT EXISTS artwork_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  
  -- AI 분석 결과
  color_palette JSONB DEFAULT '{}'::jsonb,
  dominant_colors TEXT[],
  style_tags TEXT[],
  complexity_score FLOAT DEFAULT 0.0,
  quality_score FLOAT DEFAULT 0.0,
  
  -- 콘텐츠 임베딩 벡터
  content_embedding FLOAT[] DEFAULT ARRAY[]::FLOAT[],
  
  -- 인기도 메트릭
  trending_score FLOAT DEFAULT 0.0,
  engagement_rate FLOAT DEFAULT 0.0,
  virality_coefficient FLOAT DEFAULT 0.0,
  
  -- 시간별 성능 지표
  hourly_views INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  daily_engagement JSONB DEFAULT '{}'::jsonb,
  
  -- 메타데이터
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  analysis_version TEXT DEFAULT '1.0',
  
  UNIQUE(artwork_id),
  CONSTRAINT valid_complexity CHECK (complexity_score >= 0 AND complexity_score <= 1),
  CONSTRAINT valid_quality CHECK (quality_score >= 0 AND quality_score <= 1)
);

-- 추천 시스템 로그
CREATE TABLE IF NOT EXISTS recommendation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  
  -- 추천 알고리즘 정보
  algorithm_type TEXT NOT NULL, -- 'collaborative', 'content_based', 'hybrid', 'trending'
  algorithm_version TEXT DEFAULT '1.0',
  
  -- 추천된 작품들
  recommended_artworks UUID[],
  recommendation_scores FLOAT[],
  
  -- 사용자 반응
  clicked_artworks UUID[],
  engagement_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- 성능 메트릭
  precision_score FLOAT,
  recall_score FLOAT,
  diversity_score FLOAT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_precision CHECK (precision_score IS NULL OR (precision_score >= 0 AND precision_score <= 1)),
  CONSTRAINT valid_recall CHECK (recall_score IS NULL OR (recall_score >= 0 AND recall_score <= 1)),
  CONSTRAINT valid_diversity CHECK (diversity_score IS NULL OR (diversity_score >= 0 AND diversity_score <= 1))
);

-- 콘텐츠 조정 시스템
CREATE TABLE IF NOT EXISTS content_moderation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('artwork', 'comment', 'profile', 'message')),
  reporter_id UUID REFERENCES profiles(id),
  
  -- 신고/조정 정보
  report_reason TEXT,
  report_category TEXT CHECK (report_category IN (
    'spam', 'harassment', 'inappropriate', 'copyright', 'violence', 'fake', 'other'
  )),
  
  -- AI 분석 결과
  ai_toxicity_score FLOAT DEFAULT 0.0,
  ai_inappropriateness_score FLOAT DEFAULT 0.0,
  ai_recommendation TEXT, -- 'approve', 'review', 'remove'
  
  -- 인간 검토
  moderator_decision TEXT CHECK (moderator_decision IN ('pending', 'approved', 'removed', 'restricted')),
  moderator_id UUID REFERENCES profiles(id),
  moderator_notes TEXT,
  
  -- 상태 및 시간
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'escalated')),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  CONSTRAINT valid_ai_toxicity CHECK (ai_toxicity_score >= 0 AND ai_toxicity_score <= 1),
  CONSTRAINT valid_ai_inappropriate CHECK (ai_inappropriateness_score >= 0 AND ai_inappropriateness_score <= 1)
);

-- 사용자 레벨 시스템
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 레벨 정보
  current_level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  points_to_next_level INTEGER DEFAULT 100,
  
  -- 평점 시스템
  artist_rating FLOAT DEFAULT 0.0,
  community_rating FLOAT DEFAULT 0.0,
  overall_rating FLOAT DEFAULT 0.0,
  
  -- 획득 배지들
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  achievements JSONB DEFAULT '{}'::jsonb,
  
  -- 통계
  total_uploads INTEGER DEFAULT 0,
  total_likes_received INTEGER DEFAULT 0,
  total_comments_received INTEGER DEFAULT 0,
  total_followers INTEGER DEFAULT 0,
  
  -- 메타데이터
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id),
  CONSTRAINT valid_level CHECK (current_level >= 1),
  CONSTRAINT valid_xp CHECK (experience_points >= 0),
  CONSTRAINT valid_rating CHECK (artist_rating >= 0 AND artist_rating <= 5)
);

-- ====================================================================
-- 인덱스 생성 (성능 최적화)
-- ====================================================================

-- 사용자 행동 분석 인덱스
CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_id ON user_behaviors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_artwork_id ON user_behaviors(artwork_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_type_time ON user_behaviors(behavior_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_session ON user_behaviors(session_id, timestamp DESC);

-- 스팸 탐지 인덱스
CREATE INDEX IF NOT EXISTS idx_spam_detection_user_id ON spam_detection(user_id);
CREATE INDEX IF NOT EXISTS idx_spam_detection_content ON spam_detection(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_spam_detection_hash ON spam_detection(content_hash);
CREATE INDEX IF NOT EXISTS idx_spam_detection_score ON spam_detection(spam_score DESC) WHERE is_spam = true;

-- 제재 시스템 인덱스
CREATE INDEX IF NOT EXISTS idx_user_moderation_user_id ON user_moderation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_active ON user_moderation(user_id, is_active, expires_at);

-- 선호도 인덱스
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated ON user_preferences(last_updated DESC);

-- 작품 분석 인덱스
CREATE INDEX IF NOT EXISTS idx_artwork_analytics_artwork_id ON artwork_analytics(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_analytics_trending ON artwork_analytics(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_artwork_analytics_quality ON artwork_analytics(quality_score DESC);

-- 추천 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_user_session ON recommendation_logs(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_algorithm ON recommendation_logs(algorithm_type, created_at DESC);

-- 콘텐츠 조정 인덱스
CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON content_moderation(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status, priority DESC, created_at);

-- 사용자 레벨 인덱스
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_rating ON user_levels(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_user_levels_level ON user_levels(current_level DESC);

-- ====================================================================
-- RLS (Row Level Security) 정책
-- ====================================================================

-- 사용자 행동 데이터 보호
ALTER TABLE user_behaviors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own behavior data" ON user_behaviors FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own behavior data" ON user_behaviors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 스팸 탐지 데이터 (시스템 테이블 - 개발 단계에서는 접근 제한 없음)
ALTER TABLE spam_detection ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System can read spam detection" ON spam_detection FOR SELECT
  USING (true);
CREATE POLICY "System can insert spam detection" ON spam_detection FOR INSERT
  WITH CHECK (true);
CREATE POLICY "System can update spam detection" ON spam_detection FOR UPDATE
  USING (true);

-- 사용자 제재 (사용자는 자신의 제재 내역만 볼 수 있음)
ALTER TABLE user_moderation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own moderation history" ON user_moderation FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "System can manage moderation" ON user_moderation FOR INSERT
  WITH CHECK (true);
CREATE POLICY "System can update moderation" ON user_moderation FOR UPDATE
  USING (true);

-- 사용자 선호도 (개인 정보 보호)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own preferences" ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 작품 분석 (공개)
ALTER TABLE artwork_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analytics are publicly readable" ON artwork_analytics FOR SELECT
  USING (true);
CREATE POLICY "System can insert analytics" ON artwork_analytics FOR INSERT
  WITH CHECK (true);
CREATE POLICY "System can update analytics" ON artwork_analytics FOR UPDATE
  USING (true);

-- 추천 로그 (개인 접근)
ALTER TABLE recommendation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recommendation logs" ON recommendation_logs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "System can insert recommendation logs" ON recommendation_logs FOR INSERT
  WITH CHECK (true);
CREATE POLICY "System can update recommendation logs" ON recommendation_logs FOR UPDATE
  USING (true);

-- 콘텐츠 조정 (신고자 접근)
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Content moderation access policy" ON content_moderation FOR SELECT
  USING (
    auth.uid() = reporter_id OR 
    auth.uid() = moderator_id
  );
CREATE POLICY "System can manage content moderation" ON content_moderation FOR INSERT
  WITH CHECK (true);
CREATE POLICY "System can update content moderation" ON content_moderation FOR UPDATE
  USING (true);

-- 사용자 레벨 (공개 읽기, 개인 업데이트)
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User levels are publicly readable" ON user_levels FOR SELECT
  USING (true);
CREATE POLICY "Users can update own levels" ON user_levels FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can modify own levels" ON user_levels FOR UPDATE
  USING (auth.uid() = user_id);

-- ====================================================================
-- 실시간 알림 트리거
-- ====================================================================

-- 스팸 탐지 시 알림
CREATE OR REPLACE FUNCTION notify_spam_detection()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.spam_score > 0.8 THEN
    PERFORM pg_notify('spam_alert', json_build_object(
      'user_id', NEW.user_id,
      'content_id', NEW.content_id,
      'spam_score', NEW.spam_score,
      'detection_method', NEW.detection_method
    )::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER spam_detection_trigger
  AFTER INSERT ON spam_detection
  FOR EACH ROW EXECUTE FUNCTION notify_spam_detection();

-- 선호도 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_preference_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  NEW.update_count = OLD.update_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_update_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preference_timestamp();

-- 사용자 레벨 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- 레벨 업 체크
  WHILE NEW.experience_points >= NEW.points_to_next_level LOOP
    NEW.experience_points = NEW.experience_points - NEW.points_to_next_level;
    NEW.current_level = NEW.current_level + 1;
    NEW.points_to_next_level = NEW.points_to_next_level * 1.2; -- 지수적 증가
    
    -- 레벨업 알림
    PERFORM pg_notify('level_up', json_build_object(
      'user_id', NEW.user_id,
      'new_level', NEW.current_level
    )::text);
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_level_update_trigger
  BEFORE UPDATE ON user_levels
  FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- ====================================================================
-- 성능 최적화를 위한 파티셔닝 설정 (대용량 데이터 처리)
-- ====================================================================

-- user_behaviors 테이블 월별 파티셔닝 (대용량 행동 데이터)
-- 실제 운영 시에는 pg_partman 확장을 사용하여 자동 파티션 관리 권장

-- ====================================================================
-- 성공 메시지 출력
-- ====================================================================
DO $$
BEGIN
  RAISE NOTICE '🤖 AI/ML 고급 데이터베이스 스키마가 성공적으로 생성되었습니다!';
  RAISE NOTICE '📊 다음 단계: 머신러닝 알고리즘 서비스 구현';
  RAISE NOTICE '🎯 특징: 실시간 스팸 탐지, 개인화 추천, 콘텐츠 조정, 사용자 성장';
END $$;
