/**
 * 공통 스크린 레이아웃 컴포넌트
 * 안전 영역과 다크모드를 고려한 기본 레이아웃
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  safeArea?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  scrollable = false,
  safeArea = true,
  edges = ['top', 'bottom'],
}) => {
  const isDark = useColorScheme() === 'dark';
  
  const containerStyle = [
    styles.container,
    {
      backgroundColor: isDark ? colors.darkBg : colors.bg,
    },
    style,
  ];

  const content = scrollable ? (
    <ScrollView 
      style={containerStyle}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={containerStyle}>
      {children}
    </View>
  );

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.darkBg : colors.bg}
      />
      {safeArea ? (
        <SafeAreaView style={styles.safeArea} edges={edges}>
          {content}
        </SafeAreaView>
      ) : (
        content
      )}
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
