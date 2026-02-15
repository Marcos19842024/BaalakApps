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
  
  // Campos específicos para incidentes
  lugarIncidente?: string;
  testigos?: string;
  afectados?: string;
  accionesCorrectivas?: string;
  notificaciones?: string;
  
  // Campos específicos para reporte general (pacientes)
  pacientesTransitorios?: PacienteInfo[];
  pacientesHospitalizados?: PacienteInfo[];
  pacientesPension?: PacienteInfo[];
}

export interface PacienteInfo {
  nombrePaciente: string;
  nombrePropietario: string;
  ubicacion: string; // Jaula o área
  requiereTratamiento: boolean;
  tratamiento?: string;
  tipoServicio?: string; // Consulta, procedimiento, etc.
}

export interface ReportType {
  id: string;
  title: string;
  icon: string;
  description: string;
  color?: string;
}