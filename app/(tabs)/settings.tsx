import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, Image, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  
  // États pour les différents paramètres
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [useMetricSystem, setUseMetricSystem] = useState(true);
  const [showOfflineMaps, setShowOfflineMaps] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fonction de connexion simulée
  const handleLogin = () => {
    // Simulation de connexion
    setTimeout(() => {
      setIsLoggedIn(true);
      Alert.alert('Connecté', 'Vous êtes maintenant connecté à votre compte.');
    }, 1000);
  };

  // Fonction de déconnexion simulée
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          onPress: () => {
            setIsLoggedIn(false);
          }
        },
      ]
    );
  };

  // Fonction pour vider le cache (simulée)
  const handleClearCache = () => {
    Alert.alert(
      'Vider le cache',
      'Êtes-vous sûr de vouloir vider le cache ? Cela supprimera les cartes hors ligne et les données temporaires.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Vider', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Cache vidé', 'Le cache a été vidé avec succès.');
          }
        },
      ]
    );
  };

  // Rendu d'un groupe de paramètres
  const SettingsGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View style={styles.settingsGroup}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={[styles.groupContainer, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground || '#fff' }]}>
        {children}
      </View>
    </View>
  );

  // Rendu d'un élément de paramètre avec switch
  const SettingsSwitch = ({ 
    title, 
    description, 
    value, 
    onValueChange 
  }: { 
    title: string, 
    description?: string, 
    value: boolean, 
    onValueChange: (value: boolean) => void 
  }) => (
    <View style={styles.settingsItem}>
      <View style={styles.settingsTextContainer}>
        <Text style={[styles.settingsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>{title}</Text>
        {description && <Text style={styles.settingsDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e1e1e1', true: '#0a7ea4' }}
        thumbColor={value ? '#fff' : '#fff'}
      />
    </View>
  );

  // Rendu d'un élément de paramètre avec action
  const SettingsAction = ({ 
    title, 
    description, 
    onPress, 
    icon,
    color
  }: { 
    title: string, 
    description?: string, 
    onPress: () => void, 
    icon?: string,
    color?: string
  }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsTextContainer}>
        <Text style={[
          styles.settingsTitle, 
          { color: color || Colors[colorScheme ?? 'light'].text }
        ]}>
          {title}
        </Text>
        {description && <Text style={styles.settingsDescription}>{description}</Text>}
      </View>
      {icon && <IconSymbol name={icon} size={22} color={color || '#888'} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[
      styles.container, 
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Paramètres
        </Text>
      </View>

      {/* Profil utilisateur */}
      <View style={styles.profileSection}>
        {isLoggedIn ? (
          <View style={styles.loggedInContainer}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>KD</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.username, { color: Colors[colorScheme ?? 'light'].text }]}>
                Killian Dupont
              </Text>
              <Text style={styles.email}>killian.dupont@example.com</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Paramètres de carte */}
      <SettingsGroup title="CARTE">
        <SettingsSwitch 
          title="Localisation en arrière-plan" 
          description="Autoriser l'accès à votre position même lorsque l'application est fermée"
          value={isLocationEnabled} 
          onValueChange={setIsLocationEnabled} 
        />
        <SettingsSwitch 
          title="Vue satellite" 
          description="Utiliser les images satellite sur la carte"
          value={isSatelliteView} 
          onValueChange={setIsSatelliteView} 
        />
        <SettingsSwitch 
          title="Système métrique" 
          description="Utiliser les kilomètres au lieu des miles"
          value={useMetricSystem} 
          onValueChange={setUseMetricSystem} 
        />
      </SettingsGroup>

      {/* Paramètres d'application */}
      <SettingsGroup title="APPLICATION">
        <SettingsSwitch 
          title="Cartes hors ligne" 
          description="Télécharger les cartes pour une utilisation sans connexion"
          value={showOfflineMaps} 
          onValueChange={setShowOfflineMaps} 
        />
        <SettingsAction 
          title="Langue" 
          description="Français"
          onPress={() => {
            Alert.alert('Langue', 'Fonctionnalité à venir dans une prochaine mise à jour.');
          }}
          icon="chevron.right"
        />
        <SettingsAction 
          title="Vider le cache" 
          description="Libérer de l'espace de stockage"
          onPress={handleClearCache}
          icon="trash"
        />
      </SettingsGroup>

      {/* À propos */}
      <SettingsGroup title="À PROPOS">
        <SettingsAction 
          title="Version" 
          description="1.0.0"
          onPress={() => {}}
        />
        <SettingsAction 
          title="Conditions d'utilisation" 
          onPress={() => {
            Alert.alert('Conditions d\'utilisation', 'Fonctionnalité à venir dans une prochaine mise à jour.');
          }}
          icon="doc.text"
        />
        <SettingsAction 
          title="Politique de confidentialité" 
          onPress={() => {
            Alert.alert('Politique de confidentialité', 'Fonctionnalité à venir dans une prochaine mise à jour.');
          }}
          icon="lock.shield"
        />
      </SettingsGroup>

      {/* Options de compte */}
      {isLoggedIn && (
        <SettingsGroup title="COMPTE">
          <SettingsAction 
            title="Modifier le profil" 
            onPress={() => {
              Alert.alert('Profil', 'Fonctionnalité à venir dans une prochaine mise à jour.');
            }}
            icon="person.crop.circle"
          />
          <SettingsAction 
            title="Se déconnecter" 
            onPress={handleLogout}
            icon="arrow.right.square"
            color="#ff3b30"
          />
        </SettingsGroup>
      )}

      {/* Pied de page avec informations de copyright */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 AfriMap. Tous droits réservés.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  loggedInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginVertical: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  settingsGroup: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    marginLeft: 8,
  },
  groupContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingsTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingsDescription: {
    fontSize: 14,
    color: '#888',
  },
  footer: {
    marginTop: 8,
    marginBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  },
});