import { SUCURSALES, SucursalType } from 'src/types/sucursal';
import { ChecklistData, ChecklistItem } from '../types/checklist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChecklistArea, ChecklistAspect } from 'src/types/templateChecklist';

// Plantillas por defecto para cada sucursal
const DEFAULT_TEMPLATES: Record<SucursalType, ChecklistArea[]> = {
  ANIMALIA: [
    {
      area: 'RECEPCIÓN',
      aspectos: [
        { id: 'rec-1', aspecto: 'Frente limpio' },
        { id: 'rec-2', aspecto: 'Ingreso de personal' },
        { id: 'rec-3', aspecto: 'Compañeros con buen porte' },
        { id: 'rec-4', aspecto: 'Articulos personales en área asignada' },
        { id: 'rec-5', aspecto: 'Puertas de entrada limpias' },
        { id: 'rec-6', aspecto: 'Anaqueles ordenados' },
        { id: 'rec-7', aspecto: 'Mueble de recepción limpios y ordenados' },
        { id: 'rec-8', aspecto: 'Sala de espera limpia y olorosa' },
        { id: 'rec-9', aspecto: 'Televisión y cuadros sin polvo' },
        { id: 'rec-10', aspecto: 'Ventana de sala de espera limpia' },
        { id: 'rec-11', aspecto: 'Báscula limpia y desinfectada' },
        { id: 'rec-12', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'rec-13', aspecto: 'Cambio en caja' },
        { id: 'rec-14', aspecto: 'Sin problemas de red' },
        { id: 'rec-15', aspecto: 'Computadoras, terminales e impresoras habilitadas' },
        { id: 'rec-16', aspecto: 'Celular con carga al 100%' },
      ]
    },
    {
      area: 'CONSULTORIO',
      aspectos: [
        { id: 'con-1', aspecto: 'Consultorio limpio y oloroso' },
        { id: 'con-2', aspecto: 'Mesa limpia y desinfectada' },
        { id: 'con-3', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'con-4', aspecto: 'Escritorio libre' },
        { id: 'con-5', aspecto: 'Libros acomodados' },
        { id: 'con-6', aspecto: 'Tarja limpia' },
        { id: 'con-7', aspecto: 'Abastecido de material (jeringas, alcohol, torundas)' },
        { id: 'con-8', aspecto: 'Computadoras e impresora habilitadas' },
        { id: 'con-9', aspecto: 'Sin problemas de red' },
      ]
    },
    {
      area: 'HOSPITAL',
      aspectos: [
        { id: 'hosp-1', aspecto: 'Área de exploración ordenada y limpia' },
        { id: 'hosp-2', aspecto: 'Mesa y estanterias ordenadas' },
        { id: 'hosp-3', aspecto: 'Área de hospitalizados limpia y ordenada' },
        { id: 'hosp-4', aspecto: 'Baño limpio y ordenado' },
        { id: 'hosp-5', aspecto: 'Jaulas limpias y desinfectadas' },
        { id: 'hosp-6', aspecto: 'Tarja limpia y organizada' },
        { id: 'hosp-7', aspecto: 'Área de RX limpio y organizado' },
        { id: 'hosp-8', aspecto: 'Área de laboratorio limpio y organizado' },
        { id: 'hosp-9', aspecto: 'Quirófano limpio y organizado' },
      ]
    },
    {
      area: 'ESTÉTICA',
      aspectos: [
        { id: 'est-1', aspecto: 'Jaulas limpias y desinfectadas' },
        { id: 'est-2', aspecto: 'Barra limpia' },
        { id: 'est-3', aspecto: 'Mesa de corte ordenada' },
        { id: 'est-4', aspecto: 'Carrito de material limpio y ordenado' },
        { id: 'est-5', aspecto: 'Radio limpio y funcional' },
        { id: 'est-6', aspecto: 'Tinas limpias y funcionales' },
        { id: 'est-7', aspecto: 'Bombas, equipos y máquinas limpias y funcionales' },
        { id: 'est-8', aspecto: 'Material de uso con stock' },
      ]
    },
    {
      area: 'PENSIÓN',
      aspectos: [
        { id: 'pen-1', aspecto: 'Jaulas limpias, desinfectadas y funcionales' },
        { id: 'pen-2', aspecto: 'Patios de recreo limpios' },
        { id: 'pen-3', aspecto: 'Accesorios de mascotas ordenados' },
        { id: 'pen-4', aspecto: 'Platos de casa limpios' },
        { id: 'pen-5', aspecto: 'Puerta limpia y funcional' },
      ]
    },
    {
      area: 'TRANSPORTE',
      aspectos: [
        { id: 'transp-1', aspecto: 'Limpia y olorosa' },
        { id: 'transp-2', aspecto: 'Tapete limpio libre de orines' },
        { id: 'transp-3', aspecto: 'Jaulas limpias y desinfectadas' },
        { id: 'transp-4', aspecto: 'Limpieza de carroceria' },
        { id: 'transp-5', aspecto: 'Llantas funcionales' },
        { id: 'transp-6', aspecto: 'Puertas funcionales' },
        { id: 'transp-7', aspecto: 'Luces funcionales' },
        { id: 'transp-8', aspecto: 'Clima y ventanas funcionales' },
        { id: 'transp-10', aspecto: 'Espejos limpios y funcionales' },
        { id: 'transp-11', aspecto: 'Cabina limpia y ordenada' },
        { id: 'transp-12', aspecto: 'Material a usar listo (perfume, lapiceros, tarjetas de presentacion)' },
        { id: 'transp-13', aspecto: 'Documentación en regla y vigente' },
        { id: 'transp-14', aspecto: 'Extintor cargado y en buen estado' },
        { id: 'transp-15', aspecto: 'Niveles adecuados (aceite, agua, combustible, etc.)' },
        { id: 'transp-16', aspecto: 'Cochera limpia y ordenada' },
      ]
    },
    { area: 'OFICINA',
      aspectos: [
        { id: 'ofi-1', aspecto: 'Escritorios libres y organizados' },
        { id: 'ofi-2', aspecto: 'Ventiladores limpios y funcionales' },
        { id: 'ofi-3', aspecto: 'Baño limpio y ordenado' },
        { id: 'ofi-4', aspecto: 'Refrigeradores limpios' },
        { id: 'ofi-5', aspecto: 'Comedor recogido y limpio' },
      ]
    },
    { area: 'BODEGA',
      aspectos: [
        { id: 'bod-1', aspecto: 'Escritorio libre y organizado' },
        { id: 'bod-2', aspecto: 'Estanterias organizadas' },
        { id: 'bod-3', aspecto: 'Stock de recursos' },
        { id: 'bod-4', aspecto: 'Medicamentos y material ordenados' },
        { id: 'bod-5', aspecto: 'Cámaras de seguridad funcionales' },
      ]
    }
  ],
  BAALAK_CENTRAL: [
    {
      area: 'ESTACIONAMIENTO',
      aspectos: [
        { id: 'est-1', aspecto: 'Limpieza general' },
        { id: 'est-2', aspecto: 'Iluminación funcional' },
        { id: 'est-3', aspecto: 'Señalización visible y en buen estado' },
        { id: 'est-4', aspecto: 'Cajones de estacionamiento libres' },
        { id: 'est-5', aspecto: 'Puertas de acceso funcionales' },
        { id: 'est-6', aspecto: 'Anuncios visibles y en buen estado' },
      ]
    },
    {
      area: 'TIENDA',
      aspectos: [
        { id: 'ti-1', aspecto: 'Limpieza general' },
        { id: 'ti-2', aspecto: 'Anaqueles ordenados' },
        { id: 'ti-3', aspecto: 'Productos en exhibición ordenados' },
        { id: 'ti-4', aspecto: 'Precios visibles y correctos' },
        { id: 'ti-5', aspecto: 'Cámaras de seguridad funcional' },
        { id: 'ti-6', aspecto: 'Cambio en caja' },
        { id: 'ti-7', aspecto: 'Corte de caja realizado' },
        { id: 'ti-8', aspecto: 'Sin problemas de red' },
        { id: 'ti-9', aspecto: 'Computadoras, terminales e impresoras habilitadas' },
        { id: 'ti-10', aspecto: 'Sala de espera limpia y olorosa' },
        { id: 'ti-11', aspecto: 'Televisión y cuadros sin polvo' },
        { id: 'ti-12', aspecto: 'Ventanas limpias' },
        { id: 'ti-13', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'ti-14', aspecto: 'Mostrador limpio y ordenado' },
        { id: 'ti-15', aspecto: 'Ventiladores limpios y funcionales' },
        { id: 'ti-16', aspecto: 'Luces funcionales' },
      ]
    },
    {
      area: 'RECEPCIÓN',
      aspectos: [
        { id: 'rec-1', aspecto: 'Puerta de acceso a las demás áreas limpia' },
        { id: 'rec-2', aspecto: 'Mueble de recepción limpio y ordenado' },
        { id: 'rec-3', aspecto: 'Compañeros con buen porte' },
        { id: 'rec-4', aspecto: 'Sala de espera limpia y olorosa' },
        { id: 'rec-5', aspecto: 'Televisión y cuadros sin polvo' },
        { id: 'rec-6', aspecto: 'Báscula limpia y desinfectada' },
        { id: 'rec-7', aspecto: 'Bolsas y articulos personales guardados debidamente' },
        { id: 'rec-8', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'rec-9', aspecto: 'Cambio en caja' },
        { id: 'rec-10', aspecto: 'Corte de caja realizado' },
        { id: 'rec-11', aspecto: 'Sin problemas de red' },
        { id: 'rec-12', aspecto: 'Computadoras, terminales e impresoras habilitadas' },
        { id: 'rec-13', aspecto: 'Celular con carga al 100%' },
        { id: 'rec-14', aspecto: 'Ventilador limpio y funcional' },
        { id: 'rec-15', aspecto: 'Luces funcionales' },
      ]
    },
    {
      area: 'CONSULTORIO 1',
      aspectos: [
        { id: 'con1-1', aspecto: 'Consultorio limpio y oloroso' },
        { id: 'con1-2', aspecto: 'Mesa limpia y desinfectada' },
        { id: 'con1-3', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'con1-4', aspecto: 'Escritorio libre' },
        { id: 'con1-5', aspecto: 'Tarja limpia' },
        { id: 'con1-6', aspecto: 'Abastecido de material (jeringas, alcohol, torundas)' },
        { id: 'con1-7', aspecto: 'Cajonera ordenada' },
        { id: 'con1-8', aspecto: 'Puertas limpias' },
        { id: 'con1-9', aspecto: 'Libre de portaobjetos sucios' },
        { id: 'con1-10', aspecto: 'Computadora e impresora habilitada' },
        { id: 'con1-11', aspecto: 'Sin problemas de red' },
        { id: 'con1-12', aspecto: 'Luces funcionales' },
        { id: 'con1-13', aspecto: 'Clima limpio y funcional' },
        { id: 'con1-14', aspecto: 'Cámaras funcionales' },
      ]
    },
    {
      area: 'CONSULTORIO 2',
      aspectos: [
        { id: 'con2-1', aspecto: 'Consultorio limpio y oloroso' },
        { id: 'con2-2', aspecto: 'Mesa limpia y desinfectada' },
        { id: 'con2-3', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'con2-4', aspecto: 'Escritorio libre' },
        { id: 'con2-5', aspecto: 'Tarja limpia' },
        { id: 'con2-6', aspecto: 'Abastecido de material (jeringas, alcohol, torundas)' },
        { id: 'con2-7', aspecto: 'Cajonera ordenada' },
        { id: 'con2-8', aspecto: 'Puertas limpias' },
        { id: 'con2-9', aspecto: 'Libre de portaobjetos sucios' },
        { id: 'con2-10', aspecto: 'Computadora e impresora habilitada' },
        { id: 'con2-11', aspecto: 'Sin problemas de red' },
        { id: 'con2-12', aspecto: 'Luces funcionales' },
        { id: 'con2-13', aspecto: 'Clima limpio y funcional' },
        { id: 'con2-14', aspecto: 'Cámaras funcionales' },
      ]
    },
    {
      area: 'LABORATORIO',
      aspectos: [
        { id: 'lab-1', aspecto: 'Mesa de trabajo limpia y desinfectada' },
        { id: 'lab-2', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'lab-3', aspecto: 'Estanterias ordenadas' },
        { id: 'lab-4', aspecto: 'Centrífuga limpia y funcional' },
        { id: 'lab-5', aspecto: 'Material de uso con stock' },
        { id: 'lab-6', aspecto: 'Equipos limpios y funcionales' },
        { id: 'lab-7', aspecto: 'Computadora habilitada' },
        { id: 'lab-8', aspecto: 'Sin problemas de red' },
        { id: 'lab-9', aspecto: 'Clima limpio y funcional' },
        { id: 'lab-10', aspecto: 'Luces funcionales' },
        { id: 'lab-11', aspecto: 'Cámaras funcionales' },
      ]
    },
    {
      area: 'RAYOS X',
      aspectos: [
        { id: 'rx-1', aspecto: 'Área de Rayos X limpia y ordenada' },
        { id: 'rx-2', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'rx-3', aspecto: 'Mesa de trabajo limpia y desinfectada' },
        { id: 'rx-4', aspecto: 'Equipos limpios y funcionales' },
        { id: 'rx-5', aspecto: 'Computadora habilitada' },
        { id: 'rx-6', aspecto: 'Sin problemas de red' },
        { id: 'rx-7', aspecto: 'Luces funcionales' },
        { id: 'rx-8', aspecto: 'Clima limpio y funcional' },
        { id: 'rx-9', aspecto: 'Equipo de seguridad disponible' },
        { id: 'rx-10', aspecto: 'Cámaras funcionales' },
      ]
    },
    {
      area: 'QUIRÓFANO',
      aspectos: [
        { id: 'quir-1', aspecto: 'Quirófano limpio y oloroso' },
        { id: 'quir-2', aspecto: 'Mesa de cirugía limpia y desinfectada' },
        { id: 'quir-3', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'quir-4', aspecto: 'Carrito de anestesia limpio y ordenado' },
        { id: 'quir-5', aspecto: 'Abastecido de material (jeringas, alcohol, torundas)' },
        { id: 'quir-6', aspecto: 'Cajonera ordenada' },
        { id: 'quir-7', aspecto: 'Puertas limpias' },
        { id: 'quir-8', aspecto: 'Libre de portaobjetos sucios' },
        { id: 'quir-9', aspecto: 'Luces funcionales' },
        { id: 'quir-10', aspecto: 'Clima limpio y funcional' },
        { id: 'quir-11', aspecto: 'Equipo de anestesia limpio y funcional' },
        { id: 'quir-12', aspecto: 'Monitor de signos vitales limpio y funcional' },
        { id: 'quir-13', aspecto: 'Mesa de instrumental limpia y ordenada' },
        { id: 'quir-14', aspecto: 'Material de uso con stock' },
        { id: 'quir-15', aspecto: 'Tanques de oxigeno llenos' },
      ]
    },
    {
      area: 'HOSPITAL',
      aspectos: [
        { id: 'hosp-1', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'hosp-2', aspecto: 'Área de exploración ordenada y limpia' },
        { id: 'hosp-3', aspecto: 'Mesa y estanterias ordenadas' },
        { id: 'hosp-4', aspecto: 'Área de hospitalizados limpio y ordenado' },
        { id: 'hosp-5', aspecto: 'Jaulas limpias y desinfectadas' },
        { id: 'hosp-6', aspecto: 'Tarja limpia y organizada' },
        { id: 'hosp-7', aspecto: 'Luces y lamparas funcionales' },
        { id: 'hosp-8', aspecto: 'Ventiladores funcionales' },
        { id: 'hosp-9', aspecto: 'Mesa de microbiología limpia y ordenada' },
        { id: 'hosp-10', aspecto: 'Material de uso con stock' },
        { id: 'hosp-11', aspecto: 'Impresora funcional' },
        { id: 'hosp-12', aspecto: 'Refrigerador limpio y funcional' },
        { id: 'hosp-13', aspecto: 'Cámaras funcionales' },
      ]
    },
    {
      area: 'PENSIÓN',
      aspectos: [
        { id: 'pen-1', aspecto: 'Jaulas limpias, desinfectadas y funcionales' },
        { id: 'pen-2', aspecto: 'Accesorios de mascotas ordenados' },
        { id: 'pen-3', aspecto: 'Platos de casa limpios' },
        { id: 'pen-4', aspecto: 'Ventiladores funcionales' },
        { id: 'pen-5', aspecto: 'Luces funcionales' },
        { id: 'pen-6', aspecto: 'Puerta limpia y funcional' },
        { id: 'pen-7', aspecto: 'Jardín podado y limpio' },
        { id: 'pen-8', aspecto: 'Material de uso ordenado y con stock' },
        { id: 'pen-9', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'pen-10', aspecto: 'Pisos limpios' },
        { id: 'pen-11', aspecto: 'Agua potable disponible' },
        { id: 'pen-12', aspecto: 'Cámaras funcionales' },
      ]
    },
    {
      area: 'ALMACÉN ALIMENTOS',
      aspectos: [
        { id: 'alm-ali-1', aspecto: 'Estanterias ordenadas' },
        { id: 'alm-ali-2', aspecto: 'Productos en buen estado' },
        { id: 'alm-ali-3', aspecto: 'Pisos limpios' },
        { id: 'alm-ali-4', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'alm-ali-5', aspecto: 'Puerta limpia y funcional' },
        { id: 'alm-ali-6', aspecto: 'Iluminación funcional' },
        { id: 'alm-ali-7', aspecto: 'Ventilador limpio y funcional' },
        { id: 'alm-ali-8', aspecto: 'Mesa de trabajo limpia y ordenada' },
        { id: 'alm-ali-9', aspecto: 'Computadora habilitada' },
        { id: 'alm-ali-10', aspecto: 'Sin problemas de red' },
      ]
    },
    {
      area: 'ALMACÉN GENERAL',
      aspectos: [
        { id: 'alm-gen-1', aspecto: 'Estanterias ordenadas' },
        { id: 'alm-gen-2', aspecto: 'Material de uso con stock' },
        { id: 'alm-gen-3', aspecto: 'Pisos limpios' },
        { id: 'alm-gen-4', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'alm-gen-5', aspecto: 'Puerta limpia y funcional' },
        { id: 'alm-gen-6', aspecto: 'Iluminación funcional' },
        { id: 'alm-gen-7', aspecto: 'Ventilador limpio y funcional' },
        { id: 'alm-gen-8', aspecto: 'Mesa de trabajo limpia y ordenada' },
        { id: 'alm-gen-9', aspecto: 'Computadora habilitada' },
        { id: 'alm-gen-10', aspecto: 'Sin problemas de red' },
        { id: 'alm-gen-11', aspecto: 'Impresora funcional' },
        { id: 'alm-gen-12', aspecto: 'Refrigerador limpio y funcional' },
        { id: 'alm-gen-13', aspecto: 'Cámaras funcionales' },
      ]
    },
    {
      area: 'ÁREAS COMUNES',
      aspectos: [
        { id: 'ar-com-1', aspecto: 'Pisos limpios' },
        { id: 'ar-com-2', aspecto: 'Iluminación funcional' },
        { id: 'ar-com-3', aspecto: 'Botes de basura con bolsa y limpios' },
        { id: 'ar-com-4', aspecto: 'Pasillos libres de obstáculos' },
        { id: 'ar-com-5', aspecto: 'Refrigerador limpio y funcional' },
        { id: 'ar-com-6', aspecto: 'Microondas limpio y funcional' },
        { id: 'ar-com-7', aspecto: 'Comedor limpio y ordenado' },
        { id: 'ar-com-8', aspecto: 'Ventilador limpio y funcional' },
        { id: 'ar-com-9', aspecto: 'Baño de damas limpio y ordenado' },
        { id: 'ar-com-10', aspecto: 'Baño de caballeros limpio y ordenado' },
      ]
    },
    {
      area: 'ESTÉTICA',
      aspectos: [
        { id: 'est-1', aspecto: 'Patios limpios' },
        { id: 'est-2', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'est-3', aspecto: 'Jaulas limpias y desinfectadas' },
        { id: 'est-4', aspecto: 'Barra limpia' },
        { id: 'est-5', aspecto: 'Puertas y cristales limpios' },
        { id: 'est-6', aspecto: 'Mesa de corte ordenada' },
        { id: 'est-7', aspecto: 'Carrito de material limpio y ordenado' },
        { id: 'est-8', aspecto: 'Tinas limpias y funcionales' },
        { id: 'est-9', aspecto: 'Ventiladores y luces funcionales' },
        { id: 'est-10', aspecto: 'Bombas y maquinas de rasurado funcionales' },
        { id: 'est-11', aspecto: 'Material de uso con stock' },
        { id: 'est-12', aspecto: 'Cámaras funcionales' },
      ]
    },
    {
      area: 'TRANSPORTE',
      aspectos: [
        { id: 'transp-1', aspecto: 'Limpia y olorosa' },
        { id: 'transp-2', aspecto: 'Tapete limpio libre de orines' },
        { id: 'transp-3', aspecto: 'Jaulas limpias y desinfectadas' },
        { id: 'transp-4', aspecto: 'Limpieza de carroceria' },
        { id: 'transp-5', aspecto: 'Llantas funcionales' },
        { id: 'transp-6', aspecto: 'Puertas funcionales' },
        { id: 'transp-7', aspecto: 'Luces funcionales' },
        { id: 'transp-8', aspecto: 'Clima y ventanas funcionales' },
        { id: 'transp-9', aspecto: 'Cámaras funcionales' },
        { id: 'transp-10', aspecto: 'Espejos limpios y funcionales' },
        { id: 'transp-11', aspecto: 'Cabina limpia y ordenada' },
        { id: 'transp-12', aspecto: 'Material a usar listo (perfume, lapiceros, tarjetas de presentacion)' },
        { id: 'transp-13', aspecto: 'Documentación en regla y vigente' },
        { id: 'transp-14', aspecto: 'Extintor cargado y en buen estado' },
        { id: 'transp-15', aspecto: 'Niveles adecuados (aceite, agua, combustible, etc.)' }
      ]
    },
  ],
  BAALAK_PRADO: [
    {
      area: 'ESTACIONAMIENTO',
      aspectos: [
        { id: 'est-1', aspecto: 'Limpieza general' },
        { id: 'est-2', aspecto: 'Iluminación funcional' },
        { id: 'est-3', aspecto: 'Cajones de estacionamiento libres' },
        { id: 'est-4', aspecto: 'Puertas de acceso funcionales' },
        { id: 'est-5', aspecto: 'Anuncios visibles y en buen estado' },
      ]
    },
    {
      area: 'RECEPCIÓN',
      aspectos: [
        { id: 'rec-1', aspecto: 'Puerta de acceso a las demás áreas limpia' },
        { id: 'rec-2', aspecto: 'Mueble de recepción limpio y ordenado' },
        { id: 'rec-3', aspecto: 'Compañeros con buen porte' },
        { id: 'rec-4', aspecto: 'Sala de espera limpia y ordenada' },
        { id: 'rec-5', aspecto: 'Báscula limpia y desinfectada' },
        { id: 'rec-6', aspecto: 'Bolsas y articulos personales guardados debidamente' },
        { id: 'rec-7', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'rec-8', aspecto: 'Cambio en caja' },
        { id: 'rec-9', aspecto: 'Corte de caja realizado' },
        { id: 'rec-10', aspecto: 'Sin problemas de red' },
        { id: 'rec-12', aspecto: 'Computadoras, terminales e impresoras habilitadas' },
        { id: 'rec-13', aspecto: 'Celular con carga al 100%' },
        { id: 'rec-14', aspecto: 'Aire acondicionado limpio y funcional' },
        { id: 'rec-15', aspecto: 'Luces funcionales' },
        { id: 'rec-16', aspecto: 'Limpieza general' },
        { id: 'rec-17', aspecto: 'Anaqueles ordenados' },
        { id: 'rec-18', aspecto: 'Productos en exhibición ordenados' },
        { id: 'rec-19', aspecto: 'Precios visibles y correctos' },
        { id: 'rec-20', aspecto: 'Puertas de acceso a patio central limpias y funcionales' },
        { id: 'rec-21', aspecto: 'Ventanas limpias' },
        { id: 'rec-22', aspecto: 'Mostrador limpio y ordenado' },
      ]
    },
    {
      area: 'SALA DE ESPERA (ÁREA DE GATOS)',
      aspectos: [
        { id: 'sal-1', aspecto: 'Puertas y ventanas limpias' },
        { id: 'sal-2', aspecto: 'Estantes limpios y ordenados' },
        { id: 'sal-3', aspecto: 'Sillas limpias y ordenadas' },
        { id: 'sal-4', aspecto: 'Luces funcionales' },
        { id: 'sal-5', aspecto: 'Refrigerador limpio y funcional' },
      ]
    },
    {
      area: 'CONSULTORIO 1',
      aspectos: [
        { id: 'con1-1', aspecto: 'Consultorio limpio y oloroso' },
        { id: 'con1-2', aspecto: 'Mesa limpia y desinfectada' },
        { id: 'con1-3', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'con1-4', aspecto: 'Tarja limpia' },
        { id: 'con1-5', aspecto: 'Abastecido de material (jeringas, alcohol, torundas)' },
        { id: 'con1-6', aspecto: 'Cajonera ordenada' },
        { id: 'con1-7', aspecto: 'Puerta limpia y ventana' },
        { id: 'con1-8', aspecto: 'Libre de portaobjetos sucios' },
        { id: 'con1-9', aspecto: 'Computadora habilitada' },
        { id: 'con1-11', aspecto: 'Sin problemas de red' },
        { id: 'con1-12', aspecto: 'Luces funcionales' },
        { id: 'con1-13', aspecto: 'Clima limpio y funcional' },
      ]
    },
    {
      area: 'CONSULTORIO 2',
      aspectos: [
        { id: 'con2-1', aspecto: 'Consultorio limpio y oloroso' },
        { id: 'con2-2', aspecto: 'Mesa limpia y desinfectada' },
        { id: 'con2-3', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'con2-4', aspecto: 'Tarja limpia' },
        { id: 'con2-5', aspecto: 'Abastecido de material (jeringas, alcohol, torundas)' },
        { id: 'con2-6', aspecto: 'Cajonera ordenada' },
        { id: 'con2-7', aspecto: 'Puertas y ventana limpias' },
        { id: 'con2-8', aspecto: 'Libre de portaobjetos sucios' },
        { id: 'con2-9', aspecto: 'Computadora e impresora habilitada' },
        { id: 'con2-11', aspecto: 'Sin problemas de red' },
        { id: 'con2-12', aspecto: 'Luces funcionales' },
        { id: 'con2-13', aspecto: 'Clima limpio y funcional' },
      ]
    },
    {
      area: 'BAÑO',
      aspectos: [
        { id: 'ba-1', aspecto: 'Piso limpio' },
        { id: 'ba-2', aspecto: 'Inodoro limpio y funcional' },
        { id: 'ba-3', aspecto: 'Lavabo limpio y desinfectado' },
        { id: 'ba-4', aspecto: 'Espejo limpio' },
        { id: 'ba-5', aspecto: 'Jabón y papel disponible' },
        { id: 'ba-6', aspecto: 'Bote de basura con bolsa y limpio' },
      ]
    },
    {
      area: 'PENSIÓN',
      aspectos: [
        { id: 'pen-1', aspecto: 'Jaulas limpias, desinfectadas y funcionales' },
        { id: 'pen-2', aspecto: 'Accesorios de mascotas ordenados' },
        { id: 'pen-3', aspecto: 'Platos de casa limpios' },
        { id: 'pen-4', aspecto: 'Luces funcionales' },
        { id: 'pen-5', aspecto: 'Puerta y ventana limpia y funcional' },
        { id: 'pen-6', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'pen-7', aspecto: 'Pisos limpios' },
        { id: 'pen-8', aspecto: 'Agua potable disponible' },
      ]
    },
    { area: 'MICROBIOLOGÍA',
      aspectos: [
        { id: 'mic-1', aspecto: 'Tarja limpia y desinfectada' },
        { id: 'mic-2', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'mic-3', aspecto: 'Material de uso con stock' },
        { id: 'mic-4', aspecto: 'Equipos limpios y funcionales' },
      ]
    },
    {
      area: 'RAYOS X',
      aspectos: [
        { id: 'rx-1', aspecto: 'Área de Rayos X limpia y ordenada' },
        { id: 'rx-2', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'rx-3', aspecto: 'Mesa de trabajo limpia y desinfectada' },
        { id: 'rx-4', aspecto: 'Equipos limpios y funcionales' },
        { id: 'rx-5', aspecto: 'Computadora habilitada' },
        { id: 'rx-6', aspecto: 'Sin problemas de red' },
        { id: 'rx-7', aspecto: 'Luces funcionales' },
        { id: 'rx-8', aspecto: 'Clima limpio y funcional' },
        { id: 'rx-9', aspecto: 'Equipo de seguridad disponible' },
      ]
    },
    {
      area: 'QUIRÓFANO',
      aspectos: [
        { id: 'quir-1', aspecto: 'Quirófano limpio y oloroso' },
        { id: 'quir-2', aspecto: 'Mesa de cirugía limpia y desinfectada' },
        { id: 'quir-3', aspecto: 'Bote de basura con bolsa y limpio' },
        { id: 'quir-4', aspecto: 'Carrito de anestesia limpio y ordenado' },
        { id: 'quir-5', aspecto: 'Abastecido de material (jeringas, alcohol, torundas)' },
        { id: 'quir-6', aspecto: 'Cajonera ordenada' },
        { id: 'quir-7', aspecto: 'Puertas limpias' },
        { id: 'quir-8', aspecto: 'Libre de portaobjetos sucios' },
        { id: 'quir-9', aspecto: 'Luces funcionales' },
        { id: 'quir-10', aspecto: 'Clima limpio y funcional' },
        { id: 'quir-11', aspecto: 'Equipo de anestesia limpio y funcional' },
        { id: 'quir-12', aspecto: 'Monitor de signos vitales limpio y funcional' },
        { id: 'quir-13', aspecto: 'Mesa de instrumental limpia y ordenada' },
        { id: 'quir-14', aspecto: 'Material de uso con stock' },
        { id: 'quir-15', aspecto: 'Tanques de oxigeno llenos' },
      ]
    },
  ]
};

