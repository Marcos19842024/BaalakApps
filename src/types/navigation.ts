export type RootStackParamList = {
  Checklist: undefined;
  TemplateManagement: undefined;
};

// Tipos básicos para navigation
export type NavigationProp = {
  navigate: (screen: keyof RootStackParamList) => void;
  goBack: () => void;
};

// Tipos específicos
export type ChecklistScreenNavigationProp = NavigationProp;
export type TemplateManagementScreenNavigationProp = NavigationProp;