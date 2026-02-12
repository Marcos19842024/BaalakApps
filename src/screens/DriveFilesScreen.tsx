import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { stylessupabase } from 'src/styles/supabase';
import {
    uploadFileToSupabase,
    listSupabaseFiles,
    deleteFileFromSupabase,
    shareSupabaseFile,
} from 'src/services/supabaseStorageService';
import { SupabaseFile } from 'src/types/supabase';

export const DriveFilesScreen = () => {
    const [files, setFiles] = useState<SupabaseFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<SupabaseFile | null>(null);
    const [showFileModal, setShowFileModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [fileToDelete, setFileToDelete] = useState<SupabaseFile | null>(null);
    const [authLoading, setAuthLoading] = useState(false);
    const DELETE_PASSWORD = '240608';

    // Cargar archivos al inicio
    useEffect(() => {
        loadFiles();
    }, []);

    // Cargar archivos al enfocar
    useFocusEffect(
        useCallback(() => {
            loadFiles();
        }, [])
    );

    const loadFiles = async () => {
        try {
            setIsLoading(true);
            const supabaseFiles = await listSupabaseFiles();
            setFiles(supabaseFiles);
        } catch (error) {
            console.error('Error cargando archivos:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudieron cargar los archivos'
            });
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadFiles();
    };

    // Seleccionar y subir archivo
    const handleSelectAndUpload = async () => {
        try {
            setUploading(true);
        
            // Seleccionar archivo del dispositivo
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'image/*',
                    'application/vnd.ms-excel',
                    'application/msword',
                    'text/plain'
                ],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                const file = result.assets[0];
                
                // Subir a Supabase
                const downloadURL = await uploadFileToSupabase(file.uri, file.name);
                
                if (downloadURL) {
                    await loadFiles(); // Recargar lista
                
                    Toast.show({
                        type: 'success',
                        text1: '✅ ¡Éxito!',
                        text2: `${file.name} subido al servidor`
                    });
                }
            }
        
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo subir el archivo'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleFilePress = (file: SupabaseFile) => {
        setSelectedFile(file);
        setShowFileModal(true);
    };

    const handleViewOnline = () => {
        if (selectedFile?.downloadURL) {
            import('react-native').then(({ Linking }) => {
                Linking.openURL(selectedFile.downloadURL);
            });
        }
        setShowFileModal(false);
    };

    const handleShare = async () => {
        if (!selectedFile) return;

        try {
            setIsLoading(true);
            await shareSupabaseFile(selectedFile.downloadURL, selectedFile.name);
        } catch (error) {
            console.error('Error compartiendo:', error);
        } finally {
            setIsLoading(false);
            setShowFileModal(false);
        }
    };

    const handleDelete = () => {
        if (!selectedFile) return;
        
        // Guardar el archivo a eliminar y abrir modal de contraseña
        setFileToDelete(selectedFile);
        setShowFileModal(false);
        setShowPasswordModal(true);
        setPassword(''); // Limpiar contraseña anterior
    };

    // NUEVO: Verificar contraseña y proceder con la eliminación
    const handlePasswordSubmit = () => {
        setAuthLoading(true);
        
        // Simular un pequeño delay para mejor UX
        setTimeout(() => {
            if (password === DELETE_PASSWORD) {
                // Contraseña correcta
                setAuthLoading(false);
                setShowPasswordModal(false);
                
                // Mostrar alerta de confirmación
                Alert.alert(
                    'Eliminar Archivo',
                    `¿Estás seguro de eliminar "${fileToDelete?.name}" del servidor?`,
                    [
                        { 
                            text: 'Cancelar', 
                            style: 'cancel',
                            onPress: () => {
                                setFileToDelete(null);
                                setPassword('');
                            }
                        },
                        {
                            text: 'Eliminar',
                            style: 'destructive',
                            onPress: async () => {
                                if (fileToDelete) {
                                    try {
                                        const success = await deleteFileFromSupabase(fileToDelete.fileName);
                                        if (success) {
                                            await loadFiles();
                                            Toast.show({
                                                type: 'success',
                                                text1: '✅ Archivo eliminado',
                                                text2: `${fileToDelete.name} se eliminó correctamente`
                                            });
                                        }
                                    } catch (error) {
                                        console.error('Error eliminando archivo:', error);
                                        Toast.show({
                                            type: 'error',
                                            text1: 'Error',
                                            text2: 'No se pudo eliminar el archivo'
                                        });
                                    } finally {
                                        setFileToDelete(null);
                                        setPassword('');
                                    }
                                }
                            }
                        }
                    ]
                );
            } else {
                // Contraseña incorrecta
                setAuthLoading(false);
                Toast.show({
                    type: 'error',
                    text1: '❌ Acceso denegado',
                    text2: 'Contraseña incorrecta'
                });
                setPassword('');
            }
        }, 800); // Delay de 800ms para mostrar el loading
    };

    // Cancelar eliminación
    const handleCancelDelete = () => {
        setShowPasswordModal(false);
        setPassword('');
        setFileToDelete(null);
        setAuthLoading(false);
    };

    const formatFileSize = (bytes: number): string => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('pdf')) return 'file-pdf-box';
        if (mimeType.includes('image')) return 'image';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) 
        return 'file-excel';
        if (mimeType.includes('document') || mimeType.includes('word')) 
        return 'file-word';
        if (mimeType.includes('text')) return 'file-document-outline';
        return 'database';
    };

    const renderFileItem = ({ item }: { item: SupabaseFile }) => (
        <TouchableOpacity
            style={stylessupabase.fileItem}
            onPress={() => handleFilePress(item)}
            activeOpacity={0.7}
        >
            <View style={stylessupabase.fileIconContainer}>
                <MaterialCommunityIcons
                    name={getFileIcon(item.mimeType)}
                    size={32}
                    color="#05aaca"
                />
            </View>
    
            <View style={stylessupabase.fileInfo}>
                <Text style={stylessupabase.fileName} numberOfLines={2}>
                    {item.name}
                </Text>
                
                <View style={stylessupabase.fileMeta}>
                    {item.createdTime && (
                        <View style={stylessupabase.metaItem}>
                            <Icon name="calendar-today" size={12} color="#6B7280" />
                            <Text style={stylessupabase.metaText}>
                                {formatDate(item.createdTime)}
                            </Text>
                        </View>
                    )}
                
                    {item.size && (
                        <View style={stylessupabase.metaItem}>
                            <Icon name="storage" size={12} color="#6B7280" />
                            <Text style={stylessupabase.metaText}>
                                {formatFileSize(parseInt(item.size))}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={stylessupabase.container}>
            {/* Header */}
            <View style={stylessupabase.header}>
                <View style={stylessupabase.headerTitleContainer}>
                    <MaterialCommunityIcons name="database" size={32} color="#3ECF8E" />
                    <View>
                        <Text style={stylessupabase.headerTitle}>Servidor Compartido</Text>
                        <Text style={stylessupabase.userEmail}>
                            Archivos disponibles para todo el equipo
                        </Text>
                    </View>
                </View>
            </View>

            {/* Contenido */}
            {isLoading && files.length === 0 ? (
                <View style={stylessupabase.loadingContainer}>
                    <ActivityIndicator size="large" color="#3ECF8E" />
                    <Text style={stylessupabase.loadingText}>
                        Conectando con el servidor...
                    </Text>
                </View>
            ) : files.length === 0 ? (
                <View style={stylessupabase.emptyContainer}>
                    <MaterialCommunityIcons 
                        name="database-arrow-up-outline" 
                        size={80} 
                        color="#9CA3AF" 
                    />
                    <Text style={stylessupabase.emptyTitle}>Servidor vacío</Text>
                    <Text style={stylessupabase.emptyText}>
                        Sube reportes para compartirlos con tu equipo
                    </Text>
                
                    <TouchableOpacity
                        style={[stylessupabase.uploadButtonLarge, uploading && { opacity: 0.7 }]}
                        onPress={handleSelectAndUpload}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="upload" size={20} color="white" />
                                <Text style={stylessupabase.uploadButtonText}>
                                    Subir Reporte
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                
                    <TouchableOpacity
                        style={stylessupabase.refreshButton}
                        onPress={loadFiles}
                    >
                        <Icon name="refresh" size={20} color="white" />
                        <Text style={stylessupabase.refreshButtonText}>Actualizar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={files}
                    renderItem={renderFileItem}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#cf3e3e']}
                            tintColor="#cf3e3e"
                        />
                    }
                    contentContainerStyle={stylessupabase.listContainer}
                    ListHeaderComponent={
                        <View style={stylessupabase.statsContainer}>
                            <Text style={stylessupabase.statsText}>
                                {files.length} archivos en el servidor
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Modal de opciones de archivo */}
            <Modal
                visible={showFileModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowFileModal(false)}
            >
                <View style={stylessupabase.fileModalOverlay}>
                    <View style={stylessupabase.fileModalContent}>
                        <TouchableOpacity
                            style={stylessupabase.modalCloseButton}
                            onPress={() => setShowFileModal(false)}
                        >
                            <Icon name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                        
                        {selectedFile && (
                            <>
                                <View style={stylessupabase.modalFileHeader}>
                                    <MaterialCommunityIcons
                                        name={getFileIcon(selectedFile.mimeType)}
                                        size={48}
                                        color="#05aaca"
                                    />
                                    <Text style={stylessupabase.modalFileName}>
                                        {selectedFile.name}
                                    </Text>
                                
                                    <View style={stylessupabase.modalFileMeta}>
                                        {selectedFile.createdTime && (
                                            <Text style={stylessupabase.modalFileMetaText}>
                                                <Icon name="calendar-today" size={12} />{' '}
                                                Subido: {formatDate(selectedFile.createdTime)}
                                            </Text>
                                        )}
                                        
                                        {selectedFile.size && (
                                            <Text style={stylessupabase.modalFileMetaText}>
                                                <Icon name="storage" size={12} />{' '}
                                                Tamaño: {formatFileSize(parseInt(selectedFile.size))}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={stylessupabase.modalActions}>
                                    <TouchableOpacity
                                        style={stylessupabase.modalActionButton}
                                        onPress={handleViewOnline}
                                    >
                                        <Icon name="visibility" size={24} color="#3B82F6" />
                                        <Text style={stylessupabase.modalActionText}>Ver en línea</Text>
                                    </TouchableOpacity>
                                
                                    <TouchableOpacity
                                        style={stylessupabase.modalActionButton}
                                        onPress={handleShare}
                                    >
                                        <Icon name="share" size={24} color="#8B5CF6" />
                                        <Text style={stylessupabase.modalActionText}>Compartir</Text>
                                    </TouchableOpacity>
                                
                                    <TouchableOpacity
                                        style={stylessupabase.modalActionButton}
                                        onPress={handleDelete}
                                    >
                                        <Icon name="delete" size={24} color="#EF4444" />
                                        <Text style={[stylessupabase.modalActionText, { color: '#EF4444' }]}>
                                            Eliminar
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal de contraseña */}
            <Modal
                visible={showPasswordModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCancelDelete}
            >
                <View style={stylessupabase.modalOverlay}>
                    <View style={stylessupabase.passwordModalContent}>
                        <View style={stylessupabase.passwordModalHeader}>
                            <MaterialCommunityIcons 
                                name="shield-lock" 
                                size={48} 
                                color="#EF4444" 
                            />
                            <Text style={stylessupabase.passwordModalTitle}>
                                Eliminar Archivo
                            </Text>
                            <Text style={stylessupabase.passwordModalSubtitle}>
                                Ingresa la contraseña de administrador
                            </Text>
                        </View>
                        
                        <TextInput
                            style={stylessupabase.passwordInput}
                            placeholder="Contraseña"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoFocus
                            editable={!authLoading}
                        />
                        
                        <View style={stylessupabase.passwordModalButtons}>
                            <TouchableOpacity
                                style={stylessupabase.passwordCancelButton}
                                onPress={handleCancelDelete}
                                disabled={authLoading}
                            >
                                <Text style={stylessupabase.passwordCancelButtonText}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    stylessupabase.passwordConfirmButton,
                                    (!password || authLoading) && { opacity: 0.5 }
                                ]}
                                onPress={handlePasswordSubmit}
                                disabled={!password || authLoading}
                            >
                                {authLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <Icon name="delete" size={18} color="white" />
                                        <Text style={stylessupabase.passwordConfirmButtonText}>
                                            Eliminar
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Loading Overlay */}
            <Modal
                visible={isLoading && !refreshing}
                transparent={true}
                animationType="fade"
            >
                <View style={stylessupabase.loadingOverlay}>
                    <View style={stylessupabase.loadingContent}>
                        <ActivityIndicator size="large" color="#3ECF8E" />
                        <Text style={stylessupabase.loadingText}>Procesando...</Text>
                    </View>
                </View>
            </Modal>

            <Toast />
        </SafeAreaView>
    );
};