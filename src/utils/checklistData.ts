import { ChecklistData, ChecklistItem } from '../types/checklist';

export const COMPLETE_AREAS = [
  'ESTACIONAMIENTO',
  'FACHADA',
  'ZONA DE RECEPCIÓN',
  'PISOS',
  'PAREDES',
  'TECHOS',
  'VENTANAS Y PUERTAS',
  'SANITARIOS',
  'MUEBLES Y ENSERES',
  'EQUIPO DE COMPUTO Y COMUNICACIONES',
  'AIRE ACONDICIONADO Y VENTILACIÓN',
  'ILUMINACIÓN',
  'INSTALACIONES ELÉCTRICAS',
  'INSTALACIONES HIDROSANITARIAS',
  'SEÑALIZACIÓN Y SEGURIDAD',
  'LIMPIEZA GENERAL',
  'CONTROL DE PLAGAS',
  'RESIDUOS SÓLIDOS',
  'ZONAS COMUNES',
  'ÁREAS ESPECIALES'
];

export const AREA_ORDER: Record<string, number> = {
  'ESTACIONAMIENTO': 1,
  'FACHADA': 2,
  'ZONA DE RECEPCIÓN': 3,
  'PISOS': 4,
  'PAREDES': 5,
  'TECHOS': 6,
  'VENTANAS Y PUERTAS': 7,
  'SANITARIOS': 8,
  'MUEBLES Y ENSERES': 9,
  'EQUIPO DE COMPUTO Y COMUNICACIONES': 10,
  'AIRE ACONDICIONADO Y VENTILACIÓN': 11,
  'ILUMINACIÓN': 12,
  'INSTALACIONES ELÉCTRICAS': 13,
  'INSTALACIONES HIDROSANITARIAS': 14,
  'SEÑALIZACIÓN Y SEGURIDAD': 15,
  'LIMPIEZA GENERAL': 16,
  'CONTROL DE PLAGAS': 17,
  'RESIDUOS SÓLIDOS': 18,
  'ZONAS COMUNES': 19,
  'ÁREAS ESPECIALES': 20,
};

