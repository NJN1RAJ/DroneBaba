import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, FlatList, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '@/api/api';

type Crop = {
  _id: string;
  name: string;
  area: string;
  type: string;
  season: string;
  prevCropName: string;
  farmLocation: string;
  farmName: string;
};

export default function PricingScreen() {
  const { droneId, date, time, pricePerAcre, coordinates } = useLocalSearchParams();
  const router = useRouter();

  // Fallback values
  const selectedDate = date as string || 'Not selected';
  const slotTime = time as string || 'Not selected';
  const droneIdSafe = droneId as string || '';
  const pricePerAcreRaw = pricePerAcre as string || '0';

  // Log and validate pricePerAcre
  console.log('Received pricePerAcre:', pricePerAcreRaw);
  const pricePerAcreSafe = parseFloat(pricePerAcreRaw);
  if (isNaN(pricePerAcreSafe) || pricePerAcreSafe === 0) {
    console.warn('Warning: pricePerAcre is invalid or zero:', pricePerAcreSafe);
  }

  const [farms, setFarms] = useState<Crop[]>([]);
  const [selectedFarms, setSelectedFarms] = useState<string[]>([]);
  const [farmModalVisible, setFarmModalVisible] = useState(false);
  const [newFarmModalVisible, setNewFarmModalVisible] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newCropName, setNewCropName] = useState('');
  const [newFarmArea, setNewFarmArea] = useState('');
  const [newCropType, setNewCropType] = useState('');
  const [newSeason, setNewSeason] = useState('');
  const [prevCropName, setPrevCropName] = useState('');
  const [newCoordinates, setNewCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [totalArea, setTotalArea] = useState(0);
  const [farmNames, setFarmNames] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch farms (crops) on mount
  useEffect(() => {
    const fetchFarms = async () => {
      setLoading(true);
      try {
        const fetchedCrops = await api.getAllCrops(); // Returns the array directly
        console.log('Fetched crops:', fetchedCrops);
        setFarms(fetchedCrops || []); // Ensure it's an array
        if (!fetchedCrops || fetchedCrops.length === 0) {
          setError('No crops found. Please add a new farm.');
        } else {
          setError(''); // Clear any previous error
        }
      } catch (err: any) {
        console.error('Error fetching farms:', err);
        setError('Failed to fetch farms. Please check your connection or try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchFarms();
  }, []);

  // Handle coordinates from MapScreen
  useEffect(() => {
    if (!coordinates) {
      setNewCoordinates(null);
      return;
    }

    const paramsCoordinates = Array.isArray(coordinates) ? coordinates[0] : coordinates;

    if (paramsCoordinates === 'undefined' || !paramsCoordinates) {
      setNewCoordinates(null);
      return;
    }

    try {
      const parsedCoords = JSON.parse(paramsCoordinates) as { latitude: number; longitude: number };
      if (
        typeof parsedCoords.latitude === 'number' &&
        typeof parsedCoords.longitude === 'number' &&
        !isNaN(parsedCoords.latitude) &&
        !isNaN(parsedCoords.longitude)
      ) {
        setNewCoordinates(parsedCoords);
        setNewFarmModalVisible(true);
      } else {
        console.warn('Invalid coordinates format:', parsedCoords);
        setNewCoordinates(null);
        Alert.alert('Error', 'Invalid coordinates received. Please try again.');
      }
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      setNewCoordinates(null);
      Alert.alert('Error', 'Failed to parse coordinates. Please try again.');
    }
  }, [coordinates]);

  // Add new farm
  const handleAddNewFarm = async () => {
    if (
      !newCropName ||
      !newFarmArea ||
      !newCropType ||
      !newSeason ||
      !prevCropName ||
      !newCoordinates ||
      !newFarmName
    ) {
      Alert.alert('Error', 'Please fill all the required fields.');
      return;
    }

    const areaNumber = parseFloat(newFarmArea);
    if (isNaN(areaNumber) || areaNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid area in acres.');
      return;
    }

    setLoading(true);
    try {
      const newFarm = {
        name: newCropName,
        area: `${newFarmArea} acres`,
        type: newCropType,
        season: newSeason,
        prevCropName: prevCropName,
        farmLocation: `${newCoordinates.latitude}, ${newCoordinates.longitude}`,
        farmName: newFarmName,
      };
      const response = await api.createCrop(newFarm);
      setFarms((prev) => [...prev, { ...newFarm, _id: response.cropId }]);
      setNewFarmModalVisible(false);
      setNewCropName('');
      setNewFarmArea('');
      setNewCropType('');
      setNewSeason('');
      setPrevCropName('');
      setNewFarmName('');
      setNewCoordinates(null);
      router.setParams({ coordinates: '' });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add new farm.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle farm selection
  const toggleFarmSelection = (farmId: string) => {
    setSelectedFarms((prev) =>
      prev.includes(farmId) ? prev.filter((id) => id !== farmId) : [...prev, farmId]
    );
  };

  // Calculate total area and farm names when farms are selected
  const handleFarmSelectionDone = () => {
    const selectedFarmsData = farms.filter((farm) => selectedFarms.includes(farm._id));
    const total = selectedFarmsData.reduce((sum, farm) => {
      const areaNumber = parseFloat(farm.area.replace(' acres', '')) || 0;
      return sum + areaNumber;
    }, 0);
    const names = selectedFarmsData.map((farm) => farm.farmName).join(', ');
    setTotalArea(total);
    setFarmNames(names);
    console.log('Selected farms:', selectedFarmsData, 'Total area:', total, 'Total cost:', pricePerAcreSafe * total);
    setFarmModalVisible(false);
  };

  const totalCost = pricePerAcreSafe * totalArea;
  console.log('Calculated totalCost:', totalCost, 'pricePerAcreSafe:', pricePerAcreSafe, 'totalArea:', totalArea);

  const handleConfirmBooking = async () => {
    if (!droneIdSafe || !selectedDate || !slotTime || !farmNames || totalArea === 0) {
      alert('Please select at least one farm to proceed.');
      return;
    }
    if (pricePerAcreSafe === 0) {
      alert('Price not set for this drone. Please contact the admin.');
      return;
    }

    const selectedFarmsData = farms.filter((farm) => selectedFarms.includes(farm._id));
    if (selectedFarmsData.length === 0) {
      alert('Please select at least one farm to proceed.');
      return;
    }
    const cropId = selectedFarmsData[0]._id;

    try {
      const jobId = await api.createJob({
        droneId: droneIdSafe,
        cropId,
        date: selectedDate,
        time: slotTime,
        //@ts-ignore
        price: totalCost.toString(), // This is a number, but createJob will convert it to a string
      });

      // console.log('Job ID after createJob:', jobId);

      // await api.createSchedule(droneIdSafe, jobId);

      router.replace({
        pathname: '/Farmer/fhome',
        params: { showBookingModal: 'true' },
      });
    } catch (error: any) {
      console.error('Confirm booking error:', error.message);
      alert(error.message || 'Failed to confirm booking.');
    }
  }

  const renderFarmItem = ({ item }: { item: Crop }) => (
    <TouchableOpacity
      style={[styles.farmItem, selectedFarms.includes(item._id) && styles.selectedFarmItem]}
      onPress={() => toggleFarmSelection(item._id)}
    >
      <View style={styles.farmInfo}>
        <Text style={styles.farmName}>{item.farmName}</Text>
        <Text style={styles.farmDetails}>{item.area}</Text>
      </View>
      <View
        style={[styles.checkbox, selectedFarms.includes(item._id) && styles.selectedCheckbox]}
      >
        {selectedFarms.includes(item._id) && (
          <MaterialCommunityIcons name="check" size={16} color="#FFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pricing Details</Text>
        <MaterialCommunityIcons name="drone" size={30} color="#2ECC71" />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Booking Summary</Text>

        <View style={styles.card}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{selectedDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>{slotTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="sprout" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Farms:</Text>
            <TouchableOpacity onPress={() => setFarmModalVisible(true)}>
              <Text style={[styles.value, styles.selectFarmLink]}>
                {farmNames || 'Select Farms'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="ruler-square" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Total Area:</Text>
            <Text style={styles.value}>{totalArea > 0 ? `${totalArea} acres` : 'Not selected'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="currency-usd" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Cost per Acre:</Text>
            <Text style={styles.value}>
              ${pricePerAcreSafe === 0 ? 'Not set' : pricePerAcreSafe.toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calculator" size={24} color="#2ECC71" style={styles.icon} />
            <Text style={styles.label}>Total Cost:</Text>
            <Text style={styles.value}>${totalCost.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmBooking}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>

      {/* Farm Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={farmModalVisible}
        onRequestClose={() => setFarmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Farms</Text>
            {loading ? (
              <Text style={styles.loadingText}>Loading farms...</Text>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : farms.length === 0 ? (
              <Text style={styles.emptyText}>No farms available. Add a new farm to get started.</Text>
            ) : (
              <FlatList
                data={farms}
                renderItem={renderFarmItem}
                keyExtractor={(item) => item._id}
                style={styles.farmList}
              />
            )}
            <TouchableOpacity
              style={styles.addFarmButton}
              onPress={() => {
                setFarmModalVisible(false);
                router.push({
                  pathname: '/Farmer/map',
                  params: {
                    droneId: droneIdSafe,
                    date: selectedDate,
                    time: slotTime,
                    pricePerAcre: pricePerAcreSafe.toString(),
                  },
                });
              }}
            >
              <Text style={styles.addFarmButtonText}>Add New Farm</Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setFarmModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleFarmSelectionDone}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Farm Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={newFarmModalVisible}
        onRequestClose={() => setNewFarmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Farm</Text>
            <Text style={styles.adviceText}>
              Tip: For easy identification, consider naming your farm after the crop (e.g., "Wheat Farm").
            </Text>

            <Text style={styles.inputLabel}>Farm Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newFarmName}
              onChangeText={setNewFarmName}
              placeholder="e.g., Wheat Farm"
              autoFocus
            />

            <Text style={styles.inputLabel}>Crop Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newCropName}
              onChangeText={setNewCropName}
              placeholder="e.g., Wheat"
            />

            <Text style={styles.inputLabel}>Area (in acres)</Text>
            <TextInput
              style={styles.modalInput}
              value={newFarmArea}
              onChangeText={setNewFarmArea}
              placeholder="e.g., 5"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Crop Type</Text>
            <Picker
              selectedValue={newCropType}
              style={styles.picker}
              onValueChange={(itemValue) => setNewCropType(itemValue)}
            >
              <Picker.Item label="Select Crop Type" value="" />
              <Picker.Item label="Kharif" value="Kharif" />
              <Picker.Item label="Rabi" value="Rabi" />
              <Picker.Item label="Zaid" value="Zaid" />
            </Picker>

            <Text style={styles.inputLabel}>Season</Text>
            <Picker
              selectedValue={newSeason}
              style={styles.picker}
              onValueChange={(itemValue) => setNewSeason(itemValue)}
            >
              <Picker.Item label="Select Season" value="" />
              <Picker.Item label="Monsoon" value="Monsoon" />
              <Picker.Item label="Summer" value="Summer" />
              <Picker.Item label="Winter" value="Winter" />
              <Picker.Item label="Spring" value="Spring" />
              <Picker.Item label="Autumn" value="Autumn" />
            </Picker>

            <Text style={styles.inputLabel}>Previous Crop Name</Text>
            <TextInput
              style={styles.modalInput}
              value={prevCropName}
              onChangeText={setPrevCropName}
              placeholder="e.g., Corn"
            />

            {newCoordinates ? (
              <Text style={styles.modalCoordinates}>
                Coordinates: Lat {newCoordinates.latitude.toFixed(6)}, Lon{' '}
                {newCoordinates.longitude.toFixed(6)}
              </Text>
            ) : (
              <Text style={styles.modalCoordinates}>No valid coordinates available</Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setNewFarmModalVisible(false);
                  setNewCropName('');
                  setNewFarmArea('');
                  setNewCropType('');
                  setNewSeason('');
                  setPrevCropName('');
                  setNewFarmName('');
                  setNewCoordinates(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddNewFarm}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
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
  selectFarmLink: {
    color: '#2ECC71',
    textDecorationLine: 'underline',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ECC71',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  adviceText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  farmList: {
    width: '100%',
    maxHeight: 300,
  },
  farmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedFarmItem: {
    borderColor: '#2ECC71',
    borderWidth: 2,
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  farmDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#2ECC71',
    borderColor: '#2ECC71',
  },
  addFarmButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
  },
  addFarmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#E0E0E0',
  },
  modalButtonConfirm: {
    backgroundColor: '#2ECC71',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtonTextConfirm: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalInput: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  modalCoordinates: {
    fontSize: 14,
    color: '#2ECC71',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
});