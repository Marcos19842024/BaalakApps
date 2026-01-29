import { SucursalType } from "./sucursal";

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