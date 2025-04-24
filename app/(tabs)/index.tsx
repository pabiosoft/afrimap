import { StyleSheet, View, ActivityIndicator, Alert, Button, Platform, Text, TextInput, Modal, TouchableOpacity } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LeafletView, MapLayer, MapMarker } from 'react-native-leaflet-view';
import * as Location from 'expo-location';

// Interface pour les messages reçus de Leaflet
interface WebviewLeafletMessage {
  event: string;
  payload: any;
}

export default function HomeScreen() {
  const [mapCenterPosition, setMapCenterPosition] = useState<{ lat: number; lng: number }>({
    lat: 48.856614, // Paris by default
    lng: 2.3522219
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false);
  const [userMarker, setUserMarker] = useState<MapMarker | null>(null);
  
  // États pour gérer les marqueurs personnalisés
  const [customMarkers, setCustomMarkers] = useState<MapMarker[]>([]);
  const [isMarkerDialogVisible, setMarkerDialogVisible] = useState(false);
  const [markerName, setMarkerName] = useState('');
  const [newMarkerPosition, setNewMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  // Variables pour gérer l'appui long
  const touchStartTimeRef = useRef<number>(0);
  const lastTouchRef = useRef<{lat: number, lng: number} | null>(null);
  const longPressThreshold = 2000; // 2 secondes en millisecondes

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
  const handleMessage = (message: WebviewLeafletMessage) => {
    console.log('Message received from map:', message);
    
    if (message.event === 'onMapClicked') {
      const touchLatLng = message.payload?.touchLatLng;
      
      if (touchLatLng) {
        const currentTime = Date.now();
        
        // Si c'est le premier appui, on enregistre l'heure et la position
        if (touchStartTimeRef.current === 0) {
          touchStartTimeRef.current = currentTime;
          lastTouchRef.current = touchLatLng;
          console.log('Touch started at:', touchStartTimeRef.current);
          
          // On planifie un callback pour vérifier la durée d'appui après le seuil
          setTimeout(() => {
            const elapsedTime = Date.now() - touchStartTimeRef.current;
            console.log('Elapsed time:', elapsedTime);
            
            // Si on n'a pas reçu d'autre événement entre temps et que le temps dépassé est suffisant
            if (touchStartTimeRef.current > 0 && elapsedTime >= longPressThreshold && lastTouchRef.current) {
              console.log('Long press detected!');
              // Action pour l'appui long
              handleLongPress(lastTouchRef.current);
              // Réinitialiser le timer
              touchStartTimeRef.current = 0;
              lastTouchRef.current = null;
            }
          }, longPressThreshold + 100);
        } else {
          // Si on reçoit un second événement trop rapidement, c'est probablement un déplacement ou un clic simple
          // On réinitialise les variables
          touchStartTimeRef.current = 0;
          lastTouchRef.current = null;
        }
      }
    } else if (message.event === 'onMapMarkerClicked') {
      console.log('Marker clicked:', message.payload);
      
      // Show marker info when clicked
      const markerId = message.payload?.id;
      if (markerId && markerId.startsWith('custom-marker-')) {
        const marker = customMarkers.find(m => m.id === markerId);
        if (marker && marker.title) {
          Alert.alert('Marker Info', marker.title);
        }
      }
    }
  };

  // Handle long press action
  const handleLongPress = (position: {lat: number, lng: number}) => {
    if (position) {
      // Show dialog to name marker
      setNewMarkerPosition(position);
      setMarkerName('');
      setMarkerDialogVisible(true);
    }
  };

  // Save new marker with name
  const handleSaveMarker = () => {
    if (newMarkerPosition && markerName.trim()) {
      const newMarker: MapMarker = {
        id: `custom-marker-${Date.now()}`,
        position: newMarkerPosition,
        icon: '📌',
        size: [32, 32],
        title: markerName.trim(),
      };

      setCustomMarkers(prevMarkers => [...prevMarkers, newMarker]);
      setMarkerDialogVisible(false);
      setNewMarkerPosition(null);
      
      // Confirm to user
      Alert.alert('Marker Created', `"${markerName.trim()}" has been added to the map.`);
    } else if (!markerName.trim()) {
      Alert.alert('Error', 'Please enter a name for this marker.');
    }
  };

  // Request location again if user denied initially
  const requestLocationAgain = async () => {
    setLocationPermissionRequested(false); // Reset to trigger the useEffect again
  };

  // Combine all markers for display
  const allMarkers = [
    ...(userMarker ? [userMarker] : []),
    ...customMarkers
  ];

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
        mapMarkers={allMarkers}
      />

      {/* Dialog pour nommer un nouveau marqueur */}
      <Modal
        transparent={true}
        visible={isMarkerDialogVisible}
        animationType="fade"
        onRequestClose={() => setMarkerDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Marker</Text>
            <Text style={styles.modalSubtitle}>Enter a name for this location:</Text>
            
            <TextInput
              style={styles.textInput}
              value={markerName}
              onChangeText={setMarkerName}
              placeholder="Location name"
              autoFocus
              returnKeyType="done"
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setMarkerDialogVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveMarker}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
