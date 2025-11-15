/**
 * 탭 네비게이션 설정
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

// 스크린 import
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ChallengesScreen } from '../screens/ChallengesScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<any>(); // TODO: 타입 정의 개선

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? colors.darkTextMuted : colors.textMuted,
        tabBarStyle: {
          backgroundColor: isDark ? colors.darkCard : colors.bg,
          borderTopColor: isDark ? colors.darkCard : colors.card,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: undefined, // 웹 호환성을 위해 명시적으로 설정
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Upload"
        component={HomeScreen}
        options={{
          title: 'Upload',
          tabBarIcon: ({ color, size }) => (
            <Ionicons 
              name="add-circle" 
              size={size + 8} 
              color={color} 
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // 기본 탭 네비게이션 방지
            e.preventDefault();
            // 업로드 모달 화면 열기
            navigation.navigate('ArtworkUpload');
          },
        }}
      />
      
      <Tab.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "trophy" : "trophy-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "chatbubbles" : "chatbubbles-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({});

