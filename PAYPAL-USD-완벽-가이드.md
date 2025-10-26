# 💵 PayPal + USD 완벽 가이드

## 🌍 **왜 달러($) + PayPal인가?**

```
✅ 글로벌 스타트업 이미지
✅ 전 세계 고객 대응
✅ 환율 걱정 없음
✅ 한국 은행 계좌로 원화 정산
✅ 수수료 투명
✅ 신뢰도 높음 (25년 역사)
```

---

## 💰 **수수료 구조 (달러 기준)**

### **작품 $50 판매 시**

```
작품 가격: $50.00
━━━━━━━━━━━━━━━━━━━━
플랫폼 수수료 (5%): -$2.50
PayPal 수수료 (4.4%): -$2.20
고정 수수료: -$0.30
━━━━━━━━━━━━━━━━━━━━
판매자 수령: $45.00 (90%)
━━━━━━━━━━━━━━━━━━━━
한국 은행 입금: 약 58,500원
```

**환율:** 1 USD = 1,300 KRW 기준

---

## 🚀 **PayPal 설정 (5분)**

### **1. 회원가입**
```
https://www.paypal.com/kr/business
→ 비즈니스 계정 만들기
→ 이메일 입력
→ 비즈니스 정보 입력
```

**개인 계정도 결제 받기 가능!**

### **2. API 자격증명 발급**
```
1. PayPal 대시보드 로그인
2. Settings → API credentials
3. REST API apps 섹션
4. "Create App" 클릭
5. App name: ArtYard
6. Sandbox/Live 선택
```

**받을 키:**
```
✅ Client ID: AXq...
✅ Secret: EQ1...
```

---

## 📦 **패키지 설치**

```bash
npm install @paypal/react-native-paypal
```

---

## 🔧 **환경변수 설정**