// Local Storage keys para AsyncStorage
const STORAGE_KEYS = {
  CUSTOM_TEMPLATES: 'checklist_custom_templates_v2',
  AREA_ORDER: 'checklist_area_order_v2',
  AREA_ICONS: 'checklist_area_icons_v2'
};

// Cache para mejorar performance
let cachedTemplates: Record<SucursalType, ChecklistArea[]> | null = null;
let cachedAreaOrder: Record<string, number> | null = null;
let cachedAreaIcons: Record<string, string> | null = null;

// ========== FUNCIONES PARA PLANTILLAS ==========

// Cargar plantillas personalizadas del AsyncStorage
export const loadCustomTemplates = async (): Promise<Record<SucursalType, ChecklistArea[]>> => {
  try {
    if (cachedTemplates) return cachedTemplates;
    
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedTemplates = parsed;
      return parsed;
    }
  } catch (error) {
    console.error('Error cargando plantillas personalizadas:', error);
  }
  
  cachedTemplates = {} as Record<SucursalType, ChecklistArea[]>;
  return cachedTemplates;
};

// Guardar plantillas personalizadas en AsyncStorage
export const saveCustomTemplates = async (templates: Record<SucursalType, ChecklistArea[]>) => {
  try {
    cachedTemplates = templates;
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(templates));
    return true;
  } catch (error) {
    console.error('Error guardando plantillas personalizadas:', error);
    return false;
  }
};

