import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
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
  AREA_ORDER,
  getCurrentTime,
  initializeChecklistData,
  AREA_ICONS,
  calculateAreaStats,
} from '../utils/checklistData';
import { generateChecklistPDF } from '../utils/pdfGenerator';

// Opciones de clínica/sucursal
const CLINIC_OPTIONS = [
  { id: 'animalia', name: 'Clínica Veterinaria Animalia' },
  { id: 'baalak-central', name: 'Clínica Veterinaria Baalak (Central)' },
  { id: 'baalak-prado', name: 'Clínica Veterinaria Baalak (Prado)' }
];

export default function ChecklistScreen() {
  const [formData, setFormData] = useState<ChecklistData>(initializeChecklistData());
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentArea, setCurrentArea] = useState('ESTACIONAMIENTO');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [sucursal, setSucursal] = useState('Clínica Veterinaria Baalak (Central)');
  const [showClinicSelector, setShowClinicSelector] = useState(false);

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

  // Agrupar items por área
  const itemsByArea = formData.items.reduce((acc, item) => {
    if (!acc[item.area]) acc[item.area] = [];
    acc[item.area].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // Áreas ordenadas
  const areas = Object.keys(itemsByArea).sort((a, b) => {
    const orderA = AREA_ORDER[a] || 999;
    const orderB = AREA_ORDER[b] || 999;
    return orderA - orderB;
  });

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

  // Guardar JSON localmente - VERSIÓN CORREGIDA
  const saveJsonLocally = async (data: ChecklistData): Promise<string> => {
    try {
      const key = `checklist_${data.responsable.replace(/\s+/g, '_')}_${Date.now()}`;
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(data));

      Toast.show({
        type: 'success',
        text1: 'JSON guardado',
        text2: `Checklist guardado localmente`,
      });

      return key; // Devuelve la clave como identificador
    } catch (error) {
      console.error('Error guardando JSON:', error);
      throw error;
    }
  };

  // Guardar checklist
  const handleSave = async () => {
    if (!formData.responsable.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Complete el campo responsable',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Actualizar datos
      const updatedData = {
        ...formData,
        horaFin: getCurrentTime(),
        sucursal: sucursal, // Agregar sucursal a los datos
      };

      // Guardar JSON
      const jsonUri = await saveJsonLocally(updatedData);
      
      // Generar PDF
      const pdfUri = await generateChecklistPDF(updatedData, sucursal);
      
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
                       `*Sucursal:* ${sucursal}\n` +
                       `*Responsable:* ${data.responsable}\n` +
                       `*Fecha:* ${data.fecha}\n` +
                       `*Hora:* ${data.horaInicio} - ${data.horaFin}\n` +
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

  // Guardar PDF en descargas - VERSIÓN MÁS SIMPLE
  const savePDFToDownloads = async (pdfUri: string, data: ChecklistData) => {
    try {
      // SOLUCIÓN SIMPLE: Solo compartir el archivo directamente
      // Esto evita problemas con directorios temporales
      
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

  // Generar solo PDF
  const handleGeneratePDF = async () => {
    if (!formData.responsable.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Complete el campo responsable',
      });
      return;
    }

    try {
      setIsGeneratingPDF(true);
      
      const updatedData = {
        ...formData,
        horaFin: getCurrentTime(),
        sucursal: sucursal,
      };

      const pdfUri = await generateChecklistPDF(updatedData, sucursal);
      
      Alert.alert(
        'PDF Generado',
        '¿Qué deseas hacer con el PDF?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Compartir por WhatsApp', 
            onPress: () => shareViaWhatsApp(pdfUri, updatedData)
          },
          { 
            text: 'Descargar PDF',
            onPress: () => savePDFToDownloads(pdfUri, updatedData)
          },
          { 
            text: 'Ver PDF',
            onPress: () => {
              Alert.alert('PDF Listo', `Archivo generado exitosamente para ${sucursal}`);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error generando PDF:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo generar el PDF',
      });
    } finally {
      setIsGeneratingPDF(false);
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
            setFormData(initializeChecklistData());
            setCurrentArea('ESTACIONAMIENTO');
            Toast.show({
              type: 'success',
              text1: 'Nuevo checklist',
              text2: 'Listo para comenzar',
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
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📋 CHECKLIST DE SUPERVISIÓN</Text>
          <TouchableOpacity 
            style={styles.clinicSelectorButton}
            onPress={() => setShowClinicSelector(true)}
          >
            <Text style={styles.clinicName} numberOfLines={1}>{sucursal}</Text>
            <Icon name="arrow-drop-down" size={24} color="white" />
          </TouchableOpacity>
        </View>

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
              
              {CLINIC_OPTIONS.map((clinic) => (
                <TouchableOpacity
                  key={clinic.id}
                  style={[
                    styles.clinicOption,
                    sucursal === clinic.name && styles.clinicOptionSelected
                  ]}
                  onPress={() => {
                    setSucursal(clinic.name);
                    setShowClinicSelector(false);
                    Toast.show({
                      type: 'success',
                      text1: 'Sucursal seleccionada',
                      text2: clinic.name,
                    });
                  }}
                >
                  <View style={styles.clinicOptionContent}>
                    <MaterialCommunityIcons 
                      name="hospital-building" 
                      size={24} 
                      color={sucursal === clinic.name ? '#3B82F6' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.clinicOptionText,
                      sucursal === clinic.name && styles.clinicOptionTextSelected
                    ]}>
                      {clinic.name}
                    </Text>
                  </View>
                  {sucursal === clinic.name && (
                    <Icon name="check-circle" size={24} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowClinicSelector(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Información general */}
        <View style={styles.infoCard}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>FECHA:</Text>
              <View style={styles.infoValueBox}>
                <Text style={styles.infoValue}>{formData.fecha}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>HORA INICIO:</Text>
              <View style={styles.infoValueBox}>
                <Text style={styles.infoValue}>{formData.horaInicio} hrs.</Text>
              </View>
            </View>
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
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>SUCURSAL:</Text>
            <TouchableOpacity
              style={styles.sucursalDisplay}
              onPress={() => setShowClinicSelector(true)}
            >
              <MaterialCommunityIcons name="hospital-building" size={20} color="#3B82F6" />
              <Text style={styles.sucursalText} numberOfLines={1}>
                {sucursal}
              </Text>
              <Icon name="edit" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de progreso general */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Calificación General</Text>
            <Text style={[
              styles.progressPercentage,
              { color: getProgressColor(generalStats.porcentajeBueno) }
            ]}>
              {Math.round(generalStats.porcentajeBueno)}% Bueno
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
          
          <Text style={[
            styles.progressStatus,
            { color: getProgressColor(generalStats.porcentajeBueno) }
          ]}>
            {generalStats.porcentajeBueno >= 80 ? 'EXCELENTE' :
             generalStats.porcentajeBueno >= 60 ? 'ACEPTABLE' : 'REQUIERE MEJORA'}
          </Text>
        </View>

        {/* Selector de área y botón de cámara */}
        <View style={styles.areaSection}>
          <View style={styles.areaHeader}>
            <Text style={styles.sectionTitle}>Área a evaluar:</Text>
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
            {areas.map((area) => {
              const areaPercentage = calculateBuenoPercentage(area);
              return (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.areaButton,
                    currentArea === area && styles.areaButtonActive
                  ]}
                  onPress={() => setCurrentArea(area)}
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

        {/* Galería de fotos del área */}
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

        {/* Evaluación del área actual */}
        <View style={styles.evaluationSection}>
          <View style={styles.evaluationHeader}>
            <Text style={styles.sectionTitle}>
              {currentArea} - Calificación: {Math.round(currentAreaStats.porcentajeBueno)}% Bueno
            </Text>
            <Text style={styles.evaluationSubtitle}>
              ({currentAreaStats.totalEvaluado}/{currentAreaStats.total} evaluados)
            </Text>
          </View>
          
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
            style={[styles.actionButton, styles.pdfButton]}
            onPress={handleGeneratePDF}
            disabled={isGeneratingPDF || !formData.responsable}
          >
            {isGeneratingPDF ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />
                <Text style={styles.actionButtonText}>Generar PDF</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isLoading || !formData.responsable}
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
            Sucursal: {sucursal} | Total áreas: {areas.length} | Total items: {formData.items.length} | 
            Fotos: {formData.photos?.length || 0}
          </Text>
        </View>
      </ScrollView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#0195a8',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  clinicSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  clinicName: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginRight: 5,
    maxWidth: 250,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  clinicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clinicOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  clinicOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clinicOptionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  clinicOptionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoItem: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  infoValueBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  responsableInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  sucursalDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sucursalText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 10,
    marginRight: 10,
  },
  progressCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  areaSection: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cameraButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  areaScroll: {
    maxHeight: 100,
  },
  areaButton: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 10,
    width: 120,
    position: 'relative',
  },
  areaButtonActive: {
    backgroundColor: '#3b82f6',
  },
  areaIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  areaButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  areaButtonTextActive: {
    color: 'white',
  },
  areaBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#10b981',
    borderRadius: 10,
    minWidth: 30,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  areaBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  photosSection: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  photosCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  photoCard: {
    position: 'relative',
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    width: 140,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 6,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInfo: {
    marginTop: 8,
  },
  photoDescription: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  photoTimestamp: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  evaluationSection: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  evaluationHeader: {
    marginBottom: 20,
  },
  evaluationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  observationsInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 50,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  commentsSection: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  pdfButton: {
    backgroundColor: '#EF4444',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  newButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    padding: 15,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 15,
  },
  descriptionInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  savePhotoButton: {
    backgroundColor: '#10B981',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: 'bold',
    fontSize: 16,
  },
  savePhotoButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});