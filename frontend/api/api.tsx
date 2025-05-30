import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your laptop's IP address if testing on a mobile device
const API_URL = 'http://192.168.82.244:3000';
// const API_URL = 'http://192.168.56.1:8081';
// const API_URL = 'http://10.0.2.2:3000';
// const API_URL = 'http://localhost:3000';

const api = {
  register: async (user: { name: string; email: string; password: string; city: string; role: string }) => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/user/register`, user);
      return response.data.user; // Expecting { name, email, city, role, _id } from server
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Something went wrong. Please try again.');
      }
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/user/login`, credentials);
      const { token, role } = response.data;

      if (!token) throw new Error('Token not received from server');

      await AsyncStorage.setItem('access_token', token); // Store token

      return { token, role }; // Return both
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  getUser: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.get(`${API_URL}/api/v1/user/getUser`, {
        headers: { Authorization: token },
      });
      return response.data.user; // Expecting user object without password
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to fetch user. Please try again.');
      }
    }
  },

  logout: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        await axios.post(`${API_URL}/api/v1/user/logout`, {}, { headers: { Authorization: token } });
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('currentUser'); // Clear user data
      }
      return { success: true };
    } catch (error: any) {
      throw new Error('Logout failed. Please try again.');
    }
  },

  updateUser: async (userData: { name?: string; email?: string; password?: string; city?: string }) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.put(`${API_URL}/api/v1/user/update`, userData, {
        headers: { Authorization: token },
      });
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user.');
    }
  },

  getUserLocationDetails: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.get(`${API_URL}/api/v1/locationdets/getDetails`, {
        headers: { Authorization: token },
      });
      return response.data.user; // { address, taluka, pinCode, state, whatsapp_number, pan_number, aadhar_number, contact_number }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch location details.');
    }
  },

  saveLocationDetails: async (details: {
    address: string;
    taluka: string;
    pinCode: string;
    state: string;
    whatsapp_number: string;
    pan_number: string;
    aadhar_number: string;
    contact_number: string;
  }) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.post(`${API_URL}/api/v1/locationdets/fillDetails`, details, {
        headers: { Authorization: `${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to save location details.');
    }
  },

  addDrone: async (droneData: {
    name: string;
    type: string;
    capacity: string;
    pricePerAcre: string;
    durability: string;
    purchasedDate: string;
    isNGO: boolean;
    ngoName?: string;
  }) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.post(`${API_URL}/api/v1/drone/addDrone`, droneData, {
        headers: { Authorization: token },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add drone.');
    }
  },

  getDroneDetails: async (droneId: string) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.get(`${API_URL}/api/v1/drone/getDroneDetails/${droneId}`, {
        headers: { Authorization: token },
      });
      return response.data.droneDetail; // Returns a single drone object
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch drone details.');
    }
  },

  getAllDroneOfDroneOwner: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.get(`${API_URL}/api/v1/drone/getAllDroneOfDroneOwner`, {
        headers: { Authorization: token },
      });
      return response.data.drones; // Returns an array of drones
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch drones for owner.');
    }
  },

  getSchedulesOfDroneOwner: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.get(`${API_URL}/api/v1/drone/getAllSchedulesOfDroneOwner`, {
        headers: { Authorization: token },
      });
      return response.data.Schedules; // Returns array of { DroneName, DroneSchedule }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch schedules.');
    }
  },

  deleteSchedule: async (droneId: string, date: string, timeSlot: string) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.post(
        `${API_URL}/api/v1/drone/deleteSchedule/${droneId}`,
        { date, timeSlot },
        { headers: { Authorization: token } }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete schedule.');
    }
  },

  getAllDrones: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.get(`${API_URL}/api/v1/drone/getAllDrones`, {
        headers: { Authorization: token },
      });
      return response.data.drones; // Returns array of drones with selected fields
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all drones.');
    }
  },
  
  createSchedule: async (droneId: string, scheduleData: { date: string; timeSlot: string }) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No token found. Please log in.');
      const response = await axios.post(`${API_URL}/api/v1/drone/createSchedule/${droneId}`, scheduleData, {
        headers: { Authorization: token },
      });
      return response.data; // Expecting { message: "Schedule Booked Successfully" }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create schedule.');
    }
  },
};

export { api };

