import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Image, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Drone = {
  _id: string;
  name: string;
  type: string;
  capacity: string;
  durability: string;
  pricePerAcre: string;
};

type ScheduleSlot = {
  date: string;
  timeSlot: string;
};

type DroneWithSchedule = Drone & {
  schedules: ScheduleSlot[];
};

export default function FarmerDashboard() {
  const { showBookingModal } = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(showBookingModal === 'true');
  const [selectedDate, setSelectedDate] = useState('');
  const [user, setUser] = useState<any>(null);
  const [drones, setDrones] = useState<DroneWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await api.getUser();
        setUser(userData);
        await AsyncStorage.setItem('currentUser', JSON.stringify({ ...userData, id: userData._id.toString() }));
        console.log('User data stored:', userData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user data.');
        console.error('User fetch error:', err);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchDronesAndSchedules = async () => {
      try {
        const dronesData = await api.getAllDrones();
        console.log('✅ Fetched drones:', dronesData);

        // Validate pricePerAcre for each drone
        dronesData.forEach((drone: Drone) => {
          // console.log(`Drone ${drone.name} pricePerAcre:`, drone.pricePerAcre);
          if (!drone.pricePerAcre || drone.pricePerAcre === '0') {
            // console.warn(`Warning: pricePerAcre for drone ${drone.name} is invalid: ${drone.pricePerAcre}`);
          }
        });

        let schedulesData = [];
        try {
          schedulesData = await api.getSchedulesOfDroneOwner();
          console.log('✅ Fetched schedules:', schedulesData);
        } catch (err: any) {
          // console.warn('No schedules found, proceeding with empty schedules:', err.message);
          schedulesData = [];
        }

        const dronesWithSchedules = dronesData.map((drone: Drone) => {
          const droneSchedules = schedulesData
            .filter((schedule: any) => schedule.DroneName === drone.name)
            .flatMap((schedule: any) => schedule.DroneSchedule);
          return { ...drone, schedules: droneSchedules || [] };
        });

        setDrones(dronesWithSchedules);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch drones.');
        console.error('Drones fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDronesAndSchedules();
  }, []);

  useEffect(() => {
    const currentDate = new Date();
    const minDate = new Date(currentDate);
    minDate.setDate(currentDate.getDate() + 2);
    const formattedDate = minDate.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
  }, []);

  const generateDates = () => {
    const dates = [];
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() + 2);
    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() + 21);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const day = date.toLocaleString('default', { weekday: 'short' }).toUpperCase();
      const dayNum = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
      const formattedDate = date.toISOString().split('T')[0];
      dates.push({ day, dayNum, month, formattedDate });
    }
    return dates;
  };

  const generateTimeSlots = () => {
    const slots: { time: string; status: 'Available' | 'Booked' }[] = [];
    let startTime = new Date();
    startTime.setHours(9, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(17, 0, 0, 0);

    while (startTime < endOfDay) {
      const slotStart = new Date(startTime);
      const slotEnd = new Date(startTime.getTime() + 30 * 60 * 1000);
      const slotTime = `${slotStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${slotEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      slots.push({ time: slotTime, status: 'Available' });
      startTime = new Date(slotEnd.getTime() + 10 * 60 * 1000);
    }
    return slots;
  };

  const dates = generateDates();
  const allSlots = generateTimeSlots();

  const getAvailableSlots = (drone: DroneWithSchedule) => {
    const bookedSlots = drone.schedules
      .filter((schedule) => schedule.date === selectedDate)
      .map((schedule) => schedule.timeSlot);
    return allSlots.filter((slot) => !bookedSlots.includes(slot.time));
  };

  if (loading) return <Text style={styles.loadingText}>Loading...</Text>;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="clock" size={40} color="#2ECC71" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Booking in Progress</Text>
            <Text style={styles.modalMessage}>Your booking will be confirmed shortly.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { marginTop: 0, marginLeft: 10 }]}>Book Drone</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.push('/farmerProfile/(tabs)/farmerProfile')}>
            <MaterialCommunityIcons name="account-circle-outline" size={40} color="#333" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialCommunityIcons name="menu" size={40} color="#333" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.coverage}>Coverage: 1 acre per hour</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        <View style={styles.dateContainer}>
          {dates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dateButton, selectedDate === date.formattedDate && styles.selectedDateButton]}
              onPress={() => setSelectedDate(date.formattedDate)}
            >
              <Text style={[styles.dateDay, selectedDate === date.formattedDate && styles.selectedDateText]}>{date.day}</Text>
              <Text style={[styles.dateNum, selectedDate === date.formattedDate && styles.selectedDateText]}>{date.dayNum}</Text>
              <Text style={[styles.dateMonth, selectedDate === date.formattedDate && styles.selectedDateText]}>{date.month}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.droneContainer}>
        {drones.length === 0 ? (
          <Text style={styles.noData}>No drones available on {selectedDate}</Text>
        ) : (
          drones.map((drone) => {
            const availableSlots = getAvailableSlots(drone);

            return (
              <View key={drone._id} style={styles.droneCard}>
                <TouchableOpacity style={styles.droneHeader}>
                  <Image
                    source={{ uri: 'https://www.folio3.ai/blog/wp-content/uploads/2024/07/Untitled-design-12.jpg' }}
                    style={styles.droneImage}
                  />
                  <View style={styles.droneInfo}>
                    <Text style={styles.droneName}>{drone.name}</Text>
                    <Text style={styles.pilotName}>Pilot: Pilot Name</Text>
                    <Text style={styles.droneAddress}>Type: {drone.type}</Text>
                    <Text style={styles.dronePrice}>
                      Price: ${drone.pricePerAcre === '0' ? 'Not set' : drone.pricePerAcre} per acre
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.slotsContainer}>
                  {availableSlots.length === 0 ? (
                    <Text style={styles.noSlots}>No slots available</Text>
                  ) : (
                    availableSlots.map((slot, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.slotButton}
                        onPress={() => {
                          if (drone.pricePerAcre === '0') {
                            alert('Price not set for this drone. Please contact the admin.');
                            return;
                          }
                          console.log(`Navigating with pricePerAcre: ${drone.pricePerAcre}`);
                          router.push({
                            pathname: '/Farmer/pricing',
                            params: { 
                              droneId: drone._id, 
                              date: selectedDate,
                              time: slot.time,
                              pricePerAcre: drone.pricePerAcre,
                            },
                          });
                        }}
                      >
                        <Text style={styles.slotText}>{slot.time}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Text style={styles.infoText}>* Select a time slot to book a drone for the chosen date</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F6FA',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#E74C3C',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 0,
  },
  coverage: {
    fontSize: 16,
    color: '#666',
    marginVertical: 10,
  },
  dateScroll: {
    marginBottom: 15,
    maxHeight: 100,
  },
  dateContainer: {
    flexDirection: 'row',
  },
  dateButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginRight: 10,
    width: 70,
    height: 90,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedDateButton: {
    backgroundColor: '#E74C3C',
  },
  dateDay: {
    fontSize: 12,
    color: '#666',
  },
  dateNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  dateMonth: {
    fontSize: 12,
    color: '#666',
  },
  selectedDateText: {
    color: '#FFF',
  },
  droneContainer: {
    flex: 1,
  },
  droneCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  droneHeader: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  droneImage: {
    width: '30%',
    height: 100,
    resizeMode: 'cover',
  },
  droneInfo: {
    padding: 15,
    flex: 1,
  },
  droneName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  pilotName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  droneAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dronePrice: {
    fontSize: 14,
    color: '#2ECC71',
    fontWeight: 'bold',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    paddingTop: 0,
  },
  slotButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2ECC71',
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
  },
  slotText: {
    fontSize: 14,
    color: '#2ECC71',
    fontWeight: '600',
  },
  noSlots: {
    fontSize: 14,
    color: '#666',
  },
  noData: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});