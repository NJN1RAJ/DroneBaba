import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import WebView from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';

// Constants
const { height } = Dimensions.get('window');

export default function MapScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { droneId, date, time, pricePerAcre } = params;

    // Fallback values to prevent undefined errors
    const droneIdSafe = droneId as string || '';
    const selectedDate = date as string || '';
    const slotTime = time as string || '';
    const pricePerAcreSafe = pricePerAcre as string || '0';

    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const webViewRef = useRef<WebView>(null);

    const googleMapsHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, user-scalable=yes, width=device-width, minimum-scale=1, maximum-scale=5">
      <style>
        html, body, #map {
          height: 100%;
          margin: 0;
          padding: 0;
          touch-action: pan-x pan-y;
        }
      </style> 
      <script src="https://maps.googleapis.com/maps/api/js?key=&libraries=places"></script>
      <script>
        function initMap() {
          const container = document.getElementById('map');
          const width = container.offsetWidth;
          const height = container.offsetHeight;

          const map = new google.maps.Map(container, {
            center: { lat: 21.1458, lng: 79.0882 }, // Nagpur
            zoom: 12,
            disableDefaultUI: false,
            gestureHandling: 'greedy',
          });

          let marker = null;

          map.addListener('click', (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();

            if (marker) {
              marker.setPosition(event.latLng);
            } else {
              marker = new google.maps.Marker({
                position: event.latLng,
                map: map,
              });
            }

            // Send coordinates back to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              latitude: lat, 
              longitude: lng 
            }));
          });

          window.addEventListener('resize', () => {
            google.maps.event.trigger(map, 'resize');
          });
        }

        document.addEventListener('DOMContentLoaded', initMap);
      </script>
    </head>
    <body>
      <div id="map"></div>
    </body>
    </html>
  `;

    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.latitude && data.longitude) {
                setCoordinates({ latitude: data.latitude, longitude: data.longitude });
            }
        } catch (error) {
            console.error('Error parsing WebView message:', error);
        }
    };

    const handleDone = () => {
        if (coordinates) {
            console.log("Selected Coordinates:", coordinates);
            router.replace({ 
                pathname: "/Farmer/pricing", 
                params: { 
                    coordinates: JSON.stringify(coordinates),
                    droneId: droneIdSafe,
                    date: selectedDate,
                    time: slotTime,
                    pricePerAcre: pricePerAcreSafe,
                } 
            });
        } else {
            router.back(); // Return without coordinates if none selected
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mapContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ html: googleMapsHtml }}
                    style={styles.webView}
                    onMessage={handleWebViewMessage}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    scrollEnabled={false}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error: ', nativeEvent);
                    }}
                />
            </View>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    mapContainer: {
        flex: 1,
    },
    webView: {
        flex: 1,
    },
    doneButton: {
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: [{ translateX: -50 }],
        backgroundColor: '#2ECC71',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    doneButtonText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: 'bold',
    },
});