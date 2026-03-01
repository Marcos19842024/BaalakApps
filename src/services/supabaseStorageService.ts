import Toast from 'react-native-toast-message';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import supabase from 'src/utils/supabaseConfig';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as base64js from 'base64-js';

// Variables
const BUCKET_NAME = 'Documentos';

// =========== FUNCIONES COMPARTIDAS ===========

// Obtener tipo MIME
const getMimeType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
  
    switch (extension) {
        case 'pdf':
            return 'application/pdf';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'xlsx':
        case 'xls':
            return 'application/vnd.ms-excel';
        case 'docx':
        case 'doc':
            return 'application/msword';
        case 'txt':
            return 'text/plain';
        default:
            return 'application/octet-stream';
    }
};

// Comprimir imagen (útil para fotos)
export const compressImage = async (photoUri: string): Promise<string> => {
    try {
        console.log('Comprimiendo imagen:', photoUri);
        
        const compressedImage = await manipulateAsync(
            photoUri,
            [{ resize: { width: 1024 } }],
            { compress: 0.7, format: SaveFormat.JPEG }
        );
        
        return compressedImage.uri;
    } catch (error) {
        console.error('Error comprimiendo imagen:', error);
        return photoUri;
    }
};

// =========== SUBIR ARCHIVO (PDFs - usado por Checklist y Reports) ===========
export const uploadFileToSupabase = async (
    fileUri: string,
    fileName: string
): Promise<string | null> => {
    try {
        console.log('📤 Subiendo archivo:', fileName);
        
        // Leer archivo
        const response = await fetch(fileUri);
        const arrayBuffer = await response.arrayBuffer();
        
        // NO generar nuevo timestamp, usar el nombre ya formateado
        // que ya incluye timestamp_checklistId_...
        const filePath = `pdfs/${fileName}`; // Guardar en carpeta pdfs/
        const mimeType = getMimeType(fileName);

        // Subir a Supabase
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, arrayBuffer, {
                contentType: mimeType,
                upsert: false,
                cacheControl: '3600'
            });

        if (error) {
            console.error('❌ Error subiendo:', error);
            throw error;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        console.log('✅ Archivo subido:', urlData.publicUrl);

        Toast.show({
            type: 'success',
            text1: '✅ Subido exitosamente',
            text2: `${fileName} disponible`
        });

        return urlData.publicUrl;

    } catch (error: any) {
        console.error('❌ Error subiendo:', error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message || 'No se pudo subir el archivo'
        });
        return null;
    }
};

// =========== SUBIR FOTO (solo para Checklist) ===========
export const uploadPhotoToSupabase = async (
    photoUri: string,
    checklistId: string,
    photoId: string
): Promise<string | null> => {
    try {
        console.log(`📸 Subiendo foto ${photoId} para checklist ${checklistId}...`);
        
        // Verificar que el archivo existe
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        if (!fileInfo.exists) {
            throw new Error('El archivo no existe');
        }
        
        // Comprimir si es necesario
        let uriToUpload = photoUri;
        if (fileInfo.size && fileInfo.size > 2 * 1024 * 1024) {
            uriToUpload = await compressImage(photoUri);
        }
        
        // Nombre del archivo con checklistId (Opción B)
        const fileName = `${checklistId}_${photoId}.jpg`;
        const filePath = `checklist-photos/${fileName}`;
        
        // Leer archivo como base64
        const base64 = await FileSystem.readAsStringAsync(uriToUpload, {
            encoding: 'base64',
        });
        
        const arrayBuffer = base64js.toByteArray(base64);
        
        // Subir a Supabase
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, arrayBuffer, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('❌ Error subiendo foto:', error);
            throw error;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        console.log('✅ Foto subida:', urlData.publicUrl);
        return urlData.publicUrl;

    } catch (error: any) {
        console.error('❌ Error subiendo foto:', error);
        Toast.show({
            type: 'error',
            text1: 'Error subiendo foto',
            text2: error.message || 'No se pudo subir la foto'
        });
        return null;
    }
};

// =========== ELIMINAR FOTO ===========
export const deletePhotoFromSupabase = async (
    checklistId: string,
    photoId: string
): Promise<boolean> => {
    try {
        const fileName = `${checklistId}_${photoId}.jpg`;
        const filePath = `checklist-photos/${fileName}`;
        
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            console.error('❌ Error eliminando foto:', error);
            return false;
        }

        console.log('✅ Foto eliminada:', photoId);
        return true;

    } catch (error: any) {
        console.error('❌ Error eliminando foto:', error);
        return false;
    }
};

// =========== ELIMINAR CHECKLIST COMPLETO (PDF + fotos) ===========
export const deleteChecklistAndPhotos = async (pdfFileName: string): Promise<boolean> => {
    try {
        console.log('🗑️ Eliminando checklist completo:', pdfFileName);
        
        // Extraer el checklistId del nombre del PDF
        // Formatos posibles:
        // 1. Con timestamp: [timestamp]_[checklistId]_Checklist_[...].pdf
        // 2. Sin timestamp: [checklistId]_Checklist_[...].pdf
        let checklistId = '';
        
        // Patrón 1: Con timestamp al inicio (ej: 1234567890_uuid_Checklist_...)
        const matchWithTimestamp = pdfFileName.match(/^\d+_([a-f0-9-]+)_Checklist_.+\.pdf$/);
        
        // Patrón 2: Sin timestamp (solo checklistId)
        const matchWithoutTimestamp = pdfFileName.match(/^([a-f0-9-]+)_Checklist_.+\.pdf$/);
        
        if (matchWithTimestamp && matchWithTimestamp[1]) {
            checklistId = matchWithTimestamp[1];
            console.log('📋 Checklist ID extraído (con timestamp):', checklistId);
        } else if (matchWithoutTimestamp && matchWithoutTimestamp[1]) {
            checklistId = matchWithoutTimestamp[1];
            console.log('📋 Checklist ID extraído (sin timestamp):', checklistId);
        } else {
            console.error('❌ No se pudo extraer checklistId del nombre:', pdfFileName);
            console.log('Formatos esperados: [timestamp]_[uuid]_Checklist_...pdf o [uuid]_Checklist_...pdf');
            return false;
        }
        
        // 1. Eliminar el PDF
        console.log('📄 Eliminando PDF:', pdfFileName);
        const pdfPath = `pdfs/${pdfFileName}`;
        const { error: pdfError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([pdfPath]);
        
        if (pdfError) {
            console.error('❌ Error eliminando PDF:', pdfError);
            return false;
        }
        
        console.log('✅ PDF eliminado correctamente');
        
        // 2. Buscar todas las fotos que comienzan con checklistId
        console.log(`🔍 Buscando fotos con ID: ${checklistId}...`);
        const { data: fotos, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('checklist-photos', {
            search: checklistId,
            limit: 100
        });
        
        if (listError) {
            console.error('❌ Error buscando fotos:', listError);
            return true; // El PDF ya se eliminó, no fallamos por las fotos
        }
        
        if (fotos && fotos.length > 0) {
            console.log(`📸 Encontradas ${fotos.length} fotos asociadas:`);
            fotos.forEach(foto => console.log(`   - ${foto.name}`));
            
            // Eliminar todas las fotos encontradas
            const fotoPaths = fotos.map(foto => `checklist-photos/${foto.name}`);
            const { error: fotosError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove(fotoPaths);
            
            if (fotosError) {
                console.error('❌ Error eliminando fotos:', fotosError);
                Toast.show({
                    type: 'warning',
                    text1: '⚠️ Eliminación parcial',
                    text2: `PDF eliminado, pero ${fotos.length} fotos no pudieron eliminarse`
                });
            } else {
                console.log(`✅ ${fotos.length} fotos eliminadas correctamente`);
                Toast.show({
                    type: 'success',
                    text1: '✅ Checklist eliminado',
                    text2: `PDF y ${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'} eliminados`
                });
            }
        } else {
            console.log('📸 No se encontraron fotos asociadas a este checklist');
            Toast.show({
                type: 'success',
                text1: '✅ PDF eliminado',
                text2: 'No había fotos asociadas'
            });
        }
        
        return true;
        
    } catch (error: any) {
        console.error('❌ Error eliminando checklist:', error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message || 'No se pudo eliminar el checklist'
        });
        return false;
    }
};

// =========== LISTAR ARCHIVOS ===========
export const listSupabaseFiles = async () => {
    try {
        console.log('📂 Listando archivos del bucket:', BUCKET_NAME);
        
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list('pdfs', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) {
            console.error('❌ Error listando archivos:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.log('📂 La carpeta pdfs está vacía');
            return [];
        }

        // Filtrar archivos placeholder
        const realFiles = data.filter(item => 
            item.name && !item.name.includes('.emptyFolderPlaceholder')
        );

        console.log(`✅ Encontrados ${data.length} archivos totales, ${realFiles.length} reales`);

        const files = await Promise.all(
            realFiles.map(async (item) => {
                try {
                    if (!item || !item.name) return null;
                    
                    const filePath = `pdfs/${item.name}`;
                    
                    const { data: { publicUrl } } = supabase.storage
                        .from(BUCKET_NAME)
                        .getPublicUrl(filePath);

                    const originalName = item.name.replace(/^\d+_/, '').replace(/_/g, ' ');

                    return {
                        id: item.id || item.name,
                        name: originalName,
                        fileName: item.name,
                        downloadURL: publicUrl,
                        createdTime: item.created_at,
                        updated_at: item.updated_at,
                        size: item.metadata?.size || 0,
                        mimeType: item.metadata?.mimetype || getMimeType(item.name),
                        fullPath: filePath
                    };
                } catch (err) {
                    console.error('Error procesando archivo:', item?.name, err);
                    return null;
                }
            })
        );

        const validFiles = files.filter((file): file is NonNullable<typeof file> => file !== null);
        return validFiles;

    } catch (error: any) {
        console.error('❌ Error listando archivos:', error);
        return [];
    }
};

// =========== DESCARGAR ARCHIVO ===========
export const downloadFileFromSupabase = async (fileUrl: string, fileName: string) => {
    try {
        console.log('📥 Descargando:', fileName);
        
        const downloadDir = FileSystem.documentDirectory + 'downloads/';
    
        const dirInfo = await FileSystem.getInfoAsync(downloadDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
        }
    
        const localUri = downloadDir + fileName;

        const downloadResult = await FileSystem.downloadAsync(fileUrl, localUri);

        if (downloadResult.status === 200) {
            console.log('✅ Archivo descargado:', localUri);
            Toast.show({
                type: 'success',
                text1: '✅ Descargado',
                text2: `Archivo guardado localmente`
            });
            return localUri;
        }
    
        return null;
    
    } catch (error: any) {
        console.error('❌ Error descargando:', error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'No se pudo descargar el archivo'
        });
        return null;
    }
};

// =========== ELIMINAR ARCHIVO (solo PDF) ===========
export const deleteFileFromSupabase = async (fileName: string): Promise<boolean> => {
    try {
        console.log('🗑️ Eliminando archivo:', fileName);
        
        const filePath = `pdfs/${fileName}`;
        
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            throw new Error(error.message);
        }

        Toast.show({
            type: 'success',
            text1: '✅ Eliminado',
            text2: 'Archivo eliminado del servidor'
        });
    
        return true;
    
    } catch (error: any) {
        console.error('❌ Error eliminando:', error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'No se pudo eliminar el archivo'
        });
        return false;
    }
};

