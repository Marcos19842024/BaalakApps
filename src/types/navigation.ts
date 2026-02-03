import { SucursalType } from "./sucursal";

export type RootStackParamList = {
  Checklist: { sucursalKey: string };
  TemplateChecklist: { sucursalKey: string };
  Reminders: { sucursalKey: string };
  Reports: { sucursalKey: string };
  DriveFiles: { sucursalKey: string };
};

// Tipos básicos para navigation
export type NavigationProp = {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
};

export type RouteParams = {
  sucursalKey: SucursalType;
};

// Tipos específicos
export type ScreenNavigationProp = NavigationProp;