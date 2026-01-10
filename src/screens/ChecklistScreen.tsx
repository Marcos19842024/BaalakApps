import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import Toast from 'react-native-toast-message';
import Icon from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ChecklistData, ChecklistItem, ChecklistPhoto } from '../types/checklist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  SUCURSALES,
  SucursalType,
  getCurrentTime,
  initializeChecklistData,
  AREA_ICONS,
  calculateAreaStats,
  getUniqueAreasForSucursal,
  areAllAreasComplete,
  getIncompleteAreas,
  getCompletionPercentage,
} from '../utils/checklistData';
import { generateChecklistPDF } from '../utils/pdfGenerator';
import { styles } from 'src/styles/styles';

// Array de opciones para el selector
const CLINIC_OPTIONS = [
  { id: 'BAALAK_CENTRAL', name: 'Clínica Veterinaria Baalak (Central)' },
  { id: 'ANIMALIA', name: 'Clínica Veterinaria Animalia' },
  { id: 'BAALAK_PRADO', name: 'Clínica Veterinaria Baalak (Prado)' }
];

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
  const scrollY = useRef(new Animated.Value(0)).current;

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
    <SafeAreaView style={styles.container}>
      {/* SECCIÓN FIJA SUPERIOR */}
      <View style={styles.fixedSection}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📋 CHECKLIST DE SUPERVISIÓN</Text>
          <TouchableOpacity 
            style={styles.clinicSelectorButton}
            onPress={() => setShowClinicSelector(true)}
          >
            <View style={styles.clinicButtonContent}>
              <MaterialCommunityIcons name="hospital-building" size={20} color="#ff006f" />
              <Text style={styles.clinicName} numberOfLines={1}>{sucursalName}</Text>
            </View>
            <Icon name="arrow-drop-down" size={24} color="#ff006f" />
          </TouchableOpacity>
        </View>

        {/* Información general */}
        <View style={styles.infoCard}>
          
          <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>FECHA:</Text>
              <Text style={styles.infoValue}>{formData.fecha}</Text>
              <Text></Text><Text></Text><Text></Text>
              <Text style={styles.infoLabel}>HORA INICIO:</Text>
              <Text style={styles.infoValue}>{formData.horaInicio} hrs.</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>RESPONSABLE:</Text>
            <TextInput
              style={styles.responsableInput}
              placeholder="Nombre del responsable"
              value={formData.responsable}
              onChangeText={(text) => setFormData(prev => ({ ...prev, responsable: text }))}
            />
          </View>
        </View>

        {/* Barra de progreso general */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Calificación General</Text>
            <Text style={[
              styles.progressStatus,
              { color: getProgressColor(generalStats.porcentajeBueno) }
            ]}>
              {generalStats.porcentajeBueno >= 80 ? 'EXCELENTE' :
                generalStats.porcentajeBueno >= 60 ? 'ACEPTABLE' : 'REQUIERE MEJORA'}
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${generalStats.porcentajeBueno}%`,
                  backgroundColor: getProgressColor(generalStats.porcentajeBueno)
                }
              ]}
            />
          </View>
          
          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>0%</Text>
            <Text style={[
              styles.progressText,
              { color: getProgressColor(generalStats.porcentajeBueno), fontWeight: 'bold' }
            ]}>
              {Math.round(generalStats.porcentajeBueno)}% Bueno
            </Text>
            <Text style={styles.progressText}>100%</Text>
          </View>
        </View>

        {/* Selector de área y botón de cámara */}
        <View style={styles.areaSection}>
          <View style={styles.areaHeader}>
            <View>
              <Text style={styles.evaluationSubtitle}>
                {areas.length} áreas disponibles
              </Text>
              <Text style={styles.areasCountInfo}>
                {currentArea} ({currentAreaStats.totalEvaluado}/{currentAreaStats.total} evaluados)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={takePhoto}
              disabled={hasCameraPermission === false}
            >
              <MaterialCommunityIcons name="camera" size={24} color="white" />
              <Text style={styles.cameraButtonText}>Tomar Foto</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.areaScroll}
          >
            {areas.map((area, index) => {
              const areaPercentage = calculateBuenoPercentage(area);
              return (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.areaButton,
                    currentArea === area && styles.areaButtonActive
                  ]}
                  onPress={() => {
                    setCurrentArea(area);
                    // Opcional: hacer scroll automático al área
                    scrollToArea(index);
                  }}
                >
                  <Text style={styles.areaIcon}>{AREA_ICONS[area] || '📋'}</Text>
                  <Text style={[
                    styles.areaButtonText,
                    currentArea === area && styles.areaButtonTextActive
                  ]}>
                    {area.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                  </Text>
                  <View style={[
                    styles.areaBadge,
                    { backgroundColor: getProgressColor(areaPercentage) }
                  ]}>
                    <Text style={styles.areaBadgeText}>
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
          <View style={styles.photosSection}>
            <View style={styles.photosHeader}>
              <Text style={styles.sectionTitle}>Fotos de {currentArea}</Text>
              <Text style={styles.photosCount}>{areaPhotos.length} foto(s)</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {areaPhotos.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image source={{ uri: photo.photoUri }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removePhoto(photo.id)}
                  >
                    <Icon name="delete" size={20} color="white" />
                  </TouchableOpacity>
                  <View style={styles.photoInfo}>
                    {photo.description && (
                      <Text style={styles.photoDescription} numberOfLines={2}>
                        {photo.description}
                      </Text>
                    )}
                    <Text style={styles.photoTimestamp}>
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
        style={styles.areasScrollView}
        showsVerticalScrollIndicator={true}
      >
        {/* Evaluación del área actual */}
        <View style={styles.evaluationSection}>
          
          {(itemsByArea[currentArea] || []).map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemText}>{item.aspecto}</Text>
              
              <View style={styles.ratingContainer}>
                {['malo', 'regular', 'bueno'].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
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
                      styles.radioCircle,
                      item.cumplimiento === rating && {
                        borderColor: getRatingColor(rating),
                      }
                    ]}>
                      {item.cumplimiento === rating && (
                        <View style={[
                          styles.radioInner,
                          { backgroundColor: getRatingColor(rating) }
                        ]} />
                      )}
                    </View>
                    <Text style={[
                      styles.ratingText,
                      { color: getRatingColor(rating) }
                    ]}>
                      {rating.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.observationsInput}
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
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comentarios Adicionales</Text>
          <TextInput
            style={styles.commentsInput}
            placeholder="Ingrese comentarios adicionales aquí..."
            value={formData.comentariosAdicionales}
            onChangeText={(text) => setFormData(prev => ({ ...prev, comentariosAdicionales: text }))}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon name="save" size={24} color="white" />
                <Text style={styles.actionButtonText}>Guardar Checklist</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.newButton]}
            onPress={handleNewChecklist}
          >
            <Icon name="add-circle-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Nuevo</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {sucursalName} | {areas.length} áreas | {formData.items.length} items | 
            Fotos: {formData.photos?.length || 0}
          </Text>
        </View>

        {/* Espacio extra al final para mejor scroll */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal para seleccionar clínica */}
      <Modal
        visible={showClinicSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClinicSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.clinicModalContent}>
            <Text style={styles.modalTitle}>Seleccionar Sucursal</Text>
            <Text style={styles.modalSubtitle}>
              Cada sucursal tiene sus propias áreas específicas
            </Text>
            
            {CLINIC_OPTIONS.map((clinic) => {
              const clinicKey = clinic.id as SucursalType;
              const areasCount = getUniqueAreasForSucursal(clinicKey).length;
              
              return (
                <TouchableOpacity
                  key={clinic.id}
                  style={[
                    styles.clinicOption,
                    sucursalKey === clinic.id && styles.clinicOptionSelected
                  ]}
                  onPress={() => handleSucursalChange(clinicKey)}
                >
                  <View style={styles.clinicOptionContent}>
                    <View style={styles.clinicIconContainer}>
                      <MaterialCommunityIcons 
                        name="hospital-building" 
                        size={28} // Aumentado el tamaño
                        color={sucursalKey === clinic.id ? '#ff008cea' : '#6B7280'} 
                      />
                    </View>
                    <View style={styles.clinicTextContainer}>
                      <Text style={[
                        styles.clinicOptionText,
                        sucursalKey === clinic.id && styles.clinicOptionTextSelected
                      ]}>
                        {clinic.name}
                      </Text>
                      <Text style={styles.clinicAreasCount}>
                        {areasCount} {areasCount === 1 ? 'área' : 'áreas'} específicas
                      </Text>
                    </View>
                  </View>
                  {sucursalKey === clinic.id && (
                    <View style={styles.checkIconContainer}>
                      <Icon name="check-circle" size={24} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowClinicSelector(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
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
        <View style={styles.validationModalOverlay}>
          <View style={styles.validationModalContent}>
            <View style={styles.validationHeader}>
              <MaterialCommunityIcons name="alert-circle" size={40} color="#F59E0B" />
              <Text style={styles.validationTitle}>Áreas Pendientes</Text>
              <Text style={styles.validationSubtitle}>
                Hay {incompleteAreas.length} {incompleteAreas.length === 1 ? 'área' : 'áreas'} sin evaluar completamente
              </Text>
            </View>
            
            <ScrollView style={styles.incompleteAreasList}>
              {incompleteAreas.map((area, index) => (
                <TouchableOpacity
                  key={area}
                  style={styles.incompleteAreaItem}
                  onPress={() => navigateToIncompleteArea(area)}
                >
                  <View style={styles.areaItemContent}>
                    <View style={styles.areaItemNumber}>
                      <Text style={styles.areaNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.areaItemInfo}>
                      <Text style={styles.areaItemName}>{area}</Text>
                      <Text style={styles.areaItemAction}>
                        Tocar para evaluar esta área
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.validationButtons}>
              <TouchableOpacity
                style={[styles.validationButton, styles.cancelValidationButton]}
                onPress={() => setShowValidationModal(false)}
              >
                <Text style={styles.cancelValidationButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.validationButton, styles.forceSaveButton]}
                onPress={handleForceSave}
              >
                <MaterialCommunityIcons name="file-document-outline" size={20} color="white" />
                <Text style={styles.forceSaveButtonText}>Guardar como Incompleto</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.validationNote}>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vista previa de foto</Text>
            
            {tempPhoto && (
              <Image source={{ uri: tempPhoto }} style={styles.previewImage} />
            )}
            
            <TextInput
              style={styles.descriptionInput}
              placeholder="Descripción de la foto (opcional)"
              value={photoDescription}
              onChangeText={setPhotoDescription}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setTempPhoto(null);
                  setCameraVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.savePhotoButton]}
                onPress={savePhoto}
              >
                <Text style={styles.savePhotoButtonText}>Guardar Foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}