// =========== COMPARTIR ARCHIVO ===========
export const shareSupabaseFile = async (fileUrl: string, fileName: string) => {
    try {
        const localUri = await downloadFileFromSupabase(fileUrl, fileName);
        
        if (localUri && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localUri, {
                mimeType: getMimeType(fileName),
                dialogTitle: `Compartir ${fileName}`,
                UTI: 'public.data'
            });
            return localUri;
        }
        
        return null;
    } catch (error) {
        console.error('Error compartiendo:', error);
        return null;
    }
};

// =========== VERIFICAR ARCHIVO ===========
export const checkFileExists = async (fileName: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list('pdfs', {
                search: fileName
            });

        if (error) throw error;
        
        return data && data.length > 0;
    } catch (error) {
        console.error('Error verificando archivo:', error);
        return false;
    }
};

// =========== OBTENER URL PÚBLICA ===========
export const getPublicUrl = (fileName: string): string => {
    const filePath = `pdfs/${fileName}`;
    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
    
    return data.publicUrl;
};

// =========== VERIFICAR CONEXIÓN ===========
export const testConnection = async (): Promise<boolean> => {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list('pdfs', { limit: 1 });
        
        if (error) {
            console.error('Error de conexión:', error);
            return false;
        }
        
        console.log('✅ Conexión a Supabase exitosa');
        return true;
    } catch (error) {
        console.error('Error conectando a Supabase:', error);
        return false;
    }
};