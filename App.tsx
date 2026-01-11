import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ChecklistScreen, TemplateManagementScreen } from './src/screens';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Checklist"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ff008cea',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Checklist" 
          component={ChecklistScreen}
          options={{ 
            title: 'Checklist de Supervisión',
            headerShown: true,
            headerRight: () => null, // Ocultar botón derecho por defecto
          }}
        />
        <Stack.Screen 
          name="TemplateManagement" 
          component={TemplateManagementScreen}
          options={{ 
            title: 'Gestión de Plantillas',
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}