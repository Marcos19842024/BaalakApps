import { ChecklistData, ChecklistItem } from '../types/checklist';

export const AREA_ORDER: Record<string, number> = {
  'ESTACIONAMIENTO': 1,
  'TIENDA': 2,
  'RECEPCIÓN': 3,
  'CONSULTORIO 1': 4,
  'CONSULTORIO 2': 5,
  'LABORATORIO': 6,
  'RAYOS X': 7,
  'QUIRÓFANO': 8,
  'HOSPITAL': 9,
  'PENSIÓN': 10,
  'ALMACÉN ALIMENTOS': 11,
  'ALMACÉN GENERAL': 12,
  'ÁREAS COMUNES': 13,
  'ESTÉTICA': 14,
  'TRANSPORTE': 15
};

// Template completo con todos los aspectos del proyecto original
export const CHECKLIST_TEMPLATE: Omit<ChecklistItem, 'id' | 'cumplimiento' | 'observaciones'>[] = [
  // Estacionamiento
  { area: 'ESTACIONAMIENTO', aspecto: 'Limpieza general' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Iluminación funcional' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Señalización visible y en buen estado' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Cajones de estacionamiento libres' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Puertas de acceso funcionales' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Anuncios visibles y en buen estado' },
  // Tienda
  { area: 'TIENDA', aspecto: 'Limpieza general' },
  { area: 'TIENDA', aspecto: 'Anaqueles ordenados' },
  { area: 'TIENDA', aspecto: 'Productos en exhibición ordenados' },
  { area: 'TIENDA', aspecto: 'Precios visibles y correctos' },
  { area: 'TIENDA', aspecto: 'Cámaras de seguridad funcional' },
  { area: 'TIENDA', aspecto: 'Cambio en caja' },
  { area: 'TIENDA', aspecto: 'Corte de caja realizado' },
  { area: 'TIENDA', aspecto: 'Sin problemas de red' },
  { area: 'TIENDA', aspecto: 'Computadoras, terminales e impresoras habilitadas' },
  { area: 'TIENDA', aspecto: 'Sala de espera limpia y olorosa' },
  { area: 'TIENDA', aspecto: 'Televisión y cuadros sin polvo' },
  { area: 'TIENDA', aspecto: 'Ventanas limpias' },
  { area: 'TIENDA', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'TIENDA', aspecto: 'Mostrador limpio y ordenado' },
  { area: 'TIENDA', aspecto: 'Ventiladores limpios y funcionales' },
  { area: 'TIENDA', aspecto: 'Luces funcionales' },
  // Recepción
  { area: 'RECEPCIÓN', aspecto: 'Puerta de acceso a las demás áreas limpia' },
  { area: 'RECEPCIÓN', aspecto: 'Mueble de recepción limpio y ordenado' },
  { area: 'RECEPCIÓN', aspecto: 'Compañeros con buen porte' },
  { area: 'RECEPCIÓN', aspecto: 'Sala de espera limpia y olorosa' },
  { area: 'RECEPCIÓN', aspecto: 'Televisión y cuadros sin polvo' },
  { area: 'RECEPCIÓN', aspecto: 'Báscula limpia y desinfectada' },
  { area: 'RECEPCIÓN', aspecto: 'Bolsas y articulos personales guardados debidamente' },
  { area: 'RECEPCIÓN', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'RECEPCIÓN', aspecto: 'Cambio en caja' },
  { area: 'RECEPCIÓN', aspecto: 'Corte de caja realizado' },
  { area: 'RECEPCIÓN', aspecto: 'Sin problemas de red' },
  { area: 'RECEPCIÓN', aspecto: 'Computadoras, terminales e impresoras habilitadas' },
  { area: 'RECEPCIÓN', aspecto: 'Celular con carga al 100%' },
  { area: 'RECEPCIÓN', aspecto: 'Ventilador limpio y funcional' },
  { area: 'RECEPCIÓN', aspecto: 'Luces funcionales' },
  // Consultorio 1
  { area: 'CONSULTORIO 1', aspecto: 'Consultorio limpio y oloroso' },
  { area: 'CONSULTORIO 1', aspecto: 'Mesa limpia y desinfectada' },
  { area: 'CONSULTORIO 1', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'CONSULTORIO 1', aspecto: 'Escritorio libre' },
  { area: 'CONSULTORIO 1', aspecto: 'Tarja limpia' },
  { area: 'CONSULTORIO 1', aspecto: 'Abastecido de material (jeringas, alcohol, torundas)' },
  { area: 'CONSULTORIO 1', aspecto: 'Cajonera ordenada' },
  { area: 'CONSULTORIO 1', aspecto: 'Puertas limpias' },
  { area: 'CONSULTORIO 1', aspecto: 'Libre de portaobjetos sucios' },
  { area: 'CONSULTORIO 1', aspecto: 'Computadora e impresora habilitada' },
  { area: 'CONSULTORIO 1', aspecto: 'Sin problemas de red' },
  { area: 'CONSULTORIO 1', aspecto: 'Luces funcionales' },
  { area: 'CONSULTORIO 1', aspecto: 'Clima limpio y funcional' },
  { area: 'CONSULTORIO 1', aspecto: 'Cámaras funcionales' },
  // Consultorio 2
  { area: 'CONSULTORIO 2', aspecto: 'Consultorio limpio y oloroso' },
  { area: 'CONSULTORIO 2', aspecto: 'Mesa limpia y desinfectada' },
  { area: 'CONSULTORIO 2', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'CONSULTORIO 2', aspecto: 'Escritorio libre' },
  { area: 'CONSULTORIO 2', aspecto: 'Tarja limpia' },
  { area: 'CONSULTORIO 2', aspecto: 'Abastecido de material (jeringas, alcohol, torundas)' },
  { area: 'CONSULTORIO 2', aspecto: 'Cajonera ordenada' },
  { area: 'CONSULTORIO 2', aspecto: 'Puertas limpias' },
  { area: 'CONSULTORIO 2', aspecto: 'Libre de portaobjetos sucios' },
  { area: 'CONSULTORIO 2', aspecto: 'Computadora e impresora habilitada' },
  { area: 'CONSULTORIO 2', aspecto: 'Sin problemas de red' },
  { area: 'CONSULTORIO 2', aspecto: 'Luces funcionales' },
  { area: 'CONSULTORIO 2', aspecto: 'Clima limpio y funcional' },
  { area: 'CONSULTORIO 2', aspecto: 'Cámaras funcionales' },
  // Laboratorio
  { area: 'LABORATORIO', aspecto: 'Mesa de trabajo limpia y desinfectada' },
  { area: 'LABORATORIO', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'LABORATORIO', aspecto: 'Estanterias ordenadas' },
  { area: 'LABORATORIO', aspecto: 'Centrífuga limpia y funcional' },
  { area: 'LABORATORIO', aspecto: 'Material de uso con stock' },
  { area: 'LABORATORIO', aspecto: 'Equipos limpios y funcionales' },
  { area: 'LABORATORIO', aspecto: 'Computadora habilitada' },
  { area: 'LABORATORIO', aspecto: 'Sin problemas de red' },
  { area: 'LABORATORIO', aspecto: 'Clima limpio y funcional' },
  { area: 'LABORATORIO', aspecto: 'Luces funcionales' },
  { area: 'LABORATORIO', aspecto: 'Cámaras funcionales' },
  // RX
  { area: 'RAYOS X', aspecto: 'Área de Rayos X limpia y ordenada' },
  { area: 'RAYOS X', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'RAYOS X', aspecto: 'Mesa de trabajo limpia y desinfectada' },
  { area: 'RAYOS X', aspecto: 'Equipos limpios y funcionales' },
  { area: 'RAYOS X', aspecto: 'Computadora habilitada' },
  { area: 'RAYOS X', aspecto: 'Sin problemas de red' },
  { area: 'RAYOS X', aspecto: 'Luces funcionales' },
  { area: 'RAYOS X', aspecto: 'Clima limpio y funcional' },
  { area: 'RAYOS X', aspecto: 'Equipo de seguridad disponible' },
  { area: 'RAYOS X', aspecto: 'Cámaras funcionales' },
  // Quirófano
  { area: 'QUIRÓFANO', aspecto: 'Quirófano limpio y oloroso' },
  { area: 'QUIRÓFANO', aspecto: 'Mesa de cirugía limpia y desinfectada' },
  { area: 'QUIRÓFANO', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'QUIRÓFANO', aspecto: 'Carrito de anestesia limpio y ordenado' },
  { area: 'QUIRÓFANO', aspecto: 'Abastecido de material (jeringas, alcohol, torundas)' },
  { area: 'QUIRÓFANO', aspecto: 'Cajonera ordenada' },
  { area: 'QUIRÓFANO', aspecto: 'Puertas limpias' },
  { area: 'QUIRÓFANO', aspecto: 'Libre de portaobjetos sucios' },
  { area: 'QUIRÓFANO', aspecto: 'Luces funcionales' },
  { area: 'QUIRÓFANO', aspecto: 'Clima limpio y funcional' },
  { area: 'QUIRÓFANO', aspecto: 'Equipo de anestesia limpio y funcional' },
  { area: 'QUIRÓFANO', aspecto: 'Monitor de signos vitales limpio y funcional' },
  { area: 'QUIRÓFANO', aspecto: 'Mesa de instrumental limpia y ordenada' },
  { area: 'QUIRÓFANO', aspecto: 'Material de uso con stock' },
  { area: 'QUIRÓFANO', aspecto: 'Tanques de oxigeno llenos' },
  // Hospital
  { area: 'HOSPITAL', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'HOSPITAL', aspecto: 'Área de exploración ordenada y limpia' },
  { area: 'HOSPITAL', aspecto: 'Mesa y estanterias ordenadas' },
  { area: 'HOSPITAL', aspecto: 'Área de hospitalizados limpio y ordenado' },
  { area: 'HOSPITAL', aspecto: 'Jaulas limpias y desinfectadas' },
  { area: 'HOSPITAL', aspecto: 'Tarja limpia y organizada' },
  { area: 'HOSPITAL', aspecto: 'Luces y lamparas funcionales' },
  { area: 'HOSPITAL', aspecto: 'Ventiladores funcionales' },
  { area: 'HOSPITAL', aspecto: 'Mesa de microbiología limpia y ordenada' },
  { area: 'HOSPITAL', aspecto: 'Material de uso con stock' },
  { area: 'HOSPITAL', aspecto: 'impresora funcional' },
  { area: 'HOSPITAL', aspecto: 'refrigerador limpio y funcional' },
  { area: 'HOSPITAL', aspecto: 'Cámaras funcionales' },
  // Pensión
  { area: 'PENSIÓN', aspecto: 'Jaulas limpias, desinfectadas y funcionales' },
  { area: 'PENSIÓN', aspecto: 'Accesorios de mascotas ordenados' },
  { area: 'PENSIÓN', aspecto: 'Platos de casa limpios' },
  { area: 'PENSIÓN', aspecto: 'Ventiladores funcionales' },
  { area: 'PENSIÓN', aspecto: 'Luces funcionales' },
  { area: 'PENSIÓN', aspecto: 'Puerta limpia y funcional' },
  { area: 'PENSIÓN', aspecto: 'Jardín podado y limpio' },
  { area: 'PENSIÓN', aspecto: 'Material de uso ordenado y con stock' },
  { area: 'PENSIÓN', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'PENSIÓN', aspecto: 'Pisos limpios' },
  { area: 'PENSIÓN', aspecto: 'Agua potable disponible' },
  { area: 'PENSIÓN', aspecto: 'Cámaras funcionales' },
  // Almacén alimentos
  { area: 'ALMACÉN ALIMENTOS', aspecto: 'Estanterias ordenadas' },
  { area: 'ALMACÉN ALIMENTOS', aspecto: 'Productos en buen estado' },
  { area: 'ALMACÉN ALIMENTOS', aspecto: 'Pisos limpios' },
  { area: 'ALMACÉN ALIMENTOS', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'ALMACÉN ALIMENTOS', aspecto: 'Puerta limpia y funcional' },
  { area: 'ALMACÉN ALIMENTOS', aspecto: 'Iluminación funcional' },
  { area: 'ALMACÉN ALIMENTOS', aspecto: 'Ventilador limpio y funcional' },
  { area: 'ALMACÉN ALIMENTOS', aspecto: 'Mesa de trabajo limpia y ordenada' },
  { area: 'ALMACÉN ALIMENTOS', aspecto: 'Computadora habilitada' },
  { area: 'ALMACÉN ALIMENTOS', aspecto: 'Sin problemas de red' },
  // Almacén general
  { area: 'ALMACÉN GENERAL', aspecto: 'Estanterias ordenadas' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Material de uso con stock' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Pisos limpios' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Puerta limpia y funcional' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Iluminación funcional' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Ventilador limpio y funcional' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Mesa de trabajo limpia y ordenada' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Computadora habilitada' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Sin problemas de red' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Impresora funcional' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Refrigerador limpio y funcional' },
  { area: 'ALMACÉN GENERAL', aspecto: 'Cámaras funcionales' },
  // Áreas comunes
  { area: 'ÁREAS COMUNES', aspecto: 'Pisos limpios' },
  { area: 'ÁREAS COMUNES', aspecto: 'Iluminación funcional' },
  { area: 'ÁREAS COMUNES', aspecto: 'Botes de basura con bolsa y limpios' },
  { area: 'ÁREAS COMUNES', aspecto: 'Pasillos libres de obstáculos' },
  { area: 'ÁREAS COMUNES', aspecto: 'Refrigerador limpio y funcional' },
  { area: 'ÁREAS COMUNES', aspecto: 'Microondas limpio y funcional' },
  { area: 'ÁREAS COMUNES', aspecto: 'Comedor limpio y ordenado' },
  { area: 'ÁREAS COMUNES', aspecto: 'Ventilador limpio y funcional' },
  { area: 'ÁREAS COMUNES', aspecto: 'Baño de damas limpio y ordenado' },
  { area: 'ÁREAS COMUNES', aspecto: 'Baño de caballeros limpio y ordenado' },
  // Estética
  { area: 'ESTÉTICA', aspecto: 'Patios limpios' },
  { area: 'ESTÉTICA', aspecto: 'Bote de basura con bolsa y limpio' },
  { area: 'ESTÉTICA', aspecto: 'Jaulas limpias y desinfectadas' },
  { area: 'ESTÉTICA', aspecto: 'Barra limpia' },
  { area: 'ESTÉTICA', aspecto: 'Puertas y cristales limpios' },
  { area: 'ESTÉTICA', aspecto: 'Mesa de corte ordenada' },
  { area: 'ESTÉTICA', aspecto: 'Carrito de material limpio y ordenado' },
  { area: 'ESTÉTICA', aspecto: 'Tinas limpias y funcionales' },
  { area: 'ESTÉTICA', aspecto: 'Ventiladores y luces funcionales' },
  { area: 'ESTÉTICA', aspecto: 'Bombas y maquinas de rasurado funcionales' },
  { area: 'ESTÉTICA', aspecto: 'Material de uso con stock' },
  { area: 'ESTÉTICA', aspecto: 'Cámaras funcionales' },
  // Transporte
  { area: 'TRANSPORTE', aspecto: 'Limpia y olorosa' },
  { area: 'TRANSPORTE', aspecto: 'Tapete limpio libre de orines' },
  { area: 'TRANSPORTE', aspecto: 'Jaulas limpias y desinfectadas' },
  { area: 'TRANSPORTE', aspecto: 'Limpieza de carroceria' },
  { area: 'TRANSPORTE', aspecto: 'Llantas funcionales' },
  { area: 'TRANSPORTE', aspecto: 'Puertas funcionales' },
  { area: 'TRANSPORTE', aspecto: 'Luces funcionales' },
  { area: 'TRANSPORTE', aspecto: 'Clima y ventanas funcionales' },
  { area: 'TRANSPORTE', aspecto: 'Cámaras funcionales' },
  { area: 'TRANSPORTE', aspecto: 'Espejos limpios y funcionales' },
  { area: 'TRANSPORTE', aspecto: 'Cabina limpia y ordenada' },
  { area: 'TRANSPORTE', aspecto: 'Material a usar listo (perfume, lapiceros, tarjetas de presentacion)' },
  { area: 'TRANSPORTE', aspecto: 'Documentación en regla y vigente' },
  { area: 'TRANSPORTE', aspecto: 'Extintor cargado y en buen estado' },
  { area: 'TRANSPORTE', aspecto: 'Niveles adecuados (aceite, agua, combustible, etc.)' }
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

export const initializeChecklistData = (): ChecklistData => {
  return {
    fecha: getCurrentDate(),
    horaInicio: getCurrentTime(),
    horaFin: '',
    responsable: '',
    items: CHECKLIST_TEMPLATE.map((item, index) => ({
      id: `item-${index}`,
      area: item.area,
      aspecto: item.aspecto,
      cumplimiento: '',
      observaciones: ''
    })),
    comentariosAdicionales: '',
    photos: [],
    completed: false
  };
};

export const AREA_ICONS: Record<string, string> = {
  'ESTACIONAMIENTO': '🚗',
  'TIENDA': '🏬',
  'RECEPCIÓN': '💁',
  'CONSULTORIO 1': '🏥',
  'CONSULTORIO 2': '🏥',
  'LABORATORIO': '🔬',
  'RAYOS X': '🩻',
  'QUIRÓFANO': '😷',
  'HOSPITAL': '🏥',
  'PENSIÓN': '🐩',
  'ALMACÉN ALIMENTOS': '🥣',
  'ALMACÉN GENERAL': '📥',
  'ÁREAS COMUNES': '🚶🏼',
  'ESTÉTICA': '🐾',
  'TRANSPORTE': '🚑'
};

export const getAreaIcon = (area: string): string => {
  return AREA_ICONS[area] || '📋';
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

// Función para agrupar items por área
export const groupItemsByArea = (items: ChecklistItem[]): Record<string, ChecklistItem[]> => {
  const grouped: Record<string, ChecklistItem[]> = {};
  
  items.forEach(item => {
    if (!grouped[item.area]) {
      grouped[item.area] = [];
    }
    grouped[item.area].push(item);
  });
  
  return grouped;
};

// Función para obtener áreas únicas ordenadas según AREA_ORDER
export const getUniqueAreas = (): string[] => {
  return Object.keys(AREA_ORDER).sort((a, b) => AREA_ORDER[a] - AREA_ORDER[b]);
};

// Función para verificar si un área está completa
export const isAreaComplete = (items: ChecklistItem[], area: string): boolean => {
  const areaItems = items.filter(item => item.area === area);
  if (areaItems.length === 0) return false;
  
  return areaItems.every(item => 
    item.cumplimiento === 'bueno' || 
    item.cumplimiento === 'regular' || 
    item.cumplimiento === 'malo'
  );
};