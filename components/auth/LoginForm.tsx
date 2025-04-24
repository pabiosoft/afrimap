import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onRegisterPress?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onCancel, onRegisterPress }) => {
  const { login, authState, clearError } = useAuth();
  const { isLoading, error } = authState;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const handleChange = (field: 'username' | 'password', value: string) => {
    if (field === 'username') {
      setUsername(value);
    } else {
      setPassword(value);
    }

    if (localErrors[field]) {
      setLocalErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    }
    
    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    }
    
    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    clearError();
    
    if (!validateForm()) {
      return;
    }
    
    const success = await login(username, password);
    if (success) {
      Alert.alert("Succès", "Vous êtes maintenant connecté!");
      if (onSuccess) onSuccess();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom d'utilisateur</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={(value) => handleChange('username', value)}
          placeholder="Entrez votre nom d'utilisateur"
          autoCapitalize="none"
          editable={!isLoading}
        />
        {localErrors.username ? (
          <Text style={styles.errorText}>{localErrors.username}</Text>
        ) : null}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={(value) => handleChange('password', value)}
          placeholder="Entrez votre mot de passe"
          secureTextEntry
          editable={!isLoading}
        />
        {localErrors.password ? (
          <Text style={styles.errorText}>{localErrors.password}</Text>
        ) : null}
      </View>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Annuler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.submitButton, isLoading && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.registerLink} 
        onPress={onRegisterPress}
        disabled={isLoading}
      >
        <Text style={styles.registerText}>
          Vous n'avez pas de compte? S'inscrire maintenant
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    color: '#0a7ea4',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginForm;