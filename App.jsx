import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChecklistScreen from './src/screens/ChecklistScreen';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <SafeAreaProvider>
      <ChecklistScreen />
      <Toast />
    </SafeAreaProvider>
  );
}