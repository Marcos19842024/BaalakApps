import { useNavigation as useNativeNavigation } from '@react-navigation/native';

export function useAppNavigation() {
    const navigation = useNativeNavigation();
    return navigation;
}

// O específico para cada pantalla:
export function useChecklistNavigation() {
    const navigation = useNativeNavigation();
    return {
        navigateToTemplateChecklist: () => navigation.navigate('TemplateChecklist' as never),
        goBack: () => navigation.goBack(),
    };
}

export function useTemplateChecklistNavigation() {
    const navigation = useNativeNavigation();
    return {
        goBack: () => navigation.goBack(),
    };
}

// O específico para cada pantalla:
export function useRemindersNavigation() {
    const navigation = useNativeNavigation();
    return {
        navigateToTemplateReminders: () => navigation.navigate('TemplateReminders' as never),
        goBack: () => navigation.goBack(),
    };
}

export function useTemplateRemindersNavigation() {
    const navigation = useNativeNavigation();
    return {
        goBack: () => navigation.goBack(),
    };
}