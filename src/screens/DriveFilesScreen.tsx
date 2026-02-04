// src/screens/DriveFilesScreen.tsx
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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Sharing from 'expo-sharing';
import { stylesgoogleDrive } from 'src/styles/googleDrive';
import { DriveFile } from 'src/types/googleDrive';
import {
    authenticateGoogleDrive,
    deleteFileFromDrive,
    downloadFileFromDrive,
    isAuthenticated,
    listDriveFiles,
    logoutFromDrive
} from 'src/services/googleDriveServices';

export const DriveFilesScreen = () => {
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
    const [showFileModal, setShowFileModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(!isAuthenticated());

    // Cargar archivos al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            console.log('🔍 useFocusEffect ejecutado');
            
            if (isAuthenticated()) {
                console.log('✅ Usuario autenticado, cargando archivos...');
                loadFiles();
            } else {
                console.log('🔒 Usuario NO autenticado, mostrando modal');
                setShowAuthModal(true);
                // IMPORTANTE: Limpiar loading si no hay autenticación
                setIsLoading(false);
            }
        }, [])
    );

    useEffect(() => {
        // Si el modal de autenticación está visible y estamos loading, detenerlo
        if (showAuthModal && isLoading) {
            console.log('🔄 Deteniendo loading porque se muestra modal de auth');
            setIsLoading(false);
        }
    }, [showAuthModal, isLoading]);

    const loadFiles = async () => {
        // Verificar autenticación antes de cargar
        if (!isAuthenticated()) {
            console.log('⚠️  No autenticado, no se pueden cargar archivos');
            setIsLoading(false);
            setRefreshing(false);
            setShowAuthModal(true);
            return;
        }
        
        try {
            console.log('🔄 Iniciando carga de archivos...');
            setIsLoading(true);
            
            const driveFiles = await listDriveFiles();
            console.log(`✅ Archivos obtenidos: ${driveFiles.length}`);
            
            setFiles(driveFiles);
        } catch (error) {
            console.error('❌ Error cargando archivos:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudieron cargar los archivos'
            });
        } finally {
            console.log('🏁 Finalizando carga de archivos');
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadFiles();
    };

    const handleAuth = async () => {
        console.log('🔐 Intentando autenticar...');
        setIsLoading(true); // Mostrar loading durante la autenticación
        
        const success = await authenticateGoogleDrive();
        
        if (success) {
            console.log('✅ Autenticación exitosa');
            setShowAuthModal(false);
            await loadFiles(); // Cargar archivos después de autenticar
        } else {
            console.log('❌ Autenticación fallida');
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo conectar con Google Drive'
            });
        }
        
        setIsLoading(false);
    };

    const handleFilePress = (file: DriveFile) => {
        setSelectedFile(file);
        setShowFileModal(true);
    };

    const handleViewOnline = () => {
        if (selectedFile?.webViewLink) {
            // Usar Linking para abrir en navegador
            import('react-native').then(({ Linking }) => {
                Linking.openURL(selectedFile.webViewLink!);
            });
        }
        setShowFileModal(false);
    };

    const handleDownload = async () => {
        if (!selectedFile) return;
    
        try {
            setIsLoading(true);
            const localUri = await downloadFileFromDrive(selectedFile.id, selectedFile.name);
            
            if (localUri) {
                // Compartir/abrir el archivo
                await Sharing.shareAsync(localUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Abrir ${selectedFile.name}`,
                    UTI: 'public.pdf'
                });
            }
        } catch (error) {
            console.error('Error descargando:', error);
        } finally {
            setIsLoading(false);
            setShowFileModal(false);
        }
    };

    const handleDelete = () => {
        if (!selectedFile) return;
    
        Alert.alert(
            'Eliminar Archivo',
            `¿Estás seguro de eliminar "${selectedFile.name}"? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteFileFromDrive(selectedFile.id);
                        if (success) {
                            loadFiles(); // Recargar lista
                        }
                        setShowFileModal(false);
                    }
                }
            ]
        );
    };

    const formatFileSize = (bytes: number): string => {
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
        if (mimeType.includes('spreadsheet')) return 'file-excel';
        if (mimeType.includes('document')) return 'file-word';
        return 'file-document';
    };

    const renderFileItem = ({ item }: { item: DriveFile }) => (
        <TouchableOpacity
            style={stylesgoogleDrive.fileItem}
            onPress={() => handleFilePress(item)}
            activeOpacity={0.7}
        >
            <View style={stylesgoogleDrive.fileIconContainer}>
                <MaterialCommunityIcons
                    name={getFileIcon(item.mimeType)}
                    size={32}
                    color="#EF4444"
                />
            </View>
        
            <View style={stylesgoogleDrive.fileInfo}>
                <Text style={stylesgoogleDrive.fileName} numberOfLines={2}>
                    {item.name}
                </Text>
                
                <View style={stylesgoogleDrive.fileMeta}>
                    {item.createdTime && (
                        <View style={stylesgoogleDrive.metaItem}>
                            <Icon name="calendar-today" size={12} color="#6B7280" />
                            <Text style={stylesgoogleDrive.metaText}>
                                {formatDate(item.createdTime)}
                            </Text>
                        </View>
                    )}
                
                    {item.size && (
                        <View style={stylesgoogleDrive.metaItem}>
                            <Icon name="storage" size={12} color="#6B7280" />
                            <Text style={stylesgoogleDrive.metaText}>
                                {formatFileSize(parseInt(item.size))}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={stylesgoogleDrive.container}>
            {/* Header */}
            <View style={stylesgoogleDrive.header}>
                <View style={stylesgoogleDrive.headerTitleContainer}>
                    <MaterialCommunityIcons name="google-drive" size={32} color="#4285F4" />
                    <Text style={stylesgoogleDrive.headerTitle}>Google Drive</Text>
                </View>
                
                <TouchableOpacity
                    style={stylesgoogleDrive.logoutButton}
                    onPress={() => {
                        logoutFromDrive();
                        setShowAuthModal(true);
                    }}
                >
                    <Icon name="logout" size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {/* Contenido */}
            {!showAuthModal && isLoading && files.length === 0 ? ( // SOLO mostrar loading si NO está mostrando el modal
                <View style={stylesgoogleDrive.loadingContainer}>
                    <ActivityIndicator size="large" color="#4285F4" />
                    <Text style={stylesgoogleDrive.loadingText}>Cargando archivos...</Text>
                </View>
            ) : !showAuthModal && files.length === 0 ? ( // SOLO mostrar "no hay archivos" si NO está mostrando el modal
                <View style={stylesgoogleDrive.emptyContainer}>
                    <MaterialCommunityIcons name="folder-open-outline" size={80} color="#9CA3AF" />
                    <Text style={stylesgoogleDrive.emptyTitle}>No hay archivos</Text>
                    <Text style={stylesgoogleDrive.emptyText}>
                        Los reportes que guardes aparecerán aquí
                    </Text>
                    <TouchableOpacity
                        style={stylesgoogleDrive.refreshButton}
                        onPress={loadFiles}
                    >
                        <Icon name="refresh" size={20} color="white" />
                        <Text style={stylesgoogleDrive.refreshButtonText}>Actualizar</Text>
                    </TouchableOpacity>
                </View>
            ) : !showAuthModal ? ( // SOLO mostrar lista si NO está mostrando el modal
                <FlatList
                    data={files}
                    renderItem={renderFileItem}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#4285F4']}
                            tintColor="#4285F4"
                        />
                    }
                    contentContainerStyle={stylesgoogleDrive.listContainer}
                />
            ) : null} {/* No mostrar nada si el modal está visible */}

            {/* Modal de autenticación */}
            <Modal
                visible={showAuthModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => !isAuthenticated() && setShowAuthModal(true)}
            >
                <View style={stylesgoogleDrive.authModalOverlay}>
                    <View style={stylesgoogleDrive.authModalContent}>
                        <MaterialCommunityIcons 
                            name="google-drive" 
                            size={60} 
                            color="#4285F4" 
                        />
                        
                        <Text style={stylesgoogleDrive.authTitle}>Conectar con Google Drive</Text>
                        
                        <Text style={stylesgoogleDrive.authDescription}>
                            Conecta tu cuenta de Google Drive para guardar y acceder a tus reportes desde cualquier dispositivo
                        </Text>

                        <View style={stylesgoogleDrive.authFeatures}>
                            <View style={stylesgoogleDrive.featureItem}>
                                <Icon name="cloud-upload" size={20} color="#10B981" />
                                <Text style={stylesgoogleDrive.featureText}>Guarda automáticamente tus reportes</Text>
                            </View>
                        
                            <View style={stylesgoogleDrive.featureItem}>
                                <Icon name="smartphone" size={20} color="#3B82F6" />
                                <Text style={stylesgoogleDrive.featureText}>Accede desde cualquier dispositivo</Text>
                            </View>
                        
                            <View style={stylesgoogleDrive.featureItem}>
                                <Icon name="security" size={20} color="#8B5CF6" />
                                <Text style={stylesgoogleDrive.featureText}>Tus datos están seguros y encriptados</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={stylesgoogleDrive.googleButton}
                            onPress={handleAuth}
                        >
                            <Image
                                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
                                style={stylesgoogleDrive.googleIcon}
                            />
                            <Text style={stylesgoogleDrive.googleButtonText}>
                                Conectar con Google
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={stylesgoogleDrive.skipButton}
                            onPress={() => {
                                console.log('⏭️  Saltando autenticación');
                                setShowAuthModal(false);
                                setIsLoading(false); // Asegurar que loading se detenga
                            }}
                        >
                            <Text style={stylesgoogleDrive.skipButtonText}>
                                Ahora no, tal vez después
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal de opciones de archivo */}
            <Modal
                visible={showFileModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowFileModal(false)}
            >
                <View style={stylesgoogleDrive.fileModalOverlay}>
                    <View style={stylesgoogleDrive.fileModalContent}>
                        <TouchableOpacity
                            style={stylesgoogleDrive.modalCloseButton}
                            onPress={() => setShowFileModal(false)}
                        >
                            <Icon name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                        
                        {selectedFile && (
                            <>
                                <View style={stylesgoogleDrive.modalFileHeader}>
                                    <MaterialCommunityIcons
                                        name={getFileIcon(selectedFile.mimeType)}
                                        size={48}
                                        color="#4285F4"
                                    />
                                    <Text style={stylesgoogleDrive.modalFileName}>
                                        {selectedFile.name}
                                    </Text>
                                
                                    <View style={stylesgoogleDrive.modalFileMeta}>
                                        {selectedFile.createdTime && (
                                            <Text style={stylesgoogleDrive.modalFileMetaText}>
                                                <Icon name="calendar-today" size={12} />{' '}
                                                Creado: {formatDate(selectedFile.createdTime)}
                                            </Text>
                                        )}
                                        
                                        {selectedFile.size && (
                                            <Text style={stylesgoogleDrive.modalFileMetaText}>
                                                <Icon name="storage" size={12} />{' '}
                                                Tamaño: {formatFileSize(parseInt(selectedFile.size))}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={stylesgoogleDrive.modalActions}>
                                    {selectedFile.webViewLink && (
                                        <TouchableOpacity
                                            style={stylesgoogleDrive.modalActionButton}
                                            onPress={handleViewOnline}
                                        >
                                            <Icon name="visibility" size={24} color="#3B82F6" />
                                            <Text style={stylesgoogleDrive.modalActionText}>Ver en línea</Text>
                                        </TouchableOpacity>
                                    )}
                                
                                    <TouchableOpacity
                                        style={stylesgoogleDrive.modalActionButton}
                                        onPress={handleDownload}
                                    >
                                        <Icon name="file-download" size={24} color="#10B981" />
                                        <Text style={stylesgoogleDrive.modalActionText}>Descargar</Text>
                                    </TouchableOpacity>
                                
                                    <TouchableOpacity
                                        style={stylesgoogleDrive.modalActionButton}
                                        onPress={handleDelete}
                                    >
                                        <Icon name="delete" size={24} color="#EF4444" />
                                        <Text style={[stylesgoogleDrive.modalActionText, { color: '#EF4444' }]}>
                                            Eliminar
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Loading Overlay */}
            <Modal
                visible={isLoading && !refreshing && !showAuthModal} // NO mostrar si el modal de auth está visible
                transparent={true}
                animationType="fade"
            >
                <View style={stylesgoogleDrive.loadingOverlay}>
                    <View style={stylesgoogleDrive.loadingContent}>
                        <ActivityIndicator size="large" color="#4285F4" />
                        <Text style={stylesgoogleDrive.loadingText}>Procesando...</Text>
                    </View>
                </View>
            </Modal>

            <Toast />
        </SafeAreaView>
    );
};