// Template completo con todos los aspectos del proyecto original
export const CHECKLIST_TEMPLATE = [
  // ESTACIONAMIENTO
  { area: 'ESTACIONAMIENTO', aspecto: 'Limpieza general del área' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Señalización horizontal y vertical' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Iluminación adecuada' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Drenaje funcionando correctamente' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Área libre de obstáculos' },
  
  // FACHADA
  { area: 'FACHADA', aspecto: 'Limpieza exterior' },
  { area: 'FACHADA', aspecto: 'Pintura en buen estado' },
  { area: 'FACHADA', aspecto: 'Letreros visibles y legibles' },
  { area: 'FACHADA', aspecto: 'Áreas verdes mantenidas' },
  
  // ZONA DE RECEPCIÓN
  { area: 'ZONA DE RECEPCIÓN', aspecto: 'Atención al cliente' },
  { area: 'ZONA DE RECEPCIÓN', aspecto: 'Orden y limpieza' },
  { area: 'ZONA DE RECEPCIÓN', aspecto: 'Documentación disponible' },
  { area: 'ZONA DE RECEPCIÓN', aspecto: 'Señalización interna' },
  
  // PISOS
  { area: 'PISOS', aspecto: 'Superficies limpias' },
  { area: 'PISOS', aspecto: 'Sin grietas ni desniveles' },
  { area: 'PISOS', aspecto: 'Recubrimiento en buen estado' },
  { area: 'PISOS', aspecto: 'Antiderrapante en áreas húmedas' },
  
  // PAREDES
  { area: 'PAREDES', aspecto: 'Pintura en buen estado' },
  { area: 'PAREDES', aspecto: 'Sin humedades' },
  { area: 'PAREDES', aspecto: 'Limpieza general' },
  { area: 'PAREDES', aspecto: 'Elementos de seguridad instalados' },
  
  // TECHOS
  { area: 'TECHOS', aspecto: 'Sin filtraciones' },
  { area: 'TECHOS', aspecto: 'Luminarias funcionando' },
  { area: 'TECHOS', aspecto: 'Ventilación adecuada' },
  { area: 'TECHOS', aspecto: 'Limpieza de plafones' },
  
  // VENTANAS Y PUERTAS
  { area: 'VENTANAS Y PUERTAS', aspecto: 'Funcionamiento correcto' },
  { area: 'VENTANAS Y PUERTAS', aspecto: 'Cerraduras operativas' },
  { area: 'VENTANAS Y PUERTAS', aspecto: 'Limpieza de vidrios' },
  { area: 'VENTANAS Y PUERTAS', aspecto: 'Sellos en buen estado' },
  
  // SANITARIOS
  { area: 'SANITARIOS', aspecto: 'Limpieza general' },
  { area: 'SANITARIOS', aspecto: 'Suministros completos (jabón, papel)' },
  { area: 'SANITARIOS', aspecto: 'Funcionamiento de sanitarios y lavamanos' },
  { area: 'SANITARIOS', aspecto: 'Ventilación adecuada' },
  { area: 'SANITARIOS', aspecto: 'Señalización de género' },
  
  // MUEBLES Y ENSERES
  { area: 'MUEBLES Y ENSERES', aspecto: 'Buen estado y limpieza' },
  { area: 'MUEBLES Y ENSERES', aspecto: 'Organización adecuada' },
  { area: 'MUEBLES Y ENSERES', aspecto: 'Funcionalidad' },
  
  // EQUIPO DE COMPUTO Y COMUNICACIONES
  { area: 'EQUIPO DE COMPUTO Y COMUNICACIONES', aspecto: 'Funcionamiento correcto' },
  { area: 'EQUIPO DE COMPUTO Y COMUNICACIONES', aspecto: 'Limpieza de equipos' },
  { area: 'EQUIPO DE COMPUTO Y COMUNICACIONES', aspecto: 'Cableado organizado' },
  { area: 'EQUIPO DE COMPUTO Y COMUNICACIONES', aspecto: 'Respaldo de información' },
  
  // AIRE ACONDICIONADO Y VENTILACIÓN
  { area: 'AIRE ACONDICIONADO Y VENTILACIÓN', aspecto: 'Funcionamiento adecuado' },
  { area: 'AIRE ACONDICIONADO Y VENTILACIÓN', aspecto: 'Temperatura adecuada' },
  { area: 'AIRE ACONDICIONADO Y VENTILACIÓN', aspecto: 'Filtros limpios' },
  { area: 'AIRE ACONDICIONADO Y VENTILACIÓN', aspecto: 'Mantenimiento al día' },
  
  // ILUMINACIÓN
  { area: 'ILUMINACIÓN', aspecto: 'Nivel de iluminación adecuado' },
  { area: 'ILUMINACIÓN', aspecto: 'Todas las luminarias funcionando' },
  { area: 'ILUMINACIÓN', aspecto: 'Limpieza de luminarias' },
  { area: 'ILUMINACIÓN', aspecto: 'Sistema de emergencia operativo' },
  
  // INSTALACIONES ELÉCTRICAS
  { area: 'INSTALACIONES ELÉCTRICAS', aspecto: 'Tomas y enchufes funcionando' },
  { area: 'INSTALACIONES ELÉCTRICAS', aspecto: 'Tableros eléctricos etiquetados' },
  { area: 'INSTALACIONES ELÉCTRICAS', aspecto: 'Cableado en buen estado' },
  { area: 'INSTALACIONES ELÉCTRICAS', aspecto: 'Protecciones contra descargas' },
  
  // INSTALACIONES HIDROSANITARIAS
  { area: 'INSTALACIONES HIDROSANITARIAS', aspecto: 'Suministro de agua continuo' },
  { area: 'INSTALACIONES HIDROSANITARIAS', aspecto: 'Sin fugas visibles' },
  { area: 'INSTALACIONES HIDROSANITARIAS', aspecto: 'Presión adecuada' },
  { area: 'INSTALACIONES HIDROSANITARIAS', aspecto: 'Drenajes funcionando' },
  
  // SEÑALIZACIÓN Y SEGURIDAD
  { area: 'SEÑALIZACIÓN Y SEGURIDAD', aspecto: 'Señalización de emergencia visible' },
  { area: 'SEÑALIZACIÓN Y SEGURIDAD', aspecto: 'Extintores cargados y accesibles' },
  { area: 'SEÑALIZACIÓN Y SEGURIDAD', aspecto: 'Botiquín de primeros auxilios completo' },
  { area: 'SEÑALIZACIÓN Y SEGURIDAD', aspecto: 'Rutas de evacuación despejadas' },
  { area: 'SEÑALIZACIÓN Y SEGURIDAD', aspecto: 'Equipo de seguridad personal disponible' },
  
  // LIMPIEZA GENERAL
  { area: 'LIMPIEZA GENERAL', aspecto: 'Limpieza de áreas de trabajo' },
  { area: 'LIMPIEZA GENERAL', aspecto: 'Manejo de residuos' },
  { area: 'LIMPIEZA GENERAL', aspecto: 'Almacenes organizados' },
  { area: 'LIMPIEZA GENERAL', aspecto: 'Control de olores' },
  
  // CONTROL DE PLAGAS
  { area: 'CONTROL DE PLAGAS', aspecto: 'Sin evidencia de plagas' },
  { area: 'CONTROL DE PLAGAS', aspecto: 'Control preventivo implementado' },
  { area: 'CONTROL DE PLAGAS', aspecto: 'Áreas de comida protegidas' },
  
  // RESIDUOS SÓLIDOS
  { area: 'RESIDUOS SÓLIDOS', aspecto: 'Separación de residuos' },
  { area: 'RESIDUOS SÓLIDOS', aspecto: 'Contenedores en buen estado' },
  { area: 'RESIDUOS SÓLIDOS', aspecto: 'Recolección puntual' },
  { area: 'RESIDUOS SÓLIDOS', aspecto: 'Áreas de almacenamiento limpias' },
  
  // ZONAS COMUNES
  { area: 'ZONAS COMUNES', aspecto: 'Pasillos despejados' },
  { area: 'ZONAS COMUNES', aspecto: 'Áreas de descanso limpias' },
  { area: 'ZONAS COMUNES', aspecto: 'Ascensores funcionando' },
  { area: 'ZONAS COMUNES', aspecto: 'Escaleras en buen estado' },
  
  // ÁREAS ESPECIALES
  { area: 'ÁREAS ESPECIALES', aspecto: 'Laboratorios limpios y ordenados' },
  { area: 'ÁREAS ESPECIALES', aspecto: 'Almacenes de químicos seguros' },
  { area: 'ÁREAS ESPECIALES', aspecto: 'Salas de servidores con climatización' },
  { area: 'ÁREAS ESPECIALES', aspecto: 'Talleres organizados y seguros' },
];

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

