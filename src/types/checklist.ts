import { SucursalType } from "./sucursal";

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