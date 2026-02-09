export interface ReportFormData {
  fecha: string;
  hora: string;
  fechaProblema: string;
  nombreCliente: string;
  telefono: string;
  nombreMascota: string;
  raza: string;
  area: string;
  personal: string;
  retroalimentacion: string;
  planAccion: string;
  responsable: string;
  comoResolver: string;
  pasosResolver: string;
  quejaResuelta: string;
  costoArea: string;
  observaciones: string;
}

export interface ReportType {
  id: string;
  title: string;
  icon: string;
  description: string;
  color?: string; // Color específico para cada tipo
}