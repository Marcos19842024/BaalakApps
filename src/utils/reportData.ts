import { ReportFormData, ReportType, PacienteInfo } from "src/types/report";

export const getCurrentTime = (): string => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const getCurrentDate = (): string => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
};

export const reportTypes: ReportType[] = [
    { 
        id: 'rpc', 
        title: 'Reporte de Queja', 
        icon: '📋', 
        description: 'Quejas de clientes',
        color: '#EF4444'
    },
    { 
        id: 'incidente', 
        title: 'Reporte de Incidente',
        icon: '⚠️', 
        description: 'Incidentes especiales',
        color: '#F59E0B'
    },
    { 
        id: 'general', 
        title: 'Reporte General', 
        icon: '📊', 
        description: 'Reporte diario de actividad',
        color: '#10B981'
    }
];

// Función para inicializar datos específicos por tipo de reporte
export const initializeReportData = (type?: string): ReportFormData => {
    const baseData = {
        fecha: getCurrentDate(),
        hora: getCurrentTime(),
        fechaProblema: '',
        nombreCliente: '',
        telefono: '',
        nombreMascota: '',
        raza: '',
        area: '',
        personal: '',
        retroalimentacion: '',
        planAccion: '',
        responsable: '',
        comoResolver: '',
        pasosResolver: '',
        quejaResuelta: '',
        costoArea: '',
        observaciones: '',
    };

    switch (type) {
        case 'incidente':
            return {
                ...baseData,
                retroalimentacion: 'Descripción detallada del incidente...',
                comoResolver: 'Acciones inmediatas tomadas...',
                observaciones: 'Medidas preventivas...',
                lugarIncidente: '',
                testigos: '',
                afectados: '',
                accionesCorrectivas: '',
                notificaciones: '',
            };
        case 'general':
            return {
                ...baseData,
                retroalimentacion: 'Resumen de actividades del día...',
                comoResolver: 'Logros y resultados...',
                observaciones: 'Observaciones generales...',
                pacientesTransitorios: [],
                pacientesHospitalizados: [],
                pacientesPension: [],
            };
        default:
            return baseData;
    }
};