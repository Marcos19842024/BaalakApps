import { SucursalType } from "./checklist";

export type RootStackParamList = {
  Checklist: undefined;
  TemplateChecklist: { sucursalKey: string };
  Reminders: undefined;
  TemplateReminders: { sucursalKey: string };
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
export type ChecklistScreenNavigationProp = NavigationProp;
export type TemplateChecklistScreenNavigationProp = NavigationProp;
export type RemindersScreenNavigationProp = NavigationProp;
export type TemplateRemindersScreenNavigationProp = NavigationProp;