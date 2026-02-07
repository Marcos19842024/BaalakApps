import { ReportFormData, ReportType } from "src/types/report";

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
        description: 'Quejas de clientes' 
    },
    { 
        id: 'incidente', 
        title: 'Reporte de Incidente', 
        icon: '⚠️', 
        description: 'Incidentes especiales' 
    },
    { 
        id: 'seguimiento', 
        title: 'Seguimiento', 
        icon: '📊', 
        description: 'Monitoreo y seguimiento' 
    },
    { 
        id: 'general', 
        title: 'Reporte General', 
        icon: '📄', 
        description: 'Actividades generales' 
    }
];

export const initializeReportData = (): ReportFormData => {
    return {
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
};