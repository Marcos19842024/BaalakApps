import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import Toast from 'react-native-toast-message';
import { stylesmainMenu } from 'src/styles/mainMenu';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenNavigationProp } from 'src/types/navigation';
import { CLINIC_OPTIONS, SUCURSALES, SucursalType } from 'src/types/sucursal';

export const MainMenuScreen = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [showClinicSelector, setShowClinicSelector] = useState(false);
  const [sucursalKey, setSucursalKey] = useState<SucursalType>('BAALAK_CENTRAL');

  const menuItems = [
    {
      id: 'checklist',
      title: 'Checklist',
      description: 'Realiza y gestiona checklists',
      icon: 'checklist',
      color: '#4CAF50',
      route: 'Checklist',
    },
    {
      id: 'templateChecklists',
      title: 'Configuración de checklists',
      description: 'Editar áreas y elementos de checklist',
      icon: 'settings',
      color: '#9C27B0',
      route: 'TemplateChecklist',
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
      id: 'reports',
      title: 'Generador de Reportes',
      description: 'Crea reportes de incidentes y problemas',
      icon: 'description',
      color: '#FF9800',
      route: 'Reports',
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
    if (route === 'Updates' && hasUpdate) {
      Updates.fetchUpdateAsync().then(() => {
        Toast.show({
          type: 'success',
          text1: 'Actualización descargada',
          text2: 'Reiniciando la aplicación para aplicar la actualización.',
        });
        Updates.reloadAsync();
      }).catch((error) => {
        Toast.show({
          type: 'error',
          text1: 'Error al descargar la actualización',
          text2: error.message,
        });
      });
      return;
    }
    else if (route === 'TemplateChecklist') {
      const sucursalName = SUCURSALES[sucursalKey];
      Toast.show({
        type: 'info',
        text1: 'Navegando a Configuración de Checklist',
        text2: `Sucursal actual: ${sucursalName}`,
      });
      navigation.navigate('TemplateChecklist', { sucursalKey: sucursalKey });
    }
    else if (route === 'Checklist') {
      const sucursalName = SUCURSALES[sucursalKey];
      Toast.show({
        type: 'info',
        text1: 'Navegando a Checklist',
        text2: `Sucursal actual: ${sucursalName}`,
      });
      navigation.navigate('Checklist', { sucursalKey: sucursalKey });
    }
    else if (route === 'Reminders') {
      const sucursalName = SUCURSALES[sucursalKey];
      Toast.show({
        type: 'info',
        text1: 'Navegando a Recordatorios',
        text2: `Sucursal actual: ${sucursalName}`,
      });
      navigation.navigate('Reminders', { sucursalKey: sucursalKey });
    }
    else {
      navigation.navigate(route as never);
    }
  };
  
  // Actualizar checklist cuando cambia la sucursal
  const handleSucursalChange = (newSucursalKey: SucursalType) => {
    const newSucursalName = SUCURSALES[newSucursalKey];
    
    setSucursalKey(newSucursalKey);
    setShowClinicSelector(false);
    
    Toast.show({
      type: 'success',
      text1: 'Sucursal cambiada',
      text2: newSucursalName,
    });
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
          <View style={stylesmainMenu.nameVersion}>
            <Text style={stylesmainMenu.appName}>BaalakApps</Text>
            <Text style={stylesmainMenu.appVersion}>Versión 1.0.0</Text>
          </View>
          <TouchableOpacity 
            style={stylesmainMenu.clinicSelectorButton}
            onPress={() => setShowClinicSelector(true)}
          >
            <View style={stylesmainMenu.clinicButtonContent}>
              <MaterialCommunityIcons name="hospital-building" size={20} color="#ff006f" />
              <Text style={stylesmainMenu.clinicName} numberOfLines={1}>
                {SUCURSALES[sucursalKey]}
              </Text>
            </View>
            <Icon name="arrow-drop-down" size={24} color="#ff006f" />
          </TouchableOpacity>
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

      {/* Modal para seleccionar clínica */}
      <Modal
        visible={showClinicSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClinicSelector(false)}
      >
        <View style={stylesmainMenu.modalOverlay}>
          <View style={stylesmainMenu.clinicModalContent}>
            <Text style={stylesmainMenu.modalTitle}>Seleccionar Sucursal</Text>
              
            {CLINIC_OPTIONS.map((clinic) => {
              const clinicKey = clinic.id as SucursalType;
            
              return (
                <TouchableOpacity
                  key={clinic.id}
                  style={[
                      stylesmainMenu.clinicOption,
                      sucursalKey === clinic.id && stylesmainMenu.clinicOptionSelected
                  ]}
                  onPress={() => handleSucursalChange(clinicKey)}
                >
                  <View style={stylesmainMenu.clinicOptionContent}>
                    <View style={stylesmainMenu.clinicIconContainer}>
                      <MaterialCommunityIcons 
                        name="hospital-building" 
                        size={28}
                        color={sucursalKey === clinic.id ? '#ff008cea' : '#6B7280'} 
                      />
                    </View>
                    <View style={stylesmainMenu.clinicTextContainer}>
                      <Text style={[
                        stylesmainMenu.clinicOptionText,
                        sucursalKey === clinic.id && stylesmainMenu.clinicOptionTextSelected
                      ]}>
                        {clinic.name}
                      </Text>
                    </View>
                  </View>
                  {sucursalKey === clinic.id && (
                    <View style={stylesmainMenu.checkIconContainer}>
                      <Icon name="check-circle" size={24} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
              
            <TouchableOpacity
              style={stylesmainMenu.modalCloseButton}
              onPress={() => setShowClinicSelector(false)}
            >
              <Text style={stylesmainMenu.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        
      <Toast />
    </View>
  );
};