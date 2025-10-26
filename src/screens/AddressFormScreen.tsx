/**
 * 배송지 추가/수정 화면
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export const AddressFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  
  const existingAddress = (route.params as any)?.address;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient_name: existingAddress?.recipient_name || '',
    phone: existingAddress?.phone || '',
    postal_code: existingAddress?.postal_code || '',
    country: existingAddress?.country || 'KR',
    state: existingAddress?.state || '',
    city: existingAddress?.city || '',
    address: existingAddress?.address || '',
    address_detail: existingAddress?.address_detail || '',
    is_default: existingAddress?.is_default || false,
  });
  
  const handleSave = async () => {
    // Validation
    if (!formData.recipient_name.trim()) {
      Alert.alert('Notice', 'Please enter recipient name');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Notice', 'Please enter phone number');
      return;
    }
    if (!formData.postal_code.trim()) {
      Alert.alert('Notice', 'Please enter postal code');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Notice', 'Please enter address');
      return;
    }
    
    setLoading(true);
    
    try {
      if (!user?.id) {
        throw new Error('Login required');
      }
      
      console.log('💾 배송지 저장 시작:', formData);
      console.log('👤 사용자 ID:', user.id);
      
      // If setting as default, unset other default addresses
      if (formData.is_default) {
        console.log('🔄 기본 배송지 업데이트 중...');
        const { error: updateError } = await supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('❌ 기본 배송지 업데이트 실패:', updateError);
        } else {
          console.log('✅ 기본 배송지 업데이트 성공');
        }
      }
      
      const addressData = {
        ...formData,
        user_id: user.id,
      };
      
      console.log('📦 저장할 데이터:', addressData);
      
      if (existingAddress) {
        // Update
        console.log('🔄 배송지 수정 중...', existingAddress.id);
        const { data, error } = await supabase
          .from('shipping_addresses')
          .update(addressData)
          .eq('id', existingAddress.id)
          .select();
        
        if (error) {
          console.error('❌ 배송지 수정 실패:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          throw error;
        }
        console.log('✅ 배송지 수정 성공:', data);
        Alert.alert('Success', 'Shipping address updated');
      } else {
        // Add
        console.log('➕ 새 배송지 추가 중...');
        const { data, error } = await supabase
          .from('shipping_addresses')
          .insert([addressData])
          .select();
        
        if (error) {
          console.error('❌ 배송지 추가 실패:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          throw error;
        }
        console.log('✅ 배송지 추가 성공:', data);
        Alert.alert('Success', 'Shipping address added');
      }
      
      console.log('🎉 배송지 저장 완료! 화면 닫기...');
      navigation.goBack();
    } catch (error: any) {
      console.error('💥 배송지 저장 에러:', error);
      Alert.alert(
        'Error',
        `Failed to save shipping address:\n\n${error.message}\n\nCode: ${error.code || 'N/A'}\n\nPlease check console for details.`
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {existingAddress ? 'Edit Address' : 'New Address'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#E91E63" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Recipient Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.recipient_name}
            onChangeText={(text) => setFormData({ ...formData, recipient_name: text })}
            placeholder="Enter name"
          />
        </View>
        
        <View style={styles.field}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="+1-234-567-8900"
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.field}>
          <Text style={styles.label}>Country *</Text>
          <TextInput
            style={styles.input}
            value={formData.country}
            onChangeText={(text) => setFormData({ ...formData, country: text })}
            placeholder="KR (Korea)"
          />
          <Text style={styles.hint}>ISO code (KR, US, JP, etc.)</Text>
        </View>
        
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Postal Code *</Text>
            <TextInput
              style={styles.input}
              value={formData.postal_code}
              onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
              placeholder="12345"
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>State/Province</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
              placeholder="Seoul"
            />
          </View>
        </View>
        
        <View style={styles.field}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
            placeholder="Gangnam-gu"
          />
        </View>
        
        <View style={styles.field}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Enter street address"
          />
        </View>
        
        <View style={styles.field}>
          <Text style={styles.label}>Address Detail</Text>
          <TextInput
            style={styles.input}
            value={formData.address_detail}
            onChangeText={(text) => setFormData({ ...formData, address_detail: text })}
            placeholder="Apt/Suite/Unit number, etc."
          />
        </View>
        
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
        >
          <View style={[styles.checkbox, formData.is_default && styles.checkboxChecked]}>
            {formData.is_default && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Set as default address</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    fontSize: 16,
    color: '#E91E63',
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
  },
});

