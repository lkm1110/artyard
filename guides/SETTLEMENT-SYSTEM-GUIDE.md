# 💰 정산 관리 시스템 가이드

작가에게 판매 수익을 정산하는 시스템 구현 가이드입니다.

---

## 📋 **정산 흐름**

```
1. 작품 판매 완료
   ↓
2. 구매자가 "수령 확인" 클릭 (또는 7일 자동 확인)
   ↓
3. 거래 상태: confirmed
   ↓
4. 정산 대상에 자동 추가
   ↓
5. 정산일 (매주 금요일 또는 매월 말)
   ↓
6. 관리자 승인
   ↓
7. 작가 계좌로 입금
   ↓
8. 정산 완료 알림
```

---

## 🎯 **정산 계산식**

```yaml
판매가: 50,000원
플랫폼 수수료 (10%): -5,000원
결제 수수료 (3%): -1,500원
배송비 (구매자 부담): 0원
━━━━━━━━━━━━━━━━━━━━━
작가 수령액: 43,500원
```

---

## 📊 **Database Schema**

### **settlements 테이블**

```sql
-- 정산 테이블
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 정산 기간
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- 금액 정보
  total_sales_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- 실제 정산액
  
  -- 거래 건수
  transaction_count INTEGER NOT NULL DEFAULT 0,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'processing', 'completed', 'failed')
  ),
  
  -- 은행 정보
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  
  -- 처리 정보
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- 메모
  admin_note TEXT,
  reject_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_settlements_artist_id ON settlements(artist_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_period ON settlements(period_start, period_end);

-- RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- 작가는 자신의 정산만 조회
CREATE POLICY "Artists can view own settlements"
  ON settlements FOR SELECT
  USING (artist_id = auth.uid());

-- 관리자는 모두 조회/수정 가능
CREATE POLICY "Admins can manage all settlements"
  ON settlements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- settlement_items 테이블 (정산 상세 내역)
CREATE TABLE IF NOT EXISTS settlement_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  
  artwork_id UUID NOT NULL REFERENCES artworks(id),
  artwork_title TEXT NOT NULL,
  
  sale_amount DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL,
  payment_fee DECIMAL(12,2) NOT NULL,
  net_amount DECIMAL(12,2) NOT NULL,
  
  sold_at TIMESTAMP WITH TIME ZONE NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_settlement_items_settlement_id ON settlement_items(settlement_id);
CREATE INDEX idx_settlement_items_transaction_id ON settlement_items(transaction_id);
```

---

## 🔧 **자동 정산 생성 Function**

```sql
-- 정산 자동 생성 함수
CREATE OR REPLACE FUNCTION create_weekly_settlements()
RETURNS void AS $$
DECLARE
  artist RECORD;
  period_start TIMESTAMP WITH TIME ZONE;
  period_end TIMESTAMP WITH TIME ZONE;
  settlement_id UUID;
  total_sales DECIMAL(12,2);
  total_platform_fee DECIMAL(12,2);
  total_payment_fee DECIMAL(12,2);
  total_net_amount DECIMAL(12,2);
  tx_count INTEGER;
BEGIN
  -- 지난주 월요일 00:00 ~ 일요일 23:59
  period_start := date_trunc('week', NOW() - INTERVAL '1 week');
  period_end := period_start + INTERVAL '1 week' - INTERVAL '1 second';
  
  -- 판매가 있는 작가들만
  FOR artist IN
    SELECT DISTINCT seller_id as artist_id
    FROM transactions
    WHERE status = 'confirmed'
      AND confirmed_at BETWEEN period_start AND period_end
      AND NOT EXISTS (
        SELECT 1 FROM settlement_items si
        JOIN settlements s ON s.id = si.settlement_id
        WHERE si.transaction_id = transactions.id
      )
  LOOP
    -- 해당 작가의 정산 집계
    SELECT
      COUNT(*),
      SUM(total_amount - shipping_fee) as sales,
      SUM((total_amount - shipping_fee) * 0.10) as platform_fee,
      SUM((total_amount - shipping_fee) * 0.03) as payment_fee
    INTO
      tx_count,
      total_sales,
      total_platform_fee,
      total_payment_fee
    FROM transactions
    WHERE seller_id = artist.artist_id
      AND status = 'confirmed'
      AND confirmed_at BETWEEN period_start AND period_end;
    
    total_net_amount := total_sales - total_platform_fee - total_payment_fee;
    
    -- 정산 레코드 생성
    INSERT INTO settlements (
      artist_id,
      period_start,
      period_end,
      total_sales_amount,
      platform_fee,
      payment_fee,
      net_amount,
      transaction_count,
      status
    ) VALUES (
      artist.artist_id,
      period_start,
      period_end,
      total_sales,
      total_platform_fee,
      total_payment_fee,
      total_net_amount,
      tx_count,
      'pending'
    ) RETURNING id INTO settlement_id;
    
    -- 정산 상세 내역 생성
    INSERT INTO settlement_items (
      settlement_id,
      transaction_id,
      artwork_id,
      artwork_title,
      sale_amount,
      platform_fee,
      payment_fee,
      net_amount,
      sold_at,
      confirmed_at
    )
    SELECT
      settlement_id,
      t.id,
      a.id,
      a.title,
      t.total_amount - t.shipping_fee,
      (t.total_amount - t.shipping_fee) * 0.10,
      (t.total_amount - t.shipping_fee) * 0.03,
      (t.total_amount - t.shipping_fee) * 0.87,
      t.created_at,
      t.confirmed_at
    FROM transactions t
    JOIN artworks a ON a.id = t.artwork_id
    WHERE t.seller_id = artist.artist_id
      AND t.status = 'confirmed'
      AND t.confirmed_at BETWEEN period_start AND period_end;
    
    RAISE NOTICE 'Created settlement for artist %: $%', artist.artist_id, total_net_amount;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 매주 월요일 자동 실행 (Supabase에서 cron 설정)
-- Supabase Dashboard > Database > Cron Jobs
-- Schedule: 0 0 * * 1 (매주 월요일 자정)
```

