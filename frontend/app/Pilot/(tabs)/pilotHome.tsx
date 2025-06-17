import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Linking } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/api/api';

type Booking = {
  date: string;
  timeSlot: string;
  job: {
    _id: string;
    farmLocation: string;
    payDetails: string;
    droneId: { name: string };
    farmArea?: string; // Optional field for farm area
    farmerMobile?: string; // Optional field for farmer's WhatsApp number
  };
};

export default function PilotHomeScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const pilotSchedule = await api.getPilotSchedule();
        // Get the current date dynamically in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = (pilotSchedule || []).filter((booking: Booking) => booking.date === today);
        setBookings(todayBookings);
      } catch (err: any) {
        console.error('Error fetching pilot bookings:', err);
      }
    };

    fetchBookings();
    const interval = setInterval(fetchBookings, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pilot Dashboard</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={{ marginRight: 10 }}>
            <MaterialIcons name="notifications" size={28} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/pilotProfile/(tabs)/pilotProfile')}>
            <MaterialIcons name="account-circle" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Assigned Bookings (Today)</Text>

      {/* Bookings List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {bookings.length === 0 ? (
          <Text style={styles.noBookings}>No assigned bookings for today.</Text>
        ) : (
          bookings.map((booking, index) => (
            <TouchableOpacity
              key={`${booking.job._id}-${index}`}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/Pilot/pilotBooking',
                  params: { bookingId: booking.job._id },
                })
              }
            >
              <View style={styles.cardHeader}>
                <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com/?q=${booking.job.farmLocation}`)}>
                  <Text style={styles.mapText}>📍 Open Map</Text>
                </TouchableOpacity>
                <MaterialCommunityIcons name="drone" size={24} color="#2ECC71" />
              </View>
              <Text style={styles.cardDetails}>
                Farm Area: {booking.job.farmArea || '0 Acre'}{'\n'}
                📅 Date: {booking.date} ⌛Time: {booking.timeSlot}{'\n'}
                Drone: {booking.job.droneId.name}{'\n'}
                Payment: ₹ {booking.job.payDetails}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB for Viewing Schedule */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/Pilot/pilotSchedule')}
      >
        <MaterialCommunityIcons name="calendar" size={24} color="#FFF" />
        <Text style={styles.fabText}>View Schedule</Text>
      </TouchableOpacity>
    </SafeAreaView>
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
    // marginTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  noBookings: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapText: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
  },
  cardDetails: {
    fontSize: 15,
    color: '#555',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ECC71',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 30,
    right: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});