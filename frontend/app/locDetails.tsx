import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LocationDetails = {
  address: string;
  taluka: string;
  pinCode: string;
  state: string;
  whatsapp_number: string;
  pan_number: string;
  aadhar_number: string;
  contact_number: string;
};

export default function AddLocationDetailsScreen() {
  const [locationData, setLocationData] = useState<LocationDetails>({
    address: '',
    taluka: '',
    pinCode: '',
    state: '',
    whatsapp_number: '',
    pan_number: '',
    aadhar_number: '',
    contact_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (field: keyof LocationDetails, value: string) => {
    setLocationData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Validate all fields
      const requiredFields: (keyof LocationDetails)[] = [
        'address',
        'taluka',
        'pinCode',
        'state',
        'whatsapp_number',
        'pan_number',
        'aadhar_number',
        'contact_number',
      ];
      const missingFields = requiredFields.filter((field) => !locationData[field].trim());
      if (missingFields.length > 0) {
        throw new Error('Please fill all the required fields');
      }

      // Make API call
      await api.saveLocationDetails(locationData);
      Alert.alert('Success', 'Location details saved successfully!');
      router.back(); // Navigate back after success
    } catch (err: any) {
      setError(err.message || 'Failed to save location details.');
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (
    label: string,
    field: keyof LocationDetails,
    icon: string,
    keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default'
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#2ECC71" style={styles.fieldIcon} />
        <TextInput
          style={styles.input}
          value={locationData[field]}
          onChangeText={(text) => handleChange(field, text)}
          placeholder={`Enter ${label.toLowerCase()}`}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Location Details</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {renderInputField('Address', 'address', 'home')}
        {renderInputField('Taluka', 'taluka', 'map')}
        {renderInputField('Pin Code', 'pinCode', 'map-marker', 'numeric')}
        {renderInputField('State', 'state', 'earth')}
        {renderInputField('WhatsApp Number', 'whatsapp_number', 'whatsapp', 'phone-pad')}
        {renderInputField('PAN Number', 'pan_number', 'card-account-details')}
        {renderInputField('Aadhar Number', 'aadhar_number', 'card-account-details-outline', 'numeric')}
        {renderInputField('Contact Number', 'contact_number', 'phone', 'phone-pad')}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>{loading ? 'Saving...' : 'Save Details'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    padding: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  backButton: { padding: 5 },
  placeholder: { width: 24 }, // Placeholder to balance layout
  content: { padding: 20, paddingBottom: 30 },
  fieldContainer: { marginBottom: 15 },
  fieldLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333', padding: 0 },
  submitButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#95D5B2', opacity: 0.7 },
  errorText: {
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
});