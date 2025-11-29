/**
 * LinkableText Component
 * URL을 자동으로 감지하여 클릭 가능한 링크로 변환하는 텍스트 컴포넌트
 */

import React from 'react';
import { Text, TextStyle, Linking, Alert, StyleProp } from 'react-native';
import { colors } from '../constants/theme';

interface LinkableTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export const LinkableText: React.FC<LinkableTextProps> = ({
  text,
  style,
  linkStyle,
  numberOfLines,
  ellipsizeMode,
}) => {
  // URL 패턴 매칭 정규식 (http, https, www 포함)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

  const handleLinkPress = async (url: string) => {
    try {
      // www로 시작하는 경우 https:// 추가
      const fullUrl = url.startsWith('www.') ? `https://${url}` : url;
      
      // URL이 열릴 수 있는지 확인
      const supported = await Linking.canOpenURL(fullUrl);
      
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert('Error', `Cannot open this URL: ${url}`);
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  // 텍스트를 파싱하여 링크와 일반 텍스트로 분리
  const parseText = () => {
    const parts: Array<{ text: string; isLink: boolean }> = [];
    let lastIndex = 0;

    // URL 찾기
    const matches = text.matchAll(urlRegex);
    
    for (const match of matches) {
      const url = match[0];
      const index = match.index!;

      // URL 이전의 일반 텍스트 추가
      if (index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, index),
          isLink: false,
        });
      }

      // URL 추가
      parts.push({
        text: url,
        isLink: true,
      });

      lastIndex = index + url.length;
    }

    // 마지막 URL 이후의 일반 텍스트 추가
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isLink: false,
      });
    }

    // URL이 없는 경우 전체 텍스트 반환
    if (parts.length === 0) {
      parts.push({
        text: text,
        isLink: false,
      });
    }

    return parts;
  };

  const parts = parseText();

  const defaultLinkStyle: TextStyle = {
    color: colors.primary,
    textDecorationLine: 'underline',
  };

  return (
    <Text 
      style={style}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
    >
      {parts.map((part, index) => (
        <Text
          key={index}
          style={part.isLink ? [defaultLinkStyle, linkStyle] : undefined}
          onPress={part.isLink ? () => handleLinkPress(part.text) : undefined}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
};

