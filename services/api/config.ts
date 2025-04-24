// Configuration de base pour les requêtes API

const API_BASE_URL = "https://sudmaps.pabiosoft.com/api";

export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;
};

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// Fonction pour gérer les erreurs API
export const handleApiError = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();
    if (data.detail) {
      return data.detail;
    } else if (data.violations && data.violations.length > 0) {
      // Joindre tous les messages d'erreur de validation
      return data.violations
        .map((v: any) => `${v.propertyPath}: ${v.message}`)
        .join(", ");
    } else if (data.title) {
      return data.title;
    }
    return "Une erreur est survenue. Veuillez réessayer.";
  } catch (error) {
    return (
      response.statusText || "Une erreur est survenue. Veuillez réessayer."
    );
  }
};
