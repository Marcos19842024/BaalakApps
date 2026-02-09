import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { stylesmainMenu } from 'src/styles/mainMenu';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenNavigationProp } from 'src/types/navigation';
import { 
  CLINIC_OPTIONS, 
  SUCURSALES, 
  SucursalType,
  CLINICA_COORDENADAS,
  encontrarClinicaCercana 
} from 'src/types/sucursal';

export const MainMenuScreen = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [showClinicSelector, setShowClinicSelector] = useState(false);
  const [sucursalKey, setSucursalKey] = useState<SucursalType>('BAALAK_CENTRAL');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

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
      id: 'driveFiles',
      title: 'Administrador de Documentos',
      description: 'Gestiona tus archivos',
      icon: 'folder',
      color: '#05aaca',
      route: 'DriveFiles',
    },
  ];

  useEffect(() => {
    checkForUpdates();
    checkLocationPermission();
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

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        // Intentar detectar ubicación automáticamente al inicio
        await detectCurrentLocation(true);
      } else {
        Toast.show({
          type: 'info',
          text1: 'Permiso de ubicación requerido',
          text2: 'Activa la ubicación para detección automática de clínica',
        });
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
    }
  };

  const detectCurrentLocation = async (isAutomatic: boolean = false) => {
    try {
      setIsDetectingLocation(true);

      // Verificar permisos
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const permissionResult = await Location.requestForegroundPermissionsAsync();
        if (permissionResult.status !== 'granted') {
          if (!isAutomatic) {
            Toast.show({
              type: 'error',
              text1: 'Permiso denegado',
              text2: 'Necesitas permitir el acceso a la ubicación',
            });
          }
          setIsDetectingLocation(false);
          return;
        }
      }

      // Obtener ubicación
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userCoords);

      // Encontrar clínica más cercana (500 metros máximo)
      const clinicaCercana = encontrarClinicaCercana(userCoords, 0.5);
      
      if (clinicaCercana) {
        const newSucursalName = SUCURSALES[clinicaCercana];
        setSucursalKey(clinicaCercana);
        
        if (!isAutomatic) {
          Toast.show({
            type: 'success',
            text1: '📍 Ubicación detectada',
            text2: `Clínica: ${newSucursalName}`,
          });
        }
      } else {
        if (!isAutomatic) {
          Toast.show({
            type: 'info',
            text1: 'Ubicación detectada',
            text2: 'No estás cerca de ninguna clínica registrada',
          });
        }
      }

    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      
      if (!isAutomatic) {
        Toast.show({
          type: 'error',
          text1: 'Error de ubicación',
          text2: 'No se pudo obtener la ubicación actual',
        });
      }
    } finally {
      showLocationInfo();
      setIsDetectingLocation(false);
    }
  };

  const handleMenuItemPress = (route: string) => {
    const sucursalName = SUCURSALES[sucursalKey];

    switch (route) {
      case'Checklist':
        navigation.navigate('Checklist', { sucursalKey: sucursalKey });
        break;

      case'TemplateChecklist':
        navigation.navigate('TemplateChecklist', { sucursalKey: sucursalKey });
        break;

      case'Reminders':
        navigation.navigate('Reminders', { sucursalKey: sucursalKey });
        break;

      case'Reports':
        navigation.navigate('Reports', { sucursalKey: sucursalKey });
        break;

      case'DriveFiles':
        navigation.navigate('DriveFiles', { sucursalKey: sucursalKey });
        break;

      default:
        break;
    };
  };

  // Actualizar checklist cuando cambia la sucursal manualmente
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

  // Mostrar información de ubicación
  const showLocationInfo = () => {
    if (!userLocation) {
      Alert.alert(
        'Información de Ubicación',
        'No se ha detectado la ubicación actual. Usa el botón de ubicación para detectar automáticamente la clínica.',
        [{ text: 'OK' }]
      );
      return;
    }

    const distanciaClinica = calcularDistancia(userLocation, CLINICA_COORDENADAS[sucursalKey]);
    
    Alert.alert(
      'Información de Ubicación',
      `📍 **Clínica Actual:** ${SUCURSALES[sucursalKey]}\n\n` +
      `**Tu ubicación:**\n` +
      `Latitud: ${userLocation.latitude.toFixed(6)}\n` +
      `Longitud: ${userLocation.longitude.toFixed(6)}\n\n` +
      `**Distancia a la clínica:** ${distanciaClinica.toFixed(2)} km\n\n` +
      `**Detección automática:** ${distanciaClinica <= 0.5 ? '✅ Estás cerca' : '⚠️ Estás lejos'}`,
      [
        { text: 'OK' },
        { 
          text: 'Detectar de nuevo', 
          onPress: () => detectCurrentLocation(false)
        }
      ]
    );
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
          <View style={stylesmainMenu.clinicSection}>
            <TouchableOpacity 
              style={stylesmainMenu.clinicSelectorButton}
              onPress={() => setShowClinicSelector(true)}
            >
              <View style={stylesmainMenu.clinicButtonContent}>
                <MaterialCommunityIcons name="hospital-building" size={20} color="#05aaca" />
                <Text style={stylesmainMenu.clinicName} numberOfLines={1}>
                  {SUCURSALES[sucursalKey]}
                </Text>
              </View>
              <Icon name="arrow-drop-down" size={25} color="#05aaca" />
            </TouchableOpacity>
          </View>
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
            <View style={stylesmainMenu.modalHeader}>
              <Text style={stylesmainMenu.modalTitle}>Seleccionar Sucursal</Text>
              <TouchableOpacity
                style={stylesmainMenu.detectLocationModalButton}
                onPress={() => {
                  setShowClinicSelector(false);
                  setTimeout(() => detectCurrentLocation(false), 300);
                }}
                disabled={isDetectingLocation}
              >
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#05aaca" />
                <Text style={stylesmainMenu.detectLocationText}>Detectar automáticamente</Text>
              </TouchableOpacity>
            </View>
              
            {CLINIC_OPTIONS.map((clinic) => {
              const clinicKey = clinic.id as SucursalType;
              const isNearby = userLocation && 
                calcularDistancia(userLocation, CLINICA_COORDENADAS[clinicKey]) <= 0.5;
            
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
                        color={sucursalKey === clinic.id ? '#05aaca' : '#6B7280'} 
                      />
                    </View>
                    <View style={stylesmainMenu.clinicTextContainer}>
                      <Text style={[
                        stylesmainMenu.clinicOptionText,
                        sucursalKey === clinic.id && stylesmainMenu.clinicOptionTextSelected
                      ]}>
                        {clinic.name}
                      </Text>
                      {isNearby && (
                        <Text style={stylesmainMenu.nearbyBadge}>
                          <MaterialCommunityIcons name="map-marker-radius" size={20} color="#05aaca" /> Cerca de ti
                        </Text>
                      )}
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

      {/* Loading Overlay */}
      <Modal
        visible={isDetectingLocation}
        transparent={true}
        animationType="fade"
      >
        <View style={stylesmainMenu.loadingOverlay}>
          <View style={stylesmainMenu.loadingContent}>
            <ActivityIndicator size="large" color="#05aaca" />
            <Text style={stylesmainMenu.loadingText}>
              Buscando ubicación...
            </Text>
          </View>
        </View>
      </Modal>
        
      <Toast />
    </View>
  );
};

// Función para calcular distancia (también debe estar en sucursal.ts)
const calcularDistancia = (coords1: {latitude: number, longitude: number}, coords2: {latitude: number, longitude: number}): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (coords2.latitude - coords1.latitude) * (Math.PI / 180);
  const dLon = (coords2.longitude - coords1.longitude) * (Math.PI / 180);
  
  const a = 
  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  Math.cos(coords1.latitude * (Math.PI / 180)) * 
  Math.cos(coords2.latitude * (Math.PI / 180)) * 
  Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c; // Distancia en km
  
  return distancia;
};