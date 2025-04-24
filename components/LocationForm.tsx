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
  ScrollView
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

const LocationForm: React.FC<LocationFormProps> = ({ 
  coordinate, 
  onSave, 
  onCancel, 
  isLoading = false 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Couleurs en dur pour garantir le contraste et la visibilité
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const inputBgColor = isDark ? '#333333' : '#FFFFFF';
  const inputBorderColor = isDark ? '#555555' : '#CCCCCC';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const helperTextColor = isDark ? '#AAAAAA' : '#666666';
  
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    description: '',
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    visibility: 'public'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { authState } = useAuth();
  
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
      <ScrollView contentContainerStyle={styles.formScroll}>
        <View style={[styles.formContainer, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
          {/* Titre avec couleur forcée */}
          <Text style={[styles.title, { color: textColor }]}>Nouveau lieu</Text>
          
          {/* Champ Nom */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: labelColor }]}>Nom</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: inputBgColor, 
                  borderColor: inputBorderColor, 
                  color: textColor 
                }
              ]}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholder="Nom du lieu"
              placeholderTextColor={isDark ? '#888888' : '#AAAAAA'}
              editable={!isLoading}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>
          
          {/* Champ Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: labelColor }]}>Description</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                { 
                  backgroundColor: inputBgColor, 
                  borderColor: inputBorderColor, 
                  color: textColor 
                }
              ]}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              placeholder="Description du lieu"
              placeholderTextColor={isDark ? '#888888' : '#AAAAAA'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
            />
            {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
          </View>
          
          {/* Coordonnées */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: labelColor }]}>Coordonnées</Text>
            <Text style={[styles.coordinates, { color: helperTextColor }]}>
              {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </Text>
          </View>
          
          {/* Switch Public/Privé */}
          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: labelColor }]}>Public</Text>
              <Switch 
                value={isPublic}
                onValueChange={(value) => handleChange('visibility', value)}
                disabled={isLoading}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isPublic ? '#0a7ea4' : '#f4f3f4'}
              />
            </View>
            <Text style={[styles.helperText, { color: helperTextColor }]}>
              {isPublic 
                ? 'Ce lieu sera visible par tous les utilisateurs' 
                : 'Ce lieu ne sera visible que par vous'}
            </Text>
          </View>
          
          {/* Avertissement si non connecté */}
          {!authState.isAuthenticated && (
            <View 
              style={[
                styles.warningContainer, 
                { 
                  backgroundColor: isDark ? '#332d00' : '#fff3cd', 
                  borderColor: isDark ? '#665b00' : '#ffecb5' 
                }
              ]}
            >
              <Text 
                style={[
                  styles.warningText, 
                  { color: isDark ? '#ffd700' : '#664d03' }
                ]}
              >
                Vous n'êtes pas connecté. Pour sauvegarder ce lieu dans votre compte, 
                veuillez vous connecter dans les paramètres.
              </Text>
            </View>
          )}
          
          {/* Boutons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={{ color: isDark ? '#FFFFFF' : '#000000', fontWeight: 'bold' }}>
                Annuler
              </Text>
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
                <Text style={styles.buttonText}>Enregistrer</Text>
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
  },
  formScroll: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 5,
  },
  coordinates: {
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#cccccc',
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  warningContainer: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  warningText: {
    fontSize: 14,
  }
});

export default LocationForm;