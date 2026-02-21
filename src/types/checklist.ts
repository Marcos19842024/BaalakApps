export interface ChecklistItem {
  aspectoId: any;
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