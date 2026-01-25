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
import Constants from 'expo-constants';
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
            // Obtener versión actual del manifest
            const currentVersion = Constants.expoConfig?.version || '1.0.0';
            setAppVersion(currentVersion);
            
            // Guardar en AsyncStorage para referencia
            await AsyncStorage.setItem('app_version', currentVersion);
        } catch (error) {
            console.error('Error getting app version:', error);
            setAppVersion('1.0.0');
        }
    };

    const checkForUpdates = async () => {
        setChecking(true);
        try {
            // En desarrollo, mostrar información simulada
            if (__DEV__) {
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

            // En producción, verificar actualizaciones reales
            console.log('🔍 Verificando actualizaciones...');
            const update = await Updates.checkForUpdateAsync();
            console.log('✅ Resultado de verificación:', update);
            
            setHasUpdate(update.isAvailable);
            
            if (update.isAvailable) {
                if (update.manifest) {
                    const manifest = update.manifest as any;
                    setUpdateInfo({
                        version: manifest.version || '1.1.0',
                        date: new Date().toISOString().split('T')[0],
                        changes: manifest.metadata?.expoClient?.extra?.changelog || 
                               manifest.extra?.changelog || 
                               ['Mejoras generales y corrección de errores'],
                        mandatory: manifest.metadata?.expoClient?.extra?.mandatory || false,
                        size: '15 MB'
                    });
                } else {
                    // Si no hay manifest, mostrar información por defecto
                    setUpdateInfo({
                        version: 'Nueva versión',
                        date: new Date().toISOString().split('T')[0],
                        changes: ['Actualización disponible'],
                        mandatory: false,
                        size: '10-20 MB'
                    });
                }
                
                Toast.show({
                    type: 'success',
                    text1: 'Actualización disponible',
                    text2: 'Hay una nueva versión para descargar',
                });
            } else {
                Toast.show({
                    type: 'info',
                    text1: 'Sin actualizaciones',
                    text2: 'Ya tienes la última versión',
                });
            }
        } catch (error: any) {
            console.error('❌ Error checking for updates:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo verificar actualizaciones',
            });
            
            // En caso de error, mostrar información simulada
            setHasUpdate(true);
            setUpdateInfo({
                version: '1.1.0',
                date: '2024-12-15',
                changes: ['Descarga manual disponible'],
                mandatory: false,
                size: '15 MB',
                downloadUrl: 'https://expo.dev/accounts/[tu-usuario]/projects/baalakapps/builds'
            });
        } finally {
            setChecking(false);
        }
    };

    const handleUpdate = async () => {
        if (!updateInfo) return;

        // Si estamos en desarrollo, simular actualización
        if (__DEV__) {
            Alert.alert(
                'Modo Desarrollo',
                'En desarrollo, las actualizaciones OTA están deshabilitadas. Compila una nueva versión.',
                [
                    { text: 'Entendido', style: 'cancel' }
                ]
            );
            return;
        }

        Alert.alert(
            updateInfo.mandatory ? 'Actualización Obligatoria' : 'Actualización Disponible',
            `Versión ${updateInfo.version} está disponible (${updateInfo.size}).\n\n¿Quieres descargar e instalar ahora?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Actualizar',
                    onPress: async () => {
                        setUpdating(true);
                        setDownloadProgress(0);
                        
                        try {
                            console.log('⬇️  Iniciando descarga de actualización...');
                            
                            // Configurar intervalo para simular progreso
                            const progressInterval = setInterval(() => {
                                setDownloadProgress(prev => {
                                    if (prev >= 100) {
                                        clearInterval(progressInterval);
                                        return 100;
                                    }
                                    return prev + 10;
                                });
                            }, 500);
                            
                            // Descargar la actualización
                            await Updates.fetchUpdateAsync();
                            
                            clearInterval(progressInterval);
                            setDownloadProgress(100);
                            
                            // Pequeña pausa para mostrar 100%
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            console.log('✅ Actualización descargada, reiniciando...');
                            
                            Toast.show({
                                type: 'success',
                                text1: 'Actualización lista',
                                text2: 'Reiniciando aplicación para aplicar cambios...',
                            });
                            
                            // Reiniciar la aplicación
                            await Updates.reloadAsync();
                            
                        } catch (error: any) {
                            console.error('❌ Error durante la actualización:', error);
                            
                            Toast.show({
                                type: 'error',
                                text1: 'Error en actualización',
                                text2: error.message || 'No se pudo completar la actualización',
                            });
                            
                            // Ofrecer descarga manual como alternativa
                            Alert.alert(
                                'Error de Actualización',
                                'No se pudo completar la actualización automática. ¿Quieres descargar manualmente?',
                                [
                                    { text: 'Cancelar', style: 'cancel' },
                                    {
                                        text: 'Descargar',
                                        onPress: () => {
                                            Linking.openURL('https://expo.dev/accounts/[tu-usuario]/projects/baalakapps/builds');
                                        }
                                    }
                                ]
                            );
                        } finally {
                            setUpdating(false);
                            setDownloadProgress(0);
                        }
                    }
                }
            ]
        );
    };

    const handleManualDownload = () => {
        Alert.alert(
            'Descarga Manual',
            'Serás redirigido a la página de builds para descargar la última versión.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Continuar',
                    onPress: () => {
                        Linking.openURL('https://expo.dev/accounts/[tu-usuario]/projects/baalakapps/builds');
                    }
                }
            ]
        );
    };

    const createBackup = async () => {
        Alert.alert(
            'Crear Respaldo',
            '¿Quieres crear un respaldo de tus datos antes de actualizar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Crear Respaldo',
                    onPress: async () => {
                        try {
                            // Obtener todos los datos de AsyncStorage
                            const keys = await AsyncStorage.getAllKeys();
                            const data = await AsyncStorage.multiGet(keys);
                            
                            // Crear objeto con los datos
                            const backupData: Record<string, any> = {
                                timestamp: new Date().toISOString(),
                                version: appVersion,
                                data: {}
                            };
                            
                            data.forEach(([key, value]) => {
                                try {
                                    backupData.data[key] = value ? JSON.parse(value) : null;
                                } catch {
                                    backupData.data[key] = value;
                                }
                            });
                            
                            // Convertir a JSON string
                            const backupString = JSON.stringify(backupData, null, 2);
                            
                            // Guardar en AsyncStorage como respaldo
                            await AsyncStorage.setItem('app_backup', backupString);
                            
                            Toast.show({
                                type: 'success',
                                text1: '✅ Respaldo creado',
                                text2: 'Datos guardados localmente',
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
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Restaurar',
                    onPress: async () => {
                        try {
                            const backupString = await AsyncStorage.getItem('app_backup');
                            
                            if (!backupString) {
                                Toast.show({
                                    type: 'info',
                                    text1: 'Sin respaldo',
                                    text2: 'No hay respaldos guardados',
                                });
                                return;
                            }
                            
                            const backupData = JSON.parse(backupString);
                            
                            Alert.alert(
                                'Confirmar Restauración',
                                `Restaurar respaldo del ${new Date(backupData.timestamp).toLocaleDateString()} (v${backupData.version})?`,
                                [
                                    { text: 'Cancelar', style: 'cancel' },
                                    {
                                        text: 'Restaurar',
                                        onPress: async () => {
                                            try {
                                                const entries = Object.entries(backupData.data);
                                                await AsyncStorage.multiSet(entries as [string, string][]);
                                                
                                                Toast.show({
                                                    type: 'success',
                                                    text1: '✅ Respaldo restaurado',
                                                    text2: 'Datos restaurados exitosamente',
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
                    ID: {Constants.expoConfig?.slug || 'baalakapps'}
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
                        hasUpdate ? '📢 Actualización Disponible' : '✅ Estás al día'}
                    </Text>
                </View>
                
                {checking ? (
                    <View style={stylesupdates.checkingContainer}>
                        <ActivityIndicator size="large" color="#2196F3" />
                        <Text style={stylesupdates.statusDescription}>
                            Buscando actualizaciones...
                        </Text>
                    </View>
                ) : hasUpdate && updateInfo ? (
                    <View>
                        <View style={stylesupdates.updateInfoHeader}>
                            <Text style={stylesupdates.updateVersion}>
                                🚀 Versión {updateInfo.version}
                            </Text>
                            <Text style={stylesupdates.updateDate}>
                                📅 {updateInfo.date}
                            </Text>
                        </View>
                        
                        <Text style={stylesupdates.updateSize}>
                            📦 Tamaño: {updateInfo.size} • 
                            {updateInfo.mandatory ? ' 🔴 Obligatoria' : ' 🟢 Opcional'}
                        </Text>
                        
                        <View style={stylesupdates.changesContainer}>
                            <Text style={stylesupdates.changesTitle}>✨ Novedades:</Text>
                            {updateInfo.changes.map((change, index) => (
                                <View key={index} style={stylesupdates.changeItem}>
                                    <Icon name="check" size={16} color="#4CAF50" />
                                    <Text style={stylesupdates.changeText}>{change}</Text>
                                </View>
                            ))}
                        </View>
                        
                        <View style={stylesupdates.updateButtonsContainer}>
                            <TouchableOpacity
                                style={stylesupdates.updateButton}
                                onPress={handleUpdate}
                                disabled={updating || __DEV__}
                            >
                                {updating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Icon name="download" size={20} color="#fff" />
                                )}
                                <Text style={stylesupdates.updateButtonText}>
                                    {updating ? 'Actualizando...' : 
                                     __DEV__ ? 'Solo Producción' : 'Actualizar Ahora'}
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[stylesupdates.updateButton, stylesupdates.manualButton]}
                                onPress={handleManualDownload}
                            >
                                <Icon name="link" size={20} color="#fff" />
                                <Text style={stylesupdates.updateButtonText}>
                                    Descarga Manual
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View>
                        <Text style={stylesupdates.statusDescription}>
                            ✅ Tienes la última versión de la aplicación.
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

            {/* Update Progress */}
            {updating && (
                <View style={stylesupdates.progressContainer}>
                    <Text style={stylesupdates.progressText}>
                        {downloadProgress < 100 ? '⬇️  Descargando...' : '✅ Listo para instalar'}
                    </Text>
                    <Text style={stylesupdates.progressPercent}>
                        {Math.round(downloadProgress)}%
                    </Text>
                    <View style={stylesupdates.progressBar}>
                        <View 
                            style={[stylesupdates.progressFill, { width: `${downloadProgress}%` }]} 
                        />
                    </View>
                    {downloadProgress >= 100 && (
                        <Text style={stylesupdates.progressComplete}>
                            La app se reiniciará automáticamente...
                        </Text>
                    )}
                </View>
            )}

            {/* Backup Section */}
            <View style={stylesupdates.backupSection}>
                <Text style={stylesupdates.sectionTitle}>💾 Respaldo de Datos</Text>
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

            {/* Tips */}
            <View style={stylesupdates.tipsSection}>
                <Text style={stylesupdates.tipsTitle}>💡 Consejos para actualizar:</Text>
                <View style={stylesupdates.tipItem}>
                    <Icon name="wifi" size={20} color="#2196F3" />
                    <Text style={stylesupdates.tipText}>
                        Conéctate a WiFi para descargas más rápidas
                    </Text>
                </View>
                <View style={stylesupdates.tipItem}>
                    <Icon name="battery-charging-full" size={20} color="#4CAF50" />
                    <Text style={stylesupdates.tipText}>
                        Mantén +50% de batería durante la actualización
                    </Text>
                </View>
                <View style={stylesupdates.tipItem}>
                    <Icon name="backup" size={20} color="#9C27B0" />
                    <Text style={stylesupdates.tipText}>
                        Crea respaldo antes de actualizar versiones mayores
                    </Text>
                </View>
                <View style={stylesupdates.tipItem}>
                    <Icon name="warning" size={20} color="#FF9800" />
                    <Text style={stylesupdates.tipText}>
                        No cierres la app durante la actualización
                    </Text>
                </View>
            </View>

            {/* Dev Info */}
            {__DEV__ && (
                <View style={stylesupdates.devInfo}>
                    <Text style={stylesupdates.devInfoTitle}>🛠️ Modo Desarrollo</Text>
                    <Text style={stylesupdates.devInfoText}>
                        Las actualizaciones OTA solo funcionan en producción.
                        Para probar, compila una versión release.
                    </Text>
                </View>
            )}

            <Toast />
        </ScrollView>
    );
};