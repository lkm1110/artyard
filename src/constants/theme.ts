/**
 * 디자인 토큰 및 테마 설정
 * Fuchsia 메인 컬러와 Cyan 포인트 컬러, 다크모드 지원
 */

export const colors = {
  // 메인 컬러
  primary: '#EC4899',
  primary600: '#DB2777',
  
  // 포인트 컬러
  accent: '#06B6D4',
  
  // 시스템 컬러
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  error: '#EF4444',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  primaryLight: '#FCE7F3',
  
  // 라이트 모드
  text: '#111827',
  textMuted: '#6B7280',
  textSecondary: '#6B7280',
  bg: '#FFFFFF',
  background: '#FFFFFF',
  card: '#F8FAFC',
  border: '#E5E7EB',
  white: '#FFFFFF',
  
  // 다크 모드
  darkBg: '#0B1220',
  darkBackground: '#0B1220',
  darkCard: '#111827',
  darkText: '#E5E7EB',
  darkTextMuted: '#9CA3AF',
  darkTextSecondary: '#9CA3AF',
  darkBorder: '#374151',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  medium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export const touchableMinSize = 44; // 접근성 준수를 위한 최소 터치 영역

