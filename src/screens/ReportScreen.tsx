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
import { ReportFormData } from 'src/types/report';
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
            // Si recibimos una sucursal por parámetro, seleccionarla
            if (params?.sucursalKey) {
                setSucursalKey(params.sucursalKey);
                return
            }
            console.log('ReportsScreen recibió foco, recargando...');
            handleSucursalChange(sucursalKey);
        }, [sucursalKey])
    );

    // Función para formatear fecha a DD/MM/AAAA
    const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        
        // Asegurarnos de manejar correctamente la zona horaria
        // Crear fecha usando partes específicas
        const [year, month, day] = dateString.split('-').map(Number);
        
        // Crear fecha en zona horaria local
        const date = new Date(year, month - 1, day); // mes es 0-indexed
        
        const formattedDay = date.getDate().toString().padStart(2, '0');
        const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const formattedYear = date.getFullYear();
        
        return `${formattedDay}/${formattedMonth}/${formattedYear}`;
    };

    // Función para convertir fecha de DD/MM/AAAA a YYYY-MM-DD
    const parseDateToCalendar = (dateString: string): string => {
        if (!dateString) return '';
        
        // Parsear la fecha DD/MM/AAAA
        const parts = dateString.split('/');
        if (parts.length !== 3) return '';
        
        const [day, month, year] = parts.map(Number);
        
        // Validar que la fecha sea válida
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) return '';
        
        // Formatear a YYYY-MM-DD
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

    // Manejar selección de fecha - VERSIÓN CORREGIDA
    const handleDateSelect = (date: DateData) => {
        // Usar directamente la fecha del calendario (ya está en formato YYYY-MM-DD)
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
                        const newData = initializeReportData();
                        setFormData(newData);
                        Toast.show({
                            type: 'success',
                            text1: 'Nuevo reporte',
                            text2: `Creado para ${sucursalName}`,
                        });
                    }
                }
            ]
        );
    };

    const validateForm = (): boolean => {
        if (!formData.fechaProblema) {
            Alert.alert('La fecha del problema es obligatoria');
            return false;
        }
        if (!formData.nombreCliente.trim()) {
            Alert.alert('El nombre del cliente es obligatorio');
            return false;
        }
        if (!formData.nombreMascota.trim()) {
            Alert.alert('El nombre de la mascota es obligatorio');
            return false;
        }
        if (!formData.responsable.trim()) {
            Alert.alert('El responsable del reporte es obligatorio');
            return false;
        }
        if (!formData.area) {
            Alert.alert('El área es obligatoria');
            return false;
        }
        if (!formData.personal.trim()) {
            Alert.alert('El personal involucrado es obligatorio');
            return false;
        }
        if (!formData.quejaResuelta.trim()) {
            Alert.alert('El estado de la queja es obligatorio');
            return false;
        }
        if (!formData.retroalimentacion.trim()) {
            Alert.alert('La retroalimentación del cliente es obligatoria');
            return false;
        }
        return true;
    };
    
    // Función para renombrar el archivo PDF
    const renamePDFFile = async (originalUri: string, newFileName: string): Promise<{success: boolean, uri: string, message: string}> => {
        try {
            console.log('=== INICIANDO RENOMBRE DE ARCHIVO ===');
            console.log('URI original:', originalUri);
            console.log('Nuevo nombre:', newFileName);
            
            // Obtener directorio del archivo original
            const directoryPath = getFileDirectory(originalUri);
            const newUri = `${directoryPath}${newFileName}`;
            
            console.log('Directorio:', directoryPath);
            console.log('Nueva URI:', newUri);
            
            // Verificar que el archivo original existe
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
            
            // Copiar a nuevo nombre
            console.log('📋 Copiando archivo...');
            await LegacyFileSystem.copyAsync({
                from: originalUri,
                to: newUri
            });
            
            // Verificar que se copió
            const newFileInfo = await LegacyFileSystem.getInfoAsync(newUri);
            if (newFileInfo.exists) {
                console.log('✅ Archivo copiado exitosamente, tamaño:', newFileInfo.size, 'bytes');
                
                // Intentar eliminar original (opcional)
                try {
                    await LegacyFileSystem.deleteAsync(originalUri);
                    console.log('🗑️ Archivo original eliminado');
                } catch (deleteError) {
                    console.warn('⚠️ No se pudo eliminar el archivo original:', deleteError);
                    // No es crítico, continuamos
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

    // Función para obtener el directorio del archivo
    const getFileDirectory = (fileUri: string): string => {
        const uriParts = fileUri.split('/');
        uriParts.pop(); // Remover nombre del archivo
        return uriParts.join('/') + '/';
    };

    const generateFileName = (): string => {
        const reportType = reportTypes.find(r => r.id === activeReport)?.title || 'Reporte';
        const clientName = formData.nombreCliente 
        ? `_${formData.nombreCliente.replace(/\s+/g, '_')}`
        : '';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${reportType.replace(/\s+/g, '_')}${clientName}_${date}.pdf`;
    };

    // Función para extraer nombre del archivo de la URI
    const extractFileNameFromUri = (uri: string): string => {
        const parts = uri.split('/');
        const fileNameWithExtension = parts[parts.length - 1];
        return fileNameWithExtension;
    };

    // Función para generar y mostrar opciones de PDF
    const handleGenerateReport = async () => {
        try {
            if (!validateForm()) return;
            
            setIsLoading(true);
            
            // Generar nombre del archivo
            const fileName = generateFileName();
            
            Toast.show({
                type: 'info',
                text1: 'Generando PDF...',
                text2: `Archivo: ${fileName}`,
            });
            
            // Generar PDF
            const tempPdfUri = await generateReportPDF(formData, sucursalName);
            
            // Renombrar el archivo
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
                // Si falla el rename, usar el archivo original
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

            // Subir a Supabase
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

    // Compartir por WhatsApp
    const shareViaWhatsApp = async (pdfUri: string, fileName: string) => {
        try {
            if (!await Sharing.isAvailableAsync()) {
                Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
                return;
            }

            // Para Android, podemos usar un intent directo
            if (Platform.OS === 'android') {
                const message = `*REPORTE DE PROBLEMA DEL CLIENTE*\n\n` +
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
                // Para iOS
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

    // Componente para campos de fecha con calendario
    const renderDateInput = (
        label: string,
        field: keyof ReportFormData,
        placeholder: string,
        isRequired: boolean = false
    ) => (
        <View style={stylesreport.inputGroup}>
            <Text style={stylesreport.inputLabel}>
                {label} {isRequired && <Text style={{ color: '#EF4444' }}>*</Text>}
            </Text>
            <TouchableOpacity
                style={stylesreport.dateInputContainer}
                onPress={() => openDatePicker(field, formData[field])}
                disabled={isLoading}
            >
                <TextInput
                    style={stylesreport.dateInput}
                    value={formData[field]}
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

    const renderInput = (
        label: string,
        field: keyof ReportFormData,
        placeholder: string,
        isRequired: boolean = false,
        multiline: boolean = false,
        keyboardType: 'default' | 'numeric' | 'email-address' | 'phone-pad' = 'default'
    ) => (
        <View style={stylesreport.inputGroup}>
            <Text style={stylesreport.inputLabel}>
                {label} {isRequired && <Text style={{ color: '#EF4444' }}>*</Text>}
            </Text>
            <TextInput
                style={[
                    stylesreport.textInput,
                    multiline ? stylesreport.textArea : {}
                ]}
                value={formData[field]}
                onChangeText={(text) => handleInputChange(field, text)}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
                keyboardType={keyboardType}
                editable={!isLoading}
            />
        </View>
    );

    const renderRPCForm = () => (
        <View style={stylesreport.formContainer}>
            <View style={stylesreport.formHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialCommunityIcons name="clipboard-text" size={28} color="#1F2937" />
                    <Text style={stylesreport.formTitle}>
                        Reporte de Problema del Cliente
                    </Text>
                </View>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                ref={areasScrollViewRef}
                style={stylesreport.areasScrollView}
            >
                <View style={stylesreport.gridContainer}>
                    <View style={stylesreport.gridColumn}>
                        {renderDateInput(
                            'Fecha del problema',
                            'fechaProblema',
                            'Seleccionar fecha',
                            true
                        )}
                        {renderInput(
                            'Nombre del Cliente',
                            'nombreCliente',
                            'Ej: ADRIANA ORLAINETA',
                            true
                        )}
                        {renderInput(
                            'Teléfono',
                            'telefono',
                            'Teléfono'
                        )}
                        {renderInput(
                            'Nombre de la Mascota',
                            'nombreMascota',
                            'Ej: RICKY',
                            true
                        )}
                        {renderInput(
                            'Raza',
                            'raza',
                            'Ej: Yorkie'
                        )}
                    </View>
                
                    <View style={stylesreport.gridColumn}>
                        {renderDateInput(
                            'Fecha Plan de Acción',
                            'planAccion',
                            'Seleccionar fecha',
                        )}
                        {renderInput(
                            'Área',
                            'area',
                            'Ej: Recepción',
                            true
                        )}
                        {renderInput(
                            'Personal involucrado',
                            'personal',
                            'Ej: ALICIA GOMEZ',
                            true
                        )}
                        {renderInput(
                            'Responsable del plan',
                            'responsable',
                            'Ej: Mayte colli',
                            true
                        )}
                        {renderInput(
                            'Queja resuelta',
                            'quejaResuelta',
                            'Ej: Si / No / En proceso',
                            true
                        )}
                    </View>
                </View>

                {renderInput(
                    'Costo al área ($)',
                    'costoArea',
                    '0.00',
                    false,
                    false,
                    'numeric'
                )}

                {renderInput(
                    'Retroalimentación del cliente',
                    'retroalimentacion',
                    'Describa detalladamente la queja o problema reportado por el cliente...',
                    true,
                    true
                )}
                
                {renderInput(
                    'Cómo se va a resolver el problema',
                    'comoResolver',
                    'Describa el plan de acción para resolver el problema...',
                    false,
                    true
                )}
                
                {renderInput(
                    'Pasos seguidos para resolver',
                    'pasosResolver',
                    'Describa los pasos específicos tomados para resolver la queja...',
                    false,
                    true
                )}

                {renderInput(
                    'Observaciones adicionales',
                    'observaciones',
                    'Cualquier observación adicional o comentario...',
                    false,
                    true
                )}
            </ScrollView>
        </View>
    );

    const renderForm = () => {
        switch (activeReport) {
            case 'rpc':
            return renderRPCForm();
            default:
            return renderRPCForm();
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
                        {reportTypes.map((report) => (
                            <TouchableOpacity
                                key={report.id}
                                style={[
                                    stylesreport.areaButton,
                                    activeReport === report.id && stylesreport.areaButtonActive,
                                    { minWidth: 100 }
                                ]}
                                onPress={() => setActiveReport(report.id)}
                                disabled={isLoading}
                            >
                                <Text style={stylesreport.areaIcon}>{report.icon}</Text>
                                <Text
                                    style={[
                                        stylesreport.areaButtonText,
                                        activeReport === report.id && stylesreport.areaButtonTextActive,
                                        { fontSize: 12 }
                                    ]}
                                >
                                    {report.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
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
                            firstDay={1} // Lunes como primer día
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