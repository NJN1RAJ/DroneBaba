import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="pilotHome"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={30} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pilotJobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color }) => <MaterialIcons name="work" size={30} color={color} />,
        }}
      />
    </Tabs>
  );
}
