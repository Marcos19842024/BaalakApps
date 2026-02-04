import * as FileSystem from 'expo-file-system/legacy';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import { Buffer } from 'buffer';

// Configuración simple para uso personal
const DRIVE_FOLDER_NAME = 'ChecklistApp';
const GOOGLE_DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Configuración de Google (usa tu Client ID real)
const GOOGLE_CLIENT_ID = '248603616640-96jau410u2gjqd715e26m009b0s688k1.apps.googleusercontent.com';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';

// Para app personal, usa redirect URI local
const REDIRECT_URI = 'http://localhost:19006'; // URI de desarrollo Expo

// Variables en memoria (para uso personal está bien)
let accessToken: string | null = null;
let refreshToken: string | null = null;
let driveFolderId: string | null = null;

global.Buffer = Buffer;

// =========== AUTENTICACIÓN SIMPLIFICADA ===========

export const authenticateGoogleDrive = async (): Promise<boolean> => {
    try {
        // 1. Construir URL de Google
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${GOOGLE_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(GOOGLE_DRIVE_SCOPES)}&` +
            `access_type=offline&` +
            `prompt=consent`;

        console.log('🔗 Abriendo Google para autenticación...');
        
        // 2. Abrir navegador
        const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
        
        if (result.type === 'success' && result.url) {
            // 3. Extraer código de la URL
            const urlObj = new URL(result.url);
            const code = urlObj.searchParams.get('code');
            
            if (code) {
                console.log('✅ Código recibido');
                
                // 4. Intercambiar código por tokens
                const tokens = await exchangeCodeForTokens(code);
                if (tokens) {
                    accessToken = tokens.accessToken;
                    refreshToken = tokens.refreshToken;
                    
                    // 5. Crear/obtener carpeta
                    await ensureAppFolder();
                    
                    Toast.show({
                        type: 'success',
                        text1: '✅ Conectado a Google Drive',
                        text2: 'Listo para guardar reportes'
                    });
                    
                    return true;
                }
            }
        }
        
        return false;
        
    } catch (error: any) {
        console.error('❌ Error autenticando:', error);
    
        // Cerrar sesión en caso de error
        accessToken = null;
        refreshToken = null;
        driveFolderId = null;
        
        Toast.show({
            type: 'error',
            text1: 'Error de autenticación',
            text2: 'Por favor, intenta de nuevo'
        });
        return false;
    }
};

// Intercambiar código por tokens
const exchangeCodeForTokens = async (code: string) => {
    try {
        const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            }).toString()
        });

        const data = await response.json();
        
        if (data.access_token) {
            console.log('✅ Tokens obtenidos');
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || ''
            };
        }
        
        console.error('❌ Error tokens:', data);
        return null;
        
    } catch (error) {
        console.error('❌ Error intercambiando tokens:', error);
        return null;
    }
};

// Refrescar token
const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken) return false;
    
    try {
        const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            }).toString()
        });

        const data = await response.json();
        
        if (data.access_token) {
            accessToken = data.access_token;
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error refrescando token:', error);
        return false;
    }
};

// Crear/obtener carpeta
const ensureAppFolder = async () => {
    if (!accessToken) return;
    
    try {
        // Buscar carpeta existente
        const searchResponse = await fetch(
            `${GOOGLE_DRIVE_API}/files?q=name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const data = await searchResponse.json();
        
        if (data.files && data.files.length > 0) {
            driveFolderId = data.files[0].id;
            console.log('📁 Carpeta encontrada:', driveFolderId);
        } else {
            // Crear nueva carpeta
            const createResponse = await fetch(
                `${GOOGLE_DRIVE_API}/files`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: DRIVE_FOLDER_NAME,
                        mimeType: 'application/vnd.google-apps.folder'
                    })
                }
            );
            
            const folderData = await createResponse.json();
            driveFolderId = folderData.id;
            console.log('📁 Carpeta creada:', driveFolderId);
        }
    } catch (error) {
        console.error('❌ Error con carpeta:', error);
    }
};

// Obtener token válido
const getValidToken = async (): Promise<string | null> => {
    try {
        if (!accessToken && refreshToken) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                // Token no se pudo refrescar
                accessToken = null;
                refreshToken = null;
                return null;
            }
        }
        return accessToken;
    } catch (error) {
        console.error('❌ Error obteniendo token válido:', error);
        return null;
    }
};

// =========== SUBIR ARCHIVO SIMPLIFICADO ===========

