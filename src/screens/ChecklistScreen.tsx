import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import Toast from 'react-native-toast-message';
import Icon from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ChecklistData, ChecklistItem, ChecklistPhoto, CLINIC_OPTIONS, SUCURSALES, SucursalType } from '../types/checklist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateChecklistPDF } from '../utils/pdfGenerator';
import { stylesChecklist } from 'src/styles/Checklist';
import { useChecklistNavigation } from 'src/hooks/useAppNavigation';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  getCurrentTime,
  initializeChecklistData,
  calculateAreaStats,
  getUniqueAreasForSucursal,
  areAllAreasComplete,
  getIncompleteAreas,
  getCompletionPercentage,
  getAreaIcon,
} from '../utils/checklistData';

export default function ChecklistScreen() {
  const [sucursalKey, setSucursalKey] = useState<SucursalType>('BAALAK_CENTRAL');
  const [sucursalName, setSucursalName] = useState<string>(SUCURSALES.BAALAK_CENTRAL);
  const [formData, setFormData] = useState<ChecklistData>(initializeChecklistData('BAALAK_CENTRAL'));
  const [isLoading, setIsLoading] = useState(false);
  const [currentArea, setCurrentArea] = useState('ESTACIONAMIENTO');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [showClinicSelector, setShowClinicSelector] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [incompleteAreas, setIncompleteAreas] = useState<string[]>([]);
  const areasScrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const { navigateToTemplateManagement } = useChecklistNavigation();

  // Solicitar permisos
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus === 'granted');
      
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus !== 'granted') {
        Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para guardar fotos');
      }
    })();
  }, []);

  // Función para hacer scroll automático a un área
  const scrollToArea = (areaIndex: number) => {
    if (areasScrollViewRef.current && areaIndex >= 0 && areaIndex < areas.length) {
      // Calcular la posición aproximada (ajusta según el alto de tus items)
      const scrollPosition = areaIndex * 280; // Ajusta este valor según el alto de tus áreas
      areasScrollViewRef.current.scrollTo({ y: scrollPosition, animated: true });
    }
  };

  // Actualizar checklist cuando cambia la sucursal
  const handleSucursalChange = (newSucursalKey: SucursalType) => {
    const newSucursalName = SUCURSALES[newSucursalKey];
    
    setSucursalKey(newSucursalKey);
    setSucursalName(newSucursalName);
    
    // Crear nuevo checklist con las áreas de la nueva sucursal
    const newChecklist = initializeChecklistData(newSucursalKey);
    setFormData(newChecklist);
    
    // Establecer el primer área de la sucursal como activa
    const areas = getUniqueAreasForSucursal(newSucursalKey);

    if (areas.length === 0) {
      return (
        <SafeAreaView style={stylesChecklist.container}>
          <View style={stylesChecklist.noAreasContainer}>
            <MaterialCommunityIcons name="folder-alert" size={64} color="#9CA3AF" />
            <Text style={stylesChecklist.noAreasTitle}>No hay áreas configuradas</Text>
            <Text style={stylesChecklist.noAreasText}>
              Esta sucursal no tiene áreas configuradas. Contacta al administrador.
            </Text>
            <TouchableOpacity 
              style={stylesChecklist.refreshButton}
              onPress={() => handleSucursalChange(sucursalKey)}
            >
              <Text style={stylesChecklist.refreshButtonText}>Recargar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    setCurrentArea(areas[0] || 'ESTACIONAMIENTO');
    
    setShowClinicSelector(false);
    
    Toast.show({
      type: 'success',
      text1: 'Sucursal cambiada',
      text2: newSucursalName,
    });
  };

  // Agrupar items por área
  const itemsByArea = formData.items.reduce((acc, item) => {
    if (!acc[item.area]) acc[item.area] = [];
    acc[item.area].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // Obtener áreas únicas para la sucursal actual
  const areas = getUniqueAreasForSucursal(sucursalKey);

  // Tomar foto
  const takePhoto = async () => {
    if (hasCameraPermission === false) {
      Alert.alert('Permiso denegado', 'Necesitas permitir el acceso a la cámara');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setTempPhoto(result.assets[0].uri);
        setCameraVisible(true);
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo tomar la foto',
      });
    }
  };

  // Guardar foto
  const savePhoto = async () => {
    if (!tempPhoto) return;

    try {
      // Guardar en la galería
      const asset = await MediaLibrary.createAssetAsync(tempPhoto);
      
      const newPhoto: ChecklistPhoto = {
        id: `photo-${Date.now()}`,
        area: currentArea,
        photoUri: asset.uri,
        timestamp: getCurrentTime(),
        description: photoDescription,
      };

      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), newPhoto]
      }));

      Toast.show({
        type: 'success',
        text1: '✅ Foto guardada',
        text2: 'La foto se ha agregado al checklist',
      });

      setTempPhoto(null);
      setPhotoDescription('');
      setCameraVisible(false);
    } catch (error) {
      console.error('Error guardando foto:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo guardar la foto',
      });
    }
  };

  // Eliminar foto
  const removePhoto = (photoId: string) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos?.filter(photo => photo.id !== photoId) || []
    }));
    Toast.show({
      type: 'success',
      text1: 'Foto eliminada',
    });
  };

  // Calcular porcentajes
  const calculateBuenoPercentage = (area?: string): number => {
    const itemsToCheck = area 
      ? formData.items.filter(item => item.area === area)
      : formData.items;
    
    if (itemsToCheck.length === 0) return 0;
    
    const buenoItems = itemsToCheck.filter(item => item.cumplimiento === 'bueno').length;
    const totalEvaluated = itemsToCheck.filter(item => item.cumplimiento !== '').length;
    
    return totalEvaluated > 0 ? (buenoItems / totalEvaluated) * 100 : 0;
  };

  // Guardar JSON localmente
  const saveJsonLocally = async (data: ChecklistData): Promise<string> => {
    try {
      const key = `checklist_${sucursalKey}_${data.responsable.replace(/\s+/g, '_')}_${Date.now()}`;
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify({
        ...data,
        sucursalKey: sucursalKey
      }));

      return key;
    } catch (error) {
      console.error('Error guardando JSON:', error);
      throw error;
    }
  };

  // Función para validar antes de guardar
  const validateBeforeSave = (): boolean => {
    if (!formData.responsable.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Complete el campo responsable',
      });
      return false;
    }

    // Verificar si todas las áreas están completas
    const allComplete = areAllAreasComplete(formData.items, sucursalKey);
    
    if (!allComplete) {
      const incomplete = getIncompleteAreas(formData.items, sucursalKey);
      setIncompleteAreas(incomplete);
      setShowValidationModal(true);
      return false;
    }
    
    return true;
  };

  // Función para forzar guardar a pesar de áreas incompletas
  const handleForceSave = async () => {
    setShowValidationModal(false);
    await handleSaveInternal();
  };

  // Función interna para guardar (sin validación)
  const handleSaveInternal = async () => {
    try {
      setIsLoading(true);

      // Actualizar datos
      const updatedData = {
        ...formData,
        horaFin: getCurrentTime(),
        sucursal: sucursalName,
        sucursalKey: sucursalKey,
        completed: areAllAreasComplete(formData.items, sucursalKey) // Agregar estado de completado
      };

      // Guardar JSON
      const jsonUri = await saveJsonLocally(updatedData);
      
      // Generar PDF
      const pdfUri = await generateChecklistPDF(updatedData, sucursalName);
      
      Toast.show({
        type: 'success',
        text1: '✅ Checklist guardado',
        text2: 'PDF y JSON generados correctamente',
      });

      Alert.alert(
        'Checklist Guardado',
        '¿Deseas compartir el PDF por WhatsApp?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Sí, compartir', 
            onPress: () => shareViaWhatsApp(pdfUri, updatedData)
          },
          { 
            text: 'Descargar PDF',
            onPress: () => savePDFToDownloads(pdfUri, updatedData)
          }
        ]
      );

    } catch (error) {
      console.error('Error guardando:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo guardar el checklist',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modificar handleSave para incluir validación
  const handleSave = async () => {
    if (validateBeforeSave()) {
      await handleSaveInternal();
    }
  };

  // Función para navegar a un área incompleta
  const navigateToIncompleteArea = (area: string) => {
    const areaIndex = areas.findIndex(a => a === area);
    setCurrentArea(area);
    setShowValidationModal(false);
    
    if (areaIndex >= 0) {
      // Hacer scroll al área después de un pequeño delay
      setTimeout(() => {
        scrollToArea(areaIndex);
      }, 100);
    }
    
    Toast.show({
      type: 'info',
      text1: 'Navegando al área',
      text2: `Ir a ${area}`,
    });
  };

  // Calcular porcentaje de completado
  const completionPercentage = getCompletionPercentage(formData.items, sucursalKey);

  // Compartir por WhatsApp
  const shareViaWhatsApp = async (pdfUri: string, data: ChecklistData) => {
    try {
      if (!await Sharing.isAvailableAsync()) {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
        return;
      }

      // Para Android, podemos usar un intent directo
      if (Platform.OS === 'android') {
        const message = `*CHECKLIST DE SUPERVISIÓN*\n\n` +
        `*Sucursal:* ${sucursalName}\n` +
        `*Responsable:* ${data.responsable}\n` +
        `*Fecha:* ${data.fecha}\n` +
        `*Hora:* ${data.horaInicio} - ${data.horaFin}\n` +
        `*Áreas evaluadas:* ${areas.length}\n` +
        `*Evaluación:* ${data.items.filter(item => item.cumplimiento !== '').length}/${data.items.length} items\n\n` +
        `Adjunto el reporte completo.`;

        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Checklist',
          UTI: 'public.pdf',
        });

        Toast.show({
          type: 'success',
          text1: 'Compartiendo...',
          text2: 'Selecciona WhatsApp para enviar',
        });
      } else {
        // Para iOS
        await Sharing.shareAsync(pdfUri);
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo compartir el archivo',
      });
    }
  };

  // Guardar PDF en descargas
  const savePDFToDownloads = async (pdfUri: string, data: ChecklistData) => {
    try {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Guardar Checklist PDF',
        UTI: 'public.pdf',
      });

      Toast.show({
        type: 'success',
        text1: '✅ PDF listo',
        text2: 'Usa el menú para guardar o compartir',
      });
      
    } catch (error) {
      console.error('Error compartiendo PDF:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo abrir el PDF',
      });
    }
  };

  // Resetear checklist
  const handleNewChecklist = () => {
    Alert.alert(
      'Nuevo Checklist',
      '¿Estás seguro de que deseas crear un nuevo checklist? Se perderán los datos no guardados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, crear nuevo',
          onPress: () => {
            const newData = initializeChecklistData(sucursalKey);
            setFormData(newData);
            setCurrentArea(areas[0] || 'ESTACIONAMIENTO');
            Toast.show({
              type: 'success',
              text1: 'Nuevo checklist',
              text2: `Creado para ${sucursalName}`,
            });
          }
        }
      ]
    );
  };

  // Obtener estadísticas
  const generalStats = calculateAreaStats(formData.items);
  const currentAreaStats = calculateAreaStats(
    formData.items.filter(item => item.area === currentArea)
  );

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'malo': return '#EF4444';
      case 'regular': return '#F59E0B';
      case 'bueno': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const areaPhotos = formData.photos?.filter(photo => photo.area === currentArea) || [];

  return (
    <SafeAreaView style={stylesChecklist.container}>
      {/* SECCIÓN FIJA SUPERIOR */}
      <View style={stylesChecklist.fixedSection}>
        {/* Header */}
        <View style={stylesChecklist.header}>
          <Text style={stylesChecklist.title}>📋 CHECKLIST DE SUPERVISIÓN</Text>
          <TouchableOpacity 
            style={stylesChecklist.clinicSelectorButton}
            onPress={() => setShowClinicSelector(true)}
          >
            <View style={stylesChecklist.clinicButtonContent}>
              <MaterialCommunityIcons name="hospital-building" size={20} color="#ff006f" />
              <Text style={stylesChecklist.clinicName} numberOfLines={1}>{sucursalName}</Text>
            </View>
            <Icon name="arrow-drop-down" size={24} color="#ff006f" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={stylesChecklist.settingsButton}
            onPress={navigateToTemplateManagement}
          >
            <Icon name="settings" size={24} color="#6B7280" />
          </TouchableOpacity>

        </View>

        {/* Información general */}
        <View style={stylesChecklist.infoCard}>
          
          <View style={stylesChecklist.infoGrid}>
              <Text style={stylesChecklist.infoLabel}>FECHA:</Text>
              <Text style={stylesChecklist.infoValue}>{formData.fecha}</Text>
              <Text></Text><Text></Text><Text></Text>
              <Text style={stylesChecklist.infoLabel}>HORA INICIO:</Text>
              <Text style={stylesChecklist.infoValue}>{formData.horaInicio} hrs.</Text>
          </View>
          
          <View style={stylesChecklist.infoItem}>
            <Text style={stylesChecklist.infoLabel}>RESPONSABLE:</Text>
            <TextInput
              style={stylesChecklist.responsableInput}
              placeholder="Nombre del responsable"
              value={formData.responsable}
              onChangeText={(text) => setFormData(prev => ({ ...prev, responsable: text }))}
            />
          </View>
        </View>

        {/* Barra de progreso general */}
        <View style={stylesChecklist.progressCard}>
          <View style={stylesChecklist.progressHeader}>
            <Text style={stylesChecklist.progressLabel}>Calificación General</Text>
            <Text style={[
              stylesChecklist.progressStatus,
              { color: getProgressColor(generalStats.porcentajeBueno) }
            ]}>
              {generalStats.porcentajeBueno >= 80 ? 'EXCELENTE' :
                generalStats.porcentajeBueno >= 60 ? 'ACEPTABLE' : 'REQUIERE MEJORA'}
            </Text>
          </View>
          
          <View style={stylesChecklist.progressBar}>
            <View 
              style={[
                stylesChecklist.progressFill,
                { 
                  width: `${generalStats.porcentajeBueno}%`,
                  backgroundColor: getProgressColor(generalStats.porcentajeBueno)
                }
              ]}
            />
          </View>
          
          <View style={stylesChecklist.progressFooter}>
            <Text style={stylesChecklist.progressText}>0%</Text>
            <Text style={[
              stylesChecklist.progressText,
              { color: getProgressColor(generalStats.porcentajeBueno), fontWeight: 'bold' }
            ]}>
              {Math.round(generalStats.porcentajeBueno)}% Bueno
            </Text>
            <Text style={stylesChecklist.progressText}>100%</Text>
          </View>
        </View>

        {/* Selector de área y botón de cámara */}
        <View style={stylesChecklist.areaSection}>
          <View style={stylesChecklist.areaHeader}>
            <View>
              <Text style={stylesChecklist.evaluationSubtitle}>
                {areas.length} áreas disponibles
              </Text>
              <Text style={stylesChecklist.areasCountInfo}>
                {currentArea} ({currentAreaStats.totalEvaluado}/{currentAreaStats.total} evaluados)
              </Text>
            </View>
            <TouchableOpacity
              style={stylesChecklist.cameraButton}
              onPress={takePhoto}
              disabled={hasCameraPermission === false}
            >
              <MaterialCommunityIcons name="camera" size={24} color="white" />
              <Text style={stylesChecklist.cameraButtonText}>Tomar Foto</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={stylesChecklist.areaScroll}
          >
            {areas.map((area, index) => {
              const areaPercentage = calculateBuenoPercentage(area);
              return (
                <TouchableOpacity
                  key={area}
                  style={[
                    stylesChecklist.areaButton,
                    currentArea === area && stylesChecklist.areaButtonActive
                  ]}
                  onPress={() => {
                    setCurrentArea(area);
                    // Opcional: hacer scroll automático al área
                    scrollToArea(index);
                  }}
                >
                  <Text style={stylesChecklist.areaIcon}>{getAreaIcon(area)}</Text>
                  <Text style={[
                    stylesChecklist.areaButtonText,
                    currentArea === area && stylesChecklist.areaButtonTextActive
                  ]}>
                    {area.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                  </Text>
                  <View style={[
                    stylesChecklist.areaBadge,
                    { backgroundColor: getProgressColor(areaPercentage) }
                  ]}>
                    <Text style={stylesChecklist.areaBadgeText}>
                      {Math.round(areaPercentage)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Galería de fotos del área actual */}
        {areaPhotos.length > 0 && (
          <View style={stylesChecklist.photosSection}>
            <View style={stylesChecklist.photosHeader}>
              <Text style={stylesChecklist.sectionTitle}>Fotos de {currentArea}</Text>
              <Text style={stylesChecklist.photosCount}>{areaPhotos.length} foto(s)</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {areaPhotos.map((photo) => (
                <View key={photo.id} style={stylesChecklist.photoCard}>
                  <Image source={{ uri: photo.photoUri }} style={stylesChecklist.photo} />
                  <TouchableOpacity
                    style={stylesChecklist.deleteButton}
                    onPress={() => removePhoto(photo.id)}
                  >
                    <Icon name="delete" size={20} color="white" />
                  </TouchableOpacity>
                  <View style={stylesChecklist.photoInfo}>
                    {photo.description && (
                      <Text style={stylesChecklist.photoDescription} numberOfLines={2}>
                        {photo.description}
                      </Text>
                    )}
                    <Text style={stylesChecklist.photoTimestamp}>
                      {photo.timestamp}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* SCROLLVIEW SOLO PARA LAS ÁREAS */}
      <ScrollView 
        ref={areasScrollViewRef}
        style={stylesChecklist.areasScrollView}
        showsVerticalScrollIndicator={true}
      >
        {/* Evaluación del área actual */}
        <View style={stylesChecklist.evaluationSection}>
          
          {(itemsByArea[currentArea] || []).map((item) => (
            <View key={item.id} style={stylesChecklist.itemCard}>
              <Text style={stylesChecklist.itemText}>{item.aspecto}</Text>
              
              <View style={stylesChecklist.ratingContainer}>
                {['malo', 'regular', 'bueno'].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      stylesChecklist.ratingButton,
                      item.cumplimiento === rating && {
                        backgroundColor: `${getRatingColor(rating)}20`,
                        borderColor: getRatingColor(rating),
                      }
                    ]}
                    onPress={() => {
                      const newItems = formData.items.map(i =>
                        i.id === item.id ? { ...i, cumplimiento: rating as any } : i
                      );
                      setFormData(prev => ({ ...prev, items: newItems }));
                    }}
                  >
                    <View style={[
                      stylesChecklist.radioCircle,
                      item.cumplimiento === rating && {
                        borderColor: getRatingColor(rating),
                      }
                    ]}>
                      {item.cumplimiento === rating && (
                        <View style={[
                          stylesChecklist.radioInner,
                          { backgroundColor: getRatingColor(rating) }
                        ]} />
                      )}
                    </View>
                    <Text style={[
                      stylesChecklist.ratingText,
                      { color: getRatingColor(rating) }
                    ]}>
                      {rating.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={stylesChecklist.observationsInput}
                placeholder="Observaciones..."
                value={item.observaciones}
                onChangeText={(text) => {
                  const newItems = formData.items.map(i =>
                    i.id === item.id ? { ...i, observaciones: text } : i
                  );
                  setFormData(prev => ({ ...prev, items: newItems }));
                }}
                multiline
              />
            </View>
          ))}
        </View>

        {/* Comentarios adicionales */}
        <View style={stylesChecklist.commentsSection}>
          <Text style={stylesChecklist.sectionTitle}>Comentarios Adicionales</Text>
          <TextInput
            style={stylesChecklist.commentsInput}
            placeholder="Ingrese comentarios adicionales aquí..."
            value={formData.comentariosAdicionales}
            onChangeText={(text) => setFormData(prev => ({ ...prev, comentariosAdicionales: text }))}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Botones de acción */}
        <View style={stylesChecklist.actionsContainer}>
          <TouchableOpacity
            style={[stylesChecklist.actionButton, stylesChecklist.saveButton]}
            onPress={handleSave}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon name="save" size={24} color="white" />
                <Text style={stylesChecklist.actionButtonText}>Guardar Checklist</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[stylesChecklist.actionButton, stylesChecklist.newButton]}
            onPress={handleNewChecklist}
          >
            <Icon name="add-circle-outline" size={24} color="white" />
            <Text style={stylesChecklist.actionButtonText}>Nuevo</Text>
          </TouchableOpacity>
        </View>
        
        <View style={stylesChecklist.footer}>
          <Text style={stylesChecklist.footerText}>
            {sucursalName} | {areas.length} áreas | {formData.items.length} items | 
            Fotos: {formData.photos?.length || 0}
          </Text>
        </View>

        {/* Espacio extra al final para mejor scroll */}
        <View style={stylesChecklist.bottomSpacer} />
      </ScrollView>

      {/* Modal para seleccionar clínica */}
      <Modal
        visible={showClinicSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClinicSelector(false)}
      >
        <View style={stylesChecklist.modalOverlay}>
          <View style={stylesChecklist.clinicModalContent}>
            <Text style={stylesChecklist.modalTitle}>Seleccionar Sucursal</Text>
            <Text style={stylesChecklist.modalSubtitle}>
              Cada sucursal tiene sus propias áreas específicas
            </Text>
            
            {CLINIC_OPTIONS.map((clinic) => {
              const clinicKey = clinic.id as SucursalType;
              const areasCount = getUniqueAreasForSucursal(clinicKey).length;
              
              return (
                <TouchableOpacity
                  key={clinic.id}
                  style={[
                    stylesChecklist.clinicOption,
                    sucursalKey === clinic.id && stylesChecklist.clinicOptionSelected
                  ]}
                  onPress={() => handleSucursalChange(clinicKey)}
                >
                  <View style={stylesChecklist.clinicOptionContent}>
                    <View style={stylesChecklist.clinicIconContainer}>
                      <MaterialCommunityIcons 
                        name="hospital-building" 
                        size={28} // Aumentado el tamaño
                        color={sucursalKey === clinic.id ? '#ff008cea' : '#6B7280'} 
                      />
                    </View>
                    <View style={stylesChecklist.clinicTextContainer}>
                      <Text style={[
                        stylesChecklist.clinicOptionText,
                        sucursalKey === clinic.id && stylesChecklist.clinicOptionTextSelected
                      ]}>
                        {clinic.name}
                      </Text>
                      <Text style={stylesChecklist.clinicAreasCount}>
                        {areasCount} {areasCount === 1 ? 'área' : 'áreas'} específicas
                      </Text>
                    </View>
                  </View>
                  {sucursalKey === clinic.id && (
                    <View style={stylesChecklist.checkIconContainer}>
                      <Icon name="check-circle" size={24} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity
              style={stylesChecklist.modalCloseButton}
              onPress={() => setShowClinicSelector(false)}
            >
              <Text style={stylesChecklist.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de validación de áreas incompletas */}
      <Modal
        visible={showValidationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowValidationModal(false)}
      >
        <View style={stylesChecklist.validationModalOverlay}>
          <View style={stylesChecklist.validationModalContent}>
            <View style={stylesChecklist.validationHeader}>
              <MaterialCommunityIcons name="alert-circle" size={40} color="#F59E0B" />
              <Text style={stylesChecklist.validationTitle}>Áreas Pendientes</Text>
              <Text style={stylesChecklist.validationSubtitle}>
                Hay {incompleteAreas.length} {incompleteAreas.length === 1 ? 'área' : 'áreas'} sin evaluar completamente
              </Text>
            </View>
            
            <ScrollView style={stylesChecklist.incompleteAreasList}>
              {incompleteAreas.map((area, index) => (
                <TouchableOpacity
                  key={area}
                  style={stylesChecklist.incompleteAreaItem}
                  onPress={() => navigateToIncompleteArea(area)}
                >
                  <View style={stylesChecklist.areaItemContent}>
                    <View style={stylesChecklist.areaItemNumber}>
                      <Text style={stylesChecklist.areaNumberText}>{index + 1}</Text>
                    </View>
                    <View style={stylesChecklist.areaItemInfo}>
                      <Text style={stylesChecklist.areaItemName}>{area}</Text>
                      <Text style={stylesChecklist.areaItemAction}>
                        Tocar para evaluar esta área
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={stylesChecklist.validationButtons}>
              <TouchableOpacity
                style={[stylesChecklist.validationButton, stylesChecklist.cancelValidationButton]}
                onPress={() => setShowValidationModal(false)}
              >
                <Text style={stylesChecklist.cancelValidationButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[stylesChecklist.validationButton, stylesChecklist.forceSaveButton]}
                onPress={handleForceSave}
              >
                <MaterialCommunityIcons name="file-document-outline" size={20} color="white" />
                <Text style={stylesChecklist.forceSaveButtonText}>Guardar como Incompleto</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={stylesChecklist.validationNote}>
              📝 Recomendación: Complete todas las áreas para un reporte más preciso
            </Text>
          </View>
        </View>
      </Modal>

      {/* Modal para vista previa de foto */}
      <Modal
        visible={cameraVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={stylesChecklist.modalContainer}>
          <View style={stylesChecklist.modalContent}>
            <Text style={stylesChecklist.modalTitle}>Vista previa de foto</Text>
            
            {tempPhoto && (
              <Image source={{ uri: tempPhoto }} style={stylesChecklist.previewImage} />
            )}
            
            <TextInput
              style={stylesChecklist.descriptionInput}
              placeholder="Descripción de la foto (opcional)"
              value={photoDescription}
              onChangeText={setPhotoDescription}
              multiline
            />
            
            <View style={stylesChecklist.modalButtons}>
              <TouchableOpacity
                style={[stylesChecklist.modalButton, stylesChecklist.cancelButton]}
                onPress={() => {
                  setTempPhoto(null);
                  setCameraVisible(false);
                }}
              >
                <Text style={stylesChecklist.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[stylesChecklist.modalButton, stylesChecklist.savePhotoButton]}
                onPress={savePhoto}
              >
                <Text style={stylesChecklist.savePhotoButtonText}>Guardar Foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}