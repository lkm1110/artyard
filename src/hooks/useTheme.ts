/**
 * 테마 관련 훅
 */

import { useColorScheme } from 'react-native';
import { colors } from '../constants/theme';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors,
    isDark,
    colorScheme,
  };
};