// Obtener plantilla para una sucursal (async)
export const getSucursalTemplateAsync = async (sucursalKey: SucursalType): Promise<ChecklistArea[]> => {
  try {
    const customTemplates = await loadCustomTemplates();
    const custom = customTemplates[sucursalKey];
    
    if (custom && custom.length > 0) {
      return custom;
    }
    
    return DEFAULT_TEMPLATES[sucursalKey] || [];
  } catch (error) {
    console.error('Error obteniendo plantilla:', error);
    return DEFAULT_TEMPLATES[sucursalKey] || [];
  }
};

// Versión sincrónica para compatibilidad
export const getSucursalTemplate = (sucursalKey: SucursalType): ChecklistArea[] => {
  if (cachedTemplates && cachedTemplates[sucursalKey]) {
    return cachedTemplates[sucursalKey];
  }
  return DEFAULT_TEMPLATES[sucursalKey] || [];
};

// ========== FUNCIONES PARA ORDEN DE ÁREAS ==========

// Orden de áreas por defecto
const DEFAULT_AREA_ORDER: Record<string, number> = {
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

// Cargar orden de áreas personalizado
export const loadAreaOrderAsync = async (): Promise<Record<string, number>> => {
  try {
    if (cachedAreaOrder) return cachedAreaOrder;
    
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.AREA_ORDER);
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedAreaOrder = parsed;
      return parsed;
    }
  } catch (error) {
    console.error('Error cargando orden de áreas:', error);
  }
  
  cachedAreaOrder = {};
  return {};
};

