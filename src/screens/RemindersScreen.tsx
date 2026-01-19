import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Clipboard,
    Linking,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { getClientsFromExcel, getWhatsAppContactsSimulated } from '../utils/clients';
import { Cliente } from 'src/types/reminders';
import { stylesreminders } from 'src/styles/reminders';
import MessageBubble from './MessageBubble';
import { SafeAreaView } from 'react-native-safe-area-context';

const RemindersScreen = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

    // Cargar clientes guardados
    useEffect(() => {
        loadClientes();
    }, []);

    const loadClientes = async () => {
        try {
            const saved = await AsyncStorage.getItem('reminders_clientes');
            if (saved) {
                const parsed = JSON.parse(saved);
                setClientes(parsed);
                if (parsed.length > 0) {
                    setSelectedCliente(parsed[0]);
                }
            }
        } catch (error) {
            console.error('Error loading clientes:', error);
        }
    };

    const saveClientes = async (updatedClientes: Cliente[]) => {
        try {
            await AsyncStorage.setItem('reminders_clientes', JSON.stringify(updatedClientes));
        } catch (error) {
            console.error('Error saving clientes:', error);
        }
    };

    // Importar desde Excel
    const handleImportExcel = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                setLoading(true);
                
                try {
                    const fileUri = result.assets[0].uri;
                    const clientesImportados = await getClientsFromExcel(fileUri);
                    
                    const updatedClientes = [...clientes, ...clientesImportados];
                    setClientes(updatedClientes);
                    saveClientes(updatedClientes);
                    
                    if (clientesImportados.length > 0 && !selectedCliente) {
                        setSelectedCliente(clientesImportados[0]);
                    }
                    
                    Toast.show({
                        type: 'success',
                        text1: 'Éxito',
                        text2: `${clientesImportados.length} clientes importados`,
                    });
                } catch (error) {
                    console.error('Error importing Excel:', error);
                } finally {
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error('Error picking file:', error);
            setLoading(false);
        }
    };

    // Obtener contactos simulados (para desarrollo)
    const handleGetContacts = () => {
        setLoading(true);
        
        setTimeout(() => {
            const contactosSimulados = getWhatsAppContactsSimulated();
            const updatedClientes = [...clientes, ...contactosSimulados];
            
            setClientes(updatedClientes);
            saveClientes(updatedClientes);
            
            if (contactosSimulados.length > 0 && !selectedCliente) {
                setSelectedCliente(contactosSimulados[0]);
            }
            
            Toast.show({
                type: 'success',
                text1: 'Éxito',
                text2: `${contactosSimulados.length} contactos obtenidos`,
            });
            
            setLoading(false);
        }, 1500);
    };

    // Enviar mensaje por WhatsApp
    const enviarPorWhatsApp = async (cliente: Cliente) => {
        try {
            // 1. Preparar mensaje completo
            let mensajeCompleto = '';
            
            cliente.mensajes.forEach((msg, index) => {
                mensajeCompleto += msg.contenido + '\n';
                if (index === 0) {
                    mensajeCompleto += '\n';
                }
            });

            // 2. Copiar número al portapapeles
            await Clipboard.setString(cliente.telefono);
            
            // 3. Preparar URL de WhatsApp
            const mensajeCodificado = encodeURIComponent(mensajeCompleto);
            let whatsappUrl = '';
            
            if (Platform.OS === 'ios') {
                whatsappUrl = `https://api.whatsapp.com/send?phone=${cliente.telefono}&text=${mensajeCodificado}`;
            } else {
                whatsappUrl = `whatsapp://send?phone=${cliente.telefono}&text=${mensajeCodificado}`;
            }
            
            // 4. Verificar si WhatsApp está instalado
            const canOpen = await Linking.canOpenURL(whatsappUrl);
            
            if (canOpen) {
                // 5. Abrir WhatsApp
                await Linking.openURL(whatsappUrl);
                
                // 6. Marcar como enviado
                const updatedClientes = clientes.map(c => 
                    c.nombre === cliente.nombre && c.telefono === cliente.telefono
                    ? { ...c, status: true }
                    : c
                );
                
                setClientes(updatedClientes);
                saveClientes(updatedClientes);
                
                Toast.show({
                    type: 'success',
                    text1: 'Enviado',
                    text2: `Mensaje preparado para ${cliente.nombre}`,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'WhatsApp no encontrado',
                    text2: 'Por favor instala WhatsApp para enviar mensajes',
                });
            }
        } catch (error) {
            console.error('Error sending WhatsApp:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo preparar el mensaje',
            });
        }
    };

    // Limpiar todos los clientes
    const handleClearAll = () => {
        if (clientes.length === 0) return;
        
        Alert.alert(
            'Limpiar todo',
            '¿Estás seguro de que quieres eliminar todos los clientes?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Limpiar',
                    style: 'destructive',
                    onPress: () => {
                        setClientes([]);
                        setSelectedCliente(null);
                        saveClientes([]);
                        Toast.show({
                            type: 'success',
                            text1: 'Lista limpiada',
                            text2: 'Todos los clientes han sido eliminados',
                        });
                    }
                }
            ]
        );
    };

    // Renderizar cliente en lista
    const renderClienteItem = ({ item }: { item: Cliente }) => (
        <TouchableOpacity
            style={[
                stylesreminders.clienteItem,
                selectedCliente?.nombre === item.nombre && stylesreminders.clienteItemSelected,
                item.status && stylesreminders.clienteEnviado
            ]}
            onPress={() => setSelectedCliente(item)}
            activeOpacity={0.7}
        >
            <View style={stylesreminders.clienteItemContent}>
                <View style={[
                    stylesreminders.clienteIcon,
                    item.status ? stylesreminders.iconEnviado : stylesreminders.iconPendiente
                ]}>
                    <Icon 
                        name={item.status ? "check" : "person"} 
                        size={20} 
                        color="#fff" 
                    />
                </View>

                <View style={stylesreminders.clienteInfo}>
                    <Text style={stylesreminders.clienteNombre} numberOfLines={1}>
                        {item.nombre}
                    </Text>
                    <Text style={stylesreminders.clienteTelefono} numberOfLines={1}>
                        {item.telefono}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const totalClientes = clientes.length;
    const enviadosCount = clientes.filter(c => c.status).length;
    const pendientesCount = totalClientes - enviadosCount;

    return (
        <SafeAreaView style={stylesreminders.container}>
            {/* Header */}
            <View style={stylesreminders.header}>
                {/* Estadísticas */}
                {clientes.length > 0 && (
                    <View style={stylesreminders.statsContainer}>
                        <View style={stylesreminders.statItem}>
                            <Text style={stylesreminders.statNumber}>{totalClientes}</Text>
                            <Text style={stylesreminders.statLabel}>Total</Text>
                        </View>
                        <View style={stylesreminders.statItem}>
                            <Text style={[stylesreminders.statNumber, stylesreminders.statEnviados]}>{enviadosCount}</Text>
                            <Text style={stylesreminders.statLabel}>Enviados</Text>
                        </View>
                        <View style={stylesreminders.statItem}>
                            <Text style={[stylesreminders.statNumber, stylesreminders.statPendientes]}>{pendientesCount}</Text>
                            <Text style={stylesreminders.statLabel}>Pendientes</Text>
                        </View>
                        <TouchableOpacity
                            style={stylesreminders.clearButton}
                            onPress={handleClearAll}
                        >
                            <Icon name="delete-sweep" size={20} color="#ff4444" />
                            <Text style={stylesreminders.statLabel}>Eliminar todo</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Contenido Principal */}
            {clientes.length === 0 ? (
                <View style={stylesreminders.emptyState}>
                    <Icon name="pets" size={80} color="#ccc" />
                    <Text style={stylesreminders.emptyTitle}>No hay clientes</Text>
                    <Text style={stylesreminders.emptyDescription}>
                        Importa un archivo Excel para comenzar
                    </Text>
                
                    <View style={stylesreminders.emptyButtons}>
                        <TouchableOpacity
                            style={stylesreminders.actionButton}
                            onPress={handleImportExcel}
                            disabled={loading}
                        >
                            <Icon name="upload-file" size={24} color="#fff" />
                            <Text style={stylesreminders.actionButtonText}>Importar Excel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[stylesreminders.actionButton, stylesreminders.actionButtonSecondary]}
                            onPress={handleGetContacts}
                            disabled={loading}
                        >
                            <Icon name="contacts" size={24} color="#fff" />
                            <Text style={stylesreminders.actionButtonText}>Contactos Demo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={stylesreminders.mainContent}>
                    {/* Lista de Clientes (izquierda) */}
                    <FlatList
                        data={clientes}
                        renderItem={renderClienteItem}
                        keyExtractor={(item) => `${item.nombre}-${item.telefono}`}
                        style={stylesreminders.clientesList}
                        contentContainerStyle={stylesreminders.clientesListContent}
                    />

                    {/* Área de Mensajes (derecha) */}
                    <View style={stylesreminders.messagesArea}>
                        {selectedCliente ? (
                            <>
                                {/* Info del cliente seleccionado */}
                                <View style={stylesreminders.selectedClientInfo}>
                                    <Text style={stylesreminders.selectedClientName}>
                                        {selectedCliente.nombre}
                                    </Text>
                                    <Text style={stylesreminders.selectedClientPhone}>
                                        {selectedCliente.telefono}
                                    </Text>
                                    {selectedCliente.mascotas.length > 0 && (
                                        <Text style={stylesreminders.selectedClientPets}>
                                            {selectedCliente.mascotas.map(m => m.nombre).join(', ')}
                                        </Text>
                                    )}
                                </View>

                                {/* Mensajes */}
                                <ScrollView 
                                    style={stylesreminders.messagesContainer}
                                    contentContainerStyle={stylesreminders.messagesContent}
                                >
                                    {selectedCliente.mensajes.map((mensaje) => (
                                        <MessageBubble
                                            key={mensaje.id}
                                            mensaje={mensaje}
                                        />
                                    ))}
                                </ScrollView>

                                {/* Botón de enviar (ESPACIO PARA BOTONES ANDROID) */}
                                <View style={stylesreminders.sendButtonContainer}>
                                    <TouchableOpacity
                                        style={[
                                            stylesreminders.sendButton,
                                            selectedCliente.status && stylesreminders.sendButtonDisabled
                                        ]}
                                        onPress={() => enviarPorWhatsApp(selectedCliente)}
                                        disabled={selectedCliente.status || loading}
                                    >
                                        <Icon 
                                            name={selectedCliente.status ? "check" : "send"} 
                                            size={24} 
                                            color="#fff" 
                                        />
                                        <Text style={stylesreminders.sendButtonText}>
                                            {selectedCliente.status ? 'Ya enviado' : 'Enviar por WhatsApp'}
                                        </Text>
                                    </TouchableOpacity>
                                
                                    <Text style={stylesreminders.sendInstructions}>
                                        Se copiará el número y abrirá WhatsApp
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={stylesreminders.noSelection}>
                                <Icon name="chat" size={64} color="#ccc" />
                                <Text style={stylesreminders.noSelectionText}>
                                    Selecciona un cliente
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Loading Overlay */}
            {loading && (
                <View style={stylesreminders.loadingOverlay}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={stylesreminders.loadingText}>Procesando...</Text>
                </View>
            )}

            <Toast />
        </SafeAreaView>

    );
};

export default RemindersScreen;