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

export interface ExcelTemplate {
  id: string;
  nombre: string;
  tipo: 'vacunas' | 'citas' | 'personalizado';
  descripcion: string;
  activo: boolean;
  encabezados: TemplateHeader[];
  mensajeTemplate: string;
  variablesDisponibles: string[];
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface TemplateHeader {
  nombre: string;          // Nombre exacto del encabezado en Excel
  alias: string;           // Nombre amigable para mostrar
  variable: string;        // Variable para usar en el mensaje {nombre}
  requerido: boolean;
  tipo: 'texto' | 'numero' | 'fecha' | 'telefono';
  formatoFecha?: string;   // 'YYYY-MM-DD', 'DD/MM/YYYY', etc.
  ejemplo?: string;
}

export interface VariableMapping {
  variable: string;
  valor: string;
  tipo: string;
}

export interface MensajeConfigurado {
  templateId: string;
  variables: VariableMapping[];
  mensajeFinal: string;
}