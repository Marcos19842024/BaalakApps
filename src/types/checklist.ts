// Definir las sucursales disponibles
export const SUCURSALES = {
  ANIMALIA: 'Clínica Veterinaria Animalia',
  BAALAK_CENTRAL: 'Clínica Veterinaria Baalak (Central)',
  BAALAK_PRADO: 'Clínica Veterinaria Baalak (Prado)'
};

// Array de opciones para el selector
export const CLINIC_OPTIONS = [
  { id: 'BAALAK_CENTRAL', name: 'Clínica Veterinaria Baalak (Central)' },
  { id: 'ANIMALIA', name: 'Clínica Veterinaria Animalia' },
  { id: 'BAALAK_PRADO', name: 'Clínica Veterinaria Baalak (Prado)' }
];

export type SucursalType = keyof typeof SUCURSALES;

export interface ChecklistItem {
  id: string;
  area: string;
  aspecto: string;
  cumplimiento: '' | 'bueno' | 'regular' | 'malo';
  observaciones: string;
}

export interface ChecklistPhoto {
  id: string;
  area: string;
  photoUri: string;
  timestamp: string;
  description?: string;
  base64?: string;
}

export interface ChecklistData {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  responsable: string;
  items: ChecklistItem[];
  comentariosAdicionales: string;
  photos?: ChecklistPhoto[];
  completed: boolean;
  sucursal?: string;
  sucursalKey?: string;
}

export interface ChecklistAspect {
  id: string;
  aspecto: string;
  editable?: boolean;
}

export interface ChecklistArea {
  area: string;
  aspectos: ChecklistAspect[];
  icon?: string;
  editable?: boolean;
}

export interface SucursalTemplate {
  sucursal: SucursalType;
  areas: ChecklistArea[];
}