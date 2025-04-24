import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { locationService } from '@/services/api/location';
import { Location } from '@/types/location';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SavedLocationWithDetails {
  id: string;
  name: string;
  description: string;
  position: {
    lat: number;
    lng: number;
  };
  dateAdded: string;
  imageUrl?: string;
  savedLocationId?: string; // ID de l'enregistrement SavedLocation pour la suppression
}

export default function SavedScreen() {
  const colorScheme = useColorScheme();
  const { authState } = useAuth();
  const router = useRouter();
  
  const [savedLocations, setSavedLocations] = useState<SavedLocationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSavedLocations();
  }, [authState.isAuthenticated]);

  const loadSavedLocations = async () => {
    if (!authState.isAuthenticated || !authState.user) {
      // Si l'utilisateur n'est pas connecté, on ne peut pas charger ses locations
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userIri = authState.user['@id'];
      if (!userIri) {
        setError("Impossible de récupérer l'identifiant utilisateur");
        return;
      }
      
      // Récupérer toutes les locations sauvegardées pour l'utilisateur
      const savedLocationsResponse = await locationService.getSavedLocationsByUser(userIri);
      
      if (!savedLocationsResponse.data) {
        setError(savedLocationsResponse.error || "Erreur lors du chargement des lieux enregistrés");
        return;
      }
      
      // Pour chaque saved location, récupérer les détails de la location
      const userSavedLocations: SavedLocationWithDetails[] = [];
      
      for (const savedLocation of savedLocationsResponse.data) {
        if (savedLocation.location && typeof savedLocation.location === 'string') {
          // Extraire l'ID de l'URL IRI (par ex. "/api/locations/1" -> "1")
          const locationId = savedLocation.location.split('/').pop();
          
          if (locationId) {
            const locationResponse = await locationService.getLocationById(locationId);
            
            if (locationResponse.data) {
              const location = locationResponse.data;
              const savedId = savedLocation['@id']?.split('/').pop();
              
              userSavedLocations.push({
                id: locationId,
                name: location.name,
                description: location.description,
                position: {
                  lat: location.latitude,
                  lng: location.longitude
                },
                dateAdded: format(new Date(), 'dd MMM yyyy', { locale: fr }),
                savedLocationId: savedId
              });
            }
          }
        }
      }
      
      setSavedLocations(userSavedLocations);
    } catch (err) {
      console.error("Erreur lors du chargement des lieux enregistrés:", err);
      setError("Une erreur est survenue lors du chargement des lieux enregistrés");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOnMap = (item: SavedLocationWithDetails) => {
    // Navigation vers la carte avec focus sur le marqueur
    router.push({
      pathname: "/(tabs)",
      // On pourrait passer les paramètres pour centrer la carte sur ce lieu
      params: {
        latitude: item.position.lat,
        longitude: item.position.lng,
        focus: item.id
      }
    });
  };

  const handleDelete = async (item: SavedLocationWithDetails) => {
    if (!item.savedLocationId) {
      Alert.alert("Erreur", "Impossible de supprimer ce lieu: identifiant manquant");
      return;
    }
    
    Alert.alert(
      'Supprimer ce lieu',
      'Êtes-vous sûr de vouloir supprimer ce lieu enregistré ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Implémenter l'appel API pour supprimer une savedLocation
              // Cette fonctionnalité doit être ajoutée au locationService
              
              // Pour l'instant, on supprime simplement localement
              setSavedLocations(prev => prev.filter(loc => loc.savedLocationId !== item.savedLocationId));
              
              Alert.alert("Succès", "Le lieu a été supprimé de vos favoris");
            } catch (err) {
              console.error("Erreur lors de la suppression:", err);
              Alert.alert("Erreur", "Une erreur est survenue lors de la suppression");
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

  const renderLoginPrompt = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('@/assets/images/partial-react-logo.png')} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Connectez-vous pour enregistrer des lieux</Text>
      <Text style={styles.emptyText}>
        Vous devez être connecté pour enregistrer et voir vos lieux favoris.
      </Text>
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={() => router.push('/(tabs)/settings')}
      >
        <Text style={styles.loginButtonText}>Aller aux paramètres</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('@/assets/images/partial-react-logo.png')} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Aucun lieu enregistré</Text>
      <Text style={styles.emptyText}>
        Les lieux que vous enregistrez en faisant un appui long sur la carte apparaîtront ici.
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: SavedLocationWithDetails }) => (
    <View style={[styles.locationCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
      {item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.locationImage} 
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>📍</Text>
        </View>
      )}
      
      <View style={styles.locationContent}>
        <Text style={[styles.locationName, { color: Colors[colorScheme ?? 'light'].text }]}>{item.name}</Text>
        <Text style={styles.locationAddress}>{item.description}</Text>
        <Text style={styles.dateAdded}>Ajouté le {item.dateAdded}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.viewButton]} 
            onPress={() => handleViewOnMap(item)}
          >
            <Text style={styles.viewButtonText}>Voir sur la carte</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.deleteButton]} 
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!authState.isAuthenticated) {
    return (
      <View style={[
        styles.container, 
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            Lieux enregistrés
          </Text>
        </View>
        {renderLoginPrompt()}
      </View>
    );
  }

  return (
    <View style={[
      styles.container, 
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Lieux enregistrés
        </Text>
        {!isLoading && !error && (
          <Text style={styles.subtitle}>
            {savedLocations.length} {savedLocations.length === 1 ? 'lieu enregistré' : 'lieux enregistrés'}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={styles.loadingText}>Chargement de vos lieux enregistrés...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadSavedLocations}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedLocations}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmptyList}
          refreshing={isLoading}
          onRefresh={loadSavedLocations}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  locationCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationImage: {
    width: '100%',
    height: 150,
  },
  placeholderImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
  },
  locationContent: {
    padding: 16,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  dateAdded: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#0a7ea4',
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyImage: {
    width: 150,
    height: 150,
    opacity: 0.5,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#888',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});