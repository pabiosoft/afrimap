import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  position: {
    lat: number;
    lng: number;
  };
  dateAdded: string;
  imageUrl?: string;
}

export default function SavedScreen() {
  const colorScheme = useColorScheme();
  
  // Données simulées - à remplacer par un vrai système de stockage (AsyncStorage, etc.)
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([
    {
      id: '1',
      name: 'Mont Kilimandjaro',
      address: 'Tanzanie',
      position: { lat: -3.0674, lng: 37.3556 },
      dateAdded: '15 avr. 2025',
      imageUrl: 'https://images.unsplash.com/photo-1624967016136-c73125d8b11c?q=80&w=200&h=150&auto=format'
    },
    {
      id: '2',
      name: 'Marché de Marrakech',
      address: 'Marrakech, Maroc',
      position: { lat: 31.6295, lng: -7.9811 },
      dateAdded: '10 avr. 2025',
      imageUrl: 'https://images.unsplash.com/photo-1553185311-1302be737c3b?q=80&w=200&h=150&auto=format'
    },
    {
      id: '3',
      name: 'Chutes Victoria',
      address: 'Frontière Zambie-Zimbabwe',
      position: { lat: -17.9244, lng: 25.8567 },
      dateAdded: '02 avr. 2025',
      imageUrl: 'https://images.unsplash.com/photo-1552975084-6e027ba6e9b1?q=80&w=200&h=150&auto=format'
    },
    {
      id: '4',
      name: 'Parc Kruger',
      address: 'Afrique du Sud',
      position: { lat: -23.9884, lng: 31.5547 },
      dateAdded: '28 mars 2025',
      imageUrl: 'https://images.unsplash.com/photo-1535263352198-9f75e7d6a83d?q=80&w=200&h=150&auto=format'
    },
  ]);

  const handleViewOnMap = (item: SavedLocation) => {
    // À implémenter - Navigation vers la carte avec focus sur le marqueur
    console.log(`Naviguer vers la carte à la position: ${item.position.lat}, ${item.position.lng}`);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer ce lieu',
      'Êtes-vous sûr de vouloir supprimer ce lieu enregistré ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: () => {
            setSavedLocations(prev => prev.filter(item => item.id !== id));
          }
        },
      ]
    );
  };

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

  const renderItem = ({ item }: { item: SavedLocation }) => (
    <View style={[styles.locationCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground || '#fff' }]}>
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
        <Text style={styles.locationAddress}>{item.address}</Text>
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
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[
      styles.container, 
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Lieux enregistrés
        </Text>
        <Text style={styles.subtitle}>
          {savedLocations.length} {savedLocations.length === 1 ? 'lieu enregistré' : 'lieux enregistrés'}
        </Text>
      </View>

      <FlatList
        data={savedLocations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmptyList}
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
});