export const uploadFileToDrive = async (
    fileUri: string,
    fileName: string
): Promise<string | null> => {
    try {
        const token = await getValidToken();
        if (!token || !driveFolderId) {
            Toast.show({
                type: 'error',
                text1: 'No autenticado',
                text2: 'Primero conéctate a Google Drive'
            });
            return null;
        }

        // Verificar archivo
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
            throw new Error('Archivo no encontrado');
        }

        // Leer archivo como base64 (API actual)
        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: 'base64'  // Simple string, no más EncodingType
        });

        // Convertir base64 a texto para upload simple
        const fileBytes = atob(fileContent);
        
        // Crear metadata
        const metadata = {
            name: fileName,
            mimeType: 'application/pdf',
            parents: [driveFolderId]
        };

        // Crear body multipart manualmente (más compatible)
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelim = `\r\n--${boundary}--`;
        
        const body = delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/pdf\r\n\r\n' +
            fileBytes +
            closeDelim;

        // Subir archivo
        const response = await fetch(
            `${GOOGLE_DRIVE_API}/files?uploadType=multipart`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': `multipart/related; boundary="${boundary}"`
                },
                body: body
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        
        Toast.show({
            type: 'success',
            text1: '✅ Guardado',
            text2: `${fileName} subido a Drive`
        });
        
        return result.id;
        
    } catch (error: any) {
        console.error('❌ Error subiendo:', error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message || 'No se pudo subir'
        });
        return null;
    }
};

// =========== LISTAR ARCHIVOS ===========

export const listDriveFiles = async (): Promise<any[]> => {
    try {
        const token = await getValidToken();
        if (!token || !driveFolderId) return [];

        const response = await fetch(
            `${GOOGLE_DRIVE_API}/files?q='${driveFolderId}' in parents and trashed=false&fields=files(id,name,mimeType,size,webViewLink,createdTime)&orderBy=createdTime desc`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        // Manejar respuesta no exitosa
        if (!response.ok) {
            if (response.status === 401) {
                // Token expirado
                await refreshAccessToken();
                return listDriveFiles(); // Intentar de nuevo
            }
            console.error(`Error ${response.status} al listar archivos`);
            return [];
        }

        const data = await response.json();
        return data.files || [];
        
    } catch (error) {
        console.error('❌ Error listando archivos:', error);
        return [];
    }
};

// =========== DESCARGAR ARCHIVO ===========

export const downloadFileFromDrive = async (fileId: string, fileName: string) => {
    try {
        const token = await getValidToken();
        if (!token) return null;

        // Directorio local
        const downloadDir = FileSystem.documentDirectory + 'downloads/';
        
        // Crear directorio si no existe
        const dirInfo = await FileSystem.getInfoAsync(downloadDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
        }
        
        const localUri = downloadDir + fileName;

        // Descargar
        const downloadResult = await FileSystem.downloadAsync(
            `${GOOGLE_DRIVE_API}/files/${fileId}?alt=media`,
            localUri,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

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
        return null;
    }
};

// =========== ELIMINAR ARCHIVO ===========

export const deleteFileFromDrive = async (fileId: string) => {
    try {
        const token = await getValidToken();
        if (!token) return false;

        const response = await fetch(
            `${GOOGLE_DRIVE_API}/files/${fileId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (response.ok) {
            Toast.show({
                type: 'success',
                text1: '✅ Eliminado',
                text2: 'Archivo borrado de Drive'
            });
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Error eliminando:', error);
        return false;
    }
};

// =========== FUNCIONES SIMPLES ===========

export const isAuthenticated = () => {
    return accessToken !== null;
};

export const logoutFromDrive = () => {
    accessToken = null;
    refreshToken = null;
    driveFolderId = null;
    Toast.show({
        type: 'info',
        text1: 'Sesión cerrada',
        text2: 'Desconectado de Google Drive'
    });
};

// =========== SETUP INICIAL ===========

// Crear archivo de configuración de Google
export const setupGoogleConfig = () => {
    console.log('📋 Configuración para Google Drive:');
    console.log('1. Ve a https://console.cloud.google.com/');
    console.log('2. Crea un proyecto o usa uno existente');
    console.log('3. Ve a "APIs y Servicios" > "Credenciales"');
    console.log('4. Crea un "ID de cliente OAuth 2.0"');
    console.log('5. Tipo: Aplicación de escritorio');
    console.log('6. Agrega este redirect URI:', REDIRECT_URI);
    console.log('7. Copia el Client ID y pégualo arriba');
    console.log('8. Habilitar Google Drive API en "Biblioteca"');
};