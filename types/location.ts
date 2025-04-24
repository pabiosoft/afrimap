// Types pour les entités Location et SavedLocation

export interface Location {
  "@context"?: string;
  "@id"?: string;
  "@type"?: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  visibility: string; // 'public' ou 'private'
  isActif?: boolean;
}

export interface SavedLocation {
  "@context"?: string;
  "@id"?: string;
  "@type"?: string;
  location: string; // URL IRI de la location
  user: string; // URL IRI de l'utilisateur
  isActif?: boolean;
}

export interface LocationFormData {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  visibility: string;
}

export interface ApiLocationResponse {
  member: Location[];
  totalItems: number;
  view: {
    "@id": string;
    type: string;
    first: string;
    last: string;
    previous: string;
    next: string;
  };
}

export interface ApiSavedLocationResponse {
  member: SavedLocation[];
  totalItems: number;
  view: {
    "@id": string;
    type: string;
    first: string;
    last: string;
    previous: string;
    next: string;
  };
}
