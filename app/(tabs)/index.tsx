import { StyleSheet, View, ActivityIndicator, Alert, Button, Platform, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { LeafletView, MapLayer, MapMarker, WebViewLeafletMessage } from 'react-native-leaflet-view';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [mapCenterPosition, setMapCenterPosition] = useState<{ lat: number; lng: number }>({
    lat: 48.856614, // Paris by default
    lng: 2.3522219
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false);
  const [userMarker, setUserMarker] = useState<MapMarker | null>(null);

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      if (!locationPermissionRequested) {
        setLocationPermissionRequested(true);

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        try {
          let location = await Location.getCurrentPositionAsync({});
          const newPosition = {
            lat: location.coords.latitude,
            lng: location.coords.longitude
          };
          setMapCenterPosition(newPosition);
          setZoom(15); // Zoom in closer when using user's location

          // Add a marker for the user's position
          setUserMarker({
            id: 'user-location',
            position: newPosition,
            icon: '📍',
            size: [32, 32],
          });
        } catch (error) {
          setErrorMsg('Could not get your location');
          console.error('Error getting location:', error);
        }
      }
    })();
  }, [locationPermissionRequested]);

  // Define map layers
  const mapLayers: MapLayer[] = [
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      baseLayerName: 'OpenStreetMap',
      baseLayerIsChecked: true,
      baseLayer: true,
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    },
  ];

  // Handle messages from the map
  const handleMessage = (message: WebViewLeafletMessage) => {
    console.log('Message received from map:', message);
    if (message.event === 'onMapMarkerClicked') {
      console.log('Marker clicked:', message.payload);
    }
  };

  // Request location again if user denied initially
  const requestLocationAgain = async () => {
    setLocationPermissionRequested(false); // Reset to trigger the useEffect again
  };

  return (
    <View style={styles.container}>
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Button title="Allow Location Access" onPress={requestLocationAgain} />
        </View>
      ) : null}

      <LeafletView
        mapLayers={mapLayers}
        mapCenterPosition={mapCenterPosition}
        zoom={zoom}
        onMessageReceived={handleMessage}
        loadingIndicator={() => <ActivityIndicator size="large" color="#0000ff" />}
        mapMarkers={userMarker ? [userMarker] : []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 10,
    textAlign: 'center',
  },
});
