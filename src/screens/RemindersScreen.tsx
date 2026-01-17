import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { Cliente } from 'src/types/reminders';
import { stylesreminders } from 'src/styles/reminders';

const RemindersScreen = () => {
    const navigation = useNavigation();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [whatsappConnected, setWhatsappConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Verificar estado de WhatsApp al cargar
    useEffect(() => {
        checkWhatsAppStatus();
        loadClientes();
    }, []);

    const checkWhatsAppStatus = async () => {
        try {
            const status = await AsyncStorage.getItem('whatsapp_connected');
            setWhatsappConnected(status === 'true');
        } catch (error) {
            console.error('Error checking WhatsApp status:', error);
        }
    };

    const loadClientes = async () => {
        try {
            const saved = await AsyncStorage.getItem('reminders_clientes');
            if (saved) {
                setClientes(JSON.parse(saved));
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

    const handleConnectWhatsApp = () => {
        navigation.navigate('WhatsAppConnection' as never);
    };

    const handleImportExcel = async () => {
        if (!whatsappConnected) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Primero debes conectar WhatsApp',
            });
            return;
        }

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            if (!result.canceled && result.assets[0]) {
                setLoading(true);
                // Aquí procesarías el archivo Excel
                // Por ahora, solo simulamos la carga
                setTimeout(() => {
                    const newClientes: Cliente[] = [
                        {
                            id: '1',
                            nombre: 'Juan Pérez',
                            telefono: '5551234567',
                            mascotas: [
                                {
                                    nombre: 'Firulais',
                                    recordatorios: [
                                        {
                                            nombre: 'Vacuna',
                                            tipos: [
                                                { nombre: 'Rabia', fecha: '2024-12-15' }
                                            ]
                                        }
                                    ]
                                }
                            ],
                            mensajes: [],
                            status: false
                        }
                    ];
                
                    const updatedClientes = [...clientes, ...newClientes];
                    setClientes(updatedClientes);
                    saveClientes(updatedClientes);
                    
                    Toast.show({
                        type: 'success',
                        text1: 'Éxito',
                        text2: 'Archivo procesado correctamente',
                    });
                    setLoading(false);
                }, 1500);
            }
        } catch (error) {
            console.error('Error importing file:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo procesar el archivo',
            });
            setLoading(false);
        }
    };

    const handleGetContacts = async () => {
        if (!whatsappConnected) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Primero debes conectar WhatsApp',
            });
            return;
        }

        setLoading(true);
        try {
            // Simular obtención de contactos
            setTimeout(() => {
                const newContacts: Cliente[] = [
                    {
                        id: '2',
                        nombre: 'María García',
                        telefono: '5557654321',
                        mascotas: [],
                        mensajes: [],
                        status: false
                    }
                ];
                
                const updatedClientes = [...clientes, ...newContacts];
                setClientes(updatedClientes);
                saveClientes(updatedClientes);
                
                Toast.show({
                    type: 'success',
                    text1: 'Éxito',
                    text2: 'Contactos obtenidos correctamente',
                });
                setLoading(false);
            }, 2000);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudieron obtener los contactos',
            });
            setLoading(false);
        }
    };

    const handleSendMessage = async (cliente: Cliente) => {
        Alert.alert(
            'Enviar recordatorio',
            `¿Enviar recordatorio a ${cliente.nombre}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Enviar',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Simular envío de mensaje
                            setTimeout(() => {
                                const updatedClientes = clientes.map(
                                    c => 
                                    c.id === cliente.id 
                                    ? { ...c, status: true } 
                                    : c
                                );
                                setClientes(updatedClientes);
                                saveClientes(updatedClientes);
                                
                                Toast.show({
                                    type: 'success',
                                    text1: 'Éxito',
                                    text2: `Recordatorio enviado a ${cliente.nombre}`,
                                });
                                setLoading(false);
                            }, 1000);
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'No se pudo enviar el mensaje',
                            });
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const filteredClientes = clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.telefono.includes(searchTerm)
    );

    const renderCliente = ({ item }: { item: Cliente }) => (
        <TouchableOpacity
            style={stylesreminders.clienteCard}
            onPress={() => setSelectedCliente(item)}
            activeOpacity={0.7}
        >
            <View style={stylesreminders.clienteHeader}>
                <View style={stylesreminders.avatar}>
                    <Icon name="person" size={24} color="#fff" />
                </View>
                <View style={stylesreminders.clienteInfo}>
                    <Text style={stylesreminders.clienteName}>{item.nombre}</Text>
                    <Text style={stylesreminders.clientePhone}>{item.telefono}</Text>
                    {item.mascotas.length > 0 && (
                        <Text style={stylesreminders.clientePets}>
                            Mascotas: {item.mascotas.map(m => m.nombre).join(', ')}
                        </Text>
                    )}
                </View>
                <View style={stylesreminders.statusContainer}>
                    {item.status ? (
                        <Icon name="check-circle" size={24} color="#4CAF50" />
                    ) : (
                        <TouchableOpacity
                            style={stylesreminders.sendButton}
                            onPress={() => handleSendMessage(item)}
                            disabled={!whatsappConnected}
                        >
                            <Icon name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={stylesreminders.container}>
            {/* Header */}
            <View style={stylesreminders.header}>
                <TouchableOpacity
                    style={stylesreminders.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={stylesreminders.title}>Recordatorios</Text>
                <View style={stylesreminders.placeholder} />
            </View>

            {/* WhatsApp Status */}
            <View style={stylesreminders.whatsappStatus}>
                <TouchableOpacity
                    style={[
                        stylesreminders.whatsappButton,
                        whatsappConnected && stylesreminders.whatsappConnected
                    ]}
                    onPress={handleConnectWhatsApp}
                >
                    <Icon 
                        name="whatsapp" 
                        size={20} 
                        color={whatsappConnected ? "#fff" : "#fff"} 
                    />
                    <Text style={stylesreminders.whatsappText}>
                        {whatsappConnected ? 'WhatsApp Conectado' : 'Conectar WhatsApp'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={stylesreminders.searchContainer}>
                <Icon name="search" size={20} color="#666" style={stylesreminders.searchIcon} />
                <TextInput
                    style={stylesreminders.searchInput}
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {/* Actions */}
            <View style={stylesreminders.actionsContainer}>
                <TouchableOpacity
                    style={[
                        stylesreminders.actionButton,
                        (!whatsappConnected || loading) && stylesreminders.actionButtonDisabled
                    ]}
                    onPress={handleImportExcel}
                    disabled={!whatsappConnected || loading}
                >
                    <Icon name="upload-file" size={20} color="#fff" />
                    <Text style={stylesreminders.actionText}>Importar Excel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[
                        stylesreminders.actionButton,
                        (!whatsappConnected || loading) && stylesreminders.actionButtonDisabled
                    ]}
                    onPress={handleGetContacts}
                    disabled={!whatsappConnected || loading}
                >
                    <Icon name="contacts" size={20} color="#fff" />
                    <Text style={stylesreminders.actionText}>Obtener Contactos</Text>
                </TouchableOpacity>
            </View>

            {/* Client List */}
            <FlatList
                data={filteredClientes}
                renderItem={renderCliente}
                keyExtractor={(item) => item.id}
                style={stylesreminders.list}
                ListEmptyComponent={
                    <View style={stylesreminders.emptyContainer}>
                        <Icon name="group" size={64} color="#ccc" />
                        <Text style={stylesreminders.emptyText}>No hay clientes</Text>
                        <Text style={stylesreminders.emptySubtext}>
                            Importa una lista o obtén contactos de WhatsApp
                        </Text>
                    </View>
                }
            />

            {/* Loading Overlay */}
            {loading && (
                <View style={stylesreminders.loadingOverlay}>
                    <View style={stylesreminders.loadingContainer}>
                        <Icon name="refresh" size={40} color="#fff" />
                        <Text style={stylesreminders.loadingText}>Procesando...</Text>
                    </View>
                </View>
            )}
            
            <Toast />
        </View>
    );
};

export default RemindersScreen;