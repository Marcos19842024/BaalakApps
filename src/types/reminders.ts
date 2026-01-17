export interface Cliente {
    id: string;
    nombre: string;
    telefono: string;
    mascotas: Mascota[];
    mensajes: Mensaje[];
    status: boolean;
}

export interface Mascota {
    nombre: string;
    recordatorios: Recordatorio[];
}

export interface Recordatorio {
    nombre: string;
    tipos: Tipo[];
}

export interface Tipo {
    nombre: string;
    fecha: string;
}

export interface Mensaje {
    id: string;
    message: string;
    senderName: string;
    timestamp: string;
    isOwnMessage: boolean;
}