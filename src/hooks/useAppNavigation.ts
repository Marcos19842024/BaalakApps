import { useNavigation as useNativeNavigation } from '@react-navigation/native';

export function useAppNavigation() {
    const navigation = useNativeNavigation();
    return navigation;
}

// O específico para cada pantalla:
export function useChecklistNavigation() {
    const navigation = useNativeNavigation();
    return {
        navigateToTemplateManagement: () => navigation.navigate('TemplateManagement' as never),
        goBack: () => navigation.goBack(),
    };
}

export function useTemplateManagementNavigation() {
    const navigation = useNativeNavigation();
    return {
        goBack: () => navigation.goBack(),
    };
}