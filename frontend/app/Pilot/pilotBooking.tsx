import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '@/api/api';

type Booking = {
  date: string;
  timeSlot: string;
  job: {
    _id: string;
    farmLocation: string;
    payDetails: string;
    createdBy: string;
    droneId: { name: string; _id: string };
    farmArea?: string; // Optional field for farm area
    farmerMobile?: string; // Optional field for farmer's WhatsApp number
  };
};

export default function PilotBookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [status, setStatus] = useState<string>('Accepted'); // Local state for status

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const schedule = await api.getPilotSchedule();
        const bookingData = schedule.find((item: Booking) => item.job._id === bookingId);
        if (!bookingData) {
          throw new Error('Booking not found in schedule.');
        }
        setBooking(bookingData);
      } catch (err: any) {
        console.error('Error fetching booking details:', err);
        Alert.alert('Error', err.message || 'Failed to load booking details.');
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handleStartJob = () => {
    setStatus('In Progress');
    Alert.alert('Success', 'Job started successfully!');
  };

  const handleCompleteJob = async () => {
    if (!booking) return;
    try {
      // Delete the schedule from both pilot and drone
      await api.deleteSchedule(booking.job.droneId._id, booking.date, booking.timeSlot);
      setStatus('Completed');
      Alert.alert('Success', 'Job completed successfully!', [
        { text: 'OK', onPress: () => router.replace('/Pilot/pilotHome') },
      ]);
    } catch (err: any) {
      console.error('Error completing job:', err);
      Alert.alert('Error', err.message || 'Failed to complete job.');
    }
  };

  const handleContact = () => {
    if (booking?.job.farmerMobile) {
      const phoneNumber = booking.job.farmerMobile;
      const whatsappUrl = `https://wa.me/${phoneNumber}`;
      Linking.openURL(whatsappUrl).catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp. Please ensure it is installed.');
      });
    } else {
      Alert.alert('Error', 'Invalid number');
    }
  };

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Booking Information */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Location:</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com/?q=${booking.job.farmLocation}`)}>
              <Text style={styles.mapText}>📍 Open Map</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="ruler-square" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Farm Area:</Text>
            <Text style={styles.value}>{booking.job.farmArea || '0 Acre'}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{booking.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>{booking.timeSlot}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="drone" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Drone:</Text>
            <Text style={styles.value}>{booking.job.droneId.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="information" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, { color: status === 'Completed' ? '#2ECC71' : '#E74C3C' }]}>
              {status}
            </Text>
          </View>
        </View>

        {/* Farmer Contact Placeholder */}
        <Text style={styles.sectionTitle}>Farmer Contact</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
            <Text style={styles.buttonText}>Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        {status === 'Accepted' && (
          <TouchableOpacity style={styles.actionButton} onPress={handleStartJob}>
            <Text style={styles.buttonText}>Start Job</Text>
          </TouchableOpacity>
        )}
        {status === 'In Progress' && (
          <TouchableOpacity style={styles.actionButton} onPress={handleCompleteJob}>
            <Text style={styles.buttonText}>Complete Job</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#555',
    flex: 1,
    textAlign: 'right',
  },
  mapText: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '600',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});