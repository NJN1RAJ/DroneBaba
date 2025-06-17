import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/api/api';

type Job = {
  _id: string;
  date: string;
  time: string;
  farmLocation: string;
  payDetails: string;
  createdBy: { name: string; email: string };
  droneId: { name: string; type: string; capacity: string; durability: string; pricePerAcre: string };
};

export default function PilotJobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchJobs = async () => {
    try {
      const fetchedJobs = await api.getJobs();
      setJobs(fetchedJobs || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Poll for updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const updates = await api.getUpdates();
        if (updates && updates.newJobs && updates.newJobs.length > 0) {
          // Add new jobs to the list
          setJobs((prevJobs) => {
            const existingJobIds = new Set(prevJobs.map((job) => job._id));
            const newJobs = updates.newJobs.filter((job: Job) => !existingJobIds.has(job._id));
            return [...prevJobs, ...newJobs];
          });
        }
      } catch (error: any) {
        console.error('Error fetching updates:', error.message);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAcceptJob = async (job: Job) => {
    try {
      await api.createSchedule(job.droneId._id, job._id);
      Alert.alert('Success', 'Job accepted successfully!');
      // Remove the accepted job from the list
      setJobs((prevJobs) => prevJobs.filter((j) => j._id !== job._id));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept job.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Jobs</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {jobs.length === 0 ? (
          <Text style={styles.noJobs}>No available jobs at the moment.</Text>
        ) : (
          jobs.map((job) => (
            <View key={job._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{job.farmLocation}</Text>
                <MaterialCommunityIcons name="drone" size={24} color="#2ECC71" />
              </View>
              <Text style={styles.cardDetails}>
                Date: {job.date}{'\n'}
                Time: {job.time}{'\n'}
                Farmer: {job.createdBy.name} ({job.createdBy.email}){'\n'}
                Drone: {job.droneId.name} (Type: {job.droneId.type}){'\n'}
                Pay: ${job.payDetails}
              </Text>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptJob(job)}
              >
                <Text style={styles.buttonText}>Accept Job</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
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
  noJobs: {
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
    marginBottom: 10,
  },
  acceptButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});