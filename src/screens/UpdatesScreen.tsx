import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { AppUpdate } from 'src/types/updates';
import { stylesupdates } from 'src/styles/updates';

export const UpdatesScreen = () => {
    const [checking, setChecking] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [hasUpdate, setHasUpdate] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<AppUpdate | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [appVersion, setAppVersion] = useState('1.0.0');

    useEffect(() => {
        getCurrentVersion();
        checkForUpdates();
    }, []);

    const getCurrentVersion = async () => {
        try {
            const version = await AsyncStorage.getItem('app_version');
            if (version) {
                setAppVersion(version);
            } else {
                // Si no hay versión guardada, usar la versión por defecto
                await AsyncStorage.setItem('app_version', '1.0.0');
            }
        } catch (error) {
            console.error('Error getting app version:', error);
        }
    };

    const checkForUpdates = async () => {
        setChecking(true);
        try {
            // En desarrollo, simular actualizaciones
            if (__DEV__) {
                // Simular una actualización disponible
                setTimeout(() => {
                    setHasUpdate(true);
                    setUpdateInfo({
                        version: '1.1.0',
                        date: '2024-12-15',
                        changes: [
                        'Nueva función de recordatorios por WhatsApp',
                        'Mejoras en la interfaz de usuario',
                        'Corrección de errores menores',
                        'Optimización del rendimiento'
                        ],
                        mandatory: false,
                        size: '15 MB'
                    });
                    setChecking(false);
                }, 1500);
                return;
            }

            // En producción, usar expo-updates
            const update = await Updates.checkForUpdateAsync();
            setHasUpdate(update.isAvailable);
        
            if (update.isAvailable && update.manifest) {
                // Usar información del manifest de manera segura
                const manifest = update.manifest as any;
                setUpdateInfo({
                    version: manifest.version || '1.0.0',
                    date: new Date().toISOString().split('T')[0],
                    changes: manifest.extra?.changelog || ['Mejoras generales'],
                    mandatory: manifest.extra?.mandatory || false,
                    size: manifest.extra?.size || 'N/A'
                });
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo verificar actualizaciones',
            });
        } finally {
            setChecking(false);
        }
    };

    const handleUpdate = async () => {
        if (!updateInfo) return;

        if (updateInfo.downloadUrl) {
            // Si hay URL de descarga externa
            Alert.alert(
                'Actualización Disponible',
                `Versión ${updateInfo.version} está disponible (${updateInfo.size}). ¿Quieres descargarla?`,
                [
                    { text: 'Cancelar', style: 'cancel' as const },
                    {
                        text: 'Descargar',
                        onPress: () => {
                            if (updateInfo.downloadUrl) {
                                Linking.openURL(updateInfo.downloadUrl);
                            }
                        }
                    }
                ]
            );
        } else {
            // Actualización OTA (Over The Air)
            const alertButtons: any[] = updateInfo.mandatory 
                ? [
                    {
                        text: 'Actualizar',
                        onPress: async () => {
                            setUpdating(true);
                            try {
                                // Para OTA updates con Expo
                                await Updates.fetchUpdateAsync();
                                await Updates.reloadAsync();
                            } catch (error) {
                                console.error('Error updating app:', error);
                                Toast.show({
                                    type: 'error',
                                    text1: 'Error',
                                    text2: 'No se pudo completar la actualización',
                                });
                            } finally {
                                setUpdating(false);
                            }
                        }
                    }
                ]
                : [
                    { text: 'Más tarde', style: 'cancel' as const },
                    {
                        text: 'Actualizar',
                        onPress: async () => {
                            setUpdating(true);
                            try {
                                // Para OTA updates con Expo
                                await Updates.fetchUpdateAsync();
                                await Updates.reloadAsync();
                            } catch (error) {
                                console.error('Error updating app:', error);
                                Toast.show({
                                    type: 'error',
                                    text1: 'Error',
                                    text2: 'No se pudo completar la actualización',
                                });
                            } finally {
                                setUpdating(false);
                            }
                        }
                    }
                ];

            Alert.alert(
                updateInfo.mandatory ? 'Actualización Obligatoria' : 'Actualización Disponible',
                `Versión ${updateInfo.version} está disponible (${updateInfo.size}). ¿Quieres actualizar ahora?`,
                alertButtons
            );
        }
    };

    const createBackup = async () => {
        Alert.alert(
            'Crear Respaldo',
            '¿Quieres crear un respaldo de tus datos antes de actualizar?',
            [
                { text: 'Cancelar', style: 'cancel' as const },
                {
                    text: 'Crear Respaldo',
                    onPress: async () => {
                        try {
                            // Obtener todos los datos de AsyncStorage
                            const keys = await AsyncStorage.getAllKeys();
                            const data = await AsyncStorage.multiGet(keys);
                            
                            // Crear objeto con los datos
                            const backupData: Record<string, any> = {};
                            data.forEach(([key, value]) => {
                                try {
                                    backupData[key] = value ? JSON.parse(value) : null;
                                } catch {
                                    backupData[key] = value;
                                }
                            });
                            
                            // Convertir a JSON string
                            const backupString = JSON.stringify(backupData, null, 2);
                            
                            // Guardar en AsyncStorage como respaldo
                            await AsyncStorage.setItem('app_backup', backupString);
                            
                            Toast.show({
                                type: 'success',
                                text1: 'Éxito',
                                text2: 'Respaldo creado y guardado localmente',
                            });
                        } catch (error) {
                            console.error('Error creating backup:', error);
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'No se pudo crear el respaldo',
                            });
                        }
                    }
                }
            ]
        );
    };

    const restoreBackup = async () => {
        Alert.alert(
            'Restaurar Respaldo',
            'Importante: Esto sobrescribirá tus datos actuales. ¿Continuar?',
            [
                { text: 'Cancelar', style: 'cancel' as const },
                {
                    text: 'Restaurar',
                    onPress: async () => {
                        try {
                            // Aquí implementarías la lógica para seleccionar un archivo JSON
                            // y restaurar los datos en AsyncStorage
                            Toast.show({
                                type: 'info',
                                text1: 'Información',
                                text2: 'Función de restauración en desarrollo',
                            });
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'No se pudo restaurar el respaldo',
                            });
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={stylesupdates.container}>
            {/* Current Version */}
            <View style={stylesupdates.currentVersionCard}>
                <View style={stylesupdates.versionHeader}>
                    <Icon name="info" size={24} color="#2196F3" />
                    <Text style={stylesupdates.versionTitle}>Versión Actual</Text>
                </View>
                <Text style={stylesupdates.versionNumber}>{appVersion}</Text>
                <Text style={stylesupdates.versionInfo}>
                    Última verificación: {new Date().toLocaleDateString()}
                </Text>
            </View>

            {/* Update Status */}
            <View style={stylesupdates.updateStatusCard}>
                <View style={stylesupdates.statusHeader}>
                    {checking ? (
                        <ActivityIndicator size="small" color="#2196F3" />
                    ) : hasUpdate ? (
                        <Icon name="system-update" size={24} color="#FF5722" />
                    ) : (
                        <Icon name="check-circle" size={24} color="#4CAF50" />
                    )}
                    <Text style={stylesupdates.statusTitle}>
                        {checking ? 'Verificando...' : 
                        hasUpdate ? 'Actualización Disponible' : 'Estás al día'}
                    </Text>
                </View>
                
                {checking ? (
                    <Text style={stylesupdates.statusDescription}>
                        Buscando actualizaciones...
                    </Text>
                    ) : hasUpdate && updateInfo ? (
                    <View>
                        <Text style={stylesupdates.updateVersion}>
                            Nueva versión: {updateInfo.version}
                        </Text>
                        <Text style={stylesupdates.updateSize}>
                            Tamaño: {updateInfo.size} • {updateInfo.mandatory ? 'Obligatoria' : 'Opcional'}
                        </Text>
                        
                        <View style={stylesupdates.changesContainer}>
                            <Text style={stylesupdates.changesTitle}>Novedades:</Text>
                            {updateInfo.changes.map((change, index) => (
                                <View key={index} style={stylesupdates.changeItem}>
                                    <Icon name="arrow-right" size={16} color="#4CAF50" />
                                    <Text style={stylesupdates.changeText}>{change}</Text>
                                </View>
                            ))}
                        </View>
                        
                        <TouchableOpacity
                            style={stylesupdates.updateButton}
                            onPress={handleUpdate}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Icon name="download" size={20} color="#fff" />
                            )}
                            <Text style={stylesupdates.updateButtonText}>
                                {updating ? 'Actualizando...' : 'Actualizar Ahora'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <Text style={stylesupdates.statusDescription}>
                            Tienes la última versión de la aplicación.
                        </Text>
                        <TouchableOpacity
                            style={stylesupdates.checkButton}
                            onPress={checkForUpdates}
                            disabled={checking}
                        >
                            <Icon name="refresh" size={20} color="#fff" />
                            <Text style={stylesupdates.checkButtonText}>
                                {checking ? 'Verificando...' : 'Buscar Actualizaciones'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Backup Section */}
            <View style={stylesupdates.backupSection}>
                <Text style={stylesupdates.sectionTitle}>Respaldo de Datos</Text>
                <Text style={stylesupdates.sectionDescription}>
                    Crea un respaldo antes de actualizar para proteger tus datos.
                </Text>

                <View style={stylesupdates.backupButtons}>
                    <TouchableOpacity
                        style={stylesupdates.backupButton}
                        onPress={createBackup}
                    >
                        <Icon name="save" size={24} color="#fff" />
                        <Text style={stylesupdates.backupButtonText}>Crear Respaldo</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[stylesupdates.backupButton, stylesupdates.restoreButton]}
                        onPress={restoreBackup}
                    >
                        <Icon name="restore" size={24} color="#fff" />
                        <Text style={stylesupdates.backupButtonText}>Restaurar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Update Progress */}
            {updating && downloadProgress > 0 && (
                <View style={stylesupdates.progressContainer}>
                    <Text style={stylesupdates.progressText}>
                        Descargando: {Math.round(downloadProgress)}%
                    </Text>
                    <View style={stylesupdates.progressBar}>
                        <View 
                            style={[stylesupdates.progressFill, { width: `${downloadProgress}%` }]} 
                        />
                    </View>
                </View>
            )}

            {/* Tips */}
            <View style={stylesupdates.tipsSection}>
                <Text style={stylesupdates.tipsTitle}>Consejos:</Text>
                <View style={stylesupdates.tipItem}>
                    <Icon name="wifi" size={20} color="#2196F3" />
                    <Text style={stylesupdates.tipText}>
                        Conéctate a WiFi para descargas más rápidas
                    </Text>
                </View>
                <View style={stylesupdates.tipItem}>
                    <Icon name="battery-charging-full" size={20} color="#4CAF50" />
                    <Text style={stylesupdates.tipText}>
                        Mantén la batería cargada durante la actualización
                    </Text>
                </View>
                <View style={stylesupdates.tipItem}>
                    <Icon name="backup" size={20} color="#9C27B0" />
                    <Text style={stylesupdates.tipText}>
                        Crea un respaldo antes de actualizar
                    </Text>
                </View>
            </View>

            <Toast />
        </ScrollView>
    );
};