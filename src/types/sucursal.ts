// Definir las sucursales disponibles
export const SUCURSALES = {
  ANIMALIA: 'Clínica Veterinaria Animalia',
  BAALAK_CENTRAL: 'Clínica Veterinaria Baalak (Central)',
  BAALAK_PRADO: 'Clínica Veterinaria Baalak (Prado)'
};

export type SucursalType = keyof typeof SUCURSALES;

// Array de opciones para el selector
export const CLINIC_OPTIONS = [
  { id: 'BAALAK_CENTRAL', name: 'Clínica Veterinaria Baalak (Central)' },
  { id: 'ANIMALIA', name: 'Clínica Veterinaria Animalia' },
  { id: 'BAALAK_PRADO', name: 'Clínica Veterinaria Baalak (Prado)' }
];

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export interface ClinicaCoordenadas extends Coordenadas {
  radius?: number; // Radio en kilómetros para considerar "cercano"
}

export interface ClinicaCoordenadas {
  latitude: number;
  longitude: number;
  radius?: number; // Radio en kilómetros para considerar "cercano"
}

export const CLINICA_COORDENADAS: Record<SucursalType, ClinicaCoordenadas> = {
  BAALAK_CENTRAL: {
    latitude: 19.831218,
    longitude: -90.534602,
    radius: 0.5
  },
  BAALAK_PRADO: {
    latitude: 19.832604,
    longitude: -90.551841,
    radius: 0.5
  },
  ANIMALIA: {
    latitude: 18.143160,
    longitude: -94.454624,
    radius: 0.5
  }
};

// Función para calcular distancia entre dos puntos
export const calcularDistancia = (coords1: Coordenadas, coords2: Coordenadas): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (coords2.latitude - coords1.latitude) * (Math.PI / 180);
  const dLon = (coords2.longitude - coords1.longitude) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.latitude * (Math.PI / 180)) * 
    Math.cos(coords2.latitude * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c; // Distancia en km
  
  return distancia;
};

// Encontrar clínica más cercana
export const encontrarClinicaCercana = (
  userLocation: Coordenadas,
  maxDistance: number = 0.5
): SucursalType | null => {
  let clinicaMasCercana: SucursalType | null = null;
  let distanciaMinima = Infinity;

  Object.entries(CLINICA_COORDENADAS).forEach(([key, coords]) => {
    const distancia = calcularDistancia(userLocation, coords);
    
    if (distancia < distanciaMinima && distancia <= maxDistance) {
      distanciaMinima = distancia;
      clinicaMasCercana = key as SucursalType;
    }
  });

  return clinicaMasCercana;
};