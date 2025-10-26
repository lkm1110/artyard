/**
 * 2Checkout 결제 화면
 * WebView로 2Checkout 결제 페이지 표시
 */

import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { confirmPayment } from '../services/transactionService';

const TWOCHECKOUT_ACCOUNT = process.env.EXPO_PUBLIC_2CHECKOUT_ACCOUNT || '';
const APP_SCHEME = 'artyard://';

export const TwoCheckoutPaymentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  
  const { transactionId, amount, description, buyerEmail, buyerName } = route.params as {
    transactionId: string;
    amount: number;
    description: string;
    buyerEmail: string;
    buyerName: string;
  };
  
  // 2Checkout 결제 페이지 HTML
  const getPaymentHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://www.2checkout.com/checkout/api/2co.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    .amount {
      font-size: 32px;
      color: #0070BA;
      font-weight: bold;
      margin: 20px 0;
    }
    .description {
      color: #666;
      margin-bottom: 30px;
    }
    #payment-form {
      margin-top: 30px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      color: #333;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 16px;
      box-sizing: border-box;
    }
    input:focus {
      outline: none;
      border-color: #0070BA;
    }
    .card-row {
      display: flex;
      gap: 10px;
    }
    .card-row > div {
      flex: 1;
    }
    button {
      width: 100%;
      background: #0070BA;
      color: white;
      padding: 16px;
      border: none;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 20px;
    }
    button:hover {
      background: #005a99;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .error {
      color: #dc3545;
      margin-top: 10px;
      padding: 10px;
      background: #f8d7da;
      border-radius: 4px;
      display: none;
    }
    .loading {
      text-align: center;
      color: #666;
      display: none;
    }
    .secure-badge {
      text-align: center;
      color: #28a745;
      margin-top: 20px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Secure Payment</h1>
    <div class="amount">$${amount.toFixed(2)}</div>
    <div class="description">${description}</div>
    
    <form id="payment-form">
      <div class="form-group">
        <label>Card Number</label>
        <input type="text" id="ccNo" placeholder="4242 4242 4242 4242" maxlength="19" required />
      </div>
      
      <div class="card-row">
        <div class="form-group">
          <label>Expiry (MM/YY)</label>
          <input type="text" id="expDate" placeholder="12/25" maxlength="5" required />
        </div>
        
        <div class="form-group">
          <label>CVV</label>
          <input type="text" id="cvv" placeholder="123" maxlength="4" required />
        </div>
      </div>
      
      <div class="form-group">
        <label>Cardholder Name</label>
        <input type="text" id="cardName" value="${buyerName}" required />
      </div>
      
      <div class="error" id="error-message"></div>
      <div class="loading" id="loading">Processing payment...</div>
      
      <button type="submit" id="pay-button">
        Pay $${amount.toFixed(2)}
      </button>
    </form>
    
    <div class="secure-badge">
      🔒 Secured by 2Checkout
    </div>
  </div>

  <script>
    // 카드 번호 포맷팅
    document.getElementById('ccNo').addEventListener('input', function(e) {
      let value = e.target.value.replace(/\s/g, '');
      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formattedValue;
    });
    
    // 만료일 포맷팅
    document.getElementById('expDate').addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      e.target.value = value;
    });
    
    // CVV 숫자만
    document.getElementById('cvv').addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
    
    // 결제 처리
    document.getElementById('payment-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const button = document.getElementById('pay-button');
      const errorDiv = document.getElementById('error-message');
      const loadingDiv = document.getElementById('loading');
      
      // UI 업데이트
      button.disabled = true;
      button.textContent = 'Processing...';
      errorDiv.style.display = 'none';
      loadingDiv.style.display = 'block';
      
      // 카드 정보 수집
      const ccNo = document.getElementById('ccNo').value.replace(/\s/g, '');
      const expDate = document.getElementById('expDate').value;
      const cvv = document.getElementById('cvv').value;
      const cardName = document.getElementById('cardName').value;
      
      const [expMonth, expYear] = expDate.split('/');
      
      // 간단한 검증
      if (ccNo.length < 13 || ccNo.length > 19) {
        showError('Invalid card number');
        return;
      }
      
      if (!expMonth || !expYear || expMonth > 12) {
        showError('Invalid expiry date');
        return;
      }
      
      if (cvv.length < 3) {
        showError('Invalid CVV');
        return;
      }
      
      // 테스트 모드: 바로 성공 처리
      // 실제로는 2Checkout API 호출 필요
      setTimeout(() => {
        // 성공 메시지를 React Native로 전달
        window.ReactNativeWebView.postMessage(JSON.stringify({
          success: true,
          transactionId: '${transactionId}',
          paymentId: 'TCO_' + Date.now(),
          last4: ccNo.slice(-4),
        }));
      }, 2000);
    });
    
    function showError(message) {
      const errorDiv = document.getElementById('error-message');
      const button = document.getElementById('pay-button');
      const loadingDiv = document.getElementById('loading');
      
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      loadingDiv.style.display = 'none';
      button.disabled = false;
      button.textContent = 'Pay $${amount.toFixed(2)}';
    }
  </script>
</body>
</html>
    `;
  };
  
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.success) {
        // 결제 성공 처리
        const success = await confirmPayment(transactionId, data.paymentId);
        
        if (success) {
          Alert.alert(
            'Payment Successful! 🎉',
            `Your order has been confirmed.\nCard ending in ${data.last4}`,
            [
              {
                text: 'View Order',
                onPress: () => {
                  navigation.reset({
                    index: 1,
                    routes: [
                      { name: 'Home' },
                      { name: 'OrderDetail', params: { id: transactionId } },
                    ],
                  });
                },
              },
            ]
          );
        } else {
          throw new Error('Payment confirmation failed');
        }
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error: any) {
      Alert.alert('Payment Error', error.message);
      navigation.goBack();
    }
  };
  
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0070BA" />
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ html: getPaymentHTML() }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

