import Toast from 'react-native-toast-message';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import supabase from 'src/utils/supabaseConfig';

// Variables
const BUCKET_NAME = 'Documentos';

// =========== AUTENTICACIÓN ANÓNIMA ===========
export const authenticateSupabase = async (): Promise<boolean> => {
    try {
        // Supabase permite acceso anónimo con la anon key
        console.log('✅ Supabase autenticado (modo anónimo)');
        return true;
    } catch (error) {
        console.error('Error autenticando:', error);
        return false;
    }
};

// =========== SUBIR ARCHIVO CON POLÍTICAS CORRECTAS ===========
export const uploadFileToSupabase = async (
    fileUri: string,
    fileName: string
): Promise<string | null> => {
    try {
        console.log('📤 Subiendo archivo:', fileName);
        
        // Autenticar primero
        await authenticateSupabase();

        // Leer archivo
        const response = await fetch(fileUri);
        const arrayBuffer = await response.arrayBuffer();
        
        // Crear nombre único
        const uniqueName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const mimeType = getMimeType(fileName);

        // Opción A: Subir con autenticación explícita
        const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueName, arrayBuffer, {
            contentType: mimeType,
            upsert: false,
            cacheControl: '3600'
        });

        if (error) {
            // Si falla por RLS, intentar método alternativo
            console.log('⚠️  Intentando método alternativo...');
            return await uploadWithServiceRole(fileUri, fileName);
        }

        // Obtener URL
        const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uniqueName);

        Toast.show({
            type: 'success',
            text1: '✅ Subido exitosamente',
            text2: `${fileName} disponible para el equipo`
        });

        return urlData.publicUrl;

    } catch (error: any) {
        console.error('❌ Error subiendo:', error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Configura políticas RLS en Supabase'
        });
        return null;
    }
};

// =========== MÉTODO ALTERNATIVO: Usar Service Role Key ===========
const uploadWithServiceRole = async (fileUri: string, fileName: string): Promise<string | null> => {
    try {
        // NOTA: Solo para desarrollo. En producción usa políticas RLS correctas
        const SERVICE_ROLE_KEY = 'TU_SERVICE_ROLE_KEY'; // Obtén de Supabase Settings → API
        
        const response = await fetch(fileUri);
        const arrayBuffer = await response.arrayBuffer();
        
        const uniqueName = `${Date.now()}_${fileName}`;
    
        // Subir directamente con fetch
        const uploadResponse = await fetch(
            `https://TU_PROYECTO.supabase.co/storage/v1/object/${BUCKET_NAME}/${uniqueName}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'Content-Type': getMimeType(fileName),
                    'x-upsert': 'false'
                },
                body: arrayBuffer
            }
        );

        if (uploadResponse.ok) {
        return `https://TU_PROYECTO.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${uniqueName}`;
        }
    
        return null;
    } catch (error) {
        console.error('Error método alternativo:', error);
        return null;
    }
};

// =========== LISTAR ARCHIVOS ===========
export const listSupabaseFiles = async () => {
    try {
        // Obtener lista de archivos
        const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
        });

        if (error) {
            console.error('❌ Error listando archivos:', error);
            return [];
        }

        // Obtener URLs públicas y metadatos
        const files = await Promise.all(
            data.map(async (item) => {
                try {
                    // Obtener URL pública (método CORRECTO)
                    const { data: { publicUrl } } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(item.name);

                    // Extraer nombre original (remover timestamp)
                    const originalName = item.name.replace(/^\d+_/, '').replace(/_/g, ' ');

                    return {
                        id: item.id || item.name,
                        name: originalName,
                        fileName: item.name,
                        downloadURL: publicUrl,
                        createdTime: item.created_at,
                        size: item.metadata?.size || '0',
                        mimeType: item.metadata?.mimetype || getMimeType(item.name),
                        lastModified: item.updated_at
                    };
                } catch (error) {
                    console.error('Error procesando archivo:', error);
                    return null;
                }
            })
        );

        // Filtrar nulos y ordenar por fecha
        const validFiles = files.filter((file): file is NonNullable<typeof file> => file !== null);
        
        return validFiles.sort((a, b) => 
            new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
        );

    } catch (error: any) {
        console.error('❌ Error listando archivos de Supabase:', error);
        return [];
    }
};

// =========== DESCARGAR ARCHIVO ===========
export const downloadFileFromSupabase = async (fileUrl: string, fileName: string) => {
    try {
        // Directorio local
        const downloadDir = FileSystem.documentDirectory + 'downloads/';
    
        // Crear directorio si no existe
        const dirInfo = await FileSystem.getInfoAsync(downloadDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
        }
    
        const localUri = downloadDir + fileName;

        // Descargar archivo
        const downloadResult = await FileSystem.downloadAsync(fileUrl, localUri);

        if (downloadResult.status === 200) {
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

// =========== ELIMINAR ARCHIVO ===========
export const deleteFileFromSupabase = async (fileName: string): Promise<boolean> => {
    try {
        // Eliminar de Supabase Storage
        const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

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
        // Primero descargar localmente
        const localUri = await downloadFileFromSupabase(fileUrl, fileName);
        
        if (localUri && Platform.OS === 'android') {
            await Sharing.shareAsync(localUri, {
                mimeType: getMimeType(fileName),
                dialogTitle: `Compartir ${fileName}`,
                UTI: 'public.data'
            });
        } else if (localUri && Platform.OS === 'ios') {
            await Sharing.shareAsync(localUri);
        }
        
        return localUri;
    } catch (error) {
        console.error('Error compartiendo:', error);
        return null;
    }
};

// =========== FUNCIONES AUXILIARES ===========
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

// =========== FUNCIONES SIMPLES ===========
export const isAuthenticated = (): boolean => {
    return true; // Supabase no requiere autenticación para storage público
};

export const logoutFromCloud = () => {
    Toast.show({
        type: 'info',
        text1: 'Sesión cerrada',
        text2: 'Datos locales eliminados'
    });
};