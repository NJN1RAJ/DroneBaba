import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '@/api/api';

type ScheduleItem = {
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

export default function PilotScheduleScreen() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const pilotSchedule = await api.getPilotSchedule();
        // Sort by date in ascending order
        const sortedSchedule = (pilotSchedule || []).sort((a: ScheduleItem, b: ScheduleItem) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setSchedule(sortedSchedule);
      } catch (err: any) {
        console.error('Error fetching pilot schedule:', err);
      }
    };

    fetchSchedule();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Schedule List */}
      <ScrollView contentContainerStyle={styles.content}>
        {schedule.length === 0 ? (
          <Text style={styles.noSchedule}>No upcoming bookings in your schedule.</Text>
        ) : (
          schedule.map((item, index) => (
            <View key={`${item.job._id}-${index}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.date}</Text>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color="#2ECC71"
                />
              </View>
              <Text style={styles.cardDetails}>
                Time: {item.timeSlot}{'\n'}
                Location: <Text style={styles.mapText} onPress={() => Linking.openURL(`https://maps.google.com/?q=${item.job.farmLocation}`)}>📍 Open Map</Text>{'\n'}
                Farm Area: {item.job.farmArea || '0 Acre'}{'\n'}
                Drone: {item.job.droneId.name}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
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
    padding: 20,
    paddingBottom: 30,
  },
  noSchedule: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDetails: {
    fontSize: 14,
    color: '#555',
  },
  mapText: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '600',
  },
});