import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, Switch, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import UserProfile from '@/components/auth/UserProfile';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function SettingsScreen() {
  const { authState } = useAuth();
  const { isAuthenticated } = authState;
  
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  
  // Options de paramètres
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMapEnabled, setDarkMapEnabled] = useState(false);
  
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({ light: '#f9f9f9', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  
  const toggleAuthForms = (showLogin: boolean) => {
    if (showLogin) {
      setShowLoginForm(true);
      setShowRegisterForm(false);
    } else {
      setShowLoginForm(false);
      setShowRegisterForm(true);
    }
  };
  
  const closeAuthForms = () => {
    setShowLoginForm(false);
    setShowRegisterForm(false);
  };

  // Rendu du formulaire d'authentification approprié
  const renderAuthForm = () => {
    if (showLoginForm) {
      return (
        <LoginForm 
          onCancel={closeAuthForms}
          onRegisterPress={() => toggleAuthForms(false)}
          onSuccess={closeAuthForms}
        />
      );
    } else if (showRegisterForm) {
      return (
        <RegisterForm 
          onCancel={closeAuthForms}
          onSuccess={closeAuthForms}
        />
      );
    }
    
    // Si l'utilisateur n'est pas authentifié et aucun formulaire n'est affiché
    return (
      <View style={styles.authPromptContainer}>
        <Text style={[styles.authPromptText, { color: textColor }]}>
          Connectez-vous ou créez un compte pour sauvegarder vos lieux préférés et partager avec d'autres utilisateurs.
        </Text>
        <View style={styles.authButtonsContainer}>
          <TouchableOpacity 
            style={[styles.authButton, styles.loginButton]}
            onPress={() => toggleAuthForms(true)}
          >
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.authButton, styles.registerButton]}
            onPress={() => toggleAuthForms(false)}
          >
            <Text style={styles.authButtonText}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Rendu de la section d'authentification (formulaires ou profil)
  const renderAuthSection = () => {
    if (isAuthenticated) {
      return <UserProfile />;
    }
    
    return renderAuthForm();
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Paramètres</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Compte utilisateur</Text>
          <View style={[styles.sectionContent, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
            {renderAuthSection()}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Carte</Text>
          <View style={[styles.sectionContent, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: textColor }]}>Activer la localisation</Text>
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={locationEnabled ? '#0a7ea4' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: textColor }]}>Thème sombre pour la carte</Text>
              <Switch
                value={darkMapEnabled}
                onValueChange={setDarkMapEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={darkMapEnabled ? '#0a7ea4' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Notifications</Text>
          <View style={[styles.sectionContent, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: textColor }]}>Activer les notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={notificationsEnabled ? '#0a7ea4' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>À propos</Text>
          <View style={[styles.sectionContent, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
            <TouchableOpacity 
              style={styles.aboutRow}
              onPress={() => Alert.alert("AfriMap", "Version 1.0\n© 2025 AfriMap")}
            >
              <Text style={[styles.aboutText, { color: textColor }]}>Version de l'application</Text>
              <Text style={styles.versionText}>1.0</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.aboutRow}
              onPress={() => Alert.alert("Conditions d'utilisation", "Les conditions d'utilisation complètes seront disponibles prochainement.")}
            >
              <Text style={[styles.aboutText, { color: textColor }]}>Conditions d'utilisation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.aboutRow, { borderBottomWidth: 0 }]}
              onPress={() => Alert.alert("Politique de confidentialité", "La politique de confidentialité complète sera disponible prochainement.")}
            >
              <Text style={[styles.aboutText, { color: textColor }]}>Politique de confidentialité</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
  },
  aboutRow: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutText: {
    fontSize: 16,
  },
  versionText: {
    fontSize: 16,
    color: '#888',
  },
  authPromptContainer: {
    padding: 20,
    alignItems: 'center',
  },
  authPromptText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  authButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  authButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  loginButton: {
    backgroundColor: '#0a7ea4',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});