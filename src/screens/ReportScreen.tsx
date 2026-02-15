import React, { useCallback, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    Platform,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Sharing from 'expo-sharing';
import { generateReportPDF } from '../utils/pdfGenerator';
import { SUCURSALES, SucursalType } from 'src/types/sucursal';
import Toast from 'react-native-toast-message';
import { stylesreport } from 'src/styles/report';
import { ReportFormData, PacienteInfo } from 'src/types/report';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { initializeReportData, reportTypes } from 'src/utils/reportData';
import { Calendar, DateData } from 'react-native-calendars';
import { RouteParams } from 'src/types/navigation';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { uploadFileToSupabase } from 'src/services/supabaseStorageService';

export const ReportsScreen = () => {
    const route = useRoute();
    const params = route.params as RouteParams;
    const areasScrollViewRef = useRef<ScrollView>(null);
    const [activeReport, setActiveReport] = useState<string>('rpc');
    const [isLoading, setIsLoading] = useState(false);
    const [sucursalKey, setSucursalKey] = useState<SucursalType>(params?.sucursalKey || 'BAALAK_CENTRAL');
    const [sucursalName, setSucursalName] = useState<string>(SUCURSALES.BAALAK_CENTRAL);
    const [formData, setFormData] = useState<ReportFormData>(initializeReportData());
    const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Efecto para recargar cuando la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            console.log('ReportsScreen recibió foco');
            
            if (params?.sucursalKey) {
                console.log('Parámetro sucursal recibido:', params.sucursalKey);
                handleSucursalChange(params.sucursalKey);
            } else {
                console.log('Sin parámetros, recargando sucursal actual:', sucursalKey);
                handleSucursalChange(sucursalKey);
            }
        }, [sucursalKey, params?.sucursalKey])
    );

    // Función para formatear fecha a DD/MM/AAAA
    const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        const formattedDay = date.getDate().toString().padStart(2, '0');
        const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const formattedYear = date.getFullYear();
        
        return `${formattedDay}/${formattedMonth}/${formattedYear}`;
    };

    // Función para convertir fecha de DD/MM/AAAA a YYYY-MM-DD
    const parseDateToCalendar = (dateString: string): string => {
        if (!dateString) return '';
        
        const parts = dateString.split('/');
        if (parts.length !== 3) return '';
        
        const [day, month, year] = parts.map(Number);
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) return '';
        
        const formattedYear = date.getFullYear();
        const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const formattedDay = date.getDate().toString().padStart(2, '0');
        
        return `${formattedYear}-${formattedMonth}-${formattedDay}`;
    };

    // Obtener fecha actual en formato YYYY-MM-DD para el calendario
    const getCurrentCalendarDate = (): string => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    };

    // Abrir calendario para un campo específico
    const openDatePicker = (field: string, currentValue?: string) => {
        let initialDate = getCurrentCalendarDate();
        
        if (currentValue) {
            const calendarDate = parseDateToCalendar(currentValue);
            if (calendarDate) {
                initialDate = calendarDate;
            }
        }
        
        setSelectedDate(initialDate);
        setShowDatePicker(field);
    };

    // Manejar selección de fecha
    const handleDateSelect = (date: DateData) => {
        const selectedDateStr = formatDate(date.dateString);
        
        if (showDatePicker) {
            setFormData(prev => ({
                ...prev,
                [showDatePicker]: selectedDateStr
            }));
        }
        
        setShowDatePicker(null);
    };

    // Actualizar sucursal cuando cambia
    const handleSucursalChange = (newSucursalKey: SucursalType) => {
        const newSucursalName = SUCURSALES[newSucursalKey];
        
        setSucursalKey(newSucursalKey);
        setSucursalName(newSucursalName);
        
        setFormData(prev => ({
            ...prev,
            sucursal: newSucursalName,
            sucursalKey: newSucursalKey,
            fecha: new Date().toLocaleDateString('es-MX'),
            hora: new Date().toLocaleTimeString('es-MX', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        }));
        
        Toast.show({
            type: 'success',
            text1: 'Sucursal cambiada',
            text2: newSucursalName,
        });
    };

    const handleInputChange = (field: keyof ReportFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearForm = () => {
        Alert.alert(
            'Nuevo Reporte',
            '¿Estás seguro de que deseas crear un nuevo reporte? Se perderán los datos no guardados.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Sí, crear nuevo',
                    onPress: () => {
                        const newData = initializeReportData(activeReport);
                        setFormData(newData);
                        Toast.show({
                            type: 'success',
                            text1: 'Nuevo reporte',
                            text2: `${reportTypes.find(r => r.id === activeReport)?.title || 'Reporte'} creado para ${sucursalName}`,
                        });
                    }
                }
            ]
        );
    };

    const validateRQForm = (): boolean => {
        if (!formData.fechaProblema) {
            Alert.alert('Error', 'La fecha del problema es obligatoria');
            return false;
        }
        if (!formData.nombreCliente?.trim()) {
            Alert.alert('Error', 'El nombre del cliente es obligatorio');
            return false;
        }
        if (!formData.nombreMascota?.trim()) {
            Alert.alert('Error', 'El nombre de la mascota es obligatorio');
            return false;
        }
        if (!formData.responsable?.trim()) {
            Alert.alert('Error', 'El responsable del reporte es obligatorio');
            return false;
        }
        if (!formData.area) {
            Alert.alert('Error', 'El área es obligatoria');
            return false;
        }
        if (!formData.personal?.trim()) {
            Alert.alert('Error', 'El personal involucrado es obligatorio');
            return false;
        }
        if (!formData.quejaResuelta?.trim()) {
            Alert.alert('Error', 'El estado de la queja es obligatorio');
            return false;
        }
        if (!formData.retroalimentacion?.trim()) {
            Alert.alert('Error', 'La retroalimentación del cliente es obligatoria');
            return false;
        }
        return true;
    };

    const validateIncidenteForm = (): boolean => {
        if (!formData.fechaProblema) {
            Alert.alert('Error', 'La fecha del incidente es obligatoria');
            return false;
        }
        if (!formData.nombreCliente?.trim()) {
            Alert.alert('Error', 'El nombre del afectado es obligatorio');
            return false;
        }
        if (!formData.raza?.trim()) {
            Alert.alert('Error', 'El tipo de incidente es obligatorio');
            return false;
        }
        if (!formData.area) {
            Alert.alert('Error', 'El área del incidente es obligatoria');
            return false;
        }
        if (!formData.personal?.trim()) {
            Alert.alert('Error', 'El personal involucrado es obligatorio');
            return false;
        }
        if (!formData.responsable?.trim()) {
            Alert.alert('Error', 'El responsable del reporte es obligatorio');
            return false;
        }
        if (!formData.quejaResuelta?.trim()) {
            Alert.alert('Error', 'La gravedad del incidente es obligatoria');
            return false;
        }
        if (!formData.retroalimentacion?.trim()) {
            Alert.alert('Error', 'La descripción del incidente es obligatoria');
            return false;
        }
        if (!formData.comoResolver?.trim()) {
            Alert.alert('Error', 'Las acciones inmediatas tomadas son obligatorias');
            return false;
        }
        return true;
    };

    const validateGeneralForm = (): boolean => {
        if (!formData.fechaProblema) {
            Alert.alert('Error', 'La fecha de actividad es obligatoria');
            return false;
        }
        if (!formData.responsable?.trim()) {
            Alert.alert('Error', 'El responsable es obligatorio');
            return false;
        }
        return true;
    };

    const validateForm = (): boolean => {
        switch (activeReport) {
            case 'rpc':
                return validateRQForm();
            case 'incidente':
                return validateIncidenteForm();
            case 'general':
                return validateGeneralForm();
            default:
                return validateRQForm();
        }
    };
    
    const renamePDFFile = async (originalUri: string, newFileName: string): Promise<{success: boolean, uri: string, message: string}> => {
        try {
            console.log('=== INICIANDO RENOMBRE DE ARCHIVO ===');
            console.log('URI original:', originalUri);
            console.log('Nuevo nombre:', newFileName);
            
            const directoryPath = getFileDirectory(originalUri);
            const newUri = `${directoryPath}${newFileName}`;
            
            console.log('Directorio:', directoryPath);
            console.log('Nueva URI:', newUri);
            
            const fileInfo = await LegacyFileSystem.getInfoAsync(originalUri);
            if (!fileInfo.exists) {
                console.error('❌ El archivo original no existe');
                return {
                    success: false,
                    uri: originalUri,
                    message: 'El archivo original no existe'
                };
            }
            
            console.log('✅ Archivo original existe, tamaño:', fileInfo.size, 'bytes');
            
            console.log('📋 Copiando archivo...');
            await LegacyFileSystem.copyAsync({
                from: originalUri,
                to: newUri
            });
            
            const newFileInfo = await LegacyFileSystem.getInfoAsync(newUri);
            if (newFileInfo.exists) {
                console.log('✅ Archivo copiado exitosamente, tamaño:', newFileInfo.size, 'bytes');
                
                try {
                    await LegacyFileSystem.deleteAsync(originalUri);
                    console.log('🗑️ Archivo original eliminado');
                } catch (deleteError) {
                    console.warn('⚠️ No se pudo eliminar el archivo original:', deleteError);
                }
                
                console.log('=== RENOMBRE COMPLETADO ===');
                return {
                    success: true,
                    uri: newUri,
                    message: `Archivo renombrado a: ${newFileName}`
                };
            } else {
                console.error('❌ El archivo no se copió correctamente');
                return {
                    success: false,
                    uri: originalUri,
                    message: 'No se pudo copiar el archivo'
                };
            }
            
        } catch (error: any) {
            console.error('❌ Error renombrando archivo:', error.message);
            return {
                success: false,
                uri: originalUri,
                message: `Error: ${error.message}`
            };
        }
    };

    const getFileDirectory = (fileUri: string): string => {
        const uriParts = fileUri.split('/');
        uriParts.pop();
        return uriParts.join('/') + '/';
    };

    const generateFileName = (): string => {
        const reportType = reportTypes.find(r => r.id === activeReport);
        const typeName = reportType?.title.replace(/\s+/g, '_') || 'Reporte';
        
        const clientName = formData.nombreCliente 
            ? `_${formData.nombreCliente.replace(/\s+/g, '_')}`
            : '';
        
        const petName = formData.nombreMascota
            ? `_${formData.nombreMascota.replace(/\s+/g, '_')}`
            : '';
        
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        return `${typeName}${clientName}${petName}_${date}_${sucursalKey}.pdf`;
    };

    const extractFileNameFromUri = (uri: string): string => {
        const parts = uri.split('/');
        const fileNameWithExtension = parts[parts.length - 1];
        return fileNameWithExtension;
    };

    const handleGenerateReport = async () => {
        try {
            if (!validateForm()) return;
            
            setIsLoading(true);
            
            const fileName = generateFileName();
            
            Toast.show({
                type: 'info',
                text1: 'Generando PDF...',
                text2: `Archivo: ${fileName}`,
            });
            
            const tempPdfUri = await generateReportPDF(formData, sucursalName, activeReport);
            
            const renameResult = await renamePDFFile(tempPdfUri, fileName);
            const newName = extractFileNameFromUri(renameResult.uri);
            
            setIsLoading(false);
            
            if (renameResult.success) {
                Alert.alert(
                    '✅ Reporte Generado',
                    `${fileName}`,
                    [
                        { 
                            text: 'Cancelar', 
                            style: 'cancel' 
                        },
                        { 
                            text: 'Compartir por WhatsApp',
                            onPress: () => shareViaWhatsApp(renameResult.uri, newName)
                        }
                    ]
                );
            } else {
                Alert.alert(
                    '⚠️ PDF Generado',
                    `Se generó el PDF pero no se pudo renombrar.\n\n${renameResult.message}`,
                    [
                        { 
                            text: 'OK',
                            onPress: () => shareViaWhatsApp(tempPdfUri, newName)
                        }
                    ]
                );
            }

            const downloadURL = await uploadFileToSupabase(renameResult.uri, newName);
            
            if (downloadURL) {
                Toast.show({
                    type: 'success',
                    text1: '✅ ¡Éxito!',
                    text2: `${newName} subido al servidor`
                });
            }
            
        } catch (error) {
            setIsLoading(false);
            console.error('Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo generar el PDF. Por favor, intente nuevamente.',
            });
        }
    };

    const shareViaWhatsApp = async (pdfUri: string, fileName: string) => {
        try {
            if (!await Sharing.isAvailableAsync()) {
                Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
                return;
            }

            if (Platform.OS === 'android') {
                const message = `*REPORTE DE QUEJA*\n\n` +
                `*Sucursal:* ${sucursalName}\n` +
                `*Cliente:* ${formData.nombreCliente}\n` +
                `*Mascota:* ${formData.nombreMascota}\n` +
                `*Área:* ${formData.area}\n` +
                `*Fecha del problema:* ${formData.fechaProblema}\n` +
                `*Estado:* ${formData.quejaResuelta === 'SI' ? 'Resuelta' : formData.quejaResuelta === 'NO' ? 'No resuelta' : 'En proceso'}\n\n` +
                `*Archivo adjunto:* ${fileName}\n\n` + 
                `Adjunto el reporte completo.`;

                await Sharing.shareAsync(pdfUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Compartir Reporte',
                    UTI: 'public.pdf',
                });

                Toast.show({
                    type: 'success',
                    text1: 'Compartiendo...',
                    text2: `Selecciona WhatsApp para enviar ${fileName}`,
                });
            } else {
                await Sharing.shareAsync(pdfUri);
            }
        } catch (error) {
            console.error('Error compartiendo:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo compartir el archivo',
            });
        }
    };

    // Funciones para manejar pacientes en reporte general
    const addPacienteTransitorio = () => {
        setFormData(prev => {
            const pacientesActuales = prev.pacientesTransitorios || [];
            return {
                ...prev,
                pacientesTransitorios: [
                    ...pacientesActuales,
                    {
                        nombrePaciente: '',
                        nombrePropietario: '',
                        ubicacion: '',
                        requiereTratamiento: false,
                        tipoServicio: ''
                    }
                ]
            };
        });
    };

    const addPacienteHospitalizado = () => {
        setFormData(prev => {
            const pacientesActuales = prev.pacientesHospitalizados || [];
            return {
                ...prev,
                pacientesHospitalizados: [
                    ...pacientesActuales,
                    {
                        nombrePaciente: '',
                        nombrePropietario: '',
                        ubicacion: '',
                        requiereTratamiento: false,
                        tratamiento: ''
                    }
                ]
            };
        });
    };

    const addPacientePension = () => {
        setFormData(prev => {
            const pacientesActuales = prev.pacientesPension || [];
            return {
                ...prev,
                pacientesPension: [
                    ...pacientesActuales,
                    {
                        nombrePaciente: '',
                        nombrePropietario: '',
                        ubicacion: '',
                        requiereTratamiento: false,
                        tratamiento: ''
                    }
                ]
            };
        });
    };

    const updatePaciente = (
        tipo: 'transitorios' | 'hospitalizados' | 'pension',
        index: number,
        campo: string,
        valor: any
    ) => {
        setFormData(prev => {
            const key = tipo === 'transitorios' ? 'pacientesTransitorios' : 
                       tipo === 'hospitalizados' ? 'pacientesHospitalizados' : 
                       'pacientesPension';
            
            const pacientes = [...(prev[key] || [])];
            if (pacientes[index]) {
                pacientes[index] = { ...pacientes[index], [campo]: valor };
            }
            
            return {
                ...prev,
                [key]: pacientes
            };
        });
    };

    const removePaciente = (tipo: 'transitorios' | 'hospitalizados' | 'pension', index: number) => {
        setFormData(prev => {
            const key = tipo === 'transitorios' ? 'pacientesTransitorios' : 
                       tipo === 'hospitalizados' ? 'pacientesHospitalizados' : 
                       'pacientesPension';
            
            const pacientes = [...(prev[key] || [])];
            pacientes.splice(index, 1);
            
            return {
                ...prev,
                [key]: pacientes
            };
        });
    };

    // Componente para campos de fecha con calendario
    const renderDateInput = (
        label: string,
        field: string,
        placeholder: string,
        isRequired: boolean = false,
        customStyle?: any
    ) => {
        const value = formData[field as keyof ReportFormData];
        
        return (
            <View style={[stylesreport.inputGroup, customStyle]}>
                <Text style={stylesreport.inputLabel}>
                    {label} {isRequired && <Text style={{ color: '#EF4444' }}>*</Text>}
                </Text>
                <TouchableOpacity
                    style={stylesreport.dateInputContainer}
                    onPress={() => openDatePicker(field, typeof value === 'string' ? value : '')}
                    disabled={isLoading}
                >
                    <TextInput
                        style={stylesreport.dateInput}
                        value={typeof value === 'string' ? value : ''}
                        placeholder={placeholder}
                        placeholderTextColor="#9ca3af"
                        editable={false}
                        pointerEvents="none"
                    />
                    <View style={stylesreport.dateIcon}>
                        <Icon name="calendar-today" size={20} color="#05aaca" />
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const renderInput = (
        label: string,
        field: string,
        placeholder: string,
        isRequired: boolean = false,
        multiline: boolean = false,
        keyboardType: 'default' | 'numeric' | 'email-address' | 'phone-pad' = 'default',
        customStyle?: any
    ) => {
        const value = formData[field as keyof ReportFormData];
        
        return (
            <View style={[stylesreport.inputGroup, customStyle]}>
                <Text style={stylesreport.inputLabel}>
                    {label} {isRequired && <Text style={{ color: '#EF4444' }}>*</Text>}
                </Text>
                <TextInput
                    style={[
                        stylesreport.textInput,
                        multiline ? stylesreport.textArea : {}
                    ]}
                    value={typeof value === 'string' ? value : ''}
                    onChangeText={(text) => handleInputChange(field as keyof ReportFormData, text)}
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    multiline={multiline}
                    numberOfLines={multiline ? 4 : 1}
                    keyboardType={keyboardType}
                    editable={!isLoading}
                />
            </View>
        );
    };

    // Renderizar componente para paciente
    const renderPacienteItem = (
        tipo: 'transitorios' | 'hospitalizados' | 'pension',
        paciente: PacienteInfo,
        index: number
    ) => {
        // Determinar el placeholder según el tipo
        const nombrePlaceholder = tipo === 'pension' ? 'Nombre del huésped' : 'Nombre del paciente';
        
        return (
            <View key={index} style={stylesreport.pacienteCard}>
                <View style={stylesreport.pacienteHeader}>
                    <Text style={stylesreport.pacienteTitle}>
                        {tipo === 'transitorios' ? 'Paciente' : 
                         tipo === 'hospitalizados' ? 'Paciente' : 'Huésped'} #{index + 1}
                    </Text>
                    <TouchableOpacity
                        onPress={() => removePaciente(tipo, index)}
                        style={stylesreport.removeButton}
                    >
                        <Icon name="close" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={stylesreport.textInput}
                    value={paciente.nombrePaciente}
                    onChangeText={(text) => updatePaciente(tipo, index, 'nombrePaciente', text)}
                    placeholder={nombrePlaceholder}
                    placeholderTextColor="#9ca3af"
                />

                <TextInput
                    style={stylesreport.textInput}
                    value={paciente.nombrePropietario}
                    onChangeText={(text) => updatePaciente(tipo, index, 'nombrePropietario', text)}
                    placeholder="Nombre del propietario"
                    placeholderTextColor="#9ca3af"
                />

                <TextInput
                    style={stylesreport.textInput}
                    value={paciente.ubicacion}
                    onChangeText={(text) => updatePaciente(tipo, index, 'ubicacion', text)}
                    placeholder="Ubicación / Jaula"
                    placeholderTextColor="#9ca3af"
                />

                {tipo === 'transitorios' && (
                    <TextInput
                        style={stylesreport.textInput}
                        value={paciente.tipoServicio || ''}
                        onChangeText={(text) => updatePaciente(tipo, index, 'tipoServicio', text)}
                        placeholder="Tipo de servicio (consulta/procedimiento)"
                        placeholderTextColor="#9ca3af"
                    />
                )}

                <View style={stylesreport.checkboxContainer}>
                    <TouchableOpacity
                        style={[
                            stylesreport.checkbox,
                            paciente.requiereTratamiento && stylesreport.checkboxChecked
                        ]}
                        onPress={() => updatePaciente(tipo, index, 'requiereTratamiento', !paciente.requiereTratamiento)}
                    >
                        {paciente.requiereTratamiento && <Icon name="check" size={16} color="white" />}
                    </TouchableOpacity>
                    <Text style={stylesreport.checkboxLabel}>¿Requiere tratamiento médico?</Text>
                </View>

                {paciente.requiereTratamiento && (
                    <TextInput
                        style={[stylesreport.textInput, stylesreport.textArea]}
                        value={paciente.tratamiento || ''}
                        onChangeText={(text) => updatePaciente(tipo, index, 'tratamiento', text)}
                        placeholder="Especificar tratamiento"
                        placeholderTextColor="#9ca3af"
                        multiline
                        numberOfLines={2}
                    />
                )}
            </View>
        );
    };

    // Renderizar formulario de incidente mejorado
    const renderIncidenteForm = () => (
        <View style={stylesreport.formContainer}>
            <View style={stylesreport.formHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialCommunityIcons name="alert-circle" size={28} color="#D97706" />
                    <Text style={[stylesreport.formTitle, { color: '#D97706' }]}>
                        Reporte de Incidente - {sucursalName}
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={stylesreport.areasScrollView}>
                {/* Información básica */}
                <View style={stylesreport.sectionCard}>
                    <Text style={stylesreport.sectionCardTitle}>Información General</Text>
                    <View style={stylesreport.gridContainer}>
                        <View style={stylesreport.gridColumn}>
                            {renderDateInput('Fecha del incidente', 'fechaProblema', 'Seleccionar fecha', true)}
                            {renderInput('Hora aproximada', 'hora', 'HH:MM', true)}
                            {renderInput('Lugar específico', 'lugarIncidente', 'Ej: Recepción, Alberca, etc.', true)}
                        </View>
                        <View style={stylesreport.gridColumn}>
                            {renderInput('Tipo de incidente', 'raza', 'Ej: Caída, Mordida, Fuga', true)}
                            {renderInput('Gravedad', 'quejaResuelta', 'Leve / Moderado / Grave', true)}
                            {renderInput('Área responsable', 'area', 'Área involucrada', true)}
                        </View>
                    </View>
                </View>

                {/* Personas involucradas */}
                <View style={stylesreport.sectionCard}>
                    <Text style={stylesreport.sectionCardTitle}>Personas Involucradas</Text>
                    {renderInput('Afectado(s)', 'nombreCliente', 'Nombre de persona(s) afectada(s)', true)}
                    {renderInput('Personal involucrado', 'personal', 'Personal presente', true)}
                    {renderInput('Responsable del reporte', 'responsable', 'Quién reporta', true)}
                    {renderInput('Testigos', 'testigos', 'Nombre de testigos si los hay', false, true)}
                </View>

                {/* Descripción del incidente */}
                <View style={stylesreport.sectionCard}>
                    <Text style={stylesreport.sectionCardTitle}>Descripción del Incidente</Text>
                    {renderInput(
                        '¿Qué sucedió?',
                        'retroalimentacion',
                        'Describa detalladamente lo ocurrido...',
                        true,
                        true
                    )}
                    {renderInput(
                        '¿Por qué sucedió?',
                        'pasosResolver',
                        'Causas del incidente...',
                        false,
                        true
                    )}
                </View>

                {/* Acciones tomadas */}
                <View style={stylesreport.sectionCard}>
                    <Text style={stylesreport.sectionCardTitle}>Acciones Realizadas</Text>
                    {renderInput(
                        'Acciones inmediatas',
                        'comoResolver',
                        '¿Qué se hizo inmediatamente después?',
                        true,
                        true
                    )}
                    {renderInput(
                        'Acciones correctivas',
                        'accionesCorrectivas',
                        'Medidas para corregir la situación...',
                        false,
                        true
                    )}
                </View>

                {/* Notificaciones y seguimiento */}
                <View style={stylesreport.sectionCard}>
                    <Text style={stylesreport.sectionCardTitle}>Notificaciones y Seguimiento</Text>
                    {renderInput(
                        'Notificaciones realizadas',
                        'notificaciones',
                        '¿A quién se notificó? (Gerente, familia, etc.)',
                        false,
                        true
                    )}
                    {renderDateInput('Fecha de seguimiento', 'planAccion', 'Fecha programada')}
                    {renderInput('Costo estimado', 'costoArea', '$0.00', false, false, 'numeric')}
                </View>

                {/* Observaciones */}
                {renderInput(
                    'Observaciones adicionales',
                    'observaciones',
                    'Recomendaciones, medidas preventivas...',
                    false,
                    true
                )}
            </ScrollView>
        </View>
    );

    // Renderizar formulario de reporte general con pacientes
    const renderGeneralForm = () => {
        const totalPacientes = (formData.pacientesTransitorios?.length || 0) + 
        (formData.pacientesHospitalizados?.length || 0) + 
        (formData.pacientesPension?.length || 0);

        return (
            <View style={stylesreport.formContainer}>
                <View style={stylesreport.formHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <MaterialCommunityIcons name="file-document" size={28} color="#059669" />
                        <Text style={[stylesreport.formTitle, { color: '#059669' }]}>
                            Reporte General Diario - {sucursalName}
                        </Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={stylesreport.areasScrollView}>
                    {/* Resumen del día */}
                    <View style={stylesreport.sectionCard}>
                        <Text style={stylesreport.sectionCardTitle}>Resumen del Día</Text>
                        <View style={stylesreport.gridContainer}>
                            <View style={stylesreport.gridColumn}>
                                {renderDateInput('Fecha', 'fechaProblema', 'Fecha del reporte', true)}
                                <View style={stylesreport.infoBox}>
                                    <Text style={stylesreport.infoBoxLabel}>Total de pacientes/huéspedes:</Text>
                                    <Text style={stylesreport.infoBoxValue}>{totalPacientes}</Text>
                                </View>
                            </View>
                            <View style={stylesreport.gridColumn}>
                                <View style={stylesreport.statsContainer}>
                                    <View style={stylesreport.statItem}>
                                        <Text style={stylesreport.statLabel}>Transitorios:</Text>
                                        <Text style={stylesreport.statValue}>{formData.pacientesTransitorios?.length || 0}</Text>
                                    </View>
                                    <View style={stylesreport.statItem}>
                                        <Text style={stylesreport.statLabel}>Hospitalizados:</Text>
                                        <Text style={stylesreport.statValue}>{formData.pacientesHospitalizados?.length || 0}</Text>
                                    </View>
                                    <View style={stylesreport.statItem}>
                                        <Text style={stylesreport.statLabel}>Pensión:</Text>
                                        <Text style={stylesreport.statValue}>{formData.pacientesPension?.length || 0}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Personal en turno */}
                    <View style={stylesreport.sectionCard}>
                        <Text style={stylesreport.sectionCardTitle}>Personal en Turno</Text>
                        <View style={stylesreport.gridContainer}>
                            <View style={stylesreport.gridColumn}>
                                {renderInput('Médico(s) en turno', 'personal', 'Nombres de médicos', true, true)}
                            </View>
                            <View style={stylesreport.gridColumn}>
                                {renderInput('Recepcionista en turno', 'area', 'Nombre de recepcionista', true)}
                                {renderInput('Encargado de pensión', 'responsable', 'Nombre del encargado', true)}
                            </View>
                        </View>
                    </View>

                    {/* Pacientes Transitorios (Consulta/Procedimientos) */}
                    <View style={stylesreport.sectionCard}>
                        <View style={stylesreport.sectionHeader}>
                            <Text style={stylesreport.sectionCardTitle}>
                                Pacientes Transitorios ({formData.pacientesTransitorios?.length || 0})
                            </Text>
                            <TouchableOpacity
                                style={stylesreport.addButton}
                                onPress={addPacienteTransitorio}
                            >
                                <Icon name="add" size={20} color="white" />
                                <Text style={stylesreport.addButtonText}>Agregar</Text>
                            </TouchableOpacity>
                        </View>

                        {formData.pacientesTransitorios?.map((paciente, index) => 
                            renderPacienteItem('transitorios', paciente, index)
                        )}

                        {(!formData.pacientesTransitorios || formData.pacientesTransitorios.length === 0) && (
                            <Text style={stylesreport.emptyText}>No hay pacientes transitorios registrados</Text>
                        )}
                    </View>

                    {/* Pacientes Hospitalizados */}
                    <View style={stylesreport.sectionCard}>
                        <View style={stylesreport.sectionHeader}>
                            <Text style={stylesreport.sectionCardTitle}>
                                Pacientes Hospitalizados ({formData.pacientesHospitalizados?.length || 0})
                            </Text>
                            <TouchableOpacity
                                style={stylesreport.addButton}
                                onPress={addPacienteHospitalizado}
                            >
                                <Icon name="add" size={20} color="white" />
                                <Text style={stylesreport.addButtonText}>Agregar</Text>
                            </TouchableOpacity>
                        </View>

                        {formData.pacientesHospitalizados?.map((paciente, index) => 
                            renderPacienteItem('hospitalizados', paciente, index)
                        )}

                        {(!formData.pacientesHospitalizados || formData.pacientesHospitalizados.length === 0) && (
                            <Text style={stylesreport.emptyText}>No hay pacientes hospitalizados</Text>
                        )}
                    </View>

                    {/* Huéspedes en Pensión */}
                    <View style={stylesreport.sectionCard}>
                        <View style={stylesreport.sectionHeader}>
                            <Text style={stylesreport.sectionCardTitle}>
                                Huéspedes en Pensión ({formData.pacientesPension?.length || 0})
                            </Text>
                            <TouchableOpacity
                                style={stylesreport.addButton}
                                onPress={addPacientePension}
                            >
                                <Icon name="add" size={20} color="white" />
                                <Text style={stylesreport.addButtonText}>Agregar</Text>
                            </TouchableOpacity>
                        </View>

                        {formData.pacientesPension?.map((paciente, index) => 
                            renderPacienteItem('pension', paciente, index)
                        )}

                        {(!formData.pacientesPension || formData.pacientesPension.length === 0) && (
                            <Text style={stylesreport.emptyText}>No hay huéspedes en pensión</Text>
                        )}
                    </View>

                    {/* Actividades y resultados */}
                    <View style={stylesreport.sectionCard}>
                        <Text style={stylesreport.sectionCardTitle}>Actividades Realizadas</Text>
                        {renderInput(
                            'Descripción de actividades',
                            'retroalimentacion',
                            'Detalle de las actividades del día...',
                            true,
                            true
                        )}
                        {renderInput(
                            'Resultados obtenidos',
                            'comoResolver',
                            'Logros y metas cumplidas...',
                            true,
                            true
                        )}
                    </View>

                    {/* Observaciones */}
                    {renderInput(
                        'Observaciones y notas',
                        'observaciones',
                        'Incidencias, pendientes, recomendaciones...',
                        false,
                        true
                    )}
                </ScrollView>
            </View>
        );
    };

    // Renderizar RQ Form (mantener el existente)
    const renderRQForm = () => (
        <View style={stylesreport.formContainer}>
            <View style={stylesreport.formHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialCommunityIcons name="clipboard-text" size={28} color="#EF4444" />
                    <Text style={[stylesreport.formTitle, { color: '#EF4444' }]}>
                        Reporte de Queja - {sucursalName}
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={stylesreport.areasScrollView}>
                {/* Información del problema */}
                <View style={stylesreport.sectionCard}>
                    <Text style={stylesreport.sectionCardTitle}>Información del Problema</Text>
                    <View style={stylesreport.gridContainer}>
                        <View style={stylesreport.gridColumn}>
                            {renderDateInput('Fecha del problema', 'fechaProblema', 'Seleccionar fecha', true)}
                            {renderInput('Área', 'area', 'Ej: Recepción, Consultorio, etc.', true)}
                            {renderInput('Personal involucrado', 'personal', 'Ej: ALICIA GOMEZ', true)}
                        </View>
                        <View style={stylesreport.gridColumn}>
                            {renderDateInput('Fecha plan de acción', 'planAccion', 'Seleccionar fecha')}
                            {renderInput('Responsable del plan', 'responsable', 'Ej: Mayte colli', true)}
                            {renderInput('Estado', 'quejaResuelta', 'Si / No / En proceso', true)}
                        </View>
                    </View>
                </View>

                {/* Información del cliente */}
                <View style={stylesreport.sectionCard}>
                    <Text style={stylesreport.sectionCardTitle}>Información del Cliente</Text>
                    <View style={stylesreport.gridContainer}>
                        <View style={stylesreport.gridColumn}>
                            {renderInput('Nombre del Cliente', 'nombreCliente', 'Ej: ADRIANA ORLAINETA', true)}
                            {renderInput('Teléfono', 'telefono', 'Teléfono de contacto', false, false, 'phone-pad')}
                        </View>
                        <View style={stylesreport.gridColumn}>
                            {renderInput('Nombre de la Mascota', 'nombreMascota', 'Ej: RICKY', true)}
                            {renderInput('Raza', 'raza', 'Ej: Yorkie', false)}
                        </View>
                    </View>
                </View>

                {/* Descripción de la queja */}
                <View style={stylesreport.sectionCard}>
                    <Text style={stylesreport.sectionCardTitle}>Descripción de la Queja</Text>
                    {renderInput(
                        'Retroalimentación del cliente',
                        'retroalimentacion',
                        'Describa detalladamente la queja o problema reportado...',
                        true,
                        true
                    )}
                </View>

                {/* Plan de acción */}
                <View style={stylesreport.sectionCard}>
                    <Text style={stylesreport.sectionCardTitle}>Plan de Acción</Text>
                    {renderInput(
                        '¿Cómo se va a resolver?',
                        'comoResolver',
                        'Describa el plan de acción...',
                        false,
                        true
                    )}
                    {renderInput(
                        'Pasos a seguir',
                        'pasosResolver',
                        'Pasos específicos para resolver...',
                        false,
                        true
                    )}
                    {renderInput('Costo al área ($)', 'costoArea', '0.00', false, false, 'numeric')}
                </View>

                {/* Observaciones */}
                {renderInput(
                    'Observaciones adicionales',
                    'observaciones',
                    'Cualquier observación adicional...',
                    false,
                    true
                )}
            </ScrollView>
        </View>
    );

    const renderForm = () => {
        switch (activeReport) {
            case 'rpc':
                return renderRQForm();
            case 'incidente':
                return renderIncidenteForm();
            case 'general':
                return renderGeneralForm();
            default:
                return renderRQForm();
        }
    };

    return (
        <SafeAreaView style={stylesreport.container}>
            {/* SECCIÓN FIJA SUPERIOR */}
            <View style={stylesreport.fixedSection}>
                {/* Header */}
                <View style={stylesreport.header}>
                    {/* Botones de acción */}
                    <TouchableOpacity
                        style={stylesreport.headerButton}
                        onPress={handleGenerateReport}
                        disabled={isLoading}
                    >
                        <Icon name="picture-as-pdf" size={24} color="white" />
                        <Text style={stylesreport.buttonText}>Generar PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={stylesreport.headerButton}
                        onPress={clearForm}
                        disabled={isLoading}
                    >
                        <Icon name="delete-sweep" size={24} color="white" />
                        <Text style={stylesreport.buttonText}>Limpiar</Text>
                    </TouchableOpacity>
                </View>

                {/* Información general */}
                <View style={stylesreport.infoCard}>
                    <Text style={stylesreport.infoLabel}>FECHA:</Text>
                    <Text style={stylesreport.infoValue}>{formData.fecha}</Text>
                    <Text></Text><Text></Text><Text></Text>
                    <Text style={stylesreport.infoLabel}>HORA:</Text>
                    <Text style={stylesreport.infoValue}>{formData.hora} hrs.</Text>
                </View>

                {/* Selector de tipo de reporte */}
                <View style={stylesreport.areaSection}>
                    <View style={stylesreport.areaHeader}>
                        <Text style={stylesreport.evaluationSubtitle}>
                            Seleccione tipo de reporte
                        </Text>
                    </View>
                
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={stylesreport.areaScroll}
                    >
                        {reportTypes.map((report) => {
                            const reportType = reportTypes.find(r => r.id === report.id);
                            const isActive = activeReport === report.id;
                            
                            return (
                                <TouchableOpacity
                                    key={report.id}
                                    style={[
                                        stylesreport.areaButton,
                                        isActive && stylesreport.areaButtonActive,
                                        { 
                                            minWidth: 100,
                                            backgroundColor: isActive ? (reportType?.color || '#05aaca') : '#f3f4f6',
                                            borderColor: isActive ? (reportType?.color || '#05aaca') : '#d1d5db',
                                            borderWidth: 1,
                                        }
                                    ]}
                                    onPress={() => setActiveReport(report.id)}
                                    disabled={isLoading}
                                >
                                    <Text style={stylesreport.areaIcon}>{report.icon}</Text>
                                    <Text
                                        style={[
                                            stylesreport.areaButtonText,
                                            isActive && stylesreport.areaButtonTextActive,
                                            { fontSize: 12 }
                                        ]}
                                    >
                                        {report.title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            {/* SCROLLVIEW PARA EL FORMULARIO */}
            <ScrollView 
                style={stylesreport.areasScrollView}
                showsVerticalScrollIndicator={true}
            >
                {renderForm()}
            </ScrollView>

            {/* Modal del calendario */}
            <Modal
                visible={showDatePicker !== null}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(null)}
            >
                <View style={stylesreport.calendarModalOverlay}>
                    <View style={stylesreport.calendarModalContent}>
                        <TouchableOpacity
                            style={stylesreport.calendarCloseButton}
                            onPress={() => setShowDatePicker(null)}
                        >
                            <Icon name="close" size={30} color="#374151" />
                        </TouchableOpacity>
                        <Calendar
                            onDayPress={handleDateSelect}
                            markedDates={{
                                [selectedDate]: {
                                    selected: true,
                                    selectedColor: '#05aaca',
                                    selectedTextColor: 'white'
                                }
                            }}
                            minDate={'2000-01-01'}
                            maxDate={'2100-12-31'}
                            hideExtraDays={true}
                            disableMonthChange={false}
                            firstDay={1}
                            hideDayNames={false}
                            showWeekNumbers={false}
                            disableArrowLeft={false}
                            disableArrowRight={false}
                            disableAllTouchEventsForDisabledDays={true}
                            enableSwipeMonths={true}
                            theme={{
                                backgroundColor: '#E5E7EB',
                                calendarBackground: '#E5E7EB',
                                textSectionTitleColor: '#374151',
                                selectedDayBackgroundColor: '#05aaca',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#05aaca',
                                dayTextColor: '#1F2937',
                                textDisabledColor: '#9CA3AF',
                                dotColor: '#05aaca',
                                selectedDotColor: '#ffffff',
                                arrowColor: '#05aaca',
                                monthTextColor: '#05aaca',
                                textDayFontSize: 16,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 14,
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Loading Overlay */}
            <Modal
                visible={isLoading}
                transparent={true}
                animationType="fade"
            >
                <View style={stylesreport.loadingOverlay}>
                    <View style={stylesreport.loadingContent}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={stylesreport.loadingText}>
                            Generando PDF para {sucursalName}...
                        </Text>
                    </View>
                </View>
            </Modal>

            <Toast />
        </SafeAreaView>
    );
};