export const initializeFormData = (): ChecklistData => {
  return {
    fecha: getCurrentDate(),
    horaInicio: getCurrentTime(),
    horaFin: getCurrentTime(),
    responsable: '',
    items: CHECKLIST_TEMPLATE.map((item, index) => ({
      id: `item-${index}`,
      ...item,
      cumplimiento: '',
      observaciones: ''
    })),
    comentariosAdicionales: '',
    photos: []
  };
};

export const AREA_ICONS: Record<string, string> = {
  'ESTACIONAMIENTO': '🚗',
  'FACHADA': '🏢',
  'ZONA DE RECEPCIÓN': '💁',
  'PISOS': '🏗️',
  'PAREDES': '🧱',
  'TECHOS': '🏛️',
  'VENTANAS Y PUERTAS': '🚪',
  'SANITARIOS': '🚿',
  'MUEBLES Y ENSERES': '🛋️',
  'EQUIPO DE COMPUTO Y COMUNICACIONES': '💻',
  'AIRE ACONDICIONADO Y VENTILACIÓN': '🌬️',
  'ILUMINACIÓN': '💡',
  'INSTALACIONES ELÉCTRICAS': '⚡',
  'INSTALACIONES HIDROSANITARIAS': '💧',
  'SEÑALIZACIÓN Y SEGURIDAD': '🚨',
  'LIMPIEZA GENERAL': '🧹',
  'CONTROL DE PLAGAS': '🐀',
  'RESIDUOS SÓLIDOS': '🗑️',
  'ZONAS COMUNES': '🏘️',
  'ÁREAS ESPECIALES': '🔬',
};

// Función para calcular estadísticas
export const calculateAreaStats = (items: ChecklistItem[], area?: string) => {
  const filteredItems = area 
    ? items.filter(item => item.area === area)
    : items;
  
  const total = filteredItems.length;
  const bueno = filteredItems.filter(item => item.cumplimiento === 'bueno').length;
  const regular = filteredItems.filter(item => item.cumplimiento === 'regular').length;
  const malo = filteredItems.filter(item => item.cumplimiento === 'malo').length;
  const sinEvaluar = total - (bueno + regular + malo);
  const totalEvaluado = bueno + regular + malo;
  const porcentajeBueno = totalEvaluado > 0 ? (bueno / totalEvaluado) * 100 : 0;
  
  return { total, bueno, regular, malo, sinEvaluar, totalEvaluado, porcentajeBueno };
};