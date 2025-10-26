/**
 * 디버깅용 로그 표시 컴포넌트
 * 화면에 로그를 표시하여 실제 기기에서 디버깅 가능
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'success' | 'warning';
  message: string;
}

const logs: LogEntry[] = [];
let logListener: ((logs: LogEntry[]) => void) | null = null;

// 전역 로그 함수
export const debugLog = (message: string, level: 'info' | 'error' | 'success' | 'warning' = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  const entry = { timestamp, level, message };
  
  // 콘솔에도 출력
  console.log(`[${timestamp}] [${level.toUpperCase()}]`, message);
  
  // 배열에 추가 (최대 100개)
  logs.push(entry);
  if (logs.length > 100) {
    logs.shift();
  }
  
  // 리스너에 알림
  if (logListener) {
    logListener([...logs]);
  }
};

export const DebugLogger: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    // 로그 리스너 등록
    logListener = (newLogs) => {
      setLogEntries(newLogs);
    };

    return () => {
      logListener = null;
    };
  }, []);

  if (Platform.OS === 'web') {
    return null; // 웹에서는 표시 안 함
  }

  if (!visible) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.floatingButtonText}>🐛 디버그</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>디버그 로그 ({logEntries.length})</Text>
        <TouchableOpacity onPress={() => setLogEntries([])}>
          <Text style={styles.clearButton}>지우기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setVisible(false)}>
          <Text style={styles.closeButton}>닫기</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.logContainer}>
        {logEntries.map((entry, index) => (
          <View key={index} style={styles.logEntry}>
            <Text style={[styles.logText, styles[entry.level]]}>
              [{entry.timestamp}] {entry.message}
            </Text>
          </View>
        ))}
        {logEntries.length === 0 && (
          <Text style={styles.emptyText}>로그가 없습니다</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    bottom: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 10,
    zIndex: 9999,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  clearButton: {
    color: '#FFA500',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  closeButton: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    padding: 8,
  },
  logEntry: {
    marginBottom: 4,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  logText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  info: {
    color: '#FFFFFF',
  },
  error: {
    color: '#FF6B6B',
  },
  success: {
    color: '#51CF66',
  },
  warning: {
    color: '#FFA500',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