---

## 📱 **관리자 정산 관리 화면**

### **SettlementManagementScreen.tsx**

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../services/supabase';

export const SettlementManagementScreen = () => {
  const [settlements, setSettlements] = useState([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  
  useEffect(() => {
    loadSettlements();
  }, [filter]);
  
  const loadSettlements = async () => {
    const query = supabase
      .from('settlements')
      .select(`
        *,
        artist:profiles!settlements_artist_id_fkey(handle, email, avatar_url),
        items:settlement_items(count)
      `)
      .order('created_at', { ascending: false });
    
    if (filter === 'pending') {
      query.eq('status', 'pending');
    }
    
    const { data, error } = await query;
    if (!error) setSettlements(data || []);
  };
  
  const handleApprove = async (settlementId: string) => {
    Alert.alert(
      'Approve Settlement',
      'Are you sure you want to approve this settlement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            const { error } = await supabase
              .from('settlements')
              .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
              })
              .eq('id', settlementId);
            
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Success', 'Settlement approved!');
              loadSettlements();
            }
          }
        }
      ]
    );
  };
  
  const handleExportExcel = async () => {
    // Excel 다운로드 (나중에 구현)
    Alert.alert('Export', 'Excel export feature coming soon!');
  };
  
  const renderSettlement = ({ item }: { item: any }) => (
    <View style={styles.settlementCard}>
      <View style={styles.header}>
        <Text style={styles.artistName}>{item.artist.handle}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.period}>
        {formatDate(item.period_start)} - {formatDate(item.period_end)}
      </Text>
      
      <View style={styles.amounts}>
        <Text>Sales: ${item.total_sales_amount}</Text>
        <Text>Fees: -${item.platform_fee + item.payment_fee}</Text>
        <Text style={styles.netAmount}>Net: ${item.net_amount}</Text>
      </View>
      
      <Text style={styles.transactions}>
        {item.transaction_count} transactions
      </Text>
      
      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApprove(item.id)}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('SettlementDetail', { id: item.id })}
          >
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {item.bank_name && (
        <View style={styles.bankInfo}>
          <Text>🏦 {item.bank_name}</Text>
          <Text>{item.account_number}</Text>
          <Text>{item.account_holder}</Text>
        </View>
      )}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TouchableOpacity onPress={() => setFilter('pending')}>
          <Text>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('all')}>
          <Text>All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExportExcel}>
          <Text>📊 Export Excel</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={settlements}
        renderItem={renderSettlement}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

---

## 👨‍🎨 **작가 정산 조회 화면**

### **MySettlementsScreen.tsx**

```typescript
export const MySettlementsScreen = () => {
  const { user } = useAuthStore();
  const [settlements, setSettlements] = useState([]);
  
  useEffect(() => {
    loadMySettlements();
  }, []);
  
  const loadMySettlements = async () => {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('artist_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (!error) setSettlements(data || []);
  };
  
  return (
    <View>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Total Earnings</Text>
        <Text style={styles.summaryAmount}>
          ${settlements.reduce((sum, s) => sum + s.net_amount, 0)}
        </Text>
      </View>
      
      <FlatList
        data={settlements}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{formatDate(item.period_start)} - {formatDate(item.period_end)}</Text>
            <Text style={styles.amount}>${item.net_amount}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

---

## 🔔 **정산 알림**

```typescript
// 정산 완료 시 알림 발송
const notifySettlementComplete = async (settlementId: string) => {
  const { data: settlement } = await supabase
    .from('settlements')
    .select('artist_id, net_amount')
    .eq('id', settlementId)
    .single();
  
  if (!settlement) return;
  
  // 푸시 알림 발송
  await supabase.functions.invoke('send-push-notification', {
    body: {
      userId: settlement.artist_id,
      title: '💰 Settlement Completed!',
      body: `Your settlement of $${settlement.net_amount} has been processed.`,
      data: {
        type: 'settlement',
        settlementId,
      },
    },
  });
};
```

---

## 📝 **체크리스트**

```yaml
□ settlements 테이블 생성
□ settlement_items 테이블 생성
□ create_weekly_settlements() 함수 생성
□ Supabase Cron Job 설정 (매주 월요일)
□ SettlementManagementScreen 생성
□ MySettlementsScreen 생성
□ 정산 승인 기능
□ Excel 다운로드 기능
□ 정산 완료 알림
□ 은행 정보 등록 UI
□ 정산 상세 내역 화면
```

---

**완료 예상 시간: 1-2일** ⏰

