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