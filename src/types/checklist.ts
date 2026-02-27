export type Cumplimiento = 'bueno' | 'regular' | 'malo' | '';

export interface ChecklistPhoto {
  id: string;
  area: string;
  photoUri: string; // URL pública de Supabase o local
  timestamp: string;
  description: string;
  synced?: boolean;
}

export interface ChecklistItem {
  id: string;
  area: string;
  aspecto: string;
  cumplimiento: Cumplimiento;
  observaciones: string;
  aspectoId?: string;
}

export interface ChecklistData {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  responsable: string;
  items: ChecklistItem[];
  comentariosAdicionales: string;
  photos: ChecklistPhoto[];
  completed: boolean;
  sucursal: string;
  sucursalKey: string;
}