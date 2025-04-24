import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User, UserCredentials } from '@/types/auth';
import { userService } from '@/services/api/auth';

// Valeurs par défaut pour le contexte d'authentification
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Création du contexte
const AuthContext = createContext<{
  authState: AuthState;
  register: (userData: UserCredentials) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}>({
  authState: initialState,
  register: async () => false,
  login: async () => false,
  logout: () => {},
  clearError: () => {}
});

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Fournisseur du contexte d'authentification
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  // Vérifier si l'utilisateur est déjà connecté au chargement de l'application
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        const storedUser = await AsyncStorage.getItem('@auth_user');
        const storedToken = await AsyncStorage.getItem('@auth_token');
        
        if (storedUser && storedToken) {
          setAuthState({
            user: JSON.parse(storedUser),
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Erreur lors du chargement des données utilisateur'
        });
      }
    };

    loadUserFromStorage();
  }, []);

  // Fonction d'inscription utilisateur
  const register = async (userData: UserCredentials): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await userService.createUser(userData);
      
      if (response.data) {
        // Normalement, après inscription, l'utilisateur devrait se connecter
        // mais pour simplifier, on peut considérer qu'il est connecté directement
        const newUser = response.data;
        const mockToken = 'mock-token-' + Date.now(); // Dans une vraie app, ce serait un token JWT
        
        await AsyncStorage.setItem('@auth_user', JSON.stringify(newUser));
        await AsyncStorage.setItem('@auth_token', mockToken);
        
        setAuthState({
          user: newUser,
          token: mockToken,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        return true;
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: response.error || 'Échec de l\'inscription' 
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'inscription'
      }));
      return false;
    }
  };

  // Fonction de connexion
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simulation de connexion car l'API fournie ne semble pas avoir d'endpoint de connexion
      const usersResponse = await userService.getAllUsers();
      
      if (!usersResponse.data) {
        throw new Error('Impossible de récupérer les utilisateurs');
      }
      
      const user = usersResponse.data.find(u => u.username === username);
      
      if (!user) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Nom d\'utilisateur ou mot de passe incorrect' 
        }));
        return false;
      }
      
      // Dans une vraie app, on vérifierait le mot de passe ici
      // Pour cette démo, on considère que la connexion est réussie
      const mockToken = 'mock-token-' + Date.now();
      
      await AsyncStorage.setItem('@auth_user', JSON.stringify(user));
      await AsyncStorage.setItem('@auth_token', mockToken);
      
      setAuthState({
        user,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la connexion'
      }));
      return false;
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@auth_user');
      await AsyncStorage.removeItem('@auth_token');
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Erreur lors de la déconnexion'
      }));
    }
  };

  // Fonction pour effacer les messages d'erreur
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider value={{ authState, register, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};