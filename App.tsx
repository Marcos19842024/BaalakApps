import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ChecklistScreen, TemplateManagementScreen } from './src/screens';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Checklist"
      >
        <Stack.Screen 
          name="Checklist" 
          component={ChecklistScreen}
        />
        <Stack.Screen 
          name="TemplateManagement" 
          component={TemplateManagementScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}