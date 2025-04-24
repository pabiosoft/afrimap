import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Switch,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions
} from 'react-native';
import { LocationFormData } from '@/types/location';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LocationFormProps {
  coordinate: { latitude: number, longitude: number };
  onSave: (locationData: LocationFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const { width } = Dimensions.get('window');

const LocationForm: React.FC<LocationFormProps> = ({ 
  coordinate, 
  onSave, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    description: '',
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    visibility: 'public'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { authState } = useAuth();
  
  // Couleurs adaptatives pour les thèmes clair et sombre
  const colorScheme = useColorScheme();
  
  // Définition manuelle des couleurs basées sur le thème
  const textColor = colorScheme === 'dark' ? '#ffffff' : '#374151';
  const secondaryTextColor = colorScheme === 'dark' ? '#9ca3af' : '#6b7280';
  const inputBackgroundColor = colorScheme === 'dark' ? '#1f2937' : '#ffffff';
  const inputBorderColor = colorScheme === 'dark' ? '#374151' : '#e5e7eb';
  const placeholderColor = colorScheme === 'dark' ? '#6b7280' : '#9ca3af';
  const cardBackgroundColor = colorScheme === 'dark' ? '#111827' : '#f9fafb';
  
  const handleChange = (field: keyof LocationFormData, value: string | boolean) => {
    // Pour la visibilité, on convertit le booléen (isPublic) en chaîne
    if (field === 'visibility' && typeof value === 'boolean') {
      setFormData(prev => ({ 
        ...prev, 
        visibility: value ? 'public' : 'private'
      }));
    } else if (typeof value === 'string') {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Effacer l'erreur pour ce champ si elle existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };
  
  const isPublic = formData.visibility === 'public';
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
    >
      {/* Drag indicator for better UX */}
      <View style={styles.dragIndicatorContainer}>
        <View style={styles.dragIndicator} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.formScroll}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: textColor }]}>Nouveau lieu</Text>
          
          <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>Nom</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: errors.name ? '#ef4444' : inputBorderColor,
                    color: textColor
                  }
                ]}
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
                placeholder="Nom du lieu"
                placeholderTextColor={placeholderColor}
                editable={!isLoading}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>Description</Text>
              <TextInput
                style={[
                  styles.input, 
                  styles.textArea,
                  { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: errors.description ? '#ef4444' : inputBorderColor,
                    color: textColor
                  }
                ]}
                value={formData.description}
                onChangeText={(value) => handleChange('description', value)}
                placeholder="Description du lieu"
                placeholderTextColor={placeholderColor}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isLoading}
              />
              {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
            </View>
          </View>
          
          <View style={[styles.card, { backgroundColor: cardBackgroundColor, marginTop: 16 }]}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>Coordonnées</Text>
              <View style={[styles.coordinatesContainer, { backgroundColor: inputBackgroundColor, borderColor: inputBorderColor }]}>
                <Text style={[styles.coordinates, { color: secondaryTextColor }]}>
                  {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={[styles.label, { color: textColor }]}>Visibilité</Text>
                  <Text style={[styles.helperText, { color: secondaryTextColor }]}>
                    {isPublic 
                      ? 'Ce lieu sera visible par tous les utilisateurs' 
                      : 'Ce lieu ne sera visible que par vous'}
                  </Text>
                </View>
                <Switch 
                  value={isPublic}
                  onValueChange={(value) => handleChange('visibility', value)}
                  disabled={isLoading}
                  trackColor={{ false: '#767577', true: '#bfdbfe' }}
                  thumbColor={isPublic ? '#0a7ea4' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                />
              </View>
            </View>
          </View>
          
          {!authState.isAuthenticated && (
            <View style={[styles.warningContainer, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
              <Text style={styles.warningText}>
                Vous n'êtes pas connecté. Pour sauvegarder ce lieu dans votre compte, veuillez vous connecter dans les paramètres.
              </Text>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: colorScheme === 'dark' ? '#ffffff' : '#374151' }]}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.submitButton, 
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: '#ffffff' }]}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    width: '100%',
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 2.5,
  },
  formScroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  formContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 2,
  },
  coordinatesContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  coordinates: {
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 14,
    marginTop: 4,
  },
  warningContainer: {
    marginVertical: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    color: '#92400e',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LocationForm;