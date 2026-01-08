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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import Icon from '@expo/vector-icons/MaterialIcons';
import { ChecklistData, ChecklistItem, ChecklistPhoto } from '../types/checklist';
import { AREA_ORDER, CHECKLIST_TEMPLATE, getCurrentTime, getCurrentDate, initializeFormData } from '../utils/checklistData';
import { generateChecklistPDF } from 'src/utils/pdfGenerator';

const AREA_ICONS: Record<string, string> = {
  'ESTACIONAMIENTO': '🚗',
  'FACHADA': '🏢',
  'PISOS': '🏗️',
  'SANITARIOS': '🚿',
  'ZONAS_COMUNES': '🏛️',
};

export default function ChecklistScreen() {
  const [formData, setFormData] = useState<ChecklistData>(initializeFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [currentArea, setCurrentArea] = useState('ESTACIONAMIENTO');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);

  // Solicitar permisos de cámara
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
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

  // Función para tomar foto
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
        base64: true,
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
  const savePhoto = () => {
    if (tempPhoto) {
      const newPhoto: ChecklistPhoto = {
        id: `photo-${Date.now()}`,
        area: currentArea,
        photoUri: tempPhoto,
        timestamp: getCurrentTime(),
        description: photoDescription,
      };

      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), newPhoto]
      }));

      Toast.show({
        type: 'success',
        text1: 'Foto guardada',
        text2: 'La foto se ha agregado al checklist',
      });

      setTempPhoto(null);
      setPhotoDescription('');
      setCameraVisible(false);
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

  // Calcular porcentaje
  const calculateBuenoPercentage = (area?: string): number => {
    const itemsToCheck = area 
      ? formData.items.filter(item => item.area === area)
      : formData.items;
    
    if (itemsToCheck.length === 0) return 0;
    
    const buenoItems = itemsToCheck.filter(item => item.cumplimiento === 'bueno').length;
    const totalEvaluated = itemsToCheck.filter(item => item.cumplimiento !== '').length;
    
    return totalEvaluated > 0 ? (buenoItems / totalEvaluated) * 100 : 0;
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

      // Actualizar hora de fin
      const updatedData = {
        ...formData,
        horaFin: getCurrentTime(),
      };

      // 1. Guardar JSON localmente
      const jsonUri = await saveJsonLocally(updatedData);
      
      // 2. Generar PDF
      const pdfUri = await generateChecklistPDF(updatedData);
      
      Toast.show({
        type: 'success',
        text1: '✅ Checklist guardado',
        text2: 'PDF y JSON generados correctamente',
      });
      
      // 3. Opcional: Mostrar resumen
      Alert.alert(
        'Checklist Guardado',
        `Se han guardado:\n• PDF: ${pdfUri.split('/').pop()}\n• JSON: ${jsonUri.split('/').pop()}`,
        [{ text: 'OK' }]
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

  // Generar PDF
  const generatePDF = async (data: ChecklistData) => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #0195a8; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Checklist de Supervisión</h1>
            <p><strong>Fecha:</strong> ${data.fecha}</p>
            <p><strong>Responsable:</strong> ${data.responsable}</p>
            <!-- Agrega más contenido según necesites -->
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Checklist PDF',
        });
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  };

  // Guardar JSON localmente
  const saveJsonLocally = async (data: ChecklistData): Promise<string> => {
    try {
      // Usar FileSystem.documentDirectory si está disponible
      // Sino, usar cacheDirectory
      let directory: string | null = null;
      
      const fileName = `checklist_${data.fecha.replace(/\//g, '-')}_${Date.now()}.json`;
      const fileUri = `${directory}${fileName}`;
      
      console.log('Guardando en:', fileUri);
      
      // Escribir archivo
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(data, null, 2)
      );
      
      // Verificar que se guardó
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('No se pudo verificar la creación del archivo');
      }
      
      console.log('Archivo guardado exitosamente:', fileInfo.uri);
      console.log('Tamaño:', fileInfo.size, 'bytes');
      
      Toast.show({
        type: 'success',
        text1: 'Archivo guardado',
        text2: `Checklist guardado como ${fileName}`,
      });
      
      return fileUri;
    } catch (error) {
      console.error('Error detallado guardando JSON:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Error de guardado',
        text2: 'No se pudo guardar el archivo localmente',
      });
      
      throw error;
    }
  };

  const getRatingStyle = (rating: string) => {
    switch (rating) {
      case 'malo':
        return styles.ratingButtonMalo;
      case 'regular':
        return styles.ratingButtonRegular;
      case 'bueno':
        return styles.ratingButtonBueno;
      default:
        return {};
    }
  };

  // Fotos del área actual
  const areaPhotos = formData.photos?.filter(photo => photo.area === currentArea) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📋 Checklist App</Text>
          <Text style={styles.subtitle}>Supervisión de instalaciones</Text>
        </View>

        {/* Información general */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>{formData.fecha}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Responsable:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese su nombre"
              value={formData.responsable}
              onChangeText={(text) => setFormData(prev => ({ ...prev, responsable: text }))}
            />
          </View>
        </View>

        {/* Selector de área */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Área a evaluar:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areaScroll}>
            {areas.map((area) => (
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
                  {area}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Botón para tomar foto */}
        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
          <Icon name="camera-alt" size={24} color="white" />
          <Text style={styles.cameraButtonText}>Tomar Foto del Área</Text>
        </TouchableOpacity>

        {/* Galería de fotos */}
        {areaPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fotos de {currentArea}</Text>
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
                  {photo.description && (
                    <Text style={styles.photoDescription} numberOfLines={2}>
                      {photo.description}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Items del área */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentArea}</Text>
          {(itemsByArea[currentArea] || []).map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemText}>{item.aspecto}</Text>
              
              {/* Botones de calificación */}
              <View style={styles.ratingContainer}>
                {['malo', 'regular', 'bueno'].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      item.cumplimiento === rating && getRatingStyle(rating),
                    ]}
                    onPress={() => {
                      const newItems = formData.items.map(i =>
                        i.id === item.id ? { ...i, cumplimiento: rating as any } : i
                      );
                      setFormData(prev => ({ ...prev, items: newItems }));
                    }}
                  >
                    <Text style={[
                      styles.ratingText,
                      item.cumplimiento === rating && styles.ratingTextSelected
                    ]}>
                      {rating.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Observaciones */}
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
        <View style={styles.section}>
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

        {/* Botón guardar */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Icon name="save" size={24} color="white" />
              <Text style={styles.saveButtonText}>Guardar Checklist</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para vista previa de foto */}
      <Modal
        visible={cameraVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {tempPhoto && (
              <Image source={{ uri: tempPhoto }} style={styles.previewImage} />
            )}
            
            <TextInput
              style={styles.descriptionInput}
              placeholder="Descripción de la foto (opcional)"
              value={photoDescription}
              onChangeText={setPhotoDescription}
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
    backgroundColor: '#f8f9fa',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#374151',
    width: 100,
    fontSize: 16,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 8,
    fontSize: 16,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  areaScroll: {
    maxHeight: 50,
  },
  areaButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  areaButtonActive: {
    backgroundColor: '#3b82f6',
  },
  areaButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  areaButtonTextActive: {
    color: 'white',
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  photoCard: {
    position: 'relative',
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 6,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    maxWidth: 120,
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  ratingButtonMalo: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  ratingButtonRegular: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  ratingButtonBueno: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingTextSelected: {
    color: '#1f2937',
  },
  observationsInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    minHeight: 40,
    backgroundColor: 'white',
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
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
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  savePhotoButton: {
    backgroundColor: '#10b981',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: 'bold',
  },
  savePhotoButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  areaIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
});