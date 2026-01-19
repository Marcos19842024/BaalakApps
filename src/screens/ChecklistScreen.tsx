import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import Toast from 'react-native-toast-message';
import Icon from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ChecklistData, ChecklistItem, ChecklistPhoto, CLINIC_OPTIONS, SUCURSALES, SucursalType } from '../types/checklist';
import { generateChecklistPDF } from '../utils/pdfGenerator';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import {
  getCurrentTime,
  initializeChecklistData,
  calculateAreaStats,
  getUniqueAreasForSucursal,
  areAllAreasComplete,
  getIncompleteAreas,
  getAreaIcon,
} from '../utils/checklistData';
import { stylescheckList } from 'src/styles/checkList';
import { RouteParams } from 'src/types/navigation';

export default function ChecklistScreen() {
  const route = useRoute();
  const params = route.params as RouteParams;
  const [sucursalKey, setSucursalKey] = useState<SucursalType>(params?.sucursalKey || 'BAALAK_CENTRAL');
  const [sucursalName, setSucursalName] = useState<string>(SUCURSALES.BAALAK_CENTRAL);
  const [formData, setFormData] = useState<ChecklistData>(initializeChecklistData(params?.sucursalKey || 'BAALAK_CENTRAL'));
  const [currentArea, setCurrentArea] = useState('ESTACIONAMIENTO');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [incompleteAreas, setIncompleteAreas] = useState<string[]>([]);
  const areasScrollViewRef = useRef<ScrollView>(null);

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

  // Función para recargar el checklist
  const reloadChecklist = useCallback(() => {
    // Si recibimos una sucursal por parámetro, seleccionarla
    if (params?.sucursalKey) {
      setSucursalKey(params.sucursalKey);
    }

    console.log('Recargando checklist para sucursal:', sucursalKey);
    
    // Recargar plantilla desde AsyncStorage (si hay personalizaciones)
    const loadTemplate = async () => {
      try {
        const newChecklist = initializeChecklistData(sucursalKey);
        setFormData(newChecklist);
        
        // También recargar áreas únicas
        const areas = getUniqueAreasForSucursal(sucursalKey);
        if (areas.length > 0) {
          setCurrentArea(areas[0]);
        }
        
        Toast.show({
          type: 'info',
          text1: 'Checklist actualizado',
          text2: 'Se recargaron las configuraciones',
        });
      } catch (error) {
        console.error('Error recargando checklist:', error);
      }
    };
    
    loadTemplate();
  }, [sucursalKey]);

  // Efecto para recargar cuando la pantalla recibe foco
  useFocusEffect(

    useCallback(() => {

      console.log('ChecklistScreen recibió foco, recargando...');
      reloadChecklist();
      
      // Limpiar si es necesario cuando pierde el foco
      return () => {
        console.log('ChecklistScreen perdió foco');
      };
    }, [reloadChecklist])
  );
  
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
        <SafeAreaView style={stylescheckList.container}>
          <View style={stylescheckList.noAreasContainer}>
            <MaterialCommunityIcons name="folder-alert" size={64} color="#9CA3AF" />
            <Text style={stylescheckList.noAreasTitle}>No hay áreas configuradas</Text>
            <Text style={stylescheckList.noAreasText}>
              Esta sucursal no tiene áreas configuradas. Contacta al administrador.
            </Text>
            <TouchableOpacity 
              style={stylescheckList.refreshButton}
              onPress={() => handleSucursalChange(sucursalKey)}
            >
              <Text style={stylescheckList.refreshButtonText}>Recargar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    setCurrentArea(areas[0] || 'ESTACIONAMIENTO');
    
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

  // Función para validar antes de guardar
  const validateBeforeSave = (): boolean => {
    if (!formData.responsable.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Complete el campo responsable',
      });
      Alert.alert('Error', 'Por favor, ingrese el nombre del responsable antes de guardar.');
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
      // Actualizar datos
      const updatedData = {
        ...formData,
        horaFin: getCurrentTime(),
        sucursal: sucursalName,
        sucursalKey: sucursalKey,
        completed: areAllAreasComplete(formData.items, sucursalKey) // Agregar estado de completado
      };
      
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
    <SafeAreaView style={stylescheckList.container}>
      {/* SECCIÓN FIJA SUPERIOR */}
      <View style={stylescheckList.fixedSection}>
        {/* Header */}
        <View style={stylescheckList.header}>
          {/* Botones de acción */}
          <TouchableOpacity
            style={stylescheckList.headerButton}
            onPress={handleSave}
          >
            <Icon name="save" size={24} color="white" />
            <Text style={stylescheckList.cameraButtonText}>Guardar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={stylescheckList.headerButton}
            onPress={handleNewChecklist}
          >
            <Icon name="add-circle-outline" size={24} color="white" />
            <Text style={stylescheckList.cameraButtonText}>Nuevo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={stylescheckList.cameraButton}
            onPress={takePhoto}
            disabled={hasCameraPermission === false}
          >
            <MaterialCommunityIcons name="camera" size={24} color="white" />
            <Text style={stylescheckList.cameraButtonText}>Tomar Foto</Text>
          </TouchableOpacity>
        </View>

        {/* Información general */}
        <View style={stylescheckList.infoCard}>
          
          <View style={stylescheckList.infoGrid}>
              <Text style={stylescheckList.infoLabel}>FECHA:</Text>
              <Text style={stylescheckList.infoValue}>{formData.fecha}</Text>
              <Text></Text><Text></Text><Text></Text>
              <Text style={stylescheckList.infoLabel}>HORA INICIO:</Text>
              <Text style={stylescheckList.infoValue}>{formData.horaInicio} hrs.</Text>
          </View>
          
          <View style={stylescheckList.infoItem}>
            <Text style={stylescheckList.infoLabel}>RESPONSABLE:</Text>
            <TextInput
              style={stylescheckList.responsableInput}
              placeholder="Nombre del responsable"
              value={formData.responsable}
              onChangeText={(text) => setFormData(prev => ({ ...prev, responsable: text }))}
            />
          </View>
        </View>

        {/* Barra de progreso general */}
        <View style={stylescheckList.progressCard}>
          <View style={stylescheckList.progressHeader}>
            <Text style={stylescheckList.progressLabel}>Calificación General</Text>
            <Text style={[
              stylescheckList.progressStatus,
              { color: getProgressColor(generalStats.porcentajeBueno) }
            ]}>
              {generalStats.porcentajeBueno >= 80 ? 'EXCELENTE' :
                generalStats.porcentajeBueno >= 60 ? 'ACEPTABLE' : 'REQUIERE MEJORA'}
            </Text>
          </View>
          
          <View style={stylescheckList.progressBar}>
            <View 
              style={[
                stylescheckList.progressFill,
                { 
                  width: `${generalStats.porcentajeBueno}%`,
                  backgroundColor: getProgressColor(generalStats.porcentajeBueno)
                }
              ]}
            />
          </View>
          
          <View style={stylescheckList.progressFooter}>
            <Text style={stylescheckList.progressText}>0%</Text>
            <Text style={[
              stylescheckList.progressText,
              { color: getProgressColor(generalStats.porcentajeBueno), fontWeight: 'bold' }
            ]}>
              {Math.round(generalStats.porcentajeBueno)}% Bueno
            </Text>
            <Text style={stylescheckList.progressText}>100%</Text>
          </View>
        </View>

        {/* Selector de área */}
        <View style={stylescheckList.areaSection}>
          <View style={stylescheckList.areaHeader}>
            <Text style={stylescheckList.evaluationSubtitle}>
              {areas.length} áreas | {formData.items.length} items
            </Text>
            <Text style={stylescheckList.areasCountInfo}>
              {currentArea} ({currentAreaStats.totalEvaluado}/{currentAreaStats.total} evaluados)
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={stylescheckList.areaScroll}
          >
            {areas.map((area, index) => {
              const areaPercentage = calculateBuenoPercentage(area);
              return (
                <TouchableOpacity
                  key={area}
                  style={[
                    stylescheckList.areaButton,
                    currentArea === area && stylescheckList.areaButtonActive
                  ]}
                  onPress={() => {
                    setCurrentArea(area);
                    // Opcional: hacer scroll automático al área
                    scrollToArea(index);
                  }}
                >
                  <Text style={stylescheckList.areaIcon}>{getAreaIcon(area)}</Text>
                  <Text style={[
                    stylescheckList.areaButtonText,
                    currentArea === area && stylescheckList.areaButtonTextActive
                  ]}>
                    {area.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                  </Text>
                  <View style={[
                    stylescheckList.areaBadge,
                    { backgroundColor: getProgressColor(areaPercentage) }
                  ]}>
                    <Text style={stylescheckList.areaBadgeText}>
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
          <View style={stylescheckList.photosSection}>
            <View style={stylescheckList.photosHeader}>
              <Text style={stylescheckList.sectionTitle}>Fotos de {currentArea}</Text>
              <Text style={stylescheckList.photosCount}>{areaPhotos.length} foto(s)</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {areaPhotos.map((photo) => (
                <View key={photo.id} style={stylescheckList.photoCard}>
                  <Image source={{ uri: photo.photoUri }} style={stylescheckList.photo} />
                  <TouchableOpacity
                    style={stylescheckList.deleteButton}
                    onPress={() => removePhoto(photo.id)}
                  >
                    <Icon name="delete" size={20} color="white" />
                  </TouchableOpacity>
                  <View style={stylescheckList.photoInfo}>
                    {photo.description && (
                      <Text style={stylescheckList.photoDescription} numberOfLines={2}>
                        {photo.description}
                      </Text>
                    )}
                    <Text style={stylescheckList.photoTimestamp}>
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
        style={stylescheckList.areasScrollView}
        showsVerticalScrollIndicator={true}
      >
        {/* Evaluación del área actual */}
        <View style={stylescheckList.evaluationSection}>
          
          {(itemsByArea[currentArea] || []).map((item) => (
            <View key={item.id} style={stylescheckList.itemCard}>
              <Text style={stylescheckList.itemText}>{item.aspecto}</Text>
              
              <View style={stylescheckList.ratingContainer}>
                {['malo', 'regular', 'bueno'].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      stylescheckList.ratingButton,
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
                      stylescheckList.radioCircle,
                      item.cumplimiento === rating && {
                        borderColor: getRatingColor(rating),
                      }
                    ]}>
                      {item.cumplimiento === rating && (
                        <View style={[
                          stylescheckList.radioInner,
                          { backgroundColor: getRatingColor(rating) }
                        ]} />
                      )}
                    </View>
                    <Text style={[
                      stylescheckList.ratingText,
                      { color: getRatingColor(rating) }
                    ]}>
                      {rating.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={stylescheckList.observationsInput}
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
        <View style={stylescheckList.commentsSection}>
          <Text style={stylescheckList.sectionTitle}>Comentarios Adicionales</Text>
          <TextInput
            style={stylescheckList.commentsInput}
            placeholder="Ingrese comentarios adicionales aquí..."
            value={formData.comentariosAdicionales}
            onChangeText={(text) => setFormData(prev => ({ ...prev, comentariosAdicionales: text }))}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      {/* Modal de validación de áreas incompletas */}
      <Modal
        visible={showValidationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowValidationModal(false)}
      >
        <View style={stylescheckList.validationModalOverlay}>
          <View style={stylescheckList.validationModalContent}>
            <View style={stylescheckList.validationHeader}>
              <MaterialCommunityIcons name="alert-circle" size={40} color="#F59E0B" />
              <Text style={stylescheckList.validationTitle}>Áreas Pendientes</Text>
              <Text style={stylescheckList.validationSubtitle}>
                Hay {incompleteAreas.length} {incompleteAreas.length === 1 ? 'área' : 'áreas'} sin evaluar completamente
              </Text>
            </View>
            
            <ScrollView style={stylescheckList.incompleteAreasList}>
              {incompleteAreas.map((area, index) => (
                <TouchableOpacity
                  key={area}
                  style={stylescheckList.incompleteAreaItem}
                  onPress={() => navigateToIncompleteArea(area)}
                >
                  <View style={stylescheckList.areaItemContent}>
                    <View style={stylescheckList.areaItemNumber}>
                      <Text style={stylescheckList.areaNumberText}>{index + 1}</Text>
                    </View>
                    <View style={stylescheckList.areaItemInfo}>
                      <Text style={stylescheckList.areaItemName}>{area}</Text>
                      <Text style={stylescheckList.areaItemAction}>
                        Tocar para evaluar esta área
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={stylescheckList.validationButtons}>
              <TouchableOpacity
                style={[stylescheckList.validationButton, stylescheckList.cancelValidationButton]}
                onPress={() => setShowValidationModal(false)}
              >
                <Text style={stylescheckList.cancelValidationButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[stylescheckList.validationButton, stylescheckList.forceSaveButton]}
                onPress={handleForceSave}
              >
                <MaterialCommunityIcons name="file-document-outline" size={20} color="white" />
                <Text style={stylescheckList.forceSaveButtonText}>Guardar como Incompleto</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={stylescheckList.validationNote}>
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
        <View style={stylescheckList.modalContainer}>
          <View style={stylescheckList.modalContent}>
            <Text style={stylescheckList.modalTitle}>Vista previa de foto</Text>
            
            {tempPhoto && (
              <Image source={{ uri: tempPhoto }} style={stylescheckList.previewImage} />
            )}
            
            <TextInput
              style={stylescheckList.descriptionInput}
              placeholder="Descripción de la foto (opcional)"
              value={photoDescription}
              onChangeText={setPhotoDescription}
              multiline
            />
            
            <View style={stylescheckList.modalButtons}>
              <TouchableOpacity
                style={[stylescheckList.modalButton, stylescheckList.cancelButton]}
                onPress={() => {
                  setTempPhoto(null);
                  setCameraVisible(false);
                }}
              >
                <Text style={stylescheckList.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[stylescheckList.modalButton, stylescheckList.savePhotoButton]}
                onPress={savePhoto}
              >
                <Text style={stylescheckList.savePhotoButtonText}>Guardar Foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}