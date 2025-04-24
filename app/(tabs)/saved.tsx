import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { locationService } from '@/services/api/location';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

// Définition du type pour un lieu enregistré avec ses détails complets
interface SavedLocationWithDetails {
  id: string; // ID du SavedLocation
  savedLocationId: string; // IRI complet du SavedLocation
  name: string;
  description: string;
  address?: string;
  position: {
    lat: number;
    lng: number;
  };
  dateAdded?: string;
  imageUrl?: string;
}

export default function SavedScreen() {
  const colorScheme = useColorScheme();
  const { authState } = useAuth();
  
  // États pour gérer les données et le chargement
  const [savedLocations, setSavedLocations] = useState<SavedLocationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  
  // Fonction pour charger les lieux enregistrés
  const loadSavedLocations = useCallback(async (pageNumber: number, shouldReset = false) => {
    try {
      if (loading || (!hasMoreData && pageNumber > 1)) return;
      
      setLoading(true);
      setError(null);
      
      const response = await locationService.getSavedLocationsWithPagination(pageNumber);
      
      if (!response.data || response.error) {
        setError(response.error || 'Erreur lors du chargement des lieux enregistrés');
        return;
      }
      
      setTotalItems(response.data.totalItems);
      
      // Vérifier s'il y a des pages supplémentaires
      setHasMoreData(!!response.data.view.next);
      
      // Charger les détails de chaque lieu
      const savedLocationsDetails = await Promise.all(
        response.data.member.filter(sl => sl.isActif !== false).map(async (savedLocation) => {
          // Extraire l'ID à partir de l'IRI
          const savedLocationId = savedLocation["@id"] || '';
          const id = savedLocationId.split('/').pop() || '';
          
          // Extraire l'ID de location à partir du champ location
          // Format attendu: UUID comme "1f020c52-460a-6404-aa96-25f9461f62b2"
          const locationId = savedLocation.location && typeof savedLocation.location === 'string' 
                           ? savedLocation.location.split('/').pop() || savedLocation.location
                           : savedLocation.location;
          
          try {
            // Récupérer les détails du lieu en utilisant l'ID extrait
            const locationResponse = await locationService.getLocationById(locationId);
            
            if (locationResponse.data) {
              return {
                id,
                savedLocationId,
                name: locationResponse.data.name,
                description: locationResponse.data.description || '',
                position: {
                  lat: locationResponse.data.latitude,
                  lng: locationResponse.data.longitude,
                },
                // Utiliser une image par défaut basée sur le hash de l'ID
                imageUrl: `https://source.unsplash.com/random/200x150/?landmark&sig=${id}`,
                dateAdded: new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              };
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération des détails pour la location ID: ${locationId}`, error);
          }
          
          return null;
        })
      );
      
      // Filtrer les éléments null et mettre à jour l'état
      const validLocations = savedLocationsDetails.filter(location => location !== null) as SavedLocationWithDetails[];
      
      if (shouldReset) {
        setSavedLocations(validLocations);
      } else {
        setSavedLocations(prevLocations => [...prevLocations, ...validLocations]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, hasMoreData]);
  
  // Charger les données initiales au démarrage
  useEffect(() => {
    loadSavedLocations(1, true);
  }, []);
  
  // Gérer le pull-to-refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadSavedLocations(1, true);
  }, [loadSavedLocations]);
  
  // Charger plus de données lors du défilement
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMoreData) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadSavedLocations(nextPage);
    }
  }, [loading, hasMoreData, page, loadSavedLocations]);

  // Navigation vers la carte avec focus sur un marqueur
  const handleViewOnMap = (item: SavedLocationWithDetails) => {
    router.push({
      pathname: "/(tabs)/",
      params: { lat: item.position.lat, lng: item.position.lng, name: item.name }
    });
  };

  // Supprimer un lieu enregistré
  const handleDelete = (item: SavedLocationWithDetails) => {
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
              // Extraire l'ID à partir de l'IRI complet
              const id = item.savedLocationId.split('/').pop();
              if (!id) return;
              
              const response = await locationService.deleteSavedLocation(id);
              
              if (response.error) {
                Alert.alert('Erreur', response.error);
                return;
              }
              
              // Supprimer l'élément de la liste locale
              setSavedLocations(prev => prev.filter(location => location.id !== item.id));
              setTotalItems(prev => Math.max(0, prev - 1));
              
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer ce lieu.');
              console.error('Erreur de suppression:', error);
            }
          }
        },
      ]
    );
  };

  // Affichage en cas de liste vide
  const renderEmptyList = () => {
    if (loading && page === 1) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={styles.emptyText}>Chargement des lieux enregistrés...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Erreur</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadSavedLocations(1, true)}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
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
  };

  // Affichage d'un élément de la liste
  const renderItem = ({ item }: { item: SavedLocationWithDetails }) => (
    <View style={[styles.locationCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground || '#fff' }]}>
      {item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.locationImage} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>📍</Text>
        </View>
      )}
      
      <View style={styles.locationContent}>
        <Text style={[styles.locationName, { color: Colors[colorScheme ?? 'light'].text }]}>{item.name}</Text>
        <Text style={[styles.locationAddress, { color: Colors[colorScheme ?? 'light'].secondaryText }]} numberOfLines={2}>
          {item.description}
        </Text>
        
        {item.dateAdded && (
          <Text style={styles.dateAdded}>Ajouté le {item.dateAdded}</Text>
        )}
        
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

  // Affichage du footer de la liste (indicateur de chargement)
  const renderFooter = () => {
    if (!loading || page === 1) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#0a7ea4" />
        <Text style={styles.footerText}>Chargement...</Text>
      </View>
    );
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Lieux enregistrés
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].secondaryText }]}>
          {totalItems} {totalItems === 1 ? 'lieu enregistré' : 'lieux enregistrés'}
        </Text>
      </View>

      <FlatList
        data={savedLocations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
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
  },
  list: {
    padding: 16,
    flexGrow: 1,
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
    minHeight: 300,
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
  footerContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerText: {
    marginLeft: 8,
    color: '#666',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});