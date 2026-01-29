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
import { useFocusEffect } from '@react-navigation/native';
import { initializeReportData, reportTypes } from 'src/utils/reportData';

export const ReportsScreen = () => {
    const areasScrollViewRef = useRef<ScrollView>(null);
    const [activeReport, setActiveReport] = useState<string>('rpc');
    const [isLoading, setIsLoading] = useState(false);
    const [sucursalKey, setSucursalKey] = useState<SucursalType>('BAALAK_CENTRAL');
    const [sucursalName, setSucursalName] = useState<string>(SUCURSALES.BAALAK_CENTRAL);
    const [formData, setFormData] = useState<ReportFormData>(initializeReportData());

    // Efecto para recargar cuando la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            console.log('ReportsScreen recibió foco, recargando...');
            handleSucursalChange(sucursalKey);
        }, [sucursalKey])
    );

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

    const generateFileName = (): string => {
        const reportType = reportTypes.find(r => r.id === activeReport)?.title || 'Reporte';
        const clientName = formData.nombreCliente 
        ? `_${formData.nombreCliente.replace(/\s+/g, '_')}`
        : '';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${reportType.replace(/\s+/g, '_')}${clientName}_${date}.pdf`;
    };

    // Función para generar y mostrar opciones de PDF
    const handleGenerateReport = async () => {
        try {
            if (!validateForm()) return;
            
            setIsLoading(true);
            
            const pdfUri = await generateReportPDF(formData, sucursalName);
            const fileName = generateFileName();
            
            setIsLoading(false);
            
            Alert.alert(
                '✅ Reporte Generado',
                `Reporte PDF creado exitosamente para ${sucursalName}`,
                [
                    { 
                        text: 'Cancelar', 
                        style: 'cancel' 
                    },
                    { 
                        text: 'Descargar PDF',
                        onPress: () => sharePDF(pdfUri, fileName)
                    },
                    { 
                        text: 'Compartir por WhatsApp',
                        onPress: () => shareViaWhatsApp(pdfUri, fileName)
                    }
                ]
            );
            
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

    // Compartir PDF
    const sharePDF = async (pdfUri: string, fileName: string) => {
        try {
            if (!await Sharing.isAvailableAsync()) {
                Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
                return;
            }

            await Sharing.shareAsync(pdfUri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Guardar Reporte PDF',
                UTI: 'public.pdf',
            });

            Toast.show({
                type: 'success',
                text1: '✅ PDF listo',
                text2: 'Usa el menú para guardar o compartir',
            });
        
        } catch (error) {
            console.error('Error compartiendo PDF:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo abrir el PDF',
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
                `Adjunto el reporte completo.`;

                await Sharing.shareAsync(pdfUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Compartir Reporte',
                    UTI: 'public.pdf',
                });

                Toast.show({
                    type: 'success',
                    text1: 'Compartiendo...',
                    text2: 'Selecciona WhatsApp para enviar',
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
                        {renderInput(
                            'Fecha del problema',
                            'fechaProblema',
                            'DD/MM/AAAA',
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
                            'Fecha Plan de Acción',
                            'planAccion',
                            'DD/MM/AAAA'
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