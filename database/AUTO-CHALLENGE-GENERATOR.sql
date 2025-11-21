-- =====================================================
-- 챌린지 자동 생성 시스템
-- 매월 첫 번째, 세 번째 월요일 한국시간 00:00에 생성
-- 2026년 1월부터 시작
-- =====================================================

-- 1. 챌린지 주제 목록 테이블 생성
CREATE TABLE IF NOT EXISTS challenge_topics (
  id SERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  title_template TEXT NOT NULL,
  description_template TEXT NOT NULL,
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 챌린지 주제 데이터 삽입
INSERT INTO challenge_topics (topic, title_template, description_template) VALUES
('portrait', 'Portrait Challenge', 'Create a portrait that captures the essence of your subject. Express emotion, personality, or character through your unique artistic style.'),
('landscape', 'Landscape Challenge', 'Capture the beauty of nature and scenery. Show us your perspective on the world around you through landscapes.'),
('abstract', 'Abstract Art Challenge', 'Express your creativity through abstract forms, colors, and shapes. Let your imagination run wild without constraints.'),
('stilllife', 'Still Life Challenge', 'Arrange and depict everyday objects in an artistic way. Focus on composition, lighting, and detail.'),
('urban', 'Urban Art Challenge', 'Showcase city life, architecture, and urban culture. Capture the energy and character of urban environments.'),
('nature', 'Nature Challenge', 'Celebrate the natural world - plants, animals, and natural phenomena. Show the beauty of nature through your art.'),
('fantasy', 'Fantasy Art Challenge', 'Create imaginative worlds and characters. Let your fantasy and creativity know no bounds.'),
('minimalism', 'Minimalism Challenge', 'Express more with less. Focus on simplicity, clean lines, and essential elements.'),
('color', 'Color Study Challenge', 'Explore and experiment with colors. Create artworks that celebrate specific color palettes or harmonies.'),
('texture', 'Texture Challenge', 'Focus on textures and tactile qualities in your artwork. Explore different materials and surface treatments.'),
('movement', 'Motion & Movement Challenge', 'Capture or create a sense of movement and dynamics. Show energy and flow in your art.'),
('emotion', 'Emotion Challenge', 'Express a specific emotion or mood through your artwork. Make viewers feel something.'),
('night', 'Night Scene Challenge', 'Depict nocturnal scenes, nightlife, or the beauty of darkness. Explore lighting and atmosphere.'),
('seasonal', 'Seasonal Challenge', 'Create artwork inspired by the current season. Capture the mood and characteristics of the time of year.'),
('geometric', 'Geometric Art Challenge', 'Use geometric shapes and patterns to create compelling compositions. Explore symmetry and structure.'),
('surreal', 'Surreal Art Challenge', 'Combine reality with imagination. Create dreamlike, unexpected, or impossible scenes.'),
('cultural', 'Cultural Heritage Challenge', 'Celebrate your cultural background or explore different cultures through art.'),
('experimental', 'Experimental Art Challenge', 'Try new techniques, materials, or approaches. Push your artistic boundaries.'),
('narrative', 'Storytelling Challenge', 'Create art that tells a story or captures a moment in time. Make viewers wonder about the narrative.'),
('contrast', 'Light & Shadow Challenge', 'Play with contrasts - light and dark, highlight and shadow. Master the art of chiaroscuro.')
ON CONFLICT DO NOTHING;

-- 3. 다음 월요일 계산 함수
CREATE OR REPLACE FUNCTION get_nth_monday_of_month(
  year_val INTEGER,
  month_val INTEGER,
  nth INTEGER -- 1 = first Monday, 3 = third Monday
)
RETURNS DATE AS $$
DECLARE
  first_day DATE;
  first_monday DATE;
  result_date DATE;
BEGIN
  -- 월의 첫 날
  first_day := make_date(year_val, month_val, 1);
  
  -- 첫 번째 월요일 찾기
  -- 월요일 = 1 in EXTRACT(ISODOW)
  first_monday := first_day + ((8 - EXTRACT(ISODOW FROM first_day)::INTEGER) % 7) * INTERVAL '1 day';
  
  -- n번째 월요일 계산
  result_date := first_monday + (nth - 1) * INTERVAL '7 days';
  
  RETURN result_date;
END;
$$ LANGUAGE plpgsql;

-- 4. 챌린지 자동 생성 함수
CREATE OR REPLACE FUNCTION create_challenge_for_date(target_date DATE)
RETURNS UUID AS $$
DECLARE
  new_challenge_id UUID;
  selected_topic RECORD;
  challenge_title TEXT;
  challenge_quarter TEXT;
  challenge_start DATE;
  challenge_end DATE;
  voting_start DATE;
  voting_end DATE;
  admin_user_id UUID;
BEGIN
  -- 관리자 계정 가져오기 (첫 번째 사용자 또는 특정 admin)
  SELECT id INTO admin_user_id FROM profiles WHERE email = 'artyard2025@gmail.com' LIMIT 1;
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM profiles ORDER BY created_at LIMIT 1;
  END IF;
  
  -- 랜덤 주제 선택 (사용 횟수가 적은 것 우선)
  SELECT * INTO selected_topic
  FROM challenge_topics
  ORDER BY used_count ASC, RANDOM()
  LIMIT 1;
  
  -- 챌린지 기간 설정
  challenge_start := target_date;
  challenge_end := target_date + INTERVAL '13 days'; -- 2주
  voting_start := challenge_end + INTERVAL '1 day';
  voting_end := voting_start + INTERVAL '6 days'; -- 7일 투표
  
  -- Quarter 계산 (예: "2026 Q1")
  challenge_quarter := EXTRACT(YEAR FROM target_date)::TEXT || ' Q' || 
                       CEIL(EXTRACT(MONTH FROM target_date) / 3.0)::TEXT;
  
  -- 챌린지 생성
  INSERT INTO challenges (
    topic,
    title,
    description,
    start_date,
    end_date,
    voting_start_date,
    voting_end_date,
    status,
    prize_description,
    max_entries_per_user,
    created_by,
    quarter
  ) VALUES (
    selected_topic.topic,
    selected_topic.title_template,
    selected_topic.description_template,
    challenge_start,
    challenge_end,
    voting_start,
    voting_end,
    'active',
    '🏆 Featured on main page + Special artist badge',
    1,
    admin_user_id,
    challenge_quarter
  )
  RETURNING id INTO new_challenge_id;
  
  -- 주제 사용 횟수 업데이트
  UPDATE challenge_topics
  SET used_count = used_count + 1,
      last_used_at = NOW()
  WHERE id = selected_topic.id;
  
  RAISE NOTICE '✅ Challenge created: % (ID: %)', selected_topic.title_template, new_challenge_id;
  
  RETURN new_challenge_id;
END;
$$ LANGUAGE plpgsql;

-- 5. 2026년 챌린지 자동 생성 (첫 번째, 세 번째 월요일)
CREATE OR REPLACE FUNCTION generate_2026_challenges()
RETURNS TABLE(month_val INTEGER, week_num INTEGER, challenge_date DATE, challenge_id UUID) AS $$
DECLARE
  year_val INTEGER := 2026;
  month_val INTEGER;
  first_monday DATE;
  third_monday DATE;
  new_id UUID;
BEGIN
  FOR month_val IN 1..12 LOOP
    -- 첫 번째 월요일
    first_monday := get_nth_monday_of_month(year_val, month_val, 1);
    new_id := create_challenge_for_date(first_monday);
    RETURN QUERY SELECT month_val, 1, first_monday, new_id;
    
    -- 세 번째 월요일
    third_monday := get_nth_monday_of_month(year_val, month_val, 3);
    new_id := create_challenge_for_date(third_monday);
    RETURN QUERY SELECT month_val, 3, third_monday, new_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. pg_cron 설정 (Supabase에서 실행 필요)
-- 매일 한국시간 00:00 (UTC 15:00 전날)에 체크
-- 첫 번째 또는 세 번째 월요일이면 챌린지 생성

-- Supabase Dashboard에서 실행:
-- SELECT cron.schedule(
--   'auto-create-challenges',
--   '0 15 * * *', -- UTC 15:00 = 한국시간 다음날 00:00
--   $$
--   DO $$
--   DECLARE
--     today DATE := CURRENT_DATE;
--     first_monday DATE;
--     third_monday DATE;
--     month_val INTEGER := EXTRACT(MONTH FROM today);
--     year_val INTEGER := EXTRACT(YEAR FROM today);
--   BEGIN
--     -- 2026년부터만 실행
--     IF year_val >= 2026 THEN
--       first_monday := get_nth_monday_of_month(year_val, month_val, 1);
--       third_monday := get_nth_monday_of_month(year_val, month_val, 3);
--       
--       IF today = first_monday OR today = third_monday THEN
--         PERFORM create_challenge_for_date(today);
--       END IF;
--     END IF;
--   END $$;
--   $$
-- );

-- =====================================================
-- 사용 방법
-- =====================================================

-- 1. 테스트: 특정 날짜의 챌린지 생성
-- SELECT create_challenge_for_date('2026-01-05'); -- 2026년 1월 첫 번째 월요일

-- 2. 2026년 전체 챌린지 미리 생성 (24개)
-- SELECT * FROM generate_2026_challenges();

-- 3. 생성된 챌린지 확인
-- SELECT id, topic, title, start_date, end_date, status, quarter
-- FROM challenges
-- WHERE EXTRACT(YEAR FROM start_date) = 2026
-- ORDER BY start_date;

-- 4. 챌린지 주제 사용 통계 확인
-- SELECT topic, title_template, used_count, last_used_at
-- FROM challenge_topics
-- ORDER BY used_count DESC;

-- 5. n번째 월요일 계산 테스트
-- SELECT 
--   month_num,
--   get_nth_monday_of_month(2026, month_num, 1) as first_monday,
--   get_nth_monday_of_month(2026, month_num, 3) as third_monday
-- FROM generate_series(1, 12) as month_num;

-- =====================================================
-- 정리 (필요시)
-- =====================================================

-- DROP FUNCTION IF EXISTS generate_2026_challenges();
-- DROP FUNCTION IF EXISTS create_challenge_for_date(DATE);
-- DROP FUNCTION IF EXISTS get_nth_monday_of_month(INTEGER, INTEGER, INTEGER);
-- DROP TABLE IF EXISTS challenge_topics;
-- SELECT cron.unschedule('auto-create-challenges');

