import { ChecklistData, ChecklistItem, ChecklistPhoto } from '../types/checklist';

export const AREA_ORDER: Record<string, number> = {
  'ESTACIONAMIENTO': 1,
  'SALA DE REUNIONES': 2,
  'OFICINAS': 3,
  'BAÑOS': 4,
  'COCINA': 5,
  'ÁREAS COMUNES': 6,
};

export const CHECKLIST_TEMPLATE = [
  { area: 'ESTACIONAMIENTO', aspecto: 'Limpieza y orden' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Señalización' },
  { area: 'ESTACIONAMIENTO', aspecto: 'Iluminación' },
  { area: 'SALA DE REUNIONES', aspecto: 'Limpieza de mesas' },
  { area: 'SALA DE REUNIONES', aspecto: 'Funcionamiento de proyector' },
  { area: 'SALA DE REUNIONES', aspecto: 'Sillas en buen estado' },
  { area: 'OFICINAS', aspecto: 'Orden y limpieza' },
  { area: 'OFICINAS', aspecto: 'Equipo de cómputo funcionando' },
  { area: 'OFICINAS', aspecto: 'Aire acondicionado' },
  { area: 'BAÑOS', aspecto: 'Limpieza general' },
  { area: 'BAÑOS', aspecto: 'Suministros completos' },
  { area: 'BAÑOS', aspecto: 'Funcionamiento de sanitarios' },
  { area: 'COCINA', aspecto: 'Limpieza de superficies' },
  { area: 'COCINA', aspecto: 'Electrodomésticos funcionando' },
  { area: 'COCINA', aspecto: 'Almacenamiento adecuado' },
  { area: 'ÁREAS COMUNES', aspecto: 'Limpieza de pasillos' },
  { area: 'ÁREAS COMUNES', aspecto: 'Iluminación adecuada' },
  { area: 'ÁREAS COMUNES', aspecto: 'Señalización de seguridad' },
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
  'SALA DE REUNIONES': '💼',
  'OFICINAS': '🏢',
  'BAÑOS': '🚽',
  'COCINA': '🍳',
  'ÁREAS COMUNES': '🏘️',
};