// Guardar orden de áreas
export const saveAreaOrder = async (order: Record<string, number>) => {
  try {
    cachedAreaOrder = order;
    await AsyncStorage.setItem(STORAGE_KEYS.AREA_ORDER, JSON.stringify(order));
    return true;
  } catch (error) {
    console.error('Error guardando orden de áreas:', error);
    return false;
  }
};

// Obtener orden de áreas (async)
export const getAreaOrderAsync = async (): Promise<Record<string, number>> => {
  try {
    const customOrder = await loadAreaOrderAsync();
    return { ...DEFAULT_AREA_ORDER, ...customOrder };
  } catch (error) {
    console.error('Error obteniendo orden:', error);
    return DEFAULT_AREA_ORDER;
  }
};

// Versión sincrónica
export const getAreaOrder = (): Record<string, number> => {
  if (cachedAreaOrder) {
    return { ...DEFAULT_AREA_ORDER, ...cachedAreaOrder };
  }
  return DEFAULT_AREA_ORDER;
};

// Actualizar orden de un área
export const updateAreaOrder = async (area: string, order: number): Promise<void> => {
  try {
    const currentOrder = await loadAreaOrderAsync();
    currentOrder[area] = order;
    await saveAreaOrder(currentOrder);
  } catch (error) {
    console.error('Error actualizando orden:', error);
    throw error;
  }
};

