import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { styleswhatsAppConnection } from 'src/styles/whatsAppConnection';

const WhatsAppConnectionScreen = () => {
    const navigation = useNavigation();
    const [connecting, setConnecting] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [whatsappConnected, setWhatsappConnected] = useState(false);

    const handleConnectWhatsApp = async () => {
        setConnecting(true);
        try {
            // Simular conexión a WhatsApp
            setTimeout(async () => {
                // Aquí generas o obtienes el QR code real
                // Por ahora, simulamos un QR de ejemplo
                setQrCode('https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=WHATSAPP_CONNECTION_EXAMPLE');
                
                // Simulamos que el usuario escanea el QR
                setTimeout(async () => {
                    await AsyncStorage.setItem('whatsapp_connected', 'true');
                    setWhatsappConnected(true);
                    setQrCode(null);
                    setConnecting(false);
                    
                    Toast.show({
                        type: 'success',
                        text1: '¡Conectado!',
                        text2: 'WhatsApp se conectó exitosamente',
                    });
                }, 3000);
            }, 1500);
        } catch (error) {
            setConnecting(false);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo conectar WhatsApp',
            });
        }
    };

    const handleDisconnectWhatsApp = async () => {
        Alert.alert(
            'Desconectar WhatsApp',
            '¿Estás seguro de que quieres desconectar WhatsApp?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desconectar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('whatsapp_connected');
                            setWhatsappConnected(false);
                            Toast.show({
                                type: 'success',
                                text1: 'Desconectado',
                                text2: 'WhatsApp se desconectó exitosamente',
                            });
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'No se pudo desconectar WhatsApp',
                            });
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styleswhatsAppConnection.container}>
            {/* Header */}
            <View style={styleswhatsAppConnection.header}>
                <TouchableOpacity
                    style={styleswhatsAppConnection.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styleswhatsAppConnection.title}>Conexión WhatsApp</Text>
                <View style={styleswhatsAppConnection.placeholder} />
            </View>

            {/* Status Card */}
            <View style={styleswhatsAppConnection.statusCard}>
                <View style={styleswhatsAppConnection.statusHeader}>
                    <Icon 
                        name="whatsapp" 
                        size={32} 
                        color={whatsappConnected ? "#25D366" : "#ccc"} 
                    />
                    <Text style={styleswhatsAppConnection.statusTitle}>
                        Estado: {whatsappConnected ? 'Conectado' : 'Desconectado'}
                    </Text>
                </View>

                <Text style={styleswhatsAppConnection.statusDescription}>
                    {
                        whatsappConnected
                        ? 'WhatsApp está conectado y listo para enviar recordatorios.'
                        : 'Conecta WhatsApp para poder enviar recordatorios a tus clientes.'
                    }
                </Text>
            </View>

            {/* Connection Section */}
            <View style={styleswhatsAppConnection.connectionSection}>
                {whatsappConnected ? (
                    <TouchableOpacity
                        style={styleswhatsAppConnection.disconnectButton}
                        onPress={handleDisconnectWhatsApp}
                    >
                        <Icon name="link-off" size={24} color="#fff" />
                        <Text style={styleswhatsAppConnection.disconnectButtonText}>Desconectar WhatsApp</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[
                            styleswhatsAppConnection.connectButton,
                            connecting && styleswhatsAppConnection.connectButtonDisabled
                        ]}
                        onPress={handleConnectWhatsApp}
                        disabled={connecting}
                    >
                        <Icon name="link" size={24} color="#fff" />
                        <Text style={styleswhatsAppConnection.connectButtonText}>
                            {connecting ? 'Conectando...' : 'Conectar WhatsApp'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* QR Code Display */}
                {qrCode && (
                    <View style={styleswhatsAppConnection.qrContainer}>
                        <Text style={styleswhatsAppConnection.qrTitle}>Escanea el código QR</Text>
                        <Image
                            source={{ uri: qrCode }}
                            style={styleswhatsAppConnection.qrImage}
                            resizeMode="contain"
                        />
                        <Text style={styleswhatsAppConnection.qrInstructions}>
                            1. Abre WhatsApp en tu teléfono{'\n'}
                            2. Toca Menú → Dispositivos vinculados → Vincular un dispositivo{'\n'}
                            3. Escanea este código QR
                        </Text>
                    </View>
                )}

                {/* Instructions */}
                <View style={styleswhatsAppConnection.instructions}>
                    <Text style={styleswhatsAppConnection.instructionsTitle}>Instrucciones:</Text>
                    <View style={styleswhatsAppConnection.instructionItem}>
                        <Icon name="check-circle" size={20} color="#4CAF50" />
                        <Text style={styleswhatsAppConnection.instructionText}>
                            Usa un teléfono con WhatsApp instalado
                        </Text>
                    </View>
                    <View style={styleswhatsAppConnection.instructionItem}>
                        <Icon name="check-circle" size={20} color="#4CAF50" />
                        <Text style={styleswhatsAppConnection.instructionText}>
                            Escanea el código QR cuando aparezca
                        </Text>
                    </View>
                    <View style={styleswhatsAppConnection.instructionItem}>
                        <Icon name="check-circle" size={20} color="#4CAF50" />
                        <Text style={styleswhatsAppConnection.instructionText}>
                            Mantén el teléfono con internet activo
                        </Text>
                    </View>
                </View>
            </View>

            {/* Features */}
            <View style={styleswhatsAppConnection.featuresSection}>
                <Text style={styleswhatsAppConnection.featuresTitle}>¿Qué puedes hacer?</Text>

                <View style={styleswhatsAppConnection.featureCard}>
                    <Icon name="send" size={24} color="#2196F3" />
                    <View style={styleswhatsAppConnection.featureContent}>
                        <Text style={styleswhatsAppConnection.featureTitle}>Enviar Recordatorios</Text>
                        <Text style={styleswhatsAppConnection.featureDescription}>
                            Envía recordatorios automáticos a tus clientes
                        </Text>
                    </View>
                </View>

                <View style={styleswhatsAppConnection.featureCard}>
                    <Icon name="contacts" size={24} color="#9C27B0" />
                    <View style={styleswhatsAppConnection.featureContent}>
                        <Text style={styleswhatsAppConnection.featureTitle}>Obtener Contactos</Text>
                        <Text style={styleswhatsAppConnection.featureDescription}>
                            Accede a tu lista de contactos de WhatsApp
                        </Text>
                    </View>
                </View>

                <View style={styleswhatsAppConnection.featureCard}>
                    <Icon name="upload-file" size={24} color="#4CAF50" />
                    <View style={styleswhatsAppConnection.featureContent}>
                        <Text style={styleswhatsAppConnection.featureTitle}>Importar desde Excel</Text>
                        <Text style={styleswhatsAppConnection.featureDescription}>
                            Sube listas de clientes desde archivos Excel
                        </Text>
                    </View>
                </View>
            </View>

            <Toast />
        </ScrollView>
    );
};

export default WhatsAppConnectionScreen;