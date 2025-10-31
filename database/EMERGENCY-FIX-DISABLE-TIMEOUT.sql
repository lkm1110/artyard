-- ========================================
-- 긴급 임시 해결책: 타임아웃 제거
-- ========================================
-- 프로필 조회가 느린 근본 원인을 찾는 동안
-- 타임아웃 에러를 막기 위한 임시 조치입니다.
-- ========================================

-- 이 SQL 스크립트는 실행할 필요 없습니다!
-- 아래 코드 수정만 하면 됩니다.

-- ========================================
-- 코드 수정 방법 (src/store/authStore.ts)
-- ========================================

-- 방법 1: 타임아웃 시간 늘리기 (30초)
-- 149줄과 179줄의 15000을 30000으로 변경

-- 방법 2: 타임아웃 완전 제거 (권장)
-- Promise.race를 제거하고 직접 대기

/*
기존 코드 (약 153~193줄):

const profilePromise = supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();

const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
  setTimeout(() => { ... }, 15000);
});

const { data: fetchedProfile, error: profileError } = await Promise.race([
  profilePromise,
  timeoutPromise
]);

→ 수정 (간단하게):

const { data: fetchedProfile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();
*/

-- ========================================
-- 근본 원인 찾기
-- ========================================
-- 1. CHECK-PROFILE-PERFORMANCE.sql 실행
-- 2. 트리거, 외래 키, 인덱스 확인
-- 3. 네트워크 속도 테스트

