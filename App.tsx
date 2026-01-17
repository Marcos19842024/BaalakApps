import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  MainMenuScreen, 
  ChecklistScreen, 
  TemplateManagementScreen,
  RemindersScreen,
  WhatsAppConnectionScreen,
  UpdatesScreen 
} from './src/screens';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="MainMenu"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ff006f',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="MainMenu" 
          component={MainMenuScreen}
          options={{ title: 'Inicio' }}
        />
        <Stack.Screen 
          name="Checklist" 
          component={ChecklistScreen}
          options={{ title: 'Checklist' }}
        />
        <Stack.Screen 
          name="TemplateManagement" 
          component={TemplateManagementScreen}
          options={{ title: 'Plantillas' }}
        />
        <Stack.Screen 
          name="Reminders" 
          component={RemindersScreen}
          options={{ title: 'Recordatorios' }}
        />
        <Stack.Screen 
          name="WhatsAppConnection" 
          component={WhatsAppConnectionScreen}
          options={{ title: 'Conexión WhatsApp' }}
        />
        <Stack.Screen 
          name="Updates" 
          component={UpdatesScreen}
          options={{ title: 'Actualizaciones' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}