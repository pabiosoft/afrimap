import { StyleSheet, View, Alert, Platform, Text, TextInput, Modal, TouchableOpacity } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';

// Interface pour les marqueurs personnalisés
interface CustomMarker {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  description?: string;
}

export default function HomeScreen() {
  const [region, setRegion] = useState<Region>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  
  // États pour gérer les marqueurs personnalisés
  const [customMarkers, setCustomMarkers] = useState<CustomMarker[]>([]);
  const [isMarkerDialogVisible, setMarkerDialogVisible] = useState(false);
  const [markerName, setMarkerName] = useState('');
  const [newMarkerPosition, setNewMarkerPosition] = useState<{latitude: number, longitude: number} | null>(null);
  
  // État pour la position de l'utilisateur
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  // Obtenir la localisation de l'utilisateur au démarrage de l'app
  useEffect(() => {
    (async () => {
      // Demander la permission d'accès à la localisation
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      try {
        // Obtenir la position actuelle
        let location = await Location.getCurrentPositionAsync({});
        const userPos = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        
        // Mettre à jour l'état avec la position de l'utilisateur
        setUserLocation(userPos);
        
        // Centrer la carte sur la position de l'utilisateur
        setRegion({
          latitude: userPos.latitude,
          longitude: userPos.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421
        });
        
        // Animer la carte vers la position de l'utilisateur
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: userPos.latitude,
            longitude: userPos.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          }, 1000);
        }
      } catch (error) {
        setErrorMsg('Could not get your location');
        console.error(error);
      }
    })();
  }, []);

  // Handle long press on map
  const handleLongPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setNewMarkerPosition(coordinate);
    setMarkerName('');
    setMarkerDialogVisible(true);
  };

  // Save new marker with name
  const handleSaveMarker = () => {
    if (newMarkerPosition && markerName.trim()) {
      const newMarker: CustomMarker = {
        id: `custom-marker-${Date.now()}`,
        latitude: newMarkerPosition.latitude,
        longitude: newMarkerPosition.longitude,
        name: markerName.trim(),
        description: `Added on ${new Date().toLocaleDateString()}`
      };

      setCustomMarkers((prevMarkers: CustomMarker[]) => [...prevMarkers, newMarker]);
      setMarkerDialogVisible(false);
      setNewMarkerPosition(null);
      
      // Confirm to user
      Alert.alert('Marker Created', `"${markerName.trim()}" has been added to the map.`);
    } else if (!markerName.trim()) {
      Alert.alert('Error', 'Please enter a name for this marker.');
    }
  };

  // Handle marker selection
  const onMarkerSelected = (marker: CustomMarker) => {
    Alert.alert(marker.name, marker.description || '');
  };

  return (
    <View style={styles.container}>
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onLongPress={handleLongPress}
        onRegionChangeComplete={(newRegion: Region) => setRegion(newRegion)}
      >
        {/* Afficher seulement les marqueurs personnalisés ajoutés par l'utilisateur */}
        {customMarkers.map((marker: CustomMarker, index: number) => (
          <Marker
            key={`${marker.id || index}`}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude
            }}
            title={marker.name}
            description={marker.description}
            onPress={() => onMarkerSelected(marker)}
          >
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{marker.name}</Text>
                {marker.description && (
                  <Text style={styles.calloutDescription}>{marker.description}</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Marqueur de position de l'utilisateur (en plus du point bleu standard) */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }}
            title="Ma position"
            description="Vous êtes ici"
          >
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Ma position</Text>
                <Text style={styles.calloutDescription}>Votre position actuelle</Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

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
      
      {/* Bouton pour recentrer sur la position de l'utilisateur */}
      <TouchableOpacity
        style={styles.locateButton}
        onPress={() => {
          if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.0122,
              longitudeDelta: 0.0121
            }, 1000);
          }
        }}
      >
        <Text style={styles.locateButtonText}>📍</Text>
      </TouchableOpacity>
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
  locateButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
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
  locateButtonText: {
    fontSize: 24,
  },
  calloutContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 14,
  }
});
