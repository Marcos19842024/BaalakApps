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
}

export interface Mensaje {
    id: string;
    contenido: string;
    timestamp: string;
    esPropio: boolean;
}

export interface ContactoWhatsApp {
    id: { server: string };
    name: string;
    number: string;
    isMyContact: boolean;
}

export interface ContactoResponse {
    statusText: ContactoWhatsApp[];
}

export interface MessageBubbleProps {
    mensaje: Mensaje;
}