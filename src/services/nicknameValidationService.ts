/**
 * 닉네임 검증 및 비속어 필터링 서비스
 */

// 영어 비속어 목록 (기본적인 것들만)
const PROFANITY_LIST = [
  // 일반적인 영어 비속어
  'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard', 'crap',
  'piss', 'cock', 'dick', 'pussy', 'whore', 'slut', 'fag', 'nigger',
  'retard', 'gay', 'lesbian', 'homo', 'nazi', 'hitler', 'kill', 'die',
  'death', 'murder', 'rape', 'sex', 'porn', 'nude', 'naked', 'drug',
  'cocaine', 'weed', 'marijuana', 'alcohol', 'beer', 'wine', 'drunk',
  
  // 변형된 형태들
  'f*ck', 'f**k', 'sh*t', 'sh**', 'd*mn', 'h*ll', 'a**', 'b*tch',
  'fuk', 'fck', 'sht', 'dmn', 'hll', 'btch', 'fack', 'shyt',
  
  // 숫자로 대체된 형태들
  'f4ck', 'sh1t', 'h3ll', 'a55', 'b1tch', '5hit', 'fuc6', 'he11',
  
  // 한국어 비속어 (로마자 표기)
  'sibal', 'ssibal', 'fuck', 'jot', 'gaeseki', 'byungshin', 'michin',
  'jonna', 'jiral', 'shibal', 'ssabal', 'gae', 'nom', 'nyeon',
  
  // 기타 부적절한 단어들
  'admin', 'root', 'system', 'null', 'undefined', 'test', 'demo',
  'sample', 'example', 'temp', 'temporary', 'delete', 'remove',
];

// 예약어 목록 (시스템에서 사용하는 단어들)
const RESERVED_WORDS = [
  'admin', 'administrator', 'root', 'system', 'user', 'guest', 'anonymous',
  'null', 'undefined', 'void', 'empty', 'blank', 'none', 'nil',
  'test', 'demo', 'sample', 'example', 'temp', 'temporary', 'tmp',
  'api', 'www', 'ftp', 'mail', 'email', 'support', 'help', 'info',
  'about', 'contact', 'home', 'index', 'main', 'default', 'public',
  'private', 'secure', 'login', 'logout', 'signin', 'signup', 'register',
  'artyard', 'art', 'yard', 'canvas', 'pop', 'canvaspop',
];

/**
 * 닉네임 유효성 검사
 */
export const validateNickname = (nickname: string): {
  isValid: boolean;
  error?: string;
} => {
  // 기본 검증
  if (!nickname || typeof nickname !== 'string') {
    return { isValid: false, error: 'Nickname is required' };
  }

  const trimmed = nickname.trim();

  // 길이 검증
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Nickname must be at least 3 characters' };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: 'Nickname must be less than 30 characters' };
  }

  // 영어와 숫자만 허용 (언더스코어 제거)
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return { isValid: false, error: 'Nickname can only contain English letters and numbers' };
  }

  // 숫자로만 구성된 닉네임 금지
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Nickname cannot be only numbers' };
  }

  // 연속된 같은 문자 3개 이상 금지
  if (/(.)\1{2,}/.test(trimmed)) {
    return { isValid: false, error: 'Nickname cannot have 3 or more consecutive same characters' };
  }

  // 비속어 검사 (대소문자 무시)
  const lowerNickname = trimmed.toLowerCase();
  
  for (const profanity of PROFANITY_LIST) {
    if (lowerNickname.includes(profanity.toLowerCase())) {
      return { isValid: false, error: 'Nickname contains inappropriate content' };
    }
  }

  // 예약어 검사
  if (RESERVED_WORDS.includes(lowerNickname)) {
    return { isValid: false, error: 'This nickname is reserved and cannot be used' };
  }

  // 시작/끝이 숫자인 경우 경고 (허용하되 권장하지 않음)
  if (/^\d/.test(trimmed) || /\d$/.test(trimmed)) {
    // 경고만 하고 허용
    console.warn('닉네임이 숫자로 시작하거나 끝남:', trimmed);
  }

  return { isValid: true };
};

/**
 * 닉네임 제안 생성 (유효하지 않은 경우 대안 제시)
 */
export const suggestNickname = (originalNickname: string): string[] => {
  const suggestions: string[] = [];
  const base = originalNickname.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  if (base.length >= 3) {
    // 기본 제안들
    suggestions.push(base);
    suggestions.push(base + '123');
    suggestions.push('user' + base);
    suggestions.push(base + 'art');
    suggestions.push('art' + base);
    
    // 랜덤 숫자 추가
    for (let i = 0; i < 3; i++) {
      const randomNum = Math.floor(Math.random() * 999) + 1;
      suggestions.push(base + randomNum);
    }
  } else {
    // 너무 짧은 경우 일반적인 제안
    const commonPrefixes = ['art', 'user', 'artist', 'creative', 'canvas'];
    for (const prefix of commonPrefixes) {
      const randomNum = Math.floor(Math.random() * 999) + 1;
      suggestions.push(prefix + randomNum);
    }
  }

  // 중복 제거 및 유효성 검사
  const validSuggestions = [...new Set(suggestions)]
    .filter(suggestion => validateNickname(suggestion).isValid)
    .slice(0, 5);

  return validSuggestions;
};

/**
 * 실시간 닉네임 검증 (타이핑 중)
 */
export const validateNicknameRealtime = (nickname: string): {
  isValid: boolean;
  warning?: string;
  suggestion?: string;
} => {
  if (!nickname) {
    return { isValid: false };
  }

  const trimmed = nickname.trim();

  // 길이 체크
  if (trimmed.length < 3) {
    return { 
      isValid: false, 
      warning: `${3 - trimmed.length} more characters needed` 
    };
  }

  // 문자 유효성 체크
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return { 
      isValid: false, 
      warning: 'Only English letters and numbers allowed',
      suggestion: trimmed.replace(/[^a-zA-Z0-9]/g, '')
    };
  }

  // 전체 검증
  const fullValidation = validateNickname(trimmed);
  
  return {
    isValid: fullValidation.isValid,
    warning: fullValidation.error
  };
};

export default {
  validateNickname,
  suggestNickname,
  validateNicknameRealtime,
};
