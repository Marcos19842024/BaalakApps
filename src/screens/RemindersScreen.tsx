import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Clipboard,
    Linking,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { Cliente, ExcelTemplate } from 'src/types/reminders';
import { stylesreminders } from 'src/styles/reminders';
import { MessageBubble } from './MessageBubble';
import { SafeAreaView } from 'react-native-safe-area-context';
import remindersData from 'src/utils/remindersData';
import XLSX from 'xlsx';
import { RouteParams } from 'src/types/navigation';
import { useRoute } from '@react-navigation/native';
import { SUCURSALES, SucursalType } from 'src/types/sucursal';

export const RemindersScreen = () => {
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
    const [clientesCargados, setClientesCargados] = useState(false);

    // Cargar templates al inicio
    useEffect(() => {
        cargarTemplates();
    }, []);

    // Cargar clientes guardados al inicio
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            try {
                const storedClientes = await AsyncStorage.getItem('reminders_clientes');
                if (storedClientes) {
                    const clientesGuardados = JSON.parse(storedClientes);
                    console.log('📂 Clientes cargados de AsyncStorage:', clientesGuardados.length);
                    setClientes(clientesGuardados);
                    
                    if (clientesGuardados.length > 0) {
                        setSelectedCliente(clientesGuardados[0]);
                    }
                    
                    // Marcar que los clientes ya están cargados
                    setClientesCargados(true);
                } else {
                    console.log('📭 No hay clientes guardados en AsyncStorage');
                    setClientesCargados(true);
                }
            } catch (error) {
                console.error('Error cargando clientes:', error);
                setClientesCargados(true);
            }
        };
        
        cargarDatosIniciales();
    }, []);

    // Actualizar la sucursal cuando viene por parámetro
    useEffect(() => {
        if (params?.sucursalKey) {
            console.log('📍 Sucursal recibida por navegación:', params.sucursalKey);
            setSelectedSucursal(params.sucursalKey);
        }
    }, [params?.sucursalKey]);

    // ACTUALIZAR MENSAJES cuando cambia la sucursal Y ya se cargaron los clientes
    useEffect(() => {
        if (clientesCargados && clientes.length > 0) {
            console.log('🔄 Detonando actualización de mensajes');
            console.log('- Clientes cargados:', clientesCargados);
            console.log('- Número de clientes:', clientes.length);
            console.log('- Sucursal actual:', selectedSucursal);
            console.log('- Nombre clínica:', getNombreClinica(selectedSucursal));
            
            actualizarMensajesConClinica();
        } else {
            console.log('⏳ Esperando para actualizar mensajes...');
            console.log('- Clientes cargados:', clientesCargados);
            console.log('- Número de clientes:', clientes.length);
        }
    }, [selectedSucursal, clientesCargados]);

    const cargarTemplates = () => {
        const templatesData = remindersData.obtenerTemplates();
        setTemplates(templatesData);
        
        if (templatesData.length > 0 && !selectedTemplate) {
            setSelectedTemplate(templatesData[0]);
        }
    };

    const getNombreClinica = (sucursalKey: string): string => {
        return SUCURSALES[sucursalKey as SucursalType] || sucursalKey;
    };

    // Función mejorada para actualizar mensajes cuando cambia la clínica
    const actualizarMensajesConClinica = () => {
        const nombreClinica = getNombreClinica(selectedSucursal);
        
        console.log('🔄 Actualizando mensajes para nueva clínica:', nombreClinica);
        
        if (clientes.length === 0) {
            console.log('📭 No hay clientes para actualizar');
            return;
        }
        
        // Extraer solo el nombre de la clínica (sin "Clínica Veterinaria")
        const extraerNombreLimpio = (nombreCompleto: string) => {
            if (!nombreCompleto) return '';
            let nombre = nombreCompleto.trim();
            
            // Quitar prefijos comunes
            const prefijos = [
                'Clínica Veterinaria ',
                'La clínica veterinaria ',
                'la clínica veterinaria '
            ];
            
            for (const prefijo of prefijos) {
                if (nombre.toLowerCase().startsWith(prefijo.toLowerCase())) {
                    nombre = nombre.substring(prefijo.length);
                    break;
                }
            }
            
            return nombre;
        };
        
        const nombreClinicaLimpio = extraerNombreLimpio(nombreClinica);
        console.log('🏥 Nombre limpio para usar:', nombreClinicaLimpio);
        
        // Ver primer mensaje antes del cambio
        if (clientes[0]?.mensajes?.[1]) {
            console.log('📝 Mensaje ANTES (primeros 120 chars):');
            console.log(clientes[0].mensajes[1].contenido.substring(0, 120));
        }
        
        const clientesActualizados = clientes.map(cliente => {
            // Solo actualizar si tiene al menos 2 mensajes (saludo + info clínica)
            if (cliente.mensajes.length >= 2) {
                const mensajesActualizados = [...cliente.mensajes];
                
                // El segundo mensaje (índice 1) contiene la información de la clínica
                const mensajeOriginal = mensajesActualizados[1].contenido;
                
                // Buscar el patrón: [nombre clínica] le informa/recuerda que...
                const patron = /^([^.]*?)\s+(le informa|le recuerda)/i;
                const match = mensajeOriginal.match(patron);
                
                if (match) {
                    const textoClinicAnterior = match[1].trim();
                    console.log(`🔍 Encontrado nombre anterior: "${textoClinicAnterior}"`);
                    
                    // Reemplazar solo la parte del nombre de la clínica
                    const nuevoMensaje = mensajeOriginal.replace(
                        new RegExp(`^${textoClinicAnterior.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`),
                        `${nombreClinicaLimpio} `
                    );
                    
                    mensajesActualizados[1] = {
                        ...mensajesActualizados[1],
                        contenido: nuevoMensaje
                    };
                    
                    console.log(`✅ Reemplazado por: "${nombreClinicaLimpio}"`);
                } else {
                    // Si no encuentra el patrón, intentar otro enfoque
                    console.log('⚠️ No se encontró patrón estándar, intentando enfoque alternativo');
                    
                    // Buscar cualquier mención de clínicas conocidas
                    const clinicasConocidas = ['Baalak', 'Animalia', 'Clínica Veterinaria'];
                    let mensajeModificado = mensajeOriginal;
                    let reemplazos = 0;
                    
                    clinicasConocidas.forEach(clinica => {
                        if (mensajeOriginal.includes(clinica)) {
                            const regex = new RegExp(clinica, 'g');
                            mensajeModificado = mensajeModificado.replace(regex, nombreClinicaLimpio);
                            reemplazos++;
                            console.log(`🔄 Reemplazando "${clinica}" por "${nombreClinicaLimpio}"`);
                        }
                    });
                    
                    if (reemplazos > 0) {
                        mensajesActualizados[1] = {
                            ...mensajesActualizados[1],
                            contenido: mensajeModificado
                        };
                    }
                }
                
                return {
                    ...cliente,
                    mensajes: mensajesActualizados
                };
            }
            
            return cliente;
        });
        
        // Ver primer mensaje después del cambio
        if (clientesActualizados[0]?.mensajes?.[1]) {
            console.log('✅ Mensaje DESPUÉS (primeros 120 chars):');
            console.log(clientesActualizados[0].mensajes[1].contenido.substring(0, 120));
        }
        
        // Verificar si hubo cambios reales
        const huboCambios = JSON.stringify(clientes) !== JSON.stringify(clientesActualizados);
        
        if (huboCambios) {
            // Actualizar estado
            setClientes(clientesActualizados);
            
            // Guardar en AsyncStorage
            saveClientes(clientesActualizados);
            
            // Actualizar cliente seleccionado
            if (selectedCliente) {
                const clienteActualizado = clientesActualizados.find(
                    c => c.nombre === selectedCliente.nombre && c.telefono === selectedCliente.telefono
                );
                if (clienteActualizado) {
                    setSelectedCliente(clienteActualizado);
                }
            }
            
            Toast.show({
                type: 'success',
                text1: 'Mensajes actualizados',
                text2: `Ahora muestran: ${nombreClinicaLimpio}`,
            });
            
            console.log('✅ Mensajes actualizados correctamente');
        } else {
            console.log('ℹ️ No se encontraron cambios necesarios en los mensajes');
        }
    };

    const saveClientes = async (updatedClientes: Cliente[]) => {
        try {
            await AsyncStorage.setItem('reminders_clientes', JSON.stringify(updatedClientes));
            console.log('💾 Clientes guardados en AsyncStorage');
        } catch (error) {
            console.error('Error saving clientes:', error);
        }
    };

    const handleSelectTemplate = (template: ExcelTemplate) => {
        setSelectedTemplate(template);
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
                copyToCacheDirectory: true,
            });

            console.log('📁 Resultado del picker:', result);

            if (!result.canceled && result.assets && result.assets[0]) {
                setLoading(true);
                
                try {
                    const file = result.assets[0];
                    console.log('📄 Archivo seleccionado:', file.uri);
                    console.log('📄 Nombre del archivo:', file.name);
                    console.log('📄 Tamaño:', file.size, 'bytes');
                    
                    // Verificar extensión del archivo
                    const fileName = file.name.toLowerCase();
                    const extension = fileName.split('.').pop();
                    
                    // Aceptar ambos formatos: .xlsx y .xls
                    if (extension !== 'xlsx' && extension !== 'xls') {
                        Toast.show({
                            type: 'error',
                            text1: 'Formato no válido',
                            text2: 'Solo se aceptan archivos Excel (.xlsx o .xls)',
                            visibilityTime: 3000,
                        });
                        setLoading(false);
                        return;
                    }
                    
                    // Procesar el Excel usando la plantilla seleccionada
                    const nombreClinica = getNombreClinica(selectedSucursal);
                    const clientesProcesados = await procesarExcel(file.uri, selectedTemplate, nombreClinica, extension);
                    
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
                } catch (error: any) {
                    console.error('❌ Error procesando Excel:', error);
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: error.message || 'No se pudo procesar el archivo Excel',
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

    const procesarExcel = async (fileUri: string, template: ExcelTemplate, nombreClinica: string, extension: string) => {
        try {
            console.log('📊 Procesando Excel con template:', template.nombre);
            console.log('🏥 Para clínica:', nombreClinica);
            console.log('📄 Extensión del archivo:', extension);
            
            // Leer Excel
            const response = await fetch(fileUri);
            if (!response.ok) {
                throw new Error(`Error al leer el archivo: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            // Verificar si el arrayBuffer tiene datos
            if (arrayBuffer.byteLength === 0) {
                throw new Error('El archivo está vacío');
            }
            
            console.log('📊 Tamaño del archivo:', arrayBuffer.byteLength, 'bytes');
            
            let workbook;
            try {
                // Configuración para leer Excel según la extensión
                const readOptions = {
                    type: 'array' as const,
                    cellDates: true,
                    cellNF: false,
                    cellText: false
                };
                
                // Intentar leer el archivo
                workbook = XLSX.read(arrayBuffer, readOptions);
                
            } catch (readError) {
                console.error('❌ Error específico de lectura:', readError);
                throw new Error('No se pudo leer el archivo Excel. Verifica que sea un archivo Excel válido (.xls o .xlsx)');
            }
            
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('El archivo Excel no contiene hojas');
            }
            
            const sheetName = workbook.SheetNames[0];
            console.log('📑 Hoja seleccionada:', sheetName);
            
            const worksheet = workbook.Sheets[sheetName];
            
            if (!worksheet) {
                throw new Error('No se pudo acceder a la primera hoja del Excel');
            }
            
            // Convertir a JSON con opciones robustas
            const data = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1, 
                defval: '', 
                blankrows: false,
                raw: false // Convertir valores a texto
            }) as any[][];
            
            console.log('📈 Datos leídos:', data.length, 'filas');
            
            if (data.length === 0) {
                throw new Error('La hoja de Excel está vacía');
            }
            
            // Mostrar los primeros encabezados para debugging
            if (data[0]) {
                console.log('📋 Encabezados encontrados:', data[0]);
            }
            
            // Procesar con template usando remindersData
            return remindersData.procesarDatosConTemplate(data, template, nombreClinica);
            
        } catch (error) {
            console.error('❌ Error procesando Excel:', error);
            
            // Mensaje de error más específico
            let errorMessage = 'No se pudo procesar el archivo Excel';
            if (error instanceof Error) {
                if (error.message.includes('encabezado')) {
                    errorMessage = error.message;
                } else if (error.message.includes('vacío')) {
                    errorMessage = 'El archivo Excel está vacío';
                } else if (error.message.includes('leer')) {
                    errorMessage = 'El archivo no es un Excel válido o está dañado';
                }
            }
            
            throw new Error(errorMessage);
        }
    };

    // Enviar mensaje priorizando WhatsApp Business
    const enviarPorWhatsApp = async (cliente: Cliente) => {
        try {
            // 1. Preparar mensaje completo
            let mensajeCompleto = '';
            
            cliente.mensajes.forEach((msg) => {
                mensajeCompleto += msg.contenido + '\n\n';
            });

            // 2. Copiar número al portapapeles
            await Clipboard.setString(cliente.telefono);
            
            // 3. Preparar mensaje codificado
            const mensajeCodificado = encodeURIComponent(mensajeCompleto);
            
            // 4. Primero intentar con WhatsApp Business usando Intent
            const whatsappBusinessIntent = `intent://send?phone=${cliente.telefono}&text=${mensajeCodificado}#Intent;package=com.whatsapp.w4b;scheme=https;end;`;
            
            let opened = false;
            
            // Intentar WhatsApp Business
            try {
                const canOpenBusiness = await Linking.canOpenURL(whatsappBusinessIntent);
                if (canOpenBusiness) {
                    await Linking.openURL(whatsappBusinessIntent);
                    opened = true;
                    console.log('✅ Abriendo WhatsApp Business');
                }
            } catch (err) {
                console.log('❌ No se pudo abrir WhatsApp Business:', err);
            }
            
            // Si no funcionó, intentar WhatsApp normal
            if (!opened) {
                try {
                    const whatsappNormalUrl = `whatsapp://send?phone=${cliente.telefono}&text=${mensajeCodificado}`;
                    const canOpenNormal = await Linking.canOpenURL(whatsappNormalUrl);
                    if (canOpenNormal) {
                        await Linking.openURL(whatsappNormalUrl);
                        opened = true;
                        console.log('✅ Abriendo WhatsApp Normal (Business no disponible)');
                    }
                } catch (err) {
                    console.log('❌ No se pudo abrir WhatsApp normal:', err);
                }
            }
            
            // Si aún no funcionó, intentar web
            if (!opened) {
                try {
                    const webUrl = `https://api.whatsapp.com/send?phone=${cliente.telefono}&text=${mensajeCodificado}`;
                    await Linking.openURL(webUrl);
                    opened = true;
                    console.log('✅ Abriendo versión web');
                } catch (err) {
                    console.log('❌ No se pudo abrir versión web:', err);
                }
            }
            
            if (opened) {
                // Marcar como enviado
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
                    text1: 'WhatsApp no disponible',
                    text2: 'No se encontró ninguna versión de WhatsApp instalada',
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
                    {item.mascotas.length > 0 && (
                        <Text style={stylesreminders.clienteMascotas} numberOfLines={1}>
                            {item.mascotas.length} mascota{item.mascotas.length !== 1 ? 's' : ''}
                        </Text>
                    )}
                    {item.fechaCita && (
                        <Text style={stylesreminders.clienteCita} numberOfLines={1}>
                            📅 {item.fechaCita}
                        </Text>
                    )}
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
            {clientes.length > 0 && (
                <View style={stylesreminders.header}>
                    
                    {/* Estadísticas */}
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
                                <Text style={stylesreminders.statLabel}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    
                </View>
            )}

            {/* Contenido Principal */}
            {clientes.length === 0 ? (
                <View style={stylesreminders.emptyState}>
                    <Icon name="pets" size={80} color="#ccc" />
                    <Text style={stylesreminders.emptyTitle}>No hay clientes</Text>
                    <Text style={stylesreminders.emptyDescription}>
                        Importa un archivo Excel para comenzar
                    </Text>
                    
                    {/* Info de clínica */}
                    <View style={stylesreminders.clinicaBadge}>
                        <Text style={stylesreminders.clinicaBadgeText}>
                            {getNombreClinica(selectedSucursal)}
                        </Text>
                    </View>
                
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
                    </View>
                    
                    {selectedTemplate && (
                        <Text style={stylesreminders.templateInfo}>
                            Plantilla seleccionada: {selectedTemplate.nombre}
                        </Text>
                    )}
                </View>
            ) : (
                <View style={stylesreminders.mainContent}>
                    {/* Lista de Clientes (izquierda) */}
                    <FlatList
                        data={clientes}
                        renderItem={renderClienteItem}
                        keyExtractor={(item, index) => `${item.nombre}-${item.telefono}-${index}`}
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
                                            Mascotas: {selectedCliente.mascotas.map(m => m.nombre).join(', ')}
                                        </Text>
                                    )}
                                    
                                    {/* Mostrar info adicional para citas */}
                                    {selectedCliente.fechaCita && (
                                        <View style={stylesreminders.citaInfo}>
                                            <Text style={stylesreminders.citaInfoItem}>
                                                📅 {selectedCliente.fechaCita}
                                            </Text>
                                            {selectedCliente.horaCita && (
                                                <Text style={stylesreminders.citaInfoItem}>
                                                    ⏰ {selectedCliente.horaCita}
                                                </Text>
                                            )}
                                            {selectedCliente.tipoVisita && (
                                                <Text style={stylesreminders.citaInfoItem}>
                                                    👨‍⚕️ {selectedCliente.tipoVisita}
                                                </Text>
                                            )}
                                        </View>
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

                                {/* Botón de enviar */}
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
                                    style={[
                                        stylesreminders.templateOption,
                                        selectedTemplate?.id === item.id && stylesreminders.templateOptionSelected
                                    ]}
                                    onPress={() => {
                                        handleSelectTemplate(item);
                                    }}
                                >
                                    <View style={[
                                        stylesreminders.templateOptionIcon,
                                        item.tipo === 'vacunas' ? stylesreminders.templateIconVacunas :
                                        item.tipo === 'citas' ? stylesreminders.templateIconCitas :
                                        stylesreminders.templateIconPersonalizado
                                    ]}>
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
                                            {item.encabezados.length} campos requeridos
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
                            }}
                            disabled={!selectedTemplate}
                        >
                            <Icon name="download" size={20} color="#fff" />
                            <Text style={stylesreminders.configTemplateButtonText}>
                                {selectedTemplate 
                                    ? `Importar ${selectedTemplate.nombre}`
                                    : 'Selecciona una plantilla'
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