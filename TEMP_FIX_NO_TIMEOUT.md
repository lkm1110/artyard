# 임시 해결책: 타임아웃 완전 제거

앱 재시작으로도 해결되지 않는다면, 타임아웃을 아예 제거합니다.

## 수정할 파일: src/store/authStore.ts

### 변경 내용:

```typescript
// ❌ 이전: Promise.race로 타임아웃 구현
const { data: fetchedProfile, error: profileError } = await Promise.race([
  profilePromise,
  timeoutPromise
]);

// ✅ 수정: 타임아웃 없이 바로 대기
const { data: fetchedProfile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();
```

이렇게 하면:
- 타임아웃 에러는 발생하지 않음
- 프로필 조회가 느려도 끝까지 대기
- 실제 에러만 표시됨

단점:
- 네트워크가 매우 느리면 오래 기다림
- 하지만 RLS 정책을 최적화했으므로 빨라야 함!

