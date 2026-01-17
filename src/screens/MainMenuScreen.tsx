import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import Toast from 'react-native-toast-message';
import { stylesmainMenu } from 'src/styles/mainMenu';

const MainMenuScreen = () => {
  const navigation = useNavigation();
  const [hasUpdate, setHasUpdate] = useState(false);

  const menuItems = [
    {
      id: 'checklist',
      title: 'Checklist',
      description: 'Crea y gestiona tus listas de tareas',
      icon: 'checklist',
      color: '#4CAF50',
      route: 'Checklist',
    },
    {
      id: 'reminders',
      title: 'Recordatorios',
      description: 'Envío de recordatorios por WhatsApp',
      icon: 'notifications',
      color: '#2196F3',
      route: 'Reminders',
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Conexión y configuración',
      icon: 'whatsapp',
      color: '#25D366',
      route: 'WhatsAppConnection',
    },
    {
      id: 'updates',
      title: 'Actualizaciones',
      description: 'Actualiza la aplicación',
      icon: 'system-update',
      color: hasUpdate ? '#FF5722' : '#607D8B',
      route: 'Updates',
      badge: hasUpdate,
    },
  ];

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();
        setHasUpdate(update.isAvailable);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const handleMenuItemPress = (route: string) => {
    navigation.navigate(route as never);
  };

  return (
    <View style={stylesmainMenu.container}>
      {/* Header */}
      <View style={stylesmainMenu.header}>
        <Image
          source={require('../../assets/icon.png')}
          style={stylesmainMenu.logo}
        />
        <View style={stylesmainMenu.headerText}>
          <Text style={stylesmainMenu.appName}>BaalakApps</Text>
          <Text style={stylesmainMenu.appVersion}>Versión 1.0.0</Text>
        </View>
      </View>

      {/* Menu Grid */}
      <ScrollView style={stylesmainMenu.menuContainer}>
        <View style={stylesmainMenu.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={stylesmainMenu.menuCard}
              onPress={() => handleMenuItemPress(item.route)}
              activeOpacity={0.7}
            >
              <View style={[stylesmainMenu.iconContainer, { backgroundColor: item.color }]}>
                <Icon name={item.icon} size={32} color="#fff" />
                {item.badge && (
                  <View style={stylesmainMenu.badge}>
                    <Text style={stylesmainMenu.badgeText}>!</Text>
                  </View>
                )}
              </View>
              <Text style={stylesmainMenu.menuTitle}>{item.title}</Text>
              <Text style={stylesmainMenu.menuDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={stylesmainMenu.footer}>
        <Text style={stylesmainMenu.footerText}>
          © 2026 BaalakApps - Todos los derechos reservados
        </Text>
      </View>
      <Toast />
    </View>
  );
};

export default MainMenuScreen;