### **.env 파일**
```env
# PayPal
EXPO_PUBLIC_PAYPAL_CLIENT_ID=AXq...여기에_Client_ID
PAYPAL_SECRET=EQ1...여기에_Secret

# 통화 설정
EXPO_PUBLIC_CURRENCY=USD

# Supabase (기존)
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 💻 **CheckoutScreen 수정 (PayPal)**

### **완전한 코드**

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { PayPalButtons } from '@paypal/react-native-paypal';
import { supabase } from '../services/supabase';
import { createPaymentIntent, confirmPayment } from '../services/transactionService';
import { formatPrice } from '../types/complete-system';

const PAYPAL_CLIENT_ID = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '';
const CURRENCY = process.env.EXPO_PUBLIC_CURRENCY || 'USD';

export const CheckoutScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { artworkId } = route.params as { artworkId: string };
  
  const [loading, setLoading] = useState(false);
  const [artwork, setArtwork] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      // 작품 정보 (달러로 가격 파싱)
      const { data: artworkData } = await supabase
        .from('artworks')
        .select('*, author:profiles!artworks_author_id_fkey(*)')
        .eq('id', artworkId)
        .single();
      
      setArtwork(artworkData);
      
      // 배송지 목록
      const { data: addressData } = await supabase
        .from('shipping_addresses')
        .select('*')
        .order('is_default', { ascending: false });
      
      setAddresses(addressData || []);
      
      const defaultAddress = addressData?.find(a => a.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
      
    } catch (error: any) {
      Alert.alert('오류', error.message);
    }
  };
  
  // 가격 계산 (달러)
  const getArtworkPrice = () => {
    if (!artwork) return 0;
    // 예: artwork.price = "$50" or "50" 
    const priceStr = artwork.price.replace(/[^\d.]/g, '');
    return parseFloat(priceStr);
  };
  
  const calculateShipping = (price: number) => {
    // 국내: $5, 무료 배송 기준: $100
    if (price >= 100) return 0;
    return 5;
  };
  
  const handlePayment = async () => {
    try {
      if (!selectedAddressId) {
        Alert.alert('알림', '배송지를 선택해주세요');
        return;
      }
      
      setLoading(true);
      
      const artworkPrice = getArtworkPrice();
      const shippingFee = calculateShipping(artworkPrice);
      const platformFee = artworkPrice * 0.05;
      const paypalFee = artworkPrice * 0.044 + 0.30;
      const sellerAmount = artworkPrice - platformFee - paypalFee;
      const totalAmount = artworkPrice + shippingFee;
      
      // 1. Transaction 생성
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          artwork_id: artworkId,
          buyer_id: (await supabase.auth.getUser()).data.user?.id,
          seller_id: artwork.author_id,
          amount: Math.round(artworkPrice * 100), // 센트 단위
          shipping_fee: Math.round(shippingFee * 100),
          platform_fee: Math.round(platformFee * 100),
          seller_amount: Math.round(sellerAmount * 100),
          payment_method: 'paypal',
          status: 'pending',
          shipping_recipient: addresses.find(a => a.id === selectedAddressId)?.recipient_name,
          shipping_phone: addresses.find(a => a.id === selectedAddressId)?.phone,
          shipping_postal_code: addresses.find(a => a.id === selectedAddressId)?.postal_code,
          shipping_address: addresses.find(a => a.id === selectedAddressId)?.address,
          shipping_address_detail: addresses.find(a => a.id === selectedAddressId)?.address_detail,
          shipping_country: addresses.find(a => a.id === selectedAddressId)?.country || 'US',
          shipping_zone: 'domestic',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // 2. PayPal 결제 페이지 열기
      navigation.navigate('PayPalPayment', {
        transactionId: transaction.id,
        amount: totalAmount,
        description: artwork.title,
      });
      
    } catch (error: any) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!artwork) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  const artworkPrice = getArtworkPrice();
  const shippingFee = calculateShipping(artworkPrice);
  const totalAmount = artworkPrice + shippingFee;
  
  return (
    <ScrollView style={styles.container}>
      {/* 작품 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.artworkInfo}>
          {artwork.images && artwork.images[0] && (
            <Image
              source={{ uri: artwork.images[0] }}
              style={styles.artworkImage}
            />
          )}
          <View style={styles.artworkDetails}>
            <Text style={styles.artworkTitle}>{artwork.title}</Text>
            <Text style={styles.artworkAuthor}>by {artwork.author.handle}</Text>
            <Text style={styles.artworkPrice}>{formatPrice(artworkPrice, CURRENCY)}</Text>
          </View>
        </View>
      </View>
      
      {/* 배송지 선택 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddressForm')}>
            <Text style={styles.addButton}>+ Add New</Text>
          </TouchableOpacity>
        </View>
        
        {addresses.map((address) => (
          <TouchableOpacity
            key={address.id}
            style={[
              styles.addressItem,
              selectedAddressId === address.id && styles.addressItemSelected,
            ]}
            onPress={() => setSelectedAddressId(address.id)}
          >
            <View style={styles.addressRadio}>
              {selectedAddressId === address.id && (
                <View style={styles.addressRadioInner} />
              )}
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressName}>{address.recipient_name}</Text>
              <Text style={styles.addressText}>
                {address.address}, {address.city}, {address.state} {address.postal_code}
              </Text>
              <Text style={styles.addressText}>{address.country}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 금액 요약 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Artwork</Text>
          <Text style={styles.priceValue}>{formatPrice(artworkPrice, CURRENCY)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Shipping</Text>
          <Text style={styles.priceValue}>
            {shippingFee === 0 ? 'FREE' : formatPrice(shippingFee, CURRENCY)}
          </Text>
        </View>
        {artworkPrice >= 100 && (
          <Text style={styles.freeShippingNote}>
            🎉 Free shipping on orders over $100!
          </Text>
        )}
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(totalAmount, CURRENCY)}</Text>
        </View>
      </View>
      
      {/* PayPal 버튼 */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.paypalButton, loading && styles.paypalButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.paypalButtonText}>Pay with</Text>
              <Text style={styles.paypalLogo}>PayPal</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* 안내 */}
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          • Secure payment via PayPal
        </Text>
        <Text style={styles.noticeText}>
          • 7-day buyer protection
        </Text>
        <Text style={styles.noticeText}>
          • Fast worldwide shipping
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addButton: {
    color: '#0070BA',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // 작품 정보
  artworkInfo: {
    flexDirection: 'row',
  },
  artworkImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  artworkDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  artworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artworkAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  artworkPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0070BA',
  },
  
  // 배송지
  addressItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addressItemSelected: {
    borderColor: '#0070BA',
    backgroundColor: '#F0F7FF',
  },
  addressRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0070BA',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0070BA',
  },
  addressContent: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  
  // 금액
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: '#666',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  freeShippingNote: {
    fontSize: 13,
    color: '#0070BA',
    marginBottom: 12,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0070BA',
  },
  
  // PayPal 버튼
  paypalButton: {
    backgroundColor: '#0070BA',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paypalButtonDisabled: {
    opacity: 0.6,
  },
  paypalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paypalLogo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  // 안내
  notice: {
    padding: 20,
    backgroundColor: '#F9F9F9',
  },
  noticeText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
});
```

