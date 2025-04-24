import {
  Location,
  LocationFormData,
  ApiLocationResponse,
  SavedLocation,
} from "@/types/location";
import { ApiResponse, getApiUrl, handleApiError } from "./config";

// Service pour gérer les requêtes API des locations
export const locationService = {
  // Récupérer toutes les locations
  async getAllLocations(
    page = 1,
    isActif?: boolean
  ): Promise<ApiResponse<Location[]>> {
    try {
      let url = getApiUrl(`/locations?page=${page}`);
      if (isActif !== undefined) {
        url += `&isActif=${isActif}`;
      }

      const response = await fetch(url);

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

  // Récupérer une location par ID
  async getLocationById(id: string): Promise<ApiResponse<Location>> {
    try {
      // Vérifier si l'ID est un UUID complet ou une partie d'un IRI
      let locationId = id;

      // Si l'ID ressemble à une URL ou un IRI, extraire l'ID final
      if (id.includes("/")) {
        locationId = id.split("/").pop() || id;
      }

      const response = await fetch(getApiUrl(`/locations/${locationId}`));

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

  // Créer une nouvelle location
  async createLocation(
    locationData: LocationFormData
  ): Promise<ApiResponse<Location>> {
    try {
      const response = await fetch(getApiUrl("/locations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/ld+json",
        },
        body: JSON.stringify(locationData),
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

  // Mettre à jour une location
  async updateLocation(
    id: string,
    locationData: Partial<LocationFormData>
  ): Promise<ApiResponse<Location>> {
    try {
      const response = await fetch(getApiUrl(`/locations/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/merge-patch+json",
        },
        body: JSON.stringify(locationData),
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

  // Créer un lien entre une location et un utilisateur (SavedLocation)
  async saveLocationForUser(
    locationIri: string,
    userIri: string
  ): Promise<ApiResponse<SavedLocation>> {
    try {
      const savedLocationData = {
        location: locationIri,
        user: userIri,
      };

      const response = await fetch(getApiUrl("/saved_locations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/ld+json",
        },
        body: JSON.stringify(savedLocationData),
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

  // Récupérer toutes les locations sauvegardées d'un utilisateur
  async getSavedLocationsByUser(
    userIri: string
  ): Promise<ApiResponse<SavedLocation[]>> {
    try {
      // Idéalement, l'API devrait permettre de filtrer par utilisateur
      // Pour le moment, nous récupérons toutes les savedLocations et filtrons côté client
      const response = await fetch(getApiUrl("/saved_locations"));

      if (response.ok) {
        const data = await response.json();
        const userSavedLocations = data.member.filter(
          (sl: SavedLocation) => sl.user === userIri
        );
        return {
          data: userSavedLocations,
          error: null,
          status: response.status,
        };
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

  // Récupérer les locations sauvegardées avec pagination
  async getSavedLocationsWithPagination(
    page = 1
  ): Promise<ApiResponse<ApiSavedLocationResponse>> {
    try {
      const response = await fetch(getApiUrl(`/saved_locations?page=${page}`));

      if (response.ok) {
        const data = await response.json();
        return {
          data: {
            member: data.member,
            totalItems: data.totalItems,
            view: data.view,
          },
          error: null,
          status: response.status,
        };
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

  // Récupérer les détails d'une location à partir de son IRI
  async getLocationDetailsByIri(
    locationIri: string
  ): Promise<ApiResponse<Location>> {
    try {
      // L'IRI est déjà l'URL complète de la ressource
      const response = await fetch(locationIri);

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

  // Supprimer un lieu sauvegardé
  async deleteSavedLocation(
    savedLocationId: string
  ): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(
        getApiUrl(`/saved_locations/${savedLocationId}`),
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        return { data: null, error: null, status: response.status };
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
