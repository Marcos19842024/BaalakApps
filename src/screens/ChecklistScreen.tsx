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
import { decode } from 'js-base64';
import { ChecklistData, ChecklistItem, ChecklistPhoto } from '../types/checklist';
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
  ActivityIndicator,
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
import { RouteParams } from 'src/types/navigation';
import { styleschecklist } from 'src/styles/checklist';
import { SUCURSALES, SucursalType } from 'src/types/sucursal';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { loadDraft, clearDraft, saveDraft } from 'src/services/checklistStorage';
import supabase from 'src/utils/supabaseConfig';

export const ChecklistScreen = () => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const areasScrollViewRef = useRef<ScrollView | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Auto-save cada 30 segundos
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      saveProgressOnly();
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [formData]);

  // Cargar borrador al iniciar
  useEffect(() => {
    loadExistingDraft();
  }, [sucursalKey]);

  // Guardar cambios importantes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (formData.items.some(item => item.cumplimiento !== '')) {
        saveProgressOnly();
      }
    }, 5000);
    
    return () => clearTimeout(debounceTimer);
  }, [formData.items, formData.responsable, formData.comentariosAdicionales]);

  // Función para recargar el checklist
  const reloadChecklist = useCallback(() => {
    if (params?.sucursalKey) {
      setSucursalKey(params.sucursalKey);
    }

    console.log('Recargando checklist para sucursal:', sucursalKey);
    
    const loadTemplate = async () => {
      try {
        const newChecklist = initializeChecklistData(sucursalKey);
        setFormData(newChecklist);
        
        const areas = getUniqueAreasForSucursal(sucursalKey);
        if (areas.length > 0) {
          setCurrentArea(areas[0]);
          handleSucursalChange(sucursalKey);
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

  // Focus effect
  useFocusEffect(
    useCallback(() => {
      console.log('ChecklistScreen recibió foco, recargando...');
      reloadChecklist();
      
      return () => {
        console.log('ChecklistScreen perdió el foco');
      };
    }, [reloadChecklist])
  );

  // Cargar borrador existente
  const loadExistingDraft = async () => {
    try {
      const draft = await loadDraft(sucursalKey);
      if (draft) {
        Alert.alert(
          'Borrador encontrado',
          'Se encontró un progreso guardado. ¿Deseas continuar donde lo dejaste?',
          [
            { 
              text: 'Empezar nuevo', 
              style: 'cancel',
              onPress: () => clearDraft(sucursalKey)
            },
            { 
              text: 'Continuar', 
              onPress: () => {
                setFormData(draft);
                Toast.show({
                  type: 'success',
                  text1: '✅ Progreso cargado',
                  text2: 'Continuando con el borrador guardado',
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error cargando borrador:', error);
    }
  };

  // Guardar solo progreso (sin PDF)
  const saveProgressOnly = async () => {
    try {
      await saveDraft(sucursalKey, formData);
      setLastSaved(new Date());
      console.log('📝 Progreso guardado automáticamente');
    } catch (error) {
      console.error('Error en autoguardado:', error);
    }
  };

  // Función para hacer scroll automático a un área
  const scrollToArea = (areaIndex: number) => {
    if (areasScrollViewRef.current && areaIndex >= 0 && areaIndex < areas.length) {
      const scrollPosition = areaIndex * 280;
      areasScrollViewRef.current.scrollTo({ y: scrollPosition, animated: true });
    }
  };

  // Actualizar checklist cuando cambia la sucursal
  const handleSucursalChange = (newSucursalKey: SucursalType) => {
    const newSucursalName = SUCURSALES[newSucursalKey];
    
    setSucursalKey(newSucursalKey);
    setSucursalName(newSucursalName);
    
    const newChecklist = initializeChecklistData(newSucursalKey);
    setFormData(newChecklist);
    
    const areas = getUniqueAreasForSucursal(newSucursalKey);
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
      
      // Guardar progreso después de agregar foto
      saveProgressOnly();
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
    saveProgressOnly();
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

  // Validar antes de guardar
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

    const allComplete = areAllAreasComplete(formData.items, sucursalKey);
    
    if (!allComplete) {
      const incomplete = getIncompleteAreas(formData.items, sucursalKey);
      setIncompleteAreas(incomplete);
      setShowValidationModal(true);
      return false;
    }
    
    return true;
  };

  // Forzar guardado
  const handleForceSave = async () => {
    setShowValidationModal(false);
    await handleSaveInternal();
  };

  // ========== FUNCIONES PARA SUBIR FOTOS A SUPABASE ==========

  // Función para comprimir imagen antes de subir
  const compressImage = async (photoUri: string): Promise<string> => {
    try {
      console.log('Comprimiendo imagen:', photoUri);
      
      const compressedImage = await manipulateAsync(
        photoUri,
        [{ resize: { width: 1024 } }], // Reducir a 1024px de ancho
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      
      console.log('✅ Imagen comprimida:', compressedImage.uri);
      return compressedImage.uri;
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      return photoUri; // Devolver original si falla
    }
  };

  // Función para subir foto a Supabase Storage
  const uploadPhotoToStorage = async (photoUri: string, checklistId: string, photoIndex: number): Promise<string | null> => {
    try {
      console.log(`📸 Subiendo foto ${photoIndex + 1}:`, photoUri);
      setProgressMessage(`Preparando foto ${photoIndex + 1}...`);
      
      // 1. Verificar que el archivo existe
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      if (!fileInfo.exists) {
        console.error('❌ El archivo no existe:', photoUri);
        return null;
      }
      
      console.log('✅ Archivo existe, tamaño:', fileInfo.size, 'bytes');
      
      // 2. Comprimir si es muy grande (> 2MB)
      let uriToUpload = photoUri;
      if (fileInfo.size && fileInfo.size > 2 * 1024 * 1024) {
        console.log('📦 Archivo grande, comprimiendo...');
        uriToUpload = await compressImage(photoUri);
      }
      
      // 3. Generar nombre único
      const fileName = `${checklistId}_${Date.now()}_${photoIndex}.jpg`;
      const filePath = `checklist-photos/${fileName}`;
      
      // 4. Leer el archivo como base64
      setProgressMessage(`Procesando foto ${photoIndex + 1}...`);
      const base64 = await FileSystem.readAsStringAsync(uriToUpload, {
        encoding: 'base64',
      });
      
      console.log('✅ Foto leída, tamaño base64:', base64.length);
      
      // 5. Convertir base64 a arraybuffer
      const arrayBuffer = decode(base64);
      
      // 6. Subir a Supabase Storage
      setProgressMessage(`Subiendo foto ${photoIndex + 1} a la nube...`);
      
      const { data, error } = await supabase.storage
        .from('checklists')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        
        // Si el error es por tamaño, intentar con compresión más agresiva
        if (error.message?.includes('size') || error.statusCode === 413) {
          console.log('📦 Foto muy grande, comprimiendo más...');
          const superCompressed = await manipulateAsync(
            photoUri,
            [{ resize: { width: 800 } }],
            { compress: 0.5, format: SaveFormat.JPEG }
          );
          return await uploadPhotoToStorage(superCompressed.uri, checklistId, photoIndex);
        }
        
        return null;
      }
      
      console.log('✅ Foto subida a Storage:', data.path);
      
      // 7. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('checklists')
        .getPublicUrl(filePath);
      
      console.log('✅ URL pública:', urlData.publicUrl);
      return urlData.publicUrl;
      
    } catch (error: any) {
      console.error('❌ Error en uploadPhotoToStorage:', error);
      
      // Si es error de red, reintentar una vez
      if (error.message?.includes('Network') || error.message?.includes('network')) {
        console.log('🌐 Error de red, reintentando en 3 segundos...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        return await uploadPhotoToStorage(photoUri, checklistId, photoIndex);
      }
      
      return null;
    }
  };

  // Función para subir fotos por lotes
  const uploadPhotosInBatches = async (
    photos: ChecklistPhoto[],
    checklistId: string
  ): Promise<{ success: number; failed: number; photosToInsert: any[] }> => {
    const photosToInsert = [];
    let successCount = 0;
    let failCount = 0;
    
    // Subir en lotes de 3 fotos
    const batchSize = 3;
    
    for (let i = 0; i < photos.length; i += batchSize) {
      const batch = photos.slice(i, i + batchSize);
      
      // Procesar lote en paralelo
      const batchPromises = batch.map(async (photo, batchIndex) => {
        const photoIndex = i + batchIndex;
        
        try {
          setProgressMessage(`Subiendo foto ${photoIndex + 1} de ${photos.length}...`);
          
          const publicUrl = await uploadPhotoToStorage(photo.photoUri, checklistId, photoIndex);
          
          if (publicUrl) {
            successCount++;
            return {
              checklist_id: checklistId,
              area: photo.area,
              photo_url: publicUrl,
              timestamp: photo.timestamp,
              description: photo.description || ''
            };
          } else {
            failCount++;
            // Guardar URI local como fallback
            return {
              checklist_id: checklistId,
              area: photo.area,
              photo_url: photo.photoUri,
              timestamp: photo.timestamp,
              description: photo.description || ''
            };
          }
        } catch (error) {
          console.error(`Error en foto ${photoIndex + 1}:`, error);
          failCount++;
          // Guardar URI local como fallback
          return {
            checklist_id: checklistId,
            area: photo.area,
            photo_url: photo.photoUri,
            timestamp: photo.timestamp,
            description: photo.description || ''
          };
        }
      });
      
      // Esperar a que termine el lote
      const batchResults = await Promise.all(batchPromises);
      photosToInsert.push(...batchResults);
      
      // Pequeña pausa entre lotes
      if (i + batchSize < photos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return { success: successCount, failed: failCount, photosToInsert };
  };

  // ========== FUNCIONES PARA SUPABASE ==========

  // Formatear fecha para DB
  const formatDateForDB = (dateStr: string): string => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  // Guardar checklist en Supabase
  const saveChecklistToSupabase = async (checklistData: ChecklistData, pdfUrl: string) => {
    try {
      // 1. Insertar el checklist principal
      const { data: checklist, error: checklistError } = await supabase
        .from('checklists')
        .insert({
          sucursal_key: checklistData.sucursalKey,
          sucursal_nombre: checklistData.sucursal,
          responsable: checklistData.responsable,
          fecha: formatDateForDB(checklistData.fecha),
          hora_inicio: checklistData.horaInicio,
          hora_fin: checklistData.horaFin,
          comentarios_adicionales: checklistData.comentariosAdicionales,
          pdf_url: pdfUrl,
          completed: checklistData.completed
        })
        .select()
        .single();

      if (checklistError) throw checklistError;
      console.log('✅ Checklist creado con ID:', checklist.id);

      // 2. Insertar los items
      if (checklistData.items.length > 0) {
        const itemsToInsert = checklistData.items.map(item => ({
          checklist_id: checklist.id,
          area: item.area,
          aspecto: item.aspecto,
          cumplimiento: item.cumplimiento || '',
          observaciones: item.observaciones || '',
          aspecto_id: item.aspectoId
        }));

        // Insertar en lotes de 20 items
        const batchSize = 20;
        for (let i = 0; i < itemsToInsert.length; i += batchSize) {
          const batch = itemsToInsert.slice(i, i + batchSize);
          const { error: itemsError } = await supabase
            .from('checklist_items')
            .insert(batch);

          if (itemsError) throw itemsError;
        }
        
        console.log(`✅ ${itemsToInsert.length} items guardados`);
      }

      // 3. Subir fotos a Storage
      if (checklistData.photos && checklistData.photos.length > 0) {
        setProgressMessage('Subiendo fotos a la nube...');
        
        const { success, failed, photosToInsert } = await uploadPhotosInBatches(
          checklistData.photos,
          checklist.id
        );
        
        console.log(`📊 Fotos: ${success} exitosas, ${failed} fallaron`);
        
        // Insertar fotos en la base de datos
        if (photosToInsert.length > 0) {
          setProgressMessage('Guardando referencias de fotos...');
          
          // Insertar en lotes de 5 fotos
          const batchSize = 5;
          for (let i = 0; i < photosToInsert.length; i += batchSize) {
            const batch = photosToInsert.slice(i, i + batchSize);
            const { error: photosError } = await supabase
              .from('checklist_photos')
              .insert(batch);

            if (photosError) {
              console.error(`Error insertando lote ${i}:`, photosError);
            } else {
              console.log(`✅ Lote ${i/batchSize + 1} insertado: ${batch.length} fotos`);
            }
          }
        }
      }

      return checklist.id;
    } catch (error) {
      console.error('Error guardando en Supabase:', error);
      throw error;
    }
  };

  // Renombrar archivo PDF
  const renamePDFFile = async (originalUri: string, newFileName: string): Promise<{success: boolean, uri: string, message: string}> => {
    try {
      console.log('=== INICIANDO RENOMBRE DE ARCHIVO CHECKLIST ===');
      
      const directoryPath = originalUri.substring(0, originalUri.lastIndexOf('/') + 1);
      const newUri = `${directoryPath}${newFileName}`;
      
      const fileInfo = await FileSystem.getInfoAsync(originalUri);
      if (!fileInfo.exists) {
        return {
          success: false,
          uri: originalUri,
          message: 'El archivo original no existe'
        };
      }
      
      await FileSystem.copyAsync({
        from: originalUri,
        to: newUri
      });
      
      const newFileInfo = await FileSystem.getInfoAsync(newUri);
      if (newFileInfo.exists) {
        try {
          await FileSystem.deleteAsync(originalUri);
        } catch (deleteError) {
          console.warn('No se pudo eliminar el archivo original');
        }
        
        return {
          success: true,
          uri: newUri,
          message: `Archivo renombrado a: ${newFileName}`
        };
      } else {
        return {
          success: false,
          uri: originalUri,
          message: 'No se pudo copiar el archivo'
        };
      }
      
    } catch (error: any) {
      console.error('Error renombrando archivo:', error.message);
      return {
        success: false,
        uri: originalUri,
        message: `Error: ${error.message}`
      };
    }
  };

  // Generar nombre de archivo
  const generateChecklistFileName = (data: ChecklistData): string => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sucursal = data.sucursalKey || sucursalKey;
    const responsible = data.responsable 
      ? `_${data.responsable.trim().replace(/\s+/g, '_')}` 
      : '';
    
    return `Checklist_${sucursal}${responsible}_${date}.pdf`;
  };

  // Extraer nombre de archivo
  const extractFileNameFromUri = (uri: string): string => {
    return uri.split('/').pop() || 'checklist.pdf';
  };

  // Estimar tamaño total de fotos
  const estimateTotalPhotoSize = async (photos: ChecklistPhoto[]): Promise<number> => {
    let totalSize = 0;
    
    for (const photo of photos) {
      try {
        const info = await FileSystem.getInfoAsync(photo.photoUri);
        if (info.exists) {
          totalSize += info.size || 0;
        }
      } catch (error) {
        console.error('Error estimando tamaño:', error);
      }
    }
    
    return totalSize;
  };

  // Verificar memoria antes de generar PDF
  const checkMemoryAndWarn = async (): Promise<boolean> => {
    if (formData.photos && formData.photos.length > 8) {
      const totalSize = await estimateTotalPhotoSize(formData.photos);
      
      if (totalSize > 30 * 1024 * 1024) { // 30MB
        return new Promise((resolve) => {
          Alert.alert(
            '⚠️ Muchas fotos',
            `Las fotos ocupan aproximadamente ${Math.round(totalSize / (1024 * 1024))}MB. ` +
            'En dispositivos de gama baja esto puede causar problemas. ¿Deseas continuar?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continuar', onPress: () => resolve(true) }
            ]
          );
        });
      }
    }
    return true;
  };

  // Guardar interno
  const handleSaveInternal = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      setProgressMessage('Preparando datos...');
      
      const updatedData = {
        ...formData,
        horaFin: getCurrentTime(),
        sucursal: sucursalName,
        sucursalKey: sucursalKey,
        completed: areAllAreasComplete(formData.items, sucursalKey)
      };
      
      const fileName = generateChecklistFileName(updatedData);
    
      Toast.show({
        type: 'info',
        text1: 'Generando PDF...',
        text2: `Procesando ${formData.photos?.length || 0} fotos`,
      });
    
      // Generar PDF
      const tempPdfUri = await generateChecklistPDF(
        updatedData, 
        sucursalName,
        (progress) => {
          setProgress(progress);
          
          if (progress < 10) {
            setProgressMessage('Preparando plantilla...');
          } else if (progress >= 10 && progress < 90) {
            const photoProgress = Math.round((progress - 10) / 80 * 100);
            setProgressMessage(`Procesando fotos: ${photoProgress}%`);
          } else if (progress >= 90 && progress < 100) {
            setProgressMessage('Generando PDF final...');
          } else {
            setProgressMessage('¡Completado!');
          }
        }
      );
    
      const renameResult = await renamePDFFile(tempPdfUri, fileName);
      const newName = extractFileNameFromUri(renameResult.uri);
      
      // Subir PDF a Supabase Storage
      setProgressMessage('Subiendo PDF a la nube...');
      const pdfUrl = await uploadPDFToStorage(renameResult.uri, newName);
      
      if (pdfUrl) {
        // Guardar en la base de datos
        await saveChecklistToSupabase(updatedData, pdfUrl);
        
        // Limpiar borrador
        await clearDraft(sucursalKey);
        setLastSaved(null);
        
        Toast.show({
          type: 'success',
          text1: '✅ ¡Éxito!',
          text2: `${newName} guardado en el servidor`
        });
      }
      
      setIsLoading(false);

      Alert.alert(
        '✅ Checklist Generado',
        `${fileName}`,
        [
          { 
            text: 'Cerrar', 
            style: 'cancel' 
          },
          { 
            text: 'Compartir',
            onPress: () => shareViaWhatsApp(renameResult.uri, newName, updatedData)
          }
        ]
      );

    } catch (error) {
      setIsLoading(false);
      setProgress(0);
      console.error('Error guardando checklist:', error);
      Alert.alert(
        'Error',
        'No se pudo guardar el checklist. Intenta de nuevo.'
      );
    }
  };

  // Función para subir PDF a Storage
  const uploadPDFToStorage = async (pdfUri: string, fileName: string): Promise<string | null> => {
    try {
      console.log('📄 Subiendo PDF:', fileName);
      
      // Leer PDF como base64
      const base64 = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: 'base64',
      });
      
      const arrayBuffer = decode(base64);
      
      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('checklists')
        .upload(`pdfs/${fileName}`, arrayBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
        });
      
      if (error) throw error;
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('checklists')
        .getPublicUrl(`pdfs/${fileName}`);
      
      console.log('✅ PDF subido:', urlData.publicUrl);
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error subiendo PDF:', error);
      return null;
    }
  };

  // Handle save principal
  const handleSave = async () => {
    if (!validateBeforeSave()) return;
    
    const memoryOk = await checkMemoryAndWarn();
    if (memoryOk) {
      await handleSaveInternal();
    }
  };

  // Navegar a área incompleta
  const navigateToIncompleteArea = (area: string) => {
    const areaIndex = areas.findIndex(a => a === area);
    setCurrentArea(area);
    setShowValidationModal(false);
    
    if (areaIndex >= 0) {
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
  const shareViaWhatsApp = async (pdfUri: string, fileName: string, data: ChecklistData) => {
    try {
      if (!await Sharing.isAvailableAsync()) {
        Alert.alert('Error', 'La función de compartir no está disponible');
        return;
      }

      const message = `*CHECKLIST DE SUPERVISIÓN*\n\n` +
        `*Sucursal:* ${sucursalName}\n` +
        `*Responsable:* ${data.responsable}\n` +
        `*Fecha:* ${data.fecha}\n` +
        `*Hora:* ${data.horaInicio} - ${data.horaFin}\n` +
        `*Áreas evaluadas:* ${areas.length}\n` +
        `*Evaluación:* ${data.items.filter(item => item.cumplimiento !== '').length}/${data.items.length} items\n\n` +
        `*Archivo adjunto:* ${fileName}`;

      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Checklist',
        UTI: 'public.pdf',
      });

    } catch (error) {
      console.error('Error compartiendo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo compartir el archivo',
      });
    }
  };

  // Nuevo checklist
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
            clearDraft(sucursalKey);
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
    <SafeAreaView style={styleschecklist.container}>
      {/* SECCIÓN FIJA SUPERIOR */}
      <View style={styleschecklist.fixedSection}>
        {/* Header con botones */}
        <View style={styleschecklist.header}>
          <TouchableOpacity
            style={styleschecklist.headerButton}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Icon name="save" size={24} color="white" />
            <Text style={styleschecklist.cameraButtonText}>Guardar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styleschecklist.headerButton}
            onPress={handleNewChecklist}
            disabled={isLoading}
          >
            <Icon name="add-circle-outline" size={24} color="white" />
            <Text style={styleschecklist.cameraButtonText}>Nuevo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styleschecklist.cameraButton}
            onPress={takePhoto}
            disabled={hasCameraPermission === false || isLoading}
          >
            <MaterialCommunityIcons name="camera" size={24} color="white" />
            <Text style={styleschecklist.cameraButtonText}>Foto</Text>
          </TouchableOpacity>
        </View>

        {/* Info de último guardado */}
        {lastSaved && (
          <Text style={styleschecklist.lastSavedText}>
            💾 Guardado: {lastSaved.toLocaleTimeString()}
          </Text>
        )}

        {/* Información general */}
        <View style={styleschecklist.infoCard}>
          <View style={styleschecklist.infoGrid}>
            <Text style={styleschecklist.infoLabel}>FECHA:</Text>
            <Text style={styleschecklist.infoValue}>{formData.fecha}</Text>
            <Text></Text><Text></Text><Text></Text>
            <Text style={styleschecklist.infoLabel}>HORA INICIO:</Text>
            <Text style={styleschecklist.infoValue}>{formData.horaInicio} hrs.</Text>
          </View>
          
          <View style={styleschecklist.infoItem}>
            <Text style={styleschecklist.infoLabel}>RESPONSABLE:</Text>
            <TextInput
              style={styleschecklist.responsableInput}
              placeholder="Nombre del responsable"
              value={formData.responsable}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, responsable: text }));
                saveProgressOnly();
              }}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Barra de progreso general */}
        <View style={styleschecklist.progressCard}>
          <View style={styleschecklist.progressHeader}>
            <Text style={styleschecklist.progressLabel}>Calificación General</Text>
            <Text style={[
              styleschecklist.progressStatus,
              { color: getProgressColor(generalStats.porcentajeBueno) }
            ]}>
              {generalStats.porcentajeBueno >= 80 ? 'EXCELENTE' :
               generalStats.porcentajeBueno >= 60 ? 'ACEPTABLE' : 'REQUIERE MEJORA'}
            </Text>
          </View>
          
          <View style={styleschecklist.progressBar}>
            <View 
              style={[
                styleschecklist.progressFill,
                { 
                  width: `${generalStats.porcentajeBueno}%`,
                  backgroundColor: getProgressColor(generalStats.porcentajeBueno)
                }
              ]}
            />
          </View>
          
          <View style={styleschecklist.progressFooter}>
            <Text style={styleschecklist.progressText}>0%</Text>
            <Text style={[
              styleschecklist.progressText,
              { color: getProgressColor(generalStats.porcentajeBueno), fontWeight: 'bold' }
            ]}>
              {Math.round(generalStats.porcentajeBueno)}% Bueno
            </Text>
            <Text style={styleschecklist.progressText}>100%</Text>
          </View>
        </View>

        {/* Selector de área */}
        <View style={styleschecklist.areaSection}>
          <View style={styleschecklist.areaHeader}>
            <Text style={styleschecklist.evaluationSubtitle}>
              {areas.length} áreas | {formData.items.length} items
            </Text>
            <Text style={styleschecklist.areasCountInfo}>
              {currentArea} ({currentAreaStats.totalEvaluado}/{currentAreaStats.total} evaluados)
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styleschecklist.areaScroll}
          >
            {areas.map((area, index) => {
              const areaPercentage = calculateBuenoPercentage(area);
              return (
                <TouchableOpacity
                  key={area}
                  style={[
                    styleschecklist.areaButton,
                    currentArea === area && styleschecklist.areaButtonActive
                  ]}
                  onPress={() => {
                    setCurrentArea(area);
                    scrollToArea(index);
                  }}
                  disabled={isLoading}
                >
                  <Text style={styleschecklist.areaIcon}>{getAreaIcon(area)}</Text>
                  <Text style={[
                    styleschecklist.areaButtonText,
                    currentArea === area && styleschecklist.areaButtonTextActive
                  ]}>
                    {area}
                  </Text>
                  <View style={[
                    styleschecklist.areaBadge,
                    { backgroundColor: getProgressColor(areaPercentage) }
                  ]}>
                    <Text style={styleschecklist.areaBadgeText}>
                      {Math.round(areaPercentage)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* SCROLLVIEW PARA LAS ÁREAS */}
      <ScrollView 
        ref={areasScrollViewRef}
        style={styleschecklist.areasScrollView}
        showsVerticalScrollIndicator={true}
      >
        {/* Galería de fotos del área actual */}
        {areaPhotos.length > 0 && (
          <View style={styleschecklist.photosSection}>
            <View style={styleschecklist.photosHeader}>
              <Text style={styleschecklist.sectionTitle}>Fotos de {currentArea}</Text>
              <Text style={styleschecklist.photosCount}>{areaPhotos.length} foto(s)</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {areaPhotos.map((photo) => (
                <View key={photo.id} style={styleschecklist.photoCard}>
                  <Image source={{ uri: photo.photoUri }} style={styleschecklist.photo} />
                  <TouchableOpacity
                    style={styleschecklist.deleteButton}
                    onPress={() => removePhoto(photo.id)}
                    disabled={isLoading}
                  >
                    <Icon name="delete" size={20} color="white" />
                  </TouchableOpacity>
                  <View style={styleschecklist.photoInfo}>
                    {photo.description && (
                      <Text style={styleschecklist.photoDescription} numberOfLines={2}>
                        {photo.description}
                      </Text>
                    )}
                    <Text style={styleschecklist.photoTimestamp}>
                      {photo.timestamp}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Evaluación del área actual */}
        <View style={styleschecklist.evaluationSection}>
          {(itemsByArea[currentArea] || []).map((item) => (
            <View key={item.id} style={styleschecklist.itemCard}>
              <Text style={styleschecklist.itemText}>{item.aspecto}</Text>
              
              <View style={styleschecklist.ratingContainer}>
                {['malo', 'regular', 'bueno'].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styleschecklist.ratingButton,
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
                      saveProgressOnly();
                    }}
                    disabled={isLoading}
                  >
                    <View style={[
                      styleschecklist.radioCircle,
                      item.cumplimiento === rating && {
                        borderColor: getRatingColor(rating),
                      }
                    ]}>
                      {item.cumplimiento === rating && (
                        <View style={[
                          styleschecklist.radioInner,
                          { backgroundColor: getRatingColor(rating) }
                        ]} />
                      )}
                    </View>
                    <Text style={[
                      styleschecklist.ratingText,
                      { color: getRatingColor(rating) }
                    ]}>
                      {rating.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styleschecklist.observationsInput}
                placeholder="Observaciones..."
                value={item.observaciones}
                onChangeText={(text) => {
                  const newItems = formData.items.map(i =>
                    i.id === item.id ? { ...i, observaciones: text } : i
                  );
                  setFormData(prev => ({ ...prev, items: newItems }));
                }}
                onBlur={saveProgressOnly}
                multiline
                editable={!isLoading}
              />
            </View>
          ))}
        </View>

        {/* Comentarios adicionales */}
        <View style={styleschecklist.commentsSection}>
          <Text style={styleschecklist.sectionTitle}>Comentarios Adicionales</Text>
          <TextInput
            style={styleschecklist.commentsInput}
            placeholder="Ingrese comentarios adicionales aquí..."
            value={formData.comentariosAdicionales}
            onChangeText={(text) => setFormData(prev => ({ ...prev, comentariosAdicionales: text }))}
            onBlur={saveProgressOnly}
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />
        </View>
      </ScrollView>

      {/* Modal de validación */}
      <Modal
        visible={showValidationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowValidationModal(false)}
      >
        <View style={styleschecklist.validationModalOverlay}>
          <View style={styleschecklist.validationModalContent}>
            <View style={styleschecklist.validationHeader}>
              <MaterialCommunityIcons name="alert-circle" size={40} color="#F59E0B" />
              <Text style={styleschecklist.validationTitle}>Áreas Pendientes</Text>
              <Text style={styleschecklist.validationSubtitle}>
                Hay {incompleteAreas.length} {incompleteAreas.length === 1 ? 'área' : 'áreas'} sin evaluar completamente
              </Text>
            </View>
            
            <ScrollView style={styleschecklist.incompleteAreasList}>
              {incompleteAreas.map((area, index) => (
                <TouchableOpacity
                  key={area}
                  style={styleschecklist.incompleteAreaItem}
                  onPress={() => navigateToIncompleteArea(area)}
                  disabled={isLoading}
                >
                  <View style={styleschecklist.areaItemContent}>
                    <View style={styleschecklist.areaItemNumber}>
                      <Text style={styleschecklist.areaNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styleschecklist.areaItemInfo}>
                      <Text style={styleschecklist.areaItemName}>{area}</Text>
                      <Text style={styleschecklist.areaItemAction}>
                        Tocar para evaluar esta área
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styleschecklist.validationButtons}>
              <TouchableOpacity
                style={[styleschecklist.validationButton, styleschecklist.cancelValidationButton]}
                onPress={() => setShowValidationModal(false)}
                disabled={isLoading}
              >
                <Text style={styleschecklist.cancelValidationButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styleschecklist.validationButton, styleschecklist.forceSaveButton]}
                onPress={handleForceSave}
                disabled={isLoading}
              >
                <MaterialCommunityIcons name="file-document-outline" size={20} color="white" />
                <Text style={styleschecklist.forceSaveButtonText}>Guardar Incompleto</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styleschecklist.validationNote}>
              📝 Recomendación: Complete todas las áreas para un reporte más preciso
            </Text>
          </View>
        </View>
      </Modal>

      {/* Modal de foto */}
      <Modal
        visible={cameraVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={styleschecklist.modalContainer}>
          <View style={styleschecklist.modalContent}>
            <Text style={styleschecklist.modalTitle}>Vista previa de foto</Text>
            
            {tempPhoto && (
              <Image source={{ uri: tempPhoto }} style={styleschecklist.previewImage} />
            )}
            
            <TextInput
              style={styleschecklist.descriptionInput}
              placeholder="Descripción de la foto (opcional)"
              value={photoDescription}
              onChangeText={setPhotoDescription}
              multiline
              editable={!isLoading}
            />
            
            <View style={styleschecklist.modalButtons}>
              <TouchableOpacity
                style={[styleschecklist.modalButton, styleschecklist.cancelButton]}
                onPress={() => {
                  setTempPhoto(null);
                  setCameraVisible(false);
                }}
                disabled={isLoading}
              >
                <Text style={styleschecklist.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styleschecklist.modalButton, styleschecklist.savePhotoButton]}
                onPress={savePhoto}
                disabled={isLoading}
              >
                <Text style={styleschecklist.savePhotoButtonText}>Guardar Foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styleschecklist.loadingOverlay}>
          <View style={styleschecklist.loadingContent}>
            <ActivityIndicator size="large" color="#05aaca" />
            <Text style={styleschecklist.loadingText}>
              {progressMessage || `Generando PDF...`}
            </Text>
            
            <View style={styleschecklist.progressBarContainer}>
              <View 
                style={[
                  styleschecklist.progressBarFill, 
                  { width: `${progress}%` }
                ]} 
              />
            </View>
            
            <Text style={styleschecklist.progressText}>
              {progress}% completado
            </Text>
            
            {formData.photos && formData.photos.length > 0 && (
              <Text style={styleschecklist.progressDetail}>
                Procesando {formData.photos.length} fotos...
              </Text>
            )}
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};