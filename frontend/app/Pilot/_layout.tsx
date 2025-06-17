import { useFonts } from "expo-font";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Stack } from "expo-router";

export default function DroneOwnerLayout() {

  useFonts({
    'Gaga': require('./../../assets/fonts/Gagalin-Regular.otf'),
    'Meri-sb': require('./../../assets/fonts/Merienda-SemiBold.ttf'),
    'Meri': require('./../../assets/fonts/Merienda-Bold.ttf'),
  })

  return (
    <Stack initialRouteName="pilotBooking" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pilotBooking" />
    </Stack>
  );
}