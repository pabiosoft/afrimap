import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface SearchResult {
  id: string;
  name: string;
  address: string;
  distance?: string;
}

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Fonction de recherche (simulée pour l'instant)
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulation d'une API de recherche - à remplacer par votre véritable logique
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        { 
          id: '1', 
          name: 'Savane africaine', 
          address: 'Parc national du Serengeti, Tanzanie',
          distance: '15,234 km'
        },
        { 
          id: '2', 
          name: 'Marché central de Nairobi', 
          address: 'Nairobi, Kenya',
          distance: '12,812 km'
        },
        { 
          id: '3', 
          name: 'Mont Kilimandjaro', 
          address: 'Kilimandjaro, Tanzanie',
          distance: '14,789 km'
        },
        { 
          id: '4', 
          name: 'Chutes Victoria', 
          address: 'Frontière Zambie-Zimbabwe',
          distance: '13,456 km'
        },
        { 
          id: '5', 
          name: 'Désert du Sahara', 
          address: 'Afrique du Nord',
          distance: '8,134 km'
        },
      ].filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.address.toLowerCase().includes(query.toLowerCase())
      );

      setResults(mockResults);
      setIsSearching(false);
    }, 1000);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => console.log(`Naviguer vers: ${item.name}`)}
    >
      <View>
        <Text style={[styles.resultName, { color: Colors[colorScheme ?? 'light'].text }]}>
          {item.name}
        </Text>
        <Text style={styles.resultAddress}>{item.address}</Text>
      </View>
      {item.distance && (
        <Text style={styles.distance}>{item.distance}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[
      styles.container, 
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Search Locations
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: Colors[colorScheme ?? 'light'].searchBg || '#f0f0f0' }
          ]}
          placeholder="Search for places or addresses..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.length > 2) {
              handleSearch(text);
            } else if (text.length === 0) {
              setResults([]);
            }
          }}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(searchQuery)}
        />
      </View>

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        </View>
      ) : (
        <>
          {searchQuery.length > 0 && (
            <Text style={styles.resultsCount}>
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </Text>
          )}
          
          <FlatList
            data={results}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={
              searchQuery.length > 2 ? (
                <View style={styles.emptyResultsContainer}>
                  <Text style={styles.emptyResultsText}>
                    No locations found matching "{searchQuery}"
                  </Text>
                </View>
              ) : null
            }
          />
        </>
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  resultsCount: {
    paddingHorizontal: 16,
    marginBottom: 8,
    color: '#666',
  },
  resultsList: {
    paddingHorizontal: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  resultName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 5,
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResultsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});