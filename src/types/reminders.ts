export interface Tipo {
    nombre: string;
    fecha: string;
}

export interface Recordatorio {
    nombre: string;
    tipos: Tipo[];
}

export interface Mascota {
    nombre: string;
    recordatorios: Recordatorio[];
}

export interface Cliente {
    nombre: string;
    telefono: string;
    mascotas: Mascota[];
    mensajes: Mensaje[];
    status: boolean;
    // Campos específicos para citas
    fechaCita?: string;
    horaCita?: string;
    tipoVisita?: string;
    asunto?: string;
    agenda?: string;
    estado?: string;
    todasLasCitas?: any[];
}

export interface Mensaje {
    id: string;
    contenido: string;
    timestamp: string;
    esPropio: boolean;
}

export interface ExcelTemplate {
    id: string;
    nombre: string;
    tipo: 'vacunas' | 'citas' | 'personalizado';
    descripcion: string;
    activo: boolean;
    encabezados: TemplateHeader[];
    mensajeTemplate: string;
}

export interface TemplateHeader {
    nombre: string;
    alias: string;
    variable: string;
    requerido: boolean;
    tipo: 'texto' | 'numero' | 'fecha' | 'telefono';
    formatoFecha?: string;
    ejemplo?: string;
}