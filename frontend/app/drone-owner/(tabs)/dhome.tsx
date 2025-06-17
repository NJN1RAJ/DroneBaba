import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/api/api';

type DroneSchedule = {
  droneId: string;
  droneName: string;
  date: string;
  timeSlot: string;
};

export default function DHome() {
  const router = useRouter();
  const [locationDetailsExist, setLocationDetailsExist] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedulesByDate, setSchedulesByDate] = useState<{ [date: string]: DroneSchedule[] }>({});

  useFocusEffect(
    useCallback(() => {
      const checkLocationDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await api.getUserLocationDetails();
          if (res && Object.keys(res).length > 0) {
            await AsyncStorage.setItem('locationDetails', JSON.stringify(res));
            setLocationDetailsExist(true);
          } else {
            setLocationDetailsExist(false);
          }
        } catch (err: any) {
          console.error('Error fetching location details:', err);
          setError(err.message || 'Failed to fetch location details.');
          setLocationDetailsExist(false);
        } finally {
          setLoading(false);
        }
      };

      const fetchDroneSchedules = async () => {
        try {
          setLoading(true);
          const drones = await api.getAllDroneOfDroneOwner();
          const allSchedules: DroneSchedule[] = [];
          
          drones.forEach((drone: any) => {
            if (drone.schedule && Array.isArray(drone.schedule)) {
              drone.schedule.forEach((schedule: any) => {
                allSchedules.push({
                  droneId: drone._id,
                  droneName: drone.name,
                  date: schedule.date,
                  timeSlot: schedule.timeSlot,
                });
              });
            }
          });

          // Group schedules by date
          const groupedSchedules: { [date: string]: DroneSchedule[] } = {};
          allSchedules.forEach((schedule) => {
            if (!groupedSchedules[schedule.date]) {
              groupedSchedules[schedule.date] = [];
            }
            groupedSchedules[schedule.date].push(schedule);
          });

          // Sort dates in ascending order
          const sortedDates = Object.keys(groupedSchedules).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
          const sortedSchedules: { [date: string]: DroneSchedule[] } = {};
          sortedDates.forEach((date) => {
            groupedSchedules[date].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
            sortedSchedules[date] = groupedSchedules[date];
          });

          setSchedulesByDate(sortedSchedules);
        } catch (err: any) {
          console.error('Error fetching drone schedules:', err);
          setError(err.message || 'Failed to fetch drone schedules.');
        } finally {
          setLoading(false);
        }
      };

      checkLocationDetails();
      fetchDroneSchedules();
    }, [])
  );

  const getRelativeDateLabel = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (date === today) return 'Today';
    if (date === tomorrowStr) return 'Tomorrow';
    return date;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerButton}>
          <TouchableOpacity style={{ marginRight: 20 }} onPress={() => alert('Notifications clicked')}>
            <MaterialIcons name="notifications" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/drone-owner-Profile/drone-owner-Profile')}>
            <MaterialIcons name="account-circle" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {loading && <ActivityIndicator size="large" color="#2ECC71" style={styles.loading} />}

      {/* Profile Details Check */}
      {locationDetailsExist === false && !loading && (
        <View style={styles.noDetailsBlock}>
          <Text style={styles.noDetailsText}>It seems we do not have your Details</Text>
          <Text style={styles.noDetailsText}>Fill your Details</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/locDetails')}>
            <Text style={styles.editButtonText}>Fill Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Drone Schedules */}
      {!loading && locationDetailsExist !== false && (
        <>
          <Text style={styles.title}>Drone Schedules</Text>
          <ScrollView style={styles.scrollView}>
            {Object.keys(schedulesByDate).length === 0 ? (
              <Text style={styles.noSchedulesText}>No scheduled bookings for your drones.</Text>
            ) : (
              Object.entries(schedulesByDate).map(([date, schedules]) => (
                <View key={date} style={styles.dateSection}>
                  <Text style={styles.dateTitle}>{getRelativeDateLabel(date)}</Text>
                  {schedules.map((schedule, index) => (
                    <View key={`${schedule.droneId}-${date}-${schedule.timeSlot}-${index}`} style={styles.scheduleCard}>
                      <Text style={styles.scheduleDroneName}>{schedule.droneName}</Text>
                      <Text style={styles.scheduleDetails}>
                        Time: {schedule.timeSlot}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff', // Changed from #007bff to white
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333', // Changed to contrast with white background
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleDroneName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ECC71',
    marginBottom: 8,
  },
  scheduleDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noSchedulesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  noDetailsBlock: {
    backgroundColor: '#FFEFD5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFA07A',
  },
  noDetailsText: {
    color: '#d35400',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});