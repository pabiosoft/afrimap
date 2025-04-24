import { User, UserCredentials } from "@/types/auth";
import { ApiResponse, getApiUrl, handleApiError } from "./config";

// Service pour gérer les requêtes API d'authentification

export const userService = {
  // Récupérer tous les utilisateurs
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await fetch(getApiUrl("/users"));

      if (response.ok) {
        const data = await response.json();
        return { data: data.member, error: null, status: response.status };
      }

      const errorMessage = await handleApiError(response);
      return { data: null, error: errorMessage, status: response.status };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Erreur réseau",
        status: 500,
      };
    }
  },

  // Récupérer un utilisateur par ID
  async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(getApiUrl(`/users/${id}`));

      if (response.ok) {
        const data = await response.json();
        return { data, error: null, status: response.status };
      }

      const errorMessage = await handleApiError(response);
      return { data: null, error: errorMessage, status: response.status };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Erreur réseau",
        status: 500,
      };
    }
  },

  // Créer un nouvel utilisateur
  async createUser(userData: UserCredentials): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(getApiUrl("/users"), {
        method: "POST",
        headers: {
          "Content-Type": "application/ld+json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        return { data, error: null, status: response.status };
      }

      const errorMessage = await handleApiError(response);
      return { data: null, error: errorMessage, status: response.status };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Erreur réseau",
        status: 500,
      };
    }
  },

  // Mettre à jour un utilisateur
  async updateUser(
    id: string,
    userData: Partial<UserCredentials>
  ): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(getApiUrl(`/users/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/merge-patch+json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        return { data, error: null, status: response.status };
      }

      const errorMessage = await handleApiError(response);
      return { data: null, error: errorMessage, status: response.status };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Erreur réseau",
        status: 500,
      };
    }
  },
};
