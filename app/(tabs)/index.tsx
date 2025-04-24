import { StyleSheet, View, Alert, Platform, Text, Modal, TouchableOpacity, Pressable } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { locationService } from '@/services/api/location';
import { Location as LocationType, LocationFormData } from '@/types/location';
import LocationForm from '@/components/LocationForm';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const [region, setRegion] = useState<Region>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  
  // État pour la position de l'utilisateur
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  
  // États pour gérer les marqueurs et lieux
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour la pression forte sur iOS
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState<{latitude: number, longitude: number} | null>(null);
  
  const { authState } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#121212' }, 'background');
  
  // Obtenir la localisation de l'utilisateur et charger les lieux au démarrage
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
        
        // Charger les lieux depuis l'API
        loadLocations();
      } catch (error) {
        setErrorMsg('Could not get your location');
        console.error(error);
      }
    })();
  }, []);
  
  // Chargement des lieux depuis l'API
  const loadLocations = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les lieux publics
      const response = await locationService.getAllLocations(1, true);
      
      if (response.data) {
        setLocations(response.data);
      } else if (response.error) {
        console.error('Erreur lors du chargement des lieux:', response.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des lieux:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gestion de la pression longue pour Android
  const handleLongPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showNewLocationForm(coordinate);
  };
  
  // Fonction pour afficher le formulaire de lieu
  const showNewLocationForm = (coordinate: {latitude: number, longitude: number}) => {
    setNewMarkerPosition(coordinate);
    setShowLocationForm(true);
  };
  
  // Gestion du début de pression pour iOS (pression forte)
  const handlePressIn = (event: any) => {
    if (Platform.OS === 'ios') {
      // Déclencher un feedback haptique léger au début de la pression
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const coordinate = event.nativeEvent.coordinate;
      
      // Configurer un délai pour détecter si c'est une pression forte
      const timeout = setTimeout(() => {
        // Après le délai, déclencher un feedback haptique fort
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        showNewLocationForm(coordinate);
      }, 500); // 500ms de pression pour déclencher l'action
      
      setLongPressTimeout(timeout);
    }
  };
  
  // Gestion de la fin de pression pour iOS
  const handlePressOut = () => {
    if (Platform.OS === 'ios' && longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };
  
  // Gestion du défilement de la carte
  const handleDrag = () => {
    setIsDragging(true);
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // Création d'un nouveau lieu
  const handleSaveLocation = async (locationData: LocationFormData) => {
    try {
      setIsLoading(true);
      
      // Créer la location
      const response = await locationService.createLocation(locationData);
      
      if (response.data) {
        const newLocation = response.data;
        
        // Ajouter la nouvelle location à la liste des lieux affichés
        setLocations(prev => [...prev, newLocation]);
        
        // Si l'utilisateur est connecté, sauvegarder dans ses favoris
        if (authState.isAuthenticated && authState.user && newLocation['@id']) {
          try {
            const userIri = authState.user['@id'] || '';
            if (userIri) {
              console.log(`Sauvegarde de la location ${newLocation['@id']} pour l'utilisateur ${userIri}`);
              const savedResponse = await locationService.saveLocationForUser(newLocation['@id'], userIri);
              
              if (savedResponse.data) {
                console.log('Location sauvegardée avec succès dans les favoris');
              } else if (savedResponse.error) {
                console.error('Erreur lors de la sauvegarde dans les favoris:', savedResponse.error);
                // La location est créée mais pas sauvegardée dans les favoris
                Alert.alert(
                  "Attention",
                  "Le lieu a été créé mais n'a pas pu être ajouté à vos favoris.",
                  [{ text: "OK" }]
                );
              }
            }
          } catch (saveError) {
            console.error('Erreur lors de la sauvegarde dans les favoris:', saveError);
            Alert.alert(
              "Attention",
              "Le lieu a été créé mais n'a pas pu être ajouté à vos favoris.",
              [{ text: "OK" }]
            );
          }
        }
        
        // Fermer le formulaire
        setShowLocationForm(false);
        setNewMarkerPosition(null);
        
        // Informer l'utilisateur
        Alert.alert(
          "Succès",
          authState.isAuthenticated 
            ? "Le lieu a été créé et ajouté à vos favoris."
            : "Le lieu a été créé avec succès. Connectez-vous pour l'ajouter à vos favoris.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Erreur",
          response.error || "Une erreur est survenue lors de la création du lieu.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la création du lieu:', error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la création du lieu.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
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
        onPress={handlePressIn}
        onRegionChangeComplete={(newRegion: Region) => setRegion(newRegion)}
        onPanDrag={handleDrag}
        onRegionChange={handleDrag}
      >
        {/* Afficher les lieux existants */}
        {locations.map((location, index) => (
          <Marker
            key={location['@id'] || `location-${index}`}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude
            }}
            title={location.name}
            description={location.description}
            pinColor={location.visibility === 'public' ? "#0a7ea4" : "#e91e63"}
          >
            <Callout tooltip>
              <View style={[styles.calloutContainer, { backgroundColor }]}>
                <Text style={styles.calloutTitle}>{location.name}</Text>
                <Text style={styles.calloutDescription}>{location.description}</Text>
                <Text style={styles.calloutVisibility}>
                  {location.visibility === 'public' ? 'Public' : 'Privé'}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Formulaire de création de lieu */}
      <Modal
        transparent={true}
        visible={showLocationForm}
        animationType="slide"
        onRequestClose={() => setShowLocationForm(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowLocationForm(false);
            setNewMarkerPosition(null);
          }}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={e => e.stopPropagation()}
            style={[styles.modalContent, { backgroundColor }]}
          >
            {newMarkerPosition && (
              <LocationForm
                coordinate={newMarkerPosition}
                onSave={handleSaveLocation}
                onCancel={() => {
                  setShowLocationForm(false);
                  setNewMarkerPosition(null);
                }}
                isLoading={isLoading}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
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
    color: 'red',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    minHeight: '70%',
    maxHeight: '90%',
  },
  calloutContainer: {
    padding: 10,
    borderRadius: 6,
    minWidth: 150,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    marginBottom: 10,
  },
  calloutVisibility: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
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
});
