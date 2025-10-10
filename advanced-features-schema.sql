-- =============================================
-- 고급 필터링 & 아티스트 팔로우 시스템 스키마
-- =============================================

-- 1. 아티스트 팔로우 테이블
CREATE TABLE IF NOT EXISTS follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 팔로우 방지
    UNIQUE(follower_id, following_id),
    
    -- 자기 자신 팔로우 방지
    CHECK (follower_id != following_id)
);

-- 2. 알림 시스템 테이블
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('new_artwork', 'new_follower', 'like', 'comment', 'purchase')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- 추가 데이터 (artwork_id, user_id 등)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 작품 스타일 테이블 (확장된 분류)
CREATE TABLE IF NOT EXISTS artwork_styles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_ko VARCHAR(100), -- 한국어 이름
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 작품-스타일 연결 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS artwork_style_relations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    style_id UUID NOT NULL REFERENCES artwork_styles(id) ON DELETE CASCADE,
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- AI 분석 신뢰도
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(artwork_id, style_id)
);

-- 5. 색상 팔레트 테이블
CREATE TABLE IF NOT EXISTS artwork_colors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    color_hex VARCHAR(7) NOT NULL, -- #RRGGBB 형식
    color_name VARCHAR(50), -- 색상 이름 (Red, Blue 등)
    percentage DECIMAL(5,2) NOT NULL, -- 해당 색상이 차지하는 비율
    is_dominant BOOLEAN DEFAULT FALSE, -- 주요 색상 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 작품 크기 정보 (기존 artworks 테이블 확장)
-- 기존 size 컬럼을 구조화된 데이터로 확장
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS depth_cm DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(6,2);

-- 7. 가격 범위 인덱스 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_artworks_price_numeric ON artworks (
    CAST(REGEXP_REPLACE(price, '[^0-9.]', '', 'g') AS DECIMAL)
) WHERE price IS NOT NULL AND price != '';

-- 8. 팔로우 관계 인덱스
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- 9. 알림 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 10. 작품 필터링 인덱스
CREATE INDEX IF NOT EXISTS idx_artworks_year ON artworks(year);
CREATE INDEX IF NOT EXISTS idx_artworks_material ON artworks(material);
CREATE INDEX IF NOT EXISTS idx_artworks_size_range ON artworks(width_cm, height_cm);
CREATE INDEX IF NOT EXISTS idx_artwork_colors_hex ON artwork_colors(color_hex);
CREATE INDEX IF NOT EXISTS idx_artwork_colors_dominant ON artwork_colors(is_dominant);

-- =============================================
-- 기본 데이터 삽입
-- =============================================

-- 작품 스타일 기본 데이터
INSERT INTO artwork_styles (name, name_ko, description) VALUES
('Abstract', '추상화', 'Non-representational art that uses shapes, colors, forms and gestural marks'),
('Realism', '사실주의', 'Art that attempts to represent subject matter truthfully'),
('Impressionism', '인상주의', 'Art movement characterized by small, thin brush strokes and emphasis on light'),
('Expressionism', '표현주의', 'Art that seeks to express emotional experience rather than impressions'),
('Surrealism', '초현실주의', 'Art movement that seeks to release the creative potential of the unconscious mind'),
('Minimalism', '미니멀리즘', 'Art movement that uses simple geometric forms and industrial materials'),
('Pop Art', '팝아트', 'Art movement that emerged in the 1950s and drew inspiration from popular culture'),
('Cubism', '입체주의', 'Art movement that revolutionized European painting and sculpture'),
('Contemporary', '현대미술', 'Art produced in the present period in time'),
('Digital Art', '디지털아트', 'Art created using digital technology as part of the creative process')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- follows 테이블 RLS 활성화
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- follows 정책
CREATE POLICY "Anyone can view follows" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own follows" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- notifications 테이블 RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- notifications 정책
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- artwork_styles 테이블 RLS 활성화
ALTER TABLE artwork_styles ENABLE ROW LEVEL SECURITY;

-- artwork_styles 정책 (모든 사용자가 조회 가능)
CREATE POLICY "Anyone can view artwork styles" ON artwork_styles
    FOR SELECT USING (true);

-- artwork_style_relations 테이블 RLS 활성화
ALTER TABLE artwork_style_relations ENABLE ROW LEVEL SECURITY;

-- artwork_style_relations 정책
CREATE POLICY "Anyone can view artwork style relations" ON artwork_style_relations
    FOR SELECT USING (true);

CREATE POLICY "Artwork owners can manage style relations" ON artwork_style_relations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM artworks 
            WHERE artworks.id = artwork_style_relations.artwork_id 
            AND artworks.author_id = auth.uid()
        )
    );

-- artwork_colors 테이블 RLS 활성화
ALTER TABLE artwork_colors ENABLE ROW LEVEL SECURITY;

-- artwork_colors 정책
CREATE POLICY "Anyone can view artwork colors" ON artwork_colors
    FOR SELECT USING (true);

CREATE POLICY "Artwork owners can manage colors" ON artwork_colors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM artworks 
            WHERE artworks.id = artwork_colors.artwork_id 
            AND artworks.author_id = auth.uid()
        )
    );

-- =============================================
-- 유용한 함수들
-- =============================================

-- 팔로워 수 계산 함수
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM follows 
        WHERE following_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 팔로잉 수 계산 함수
CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM follows 
        WHERE follower_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 팔로우 여부 확인 함수
CREATE OR REPLACE FUNCTION is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM follows 
        WHERE follows.follower_id = $1 AND follows.following_id = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 작품 알림 생성 함수
CREATE OR REPLACE FUNCTION notify_followers_new_artwork()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 작품이 생성되면 팔로워들에게 알림 생성
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
        f.follower_id,
        'new_artwork',
        'New artwork from ' || p.handle,
        p.handle || ' has posted a new artwork: ' || NEW.title,
        jsonb_build_object(
            'artwork_id', NEW.id,
            'artist_id', NEW.author_id,
            'artist_handle', p.handle
        )
    FROM follows f
    JOIN profiles p ON p.id = NEW.author_id
    WHERE f.following_id = NEW.author_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 작품 알림 트리거
DROP TRIGGER IF EXISTS trigger_notify_followers_new_artwork ON artworks;
CREATE TRIGGER trigger_notify_followers_new_artwork
    AFTER INSERT ON artworks
    FOR EACH ROW
    EXECUTE FUNCTION notify_followers_new_artwork();

-- 새 팔로워 알림 함수
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 팔로워가 생기면 알림 생성
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
        NEW.following_id,
        'new_follower',
        'New follower',
        p.handle || ' started following you',
        jsonb_build_object(
            'follower_id', NEW.follower_id,
            'follower_handle', p.handle
        )
    FROM profiles p
    WHERE p.id = NEW.follower_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 팔로워 알림 트리거
DROP TRIGGER IF EXISTS trigger_notify_new_follower ON follows;
CREATE TRIGGER trigger_notify_new_follower
    AFTER INSERT ON follows
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_follower();