---

## 🎯 **가격 가이드라인 (달러)**

### **작품 가격대**
```
💎 Premium: $100 - $500
🎨 Standard: $30 - $100
🌱 Beginner: $10 - $30
```

### **배송비**
```
국내 (US): $5 (Free over $100)
아시아: $15
유럽: $25
글로벌: $30
```

---

## 💰 **수수료 계산기**

| 작품 가격 | 플랫폼 (5%) | PayPal (4.4%) | 판매자 수령 | 수령률 |
|----------|------------|--------------|-----------|--------|
| $10 | -$0.50 | -$0.74 | $8.76 | 87.6% |
| $30 | -$1.50 | -$1.62 | $26.88 | 89.6% |
| $50 | -$2.50 | -$2.50 | $45.00 | 90.0% |
| $100 | -$5.00 | -$4.70 | $90.30 | 90.3% |
| $200 | -$10.00 | -$9.10 | $180.90 | 90.5% |

**결론:** 가격이 높을수록 수수료율 유리! ✅

---

## 🌏 **환전 & 정산**

### **자동 환전**
```
PayPal에서 달러로 받음
   ↓
한국 은행 계좌 연결
   ↓
자동으로 원화 환전
   ↓
한국 은행 계좌에 입금
```

### **환전 수수료**
```
PayPal 환율: 약 3.5% (시장 환율보다 조금 높음)
예: $100 받음 → 약 126,000원 입금 (환율 1,300 기준)
```

### **정산 주기**
```
기본: D+3 (3일 후)
빠른 정산: D+1 (수수료 1% 추가)
```

---

## 🧪 **테스트 (Sandbox)**

### **PayPal Sandbox 계정**
```
1. developer.paypal.com
2. Sandbox accounts
3. 테스트 buyer/seller 계정 생성
4. 실제 돈 안 쓰고 테스트!
```

### **테스트 카드**
```
PayPal에서 제공하는 테스트 계정 사용
실제 결제 흐름 완벽 테스트 가능
```

---

## 📊 **vs Stripe 비교**

| 항목 | PayPal | Stripe |
|------|--------|--------|
| 달러 지원 | ✅ 완벽 | ✅ 완벽 |
| 한국 계좌 정산 | ✅ 가능 | ❌ 불가 |
| 수수료 | 4.4% | 3.2% |
| 글로벌 | ✅ 200개국 | ✅ 46개국 |
| 신뢰도 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 설정 난이도 | ⭐⭐⭐ | ⭐⭐ |

**달러 시스템이면 PayPal이 현실적!** ✅

---

## 🎯 **다음 단계**

```
1. ✅ SQL 실행 (완료!)
2. ✅ formatPrice 함수 수정 (완료!)
3. □ PayPal 비즈니스 계정 생성
4. □ API 자격증명 발급
5. □ 패키지 설치
6. □ CheckoutScreen 수정
7. □ 테스트!
```

---

## 💡 **팁**

### **가격 책정**
```
한국 작품: 30,000원 → $25 (약간 낮게)
이유: 글로벌 경쟁력 + 환율 고려
```

### **배송**
```
국내: $5 고정
해외: 국가별 차등 ($15-$30)
```

### **마케팅**
```
"Worldwide shipping available! 🌍"
"Secure payment via PayPal 🔒"
"Free shipping over $100! 🎉"
```

---

**달러 시스템 + PayPal = 글로벌 준비 완료!** 🚀💵

설정 도와드릴까요? 😊

