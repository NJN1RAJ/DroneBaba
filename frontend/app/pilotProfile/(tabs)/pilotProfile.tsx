import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PilotProfileScreen() {
  const [profileData, setProfileData] = useState({
    _id: '',
    name: '',
    email: '',
    password: '',
    role: 'Pilot',
    city: '',
    address: '',
    taluka: '',
    pinCode: '',
    state: '',
    whatsapp_number: '',
    pan_number: '',
    aadhar_number: '',
    contact_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await api.getUser();
        console.log("User:", user);

        const location = await api.getUserLocationDetails();
        console.log("Location:", location);

        const combinedData = { ...user, ...location };
        setProfileData(combinedData);

        await AsyncStorage.setItem('currentUser', JSON.stringify({ ...user, id: user._id.toString() }));
      } catch (err: any) {
        console.log('Error in fetchData:', err);
        setError('Failed to fetch profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (field: keyof typeof profileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { name, email, password, city } = profileData;
      await api.updateUser({ name, email, password, city });

      const locationDetails = {
        address: profileData.address,
        taluka: profileData.taluka,
        pinCode: profileData.pinCode,
        state: profileData.state,
        whatsapp_number: profileData.whatsapp_number,
        pan_number: profileData.pan_number,
        aadhar_number: profileData.aadhar_number,
        contact_number: profileData.contact_number,
      };
      await api.saveLocationDetails(locationDetails);

      setEditing(false);
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label: string, field: keyof typeof profileData, icon: string, editable = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#2ECC71" style={styles.fieldIcon} />
        {editing || !editable ? (
          <TextInput
            style={styles.input}
            value={profileData[field] || ''}
            onChangeText={(text) => handleChange(field, text)}
            editable={editing}
          />
        ) : (
          <Text style={styles.fieldValue}>{profileData[field] || ''}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pilot Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={async () => { await api.logout(); await AsyncStorage.clear(); router.replace('/(auth)/login'); }}>
          <MaterialCommunityIcons name="logout" size={24} color="#dc3545" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* First Half: Personal Details */}
        <View style={styles.profileCard}>
          <View style={styles.imageContainer}>
            <Image
              source={require('./../../../assets/images/Azmuth.png')}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.uploadButton} onPress={() => Alert.alert('Image Picker')}>
              <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
              <Text style={styles.uploadButtonText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
          {renderField('Name', 'name', 'account', true)}
          {renderField('Email', 'email', 'email', true)}
          {renderField('Password', 'password', 'lock', true)}
          {renderField('Role', 'role', 'account-group', false)}
          {renderField('City', 'city', 'city', true)}
          <TouchableOpacity style={styles.saveButton} onPress={() => setEditing(!editing)}>
            <Text style={styles.saveButtonText}>{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
          {editing && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Second Half: Location Details */}
        <Text style={styles.sectionTitle}>Additional Details</Text>
        {renderField('Address', 'address', 'home', true)}
        {renderField('Taluka', 'taluka', 'map', true)}
        {renderField('Pin Code', 'pinCode', 'map-marker', true)}
        {renderField('State', 'state', 'earth', true)}
        {renderField('WhatsApp No', 'whatsapp_number', 'whatsapp', true)}
        {renderField('PAN No', 'pan_number', 'card-account-details', true)}
        {renderField('Aadhar No', 'aadhar_number', 'card-account-details-outline', true)}
        {renderField('Contact No', 'contact_number', 'phone', true)}
        {!loading && !error && (
          <TouchableOpacity style={styles.editDataButton} onPress={() => router.push('/locDetails')}>
            <Text style={styles.editDataButtonText}>Edit Data</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  content: { padding: 20 },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0E0E0' },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ECC71',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  uploadButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginLeft: 5 },
  fieldContainer: { marginBottom: 15 },
  fieldLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fieldIcon: { marginRight: 10 },
  fieldValue: { flex: 1, fontSize: 16, color: '#333' },
  input: { flex: 1, fontSize: 16, color: '#333', padding: 0 },
  saveButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 15 },
  logoutButton: {
    padding: 5,
  },
  editDataButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  editDataButtonText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
});