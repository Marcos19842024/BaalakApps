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
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { getWhatsAppContactsSimulated } from '../utils/clients';
import { Cliente, ExcelTemplate } from 'src/types/reminders';
import { stylesreminders } from 'src/styles/reminders';
import { MessageBubble } from './MessageBubble';
import { SafeAreaView } from 'react-native-safe-area-context';
import remindersData from 'src/utils/remindersData';
import XLSX from 'xlsx';
import { RouteParams } from 'src/types/navigation';
import { useRoute } from '@react-navigation/native';
import { SucursalType } from 'src/types/checklist';

export const RemindersScreen = ({ navigation }: { navigation: any }) => {
    const route = useRoute();
    const params = route.params as RouteParams;
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [templates, setTemplates] = useState<ExcelTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ExcelTemplate | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [selectedSucursal, setSelectedSucursal] = useState<SucursalType>(
        params?.sucursalKey || 'BAALAK_CENTRAL'
    );

    // Cargar clientes guardados
    useEffect(() => {
        cargarTemplates();
        cargarTemplateSeleccionado();
    }, []);

    const cargarTemplates = async () => {
        try {
            const templatesData = await remindersData.obtenerTemplates();
            setTemplates(templatesData.filter(t => t.activo));
        } catch (error) {
            console.error('Error cargando templates:', error);
        }
    };

    const cargarTemplateSeleccionado = async () => {
        try {
            const templateId = await remindersData.obtenerTemplateSeleccionado();
            if (templateId) {
                const template = await remindersData.obtenerTemplate(templateId);
                setSelectedTemplate(template);
            }
        } catch (error) {
            console.error('Error cargando template seleccionado:', error);
        }
    };

    const saveClientes = async (updatedClientes: Cliente[]) => {
        try {
            await AsyncStorage.setItem('reminders_clientes', JSON.stringify(updatedClientes));
        } catch (error) {
            console.error('Error saving clientes:', error);
        }
    };

    const handleSelectTemplate = async (template: ExcelTemplate) => {
        setSelectedTemplate(template);
        await remindersData.guardarTemplateSeleccionado(template.id);
    };

    const handleImportExcel = async () => {
        console.log('📥 Iniciando importación de Excel...');
        
        if (!selectedTemplate) {
            console.log('⚠️ No hay template seleccionado, mostrando selector');
            setShowTemplateSelector(true);
            return;
        }

        console.log('📋 Template seleccionado:', selectedTemplate.nombre);

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                copyToCacheDirectory: true,
            });

            console.log('📁 Resultado del picker:', result);

            if (!result.canceled && result.assets && result.assets[0]) {
                setLoading(true);
                
                try {
                    const file = result.assets[0];
                    console.log('📄 Archivo seleccionado:', file.uri);
                    
                    // Procesar el Excel usando la función correcta
                    const clientesProcesados = await procesarExcelConTemplate(file.uri, selectedTemplate);
                    
                    console.log('✅ Clientes procesados:', clientesProcesados.length);
                    
                    if (clientesProcesados && clientesProcesados.length > 0) {
                        // Actualizar el estado con los nuevos clientes
                        const updatedClientes = [...clientes, ...clientesProcesados];
                        setClientes(updatedClientes);
                        saveClientes(updatedClientes);
                        
                        // Seleccionar el primer cliente si no hay ninguno seleccionado
                        if (!selectedCliente) {
                            setSelectedCliente(clientesProcesados[0]);
                        }
                        
                        Toast.show({
                            type: 'success',
                            text1: '✅ Importación exitosa',
                            text2: `${clientesProcesados.length} clientes importados`,
                        });
                        
                        console.log('🎉 Clientes actualizados en estado');
                    } else {
                        console.log('⚠️ No se encontraron clientes válidos');
                        Toast.show({
                            type: 'info',
                            text1: 'Sin datos',
                            text2: 'El archivo Excel no contiene datos válidos',
                        });
                    }
                } catch (error) {
                    console.error('❌ Error procesando Excel:', error);
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'No se pudo procesar el archivo Excel',
                    });
                } finally {
                    setLoading(false);
                }
            } else {
                console.log('❌ Selección cancelada o sin archivo');
            }
        } catch (error) {
            console.error('❌ Error al seleccionar archivo:', error);
            setLoading(false);
        }
    };

    const procesarExcelConTemplate = async (fileUri: string, template: ExcelTemplate) => {
        try {
            console.log('📊 Procesando Excel con template:', template.nombre);
            
            // Leer Excel
            const response = await fetch(fileUri);
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            console.log('📈 Datos leídos:', data.length, 'filas');
            
            // Procesar con template usando remindersData
            const datosProcesados = remindersData.procesarDatosConTemplate(data, template);
            
            console.log('👥 Datos procesados:', datosProcesados.length);
            
            // Crear clientes con mensajes personalizados
            return datosProcesados.map(item => {
                const mensaje = remindersData.generarMensajeConTemplate(template, item.variables);
                
                return {
                    ...item.cliente,
                    mensajes: [
                        {
                            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            contenido: mensaje,
                            timestamp: new Date().toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            esPropio: true
                        }
                    ]
                };
            });
            
        } catch (error) {
            console.error('❌ Error procesando Excel con template:', error);
            throw error;
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
                            onPress={() => setShowTemplateSelector(true)}
                            disabled={loading}
                        >
                            <Icon name="upload-file" size={24} color="#fff" />
                            <Text style={stylesreminders.actionButtonText}>
                                Importar Excel
                            </Text>
                        </TouchableOpacity>
                        <Text>{selectedSucursal}</Text>
                        <TouchableOpacity
                            style={[stylesreminders.actionButton, stylesreminders.actionButtonSecondary]}
                            onPress={handleGetContacts}
                            disabled={loading}
                        >
                            <Icon name="contacts" size={24} color="#fff" />
                            <Text style={stylesreminders.actionButtonText}>Importar Contactos</Text>
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

            {/* Selector de Template */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showTemplateSelector}
                onRequestClose={() => setShowTemplateSelector(false)}
            >
                <View style={stylesreminders.modalOverlay}>
                    <View style={stylesreminders.templateSelector}>
                        <View style={stylesreminders.selectorHeader}>
                            <Text style={stylesreminders.selectorTitle}>Seleccionar plantilla</Text>
                            <TouchableOpacity onPress={() => setShowTemplateSelector(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList
                            data={templates}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={stylesreminders.templateOption}
                                    onPress={() => handleSelectTemplate(item)}
                                >
                                    <View style={stylesreminders.templateOptionIcon}>
                                        <Icon 
                                            name={item.tipo === 'vacunas' ? 'vaccines' : 
                                                item.tipo === 'citas' ? 'event' : 'description'
                                            } 
                                            size={24} 
                                            color="#fff" 
                                        />
                                    </View>
                                    <View style={stylesreminders.templateOptionInfo}>
                                        <Text style={stylesreminders.templateOptionName}>{item.nombre}</Text>
                                        <Text style={stylesreminders.templateOptionDesc}>{item.descripcion}</Text>
                                        <Text style={stylesreminders.templateOptionFields}>
                                            {item.encabezados.length} campos
                                        </Text>
                                    </View>
                                    {selectedTemplate?.id === item.id && (
                                        <Icon name="check-circle" size={24} color="#4CAF50" />
                                    )}
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.id}
                        />
                        
                        <TouchableOpacity
                            style={stylesreminders.configTemplateButton}
                            onPress={() => {
                                setShowTemplateSelector(false);
                                handleImportExcel();
                                navigation.navigate('RemindersScreen');
                            }}
                        >
                            <Icon name="download" size={20} color="#fff" />
                            <Text style={stylesreminders.configTemplateButtonText}>
                                {selectedTemplate 
                                    ? `Importar ${selectedTemplate.nombre}`
                                    : 'Importar Excel'
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Toast />

        </SafeAreaView>

    );
};