export type RootStackParamList = {
  Checklist: undefined;
  TemplateManagement: { sucursalKey: string };
};

// Tipos básicos para navigation
export type NavigationProp = {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
};

// Tipos específicos
export type ChecklistScreenNavigationProp = NavigationProp;
export type TemplateManagementScreenNavigationProp = NavigationProp;