// ========== FUNCIONES PARA ICONOS ==========

// Íconos por defecto
const DEFAULT_AREA_ICONS: Record<string, string> = {
  'ESTACIONAMIENTO': '🚗',
  'TIENDA': '🏬',
  'RECEPCIÓN': '💁',
  'CONSULTORIO': '🏥',
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
  'ESTÉTICA': '💇‍♂️',
  'TRANSPORTE': '🚑',
  'SALA DE ESPERA (ÁREA DE GATOS)': '🐱',
  'BAÑO': '🚽',
  'MICROBIOLOGÍA': '🧫',
  'OFICINA': '🏢',
  'BODEGA': '📦',
};

// Cargar íconos personalizados
export const loadAreaIconsAsync = async (): Promise<Record<string, string>> => {
  try {
    if (cachedAreaIcons) return cachedAreaIcons;
    
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.AREA_ICONS);
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedAreaIcons = parsed;
      return parsed;
    }
  } catch (error) {
    console.error('Error cargando íconos de áreas:', error);
  }
  
  cachedAreaIcons = {};
  return {};
};

// Guardar íconos personalizados
export const saveAreaIcons = async (icons: Record<string, string>) => {
  try {
    cachedAreaIcons = icons;
    await AsyncStorage.setItem(STORAGE_KEYS.AREA_ICONS, JSON.stringify(icons));
    return true;
  } catch (error) {
    console.error('Error guardando íconos de áreas:', error);
    return false;
  }
};

// Obtener íconos (async)
export const getAreaIconsAsync = async (): Promise<Record<string, string>> => {
  try {
    const customIcons = await loadAreaIconsAsync();
    return { ...DEFAULT_AREA_ICONS, ...customIcons };
  } catch (error) {
    console.error('Error obteniendo íconos:', error);
    return DEFAULT_AREA_ICONS;
  }
};

// Versión sincrónica
export const getAreaIcons = (): Record<string, string> => {
  if (cachedAreaIcons) {
    return { ...DEFAULT_AREA_ICONS, ...cachedAreaIcons };
  }
  return DEFAULT_AREA_ICONS;
};

export const getAreaIcon = (area: string): string => {
  const icons = getAreaIcons();
  return icons[area] || '📋';
};

// Actualizar ícono de un área
export const updateAreaIcon = async (area: string, icon: string): Promise<void> => {
  try {
    const currentIcons = await loadAreaIconsAsync();
    currentIcons[area] = icon;
    await saveAreaIcons(currentIcons);
  } catch (error) {
    console.error('Error actualizando ícono:', error);
    throw error;
  }
};

// ========== FUNCIONES DE GESTIÓN ==========

// Agregar área a sucursal
export const addAreaToSucursal = async (
  sucursalKey: SucursalType,
  areaName: string,
  aspectos: ChecklistAspect[] = [],
  areaIcon: string
): Promise<boolean> => {
  try {
    const customTemplates = await loadCustomTemplates();
    const currentTemplate = await getSucursalTemplateAsync(sucursalKey);
    
    // Verificar si el área ya existe
    if (currentTemplate.some(area => area.area === areaName)) {
      return false;
    }
    
    const newArea: ChecklistArea = {
      area: areaName,
      aspectos: aspectos.map((aspecto, index) => ({
        id: `custom-${Date.now()}-${index}`,
        aspecto: aspecto.aspecto,
        editable: true
      })),
      icon: areaIcon,
      editable: true
    };
    
    const updatedTemplate = [...currentTemplate, newArea];
    customTemplates[sucursalKey] = updatedTemplate;
    
    const success = await saveCustomTemplates(customTemplates);
    return success;
  } catch (error) {
    console.error('Error agregando área:', error);
    return false;
  }
};

// Eliminar área de sucursal
export const removeAreaFromSucursal = async (
  sucursalKey: SucursalType,
  areaName: string
): Promise<boolean> => {
  try {
    const customTemplates = await loadCustomTemplates();
    const currentTemplate = await getSucursalTemplateAsync(sucursalKey);
    
    // Solo permitir eliminar áreas editables
    const areaToRemove = currentTemplate.find(area => area.area === areaName);
    if (!areaToRemove?.editable) {
      return false;
    }
    
    const updatedTemplate = currentTemplate.filter(area => area.area !== areaName);
    customTemplates[sucursalKey] = updatedTemplate;
    
    const success = await saveCustomTemplates(customTemplates);
    return success;
  } catch (error) {
    console.error('Error eliminando área:', error);
    return false;
  }
};

// Agregar aspecto a área
export const addAspectoToArea = async (
  sucursalKey: SucursalType,
  areaName: string,
  aspectoText: string
): Promise<boolean> => {
  try {
    const customTemplates = await loadCustomTemplates();
    const currentTemplate = await getSucursalTemplateAsync(sucursalKey);
    const areaIndex = currentTemplate.findIndex(area => area.area === areaName);
    
    if (areaIndex === -1) {
      return false;
    }
    
    const newAspecto: ChecklistAspect = {
      id: `aspect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      aspecto: aspectoText,
      editable: true
    };
    
    const updatedTemplate = [...currentTemplate];
    updatedTemplate[areaIndex] = {
      ...updatedTemplate[areaIndex],
      aspectos: [...updatedTemplate[areaIndex].aspectos, newAspecto]
    };
    
    customTemplates[sucursalKey] = updatedTemplate;
    const success = await saveCustomTemplates(customTemplates);
    return success;
  } catch (error) {
    console.error('Error agregando aspecto:', error);
    return false;
  }
};

// Eliminar aspecto de área
export const removeAspectoFromArea = async (
  sucursalKey: SucursalType,
  areaName: string,
  aspectoId: string
): Promise<boolean> => {
  try {
    const customTemplates = await loadCustomTemplates();
    const currentTemplate = await getSucursalTemplateAsync(sucursalKey);
    const areaIndex = currentTemplate.findIndex(area => area.area === areaName);
    
    if (areaIndex === -1) {
      return false;
    }
    
    // Solo permitir eliminar aspectos editables
    const aspectoToRemove = currentTemplate[areaIndex].aspectos.find(a => a.id === aspectoId);
    if (!aspectoToRemove?.editable) {
      return false;
    }
    
    const updatedTemplate = [...currentTemplate];
    updatedTemplate[areaIndex] = {
      ...updatedTemplate[areaIndex],
      aspectos: updatedTemplate[areaIndex].aspectos.filter(a => a.id !== aspectoId)
    };
    
    customTemplates[sucursalKey] = updatedTemplate;
    const success = await saveCustomTemplates(customTemplates);
    return success;
  } catch (error) {
    console.error('Error eliminando aspecto:', error);
    return false;
  }
};

// Editar aspecto
export const editAspecto = async (
  sucursalKey: SucursalType,
  areaName: string,
  aspectoId: string,
  newText: string
): Promise<boolean> => {
  try {
    const customTemplates = await loadCustomTemplates();
    const currentTemplate = await getSucursalTemplateAsync(sucursalKey);
    const areaIndex = currentTemplate.findIndex(area => area.area === areaName);
    
    if (areaIndex === -1) {
      return false;
    }
    
    const aspectoIndex = currentTemplate[areaIndex].aspectos.findIndex(a => a.id === aspectoId);
    if (aspectoIndex === -1) {
      return false;
    }
    
    // Solo permitir editar aspectos editables
    if (!currentTemplate[areaIndex].aspectos[aspectoIndex].editable) {
      return false;
    }
    
    const updatedTemplate = [...currentTemplate];
    updatedTemplate[areaIndex] = {
      ...updatedTemplate[areaIndex],
      aspectos: updatedTemplate[areaIndex].aspectos.map((a, idx) => 
        idx === aspectoIndex ? { ...a, aspecto: newText } : a
      )
    };
    
    customTemplates[sucursalKey] = updatedTemplate;
    const success = await saveCustomTemplates(customTemplates);
    return success;
  } catch (error) {
    console.error('Error editando aspecto:', error);
    return false;
  }
};

// Restablecer plantilla a valores por defecto
export const resetSucursalTemplate = async (sucursalKey: SucursalType): Promise<boolean> => {
  try {
    const customTemplates = await loadCustomTemplates();
    delete customTemplates[sucursalKey];
    const success = await saveCustomTemplates(customTemplates);
    return success;
  } catch (error) {
    console.error('Error restableciendo plantilla:', error);
    return false;
  }
};

// Función para inicializar cache al inicio de la app
export const initializeCache = async (): Promise<void> => {
  try {
    await Promise.all([
      loadCustomTemplates(),
      loadAreaOrderAsync(),
      loadAreaIconsAsync()
    ]);
  } catch (error) {
    console.error('Error inicializando cache:', error);
  }
};

// Función para obtener el checklist items para una sucursal
export const getChecklistTemplateForSucursal = (sucursalKey: SucursalType): ChecklistItem[] => {
  const template = getSucursalTemplate(sucursalKey);
  
  return template.flatMap((area, areaIndex) => 
    area.aspectos.map((aspecto, aspectoIndex) => ({
      id: `${areaIndex}-${aspectoIndex}-${aspecto.id}`,
      area: area.area,
      aspecto: aspecto.aspecto,
      cumplimiento: '' as const,
      observaciones: '',
      aspectoId: aspecto.id,
      editable: aspecto.editable || false
    }))
  );
};

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

export const initializeChecklistData = (sucursalKey: SucursalType = 'BAALAK_CENTRAL'): ChecklistData => {
  return {
    fecha: getCurrentDate(),
    horaInicio: getCurrentTime(),
    horaFin: '',
    responsable: '',
    items: getChecklistTemplateForSucursal(sucursalKey),
    comentariosAdicionales: '',
    photos: [],
    completed: false,
    sucursal: SUCURSALES[sucursalKey],
    sucursalKey: sucursalKey
  };
};

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

export const getUniqueAreasForSucursal = (sucursalKey: SucursalType): string[] => {
  const template = getSucursalTemplate(sucursalKey);
  const areas = template.map(area => area.area);
  const order = getAreaOrder();
  
  return areas.sort((a, b) => {
    const orderA = order[a] || 999;
    const orderB = order[b] || 999;
    return orderA - orderB;
  });
};

export const isAreaComplete = (items: ChecklistItem[], area: string): boolean => {
  const areaItems = items.filter(item => item.area === area);
  if (areaItems.length === 0) return false;
  
  return areaItems.every(item => 
    item.cumplimiento === 'bueno' || 
    item.cumplimiento === 'regular' || 
    item.cumplimiento === 'malo'
  );
};

export const areAllAreasComplete = (items: ChecklistItem[], sucursalKey: SucursalType): boolean => {
  const areas = getUniqueAreasForSucursal(sucursalKey);
  return areas.every(area => isAreaComplete(items, area));
};

export const getIncompleteAreas = (items: ChecklistItem[], sucursalKey: SucursalType): string[] => {
  const areas = getUniqueAreasForSucursal(sucursalKey);
  return areas.filter(area => !isAreaComplete(items, area));
};

export const getCompletionPercentage = (items: ChecklistItem[], sucursalKey: SucursalType): number => {
  const areas = getUniqueAreasForSucursal(sucursalKey);
  if (areas.length === 0) return 0;
  
  const completedAreas = areas.filter(area => isAreaComplete(items, area)).length;
  return (completedAreas / areas.length) * 100;
};

// Exportar todas las funciones de gestión
export const templateManagement = {
  loadCustomTemplates,
  saveCustomTemplates,
  getSucursalTemplateAsync,
  getSucursalTemplate,
  addAreaToSucursal,
  removeAreaFromSucursal,
  addAspectoToArea,
  removeAspectoFromArea,
  editAspecto,
  resetSucursalTemplate,
  updateAreaOrder,
  updateAreaIcon,
  getAreaOrderAsync,
  getAreaOrder,
  getAreaIconsAsync,
  getAreaIcons,
  getAreaIcon,
  initializeCache
};