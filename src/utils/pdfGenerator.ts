import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { ChecklistData } from '../types/checklist';
import { calculateAreaStats } from './checklistData';
import { ReportFormData } from 'src/types/report';

// Función para comprimir imagen antes de convertir a base64
const compressAndConvertToBase64 = async (photoUri: string): Promise<string> => {
  try {
    console.log('Comprimiendo y convirtiendo foto:', photoUri);
    
    // Si es una URI local del dispositivo
    if (photoUri.startsWith('file://') || photoUri.startsWith('content://')) {
      try {
        // Comprimir la imagen primero
        const compressedImage = await manipulateAsync(
          photoUri,
          [{ resize: { width: 800 } }], // Redimensionar a 800px de ancho
          { compress: 0.6, format: SaveFormat.JPEG } // Comprimir al 60%
        );
        
        // Leer la imagen comprimida
        const base64 = await FileSystem.readAsStringAsync(compressedImage.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        return `data:image/jpeg;base64,${base64}`;
      } catch (fsError) {
        console.warn('Error leyendo archivo local:', fsError);
        return '';
      }
    }
    
    // Si es una URI de assets o de la web
    return photoUri;
    
  } catch (error) {
    console.error('Error en compressAndConvertToBase64:', error);
    return '';
  }
};

// Función para procesar fotos en lotes
const processPhotosInBatches = async (
  photos: ChecklistData['photos'],
  batchSize: number = 3,
  onProgress?: (processed: number, total: number) => void
): Promise<any[]> => {
  if (!photos || photos.length === 0) return [];
  
  const results = [];
  const total = photos.length;
  
  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize);
    
    // Procesar lote en paralelo
    const batchResults = await Promise.all(
      batch.map(async (photo) => {
        try {
          const base64 = await compressAndConvertToBase64(photo.photoUri);
          return {
            ...photo,
            base64
          };
        } catch (error) {
          console.error(`Error procesando foto ${photo.id}:`, error);
          return {
            ...photo,
            base64: ''
          };
        }
      })
    );
    
    results.push(...batchResults);
    
    // Reportar progreso
    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }
    
    // Pequeña pausa para liberar memoria
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

// Función para generar HTML base sin fotos
const generateBaseHTML = (data: ChecklistData, sucursal: string): string => {
  // Agrupar items por área
  const itemsByArea = data.items.reduce((acc, item) => {
    if (!acc[item.area]) acc[item.area] = [];
    acc[item.area].push(item);
    return acc;
  }, {} as Record<string, typeof data.items>);

  // Estadísticas generales
  const stats = calculateAreaStats(data.items);
  const totalFotos = data.photos?.length || 0;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Checklist de Supervisión - ${sucursal}</title>
        <style>
          @page {
            margin: 1cm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #0195a8;
            padding-bottom: 10px;
          }
          .title {
            color: #0195a8;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .clinic-name {
            font-size: 16px;
            color: #333;
            margin: 10px 0;
            font-weight: bold;
          }
          .info-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          .info-column {
            width: 48%;
          }
          .info-row {
            margin-bottom: 5px;
          }
          .info-label {
            font-weight: bold;
            color: #555;
            display: inline-block;
            width: 140px;
          }
          .stats-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .stat-card {
            width: 32%;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
            text-align: center;
            border: 1px solid #ddd;
          }
          .stat-title {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .stat-value {
            font-size: 14px;
            font-weight: bold;
          }
          .area-section {
            page-break-inside: avoid;
            margin-bottom: 25px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .area-title {
            background-color: #0195a8;
            color: white;
            padding: 10px;
            margin: -15px -15px 15px -15px;
            border-radius: 5px 5px 0 0;
            font-size: 16px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          th {
            background-color: #f8f9fa;
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
            font-size: 11px;
          }
          td {
            padding: 8px;
            border: 1px solid #ddd;
            font-size: 10px;
          }
          .cumplimiento {
            font-weight: bold;
            text-align: center;
            border-radius: 3px;
            padding: 3px 6px;
            font-size: 9px;
          }
          .bueno { background-color: #d4edda; color: #155724; }
          .regular { background-color: #fff3cd; color: #856404; }
          .malo { background-color: #f8d7da; color: #721c24; }
          .photos-section {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 5px;
            page-break-inside: avoid;
          }
          .photos-title {
            font-size: 14px;
            font-weight: bold;
            color: #0369a1;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          }
          .photos-title:before {
            content: "📸";
            margin-right: 8px;
          }
          .photos-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 10px;
          }
          .photo-card {
            page-break-inside: avoid;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .photo-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 4px;
            display: block;
            margin-bottom: 8px;
            border: 1px solid #e2e8f0;
          }
          .photo-info {
            font-size: 10px;
            color: #475569;
          }
          .photo-description {
            font-weight: bold;
            margin-bottom: 3px;
            color: #1e293b;
          }
          .photo-timestamp {
            font-size: 9px;
            color: #64748b;
            font-style: italic;
          }
          .photo-placeholder {
            width: 100%;
            height: 150px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
          }
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          .comments-section {
            margin-top: 20px;
            padding: 15px;
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 5px;
          }
          .comments-title {
            font-size: 12px;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-excelente { background-color: #d4edda; color: #155724; }
          .status-aceptable { background-color: #fff3cd; color: #856404; }
          .status-mejora { background-color: #f8d7da; color: #721c24; }
          @media print {
            .area-section {
              page-break-inside: avoid;
            }
            .photo-card {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">CHECKLIST DE SUPERVISIÓN</h1>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            Sistema de Control de Calidad - ${sucursal}
          </div>
        </div>

        <div class="info-container">
          <div class="info-column">
            <div class="info-row">
              <span class="info-label">Sucursal:</span>
              <span><strong>${sucursal}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha:</span>
              <span>${data.fecha}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hora de inicio:</span>
              <span>${data.horaInicio} hrs.</span>
            </div>
          </div>
          <div class="info-column">
            <div class="info-row">
              <span class="info-label">Responsable:</span>
              <span><strong>${data.responsable}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Hora de fin:</span>
              <span>${data.horaFin || 'En progreso'} hrs.</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total áreas:</span>
              <span>${Object.keys(itemsByArea).length}</span>
            </div>
          </div>
        </div>

        <div class="stats-container">
          <div class="stat-card">
            <div class="stat-title">Total Evaluado</div>
            <div class="stat-value">${stats.totalEvaluado} / ${stats.total}</div>
            <div style="font-size: 10px; color: #666; margin-top: 2px;">
              ${Math.round((stats.totalEvaluado / stats.total) * 100)}% completado
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Calificación General</div>
            <div class="stat-value" style="color: ${
              stats.porcentajeBueno >= 80 ? '#10b981' :
              stats.porcentajeBueno >= 60 ? '#f59e0b' : '#ef4444'
            }">${stats.porcentajeBueno.toFixed(1)}% Bueno</div>
            <div class="status-badge ${
              stats.porcentajeBueno >= 80 ? 'status-excelente' :
              stats.porcentajeBueno >= 60 ? 'status-aceptable' : 'status-mejora'
            }" style="margin-top: 5px;">
              ${
                stats.porcentajeBueno >= 80 ? 'EXCELENTE' :
                stats.porcentajeBueno >= 60 ? 'ACEPTABLE' : 'REQUIERE MEJORA'
              }
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Fotos Tomadas</div>
            <div class="stat-value">${totalFotos}</div>
            <div style="font-size: 10px; color: #666; margin-top: 2px;">
              en ${data.photos ? new Set(data.photos.map(p => p.area)).size : 0} áreas
            </div>
          </div>
        </div>

        ${Object.entries(itemsByArea).map(([area, items]) => {
          const areaStats = calculateAreaStats(items);
          const areaPhotos = data.photos?.filter(photo => photo.area === area) || [];
          const photoCount = areaPhotos.length;
          
          return `
            <div class="area-section">
              <div class="area-title">
                ${area} - ${areaStats.porcentajeBueno.toFixed(1)}% Bueno (${areaStats.totalEvaluado}/${areaStats.total} evaluados)
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th width="50%">Aspecto a Evaluar</th>
                    <th width="20%">Cumplimiento</th>
                    <th width="30%">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td>${item.aspecto}</td>
                      <td>
                        ${item.cumplimiento ? `
                          <span class="cumplimiento ${item.cumplimiento}">
                            ${item.cumplimiento.toUpperCase()}
                          </span>
                        ` : '<span style="color: #999;">PENDIENTE</span>'}
                      </td>
                      <td>${item.observaciones || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="stats-container" style="margin-top: 15px;">
                <div class="stat-card">
                  <div class="stat-title" style="color: #10b981">Bueno</div>
                  <div class="stat-value" style="color: #10b981">${areaStats.bueno}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-title" style="color: #f59e0b">Regular</div>
                  <div class="stat-value" style="color: #f59e0b">${areaStats.regular}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-title" style="color: #ef4444">Malo</div>
                  <div class="stat-value" style="color: #ef4444">${areaStats.malo}</div>
                </div>
              </div>
              
              ${photoCount > 0 ? `
                <div class="photos-section">
                  <div class="photos-title">Fotos de ${area} (${photoCount})</div>
                  <div class="photos-grid">
                    ${Array(photoCount).fill(0).map((_, idx) => `
                      <div class="photo-card">
                        <!-- PHOTO_${area}_${idx} -->
                        <div class="photo-placeholder">
                          Cargando foto ${idx + 1}...
                        </div>
                        <div class="photo-info">
                          <div class="photo-description">
                            ${areaPhotos[idx]?.description || 'Sin descripción'}
                          </div>
                          <div class="photo-timestamp">
                            📅 ${areaPhotos[idx]?.timestamp || ''}
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}

        ${data.comentariosAdicionales ? `
          <div class="comments-section">
            <div class="comments-title">📝 Comentarios Adicionales:</div>
            <div style="font-size: 11px; line-height: 1.5;">${data.comentariosAdicionales}</div>
          </div>
        ` : ''}

        <div class="footer">
          <strong>Checklist de Supervisión - ${sucursal}</strong><br/>
          Documento generado automáticamente el ${new Date().toLocaleDateString()} | 
          Válido únicamente para uso interno
        </div>
      </body>
    </html>
  `;
};

// Función para inyectar fotos en el HTML
const injectPhotosIntoHTML = (html: string, photosWithBase64: any[]): string => {
  if (!photosWithBase64.length) return html;
  
  let modifiedHtml = html;
  
  // Agrupar fotos por área
  const photosByArea: Record<string, any[]> = {};
  photosWithBase64.forEach(photo => {
    if (!photosByArea[photo.area]) {
      photosByArea[photo.area] = [];
    }
    photosByArea[photo.area].push(photo);
  });
  
  // Reemplazar placeholders con fotos reales
  Object.entries(photosByArea).forEach(([area, photos]) => {
    photos.forEach((photo, idx) => {
      const placeholder = `<!-- PHOTO_${area}_${idx} -->`;
      
      if (photo.base64 && photo.base64.startsWith('data:image')) {
        const photoHtml = `
          <img src="${photo.base64}" 
               alt="Foto ${idx + 1} - ${area}" 
               class="photo-image"
               onerror="this.parentElement.innerHTML='<div style=\\'padding: 20px; text-align: center; background: #fee; border-radius: 4px;\\'>❌ Error cargando imagen</div>'"
          />
        `;
        modifiedHtml = modifiedHtml.replace(placeholder, photoHtml);
      } else {
        const photoHtml = `
          <div style="padding: 20px; text-align: center; background: #f5f5f5; border-radius: 4px; height: 150px; display: flex; align-items: center; justify-content: center;">
            <div>
              <div style="font-size: 24px; margin-bottom: 5px;">📷</div>
              <div style="font-size: 11px; color: #666;">Foto no disponible</div>
            </div>
          </div>
        `;
        modifiedHtml = modifiedHtml.replace(placeholder, photoHtml);
      }
    });
  });
  
  return modifiedHtml;
};

// Función principal optimizada para generar PDF del checklist
export const generateChecklistPDF = async (
  data: ChecklistData, 
  sucursal: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log('Generando PDF optimizado con fotos...');
    console.log('Total de fotos:', data.photos?.length || 0);
    
    // 1. Primero generar HTML sin fotos (rápido)
    if (onProgress) onProgress(10);
    let html = generateBaseHTML(data, sucursal);
    
    // 2. Si hay fotos, procesarlas en lotes
    if (data.photos && data.photos.length > 0) {
      console.log('Procesando fotos en lotes...');
      
      const photosWithBase64 = await processPhotosInBatches(
        data.photos, 
        3, 
        (processed, total) => {
          const progress = 10 + (processed / total) * 80;
          if (onProgress) onProgress(Math.round(progress));
        }
      );
      
      // 3. Inyectar fotos en el HTML
      html = injectPhotosIntoHTML(html, photosWithBase64);
      
      if (onProgress) onProgress(95);
    }
    
    // 4. Generar PDF final
    console.log('Generando PDF final...');
    const { uri } = await Print.printToFileAsync({ 
      html,
      base64: false
    });
    
    if (onProgress) onProgress(100);
    console.log('PDF generado exitosamente en:', uri);
    
    return uri;
  } catch (error) {
    console.error('Error generando PDF del checklist:', error);
    throw error;
  }
};

// Configuración de tamaños de fuente para reportes
const FONT_SIZES = {
  title: 18,
  subtitle: 14,
  normal: 11,
  small: 10,
  verySmall: 9,
  label: 10,
  value: 11,
};

// Estilos comunes para todos los reportes
const COMMON_STYLES = `
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    color: #333;
    line-height: 1.4;
  }
  .container {
    padding: 20px;
  }
  .header {
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #05aaca;
    padding-bottom: 15px;
  }
  .header h1 {
    font-size: ${FONT_SIZES.title}px;
    color: #05aaca;
    margin: 0 0 8px 0;
  }
  .header h2 {
    font-size: ${FONT_SIZES.subtitle}px;
    color: #666;
    margin: 0;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
    background: #f8fafc;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  .info-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 6px;
  }
  .info-label {
    font-size: ${FONT_SIZES.label}px;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 2px;
  }
  .info-value {
    font-size: ${FONT_SIZES.value}px;
    color: #111827;
    background: white;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #d1d5db;
    min-height: 22px;
  }
  .section {
    margin-bottom: 20px;
  }
  .section-title {
    font-size: ${FONT_SIZES.subtitle}px;
    font-weight: 600;
    color: #374151;
    background: #f3f4f6;
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 12px;
    border-left: 4px solid #05aaca;
  }
  .field-row {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }
  .field-half {
    flex: 1;
  }
  .field-full {
    width: 100%;
  }
  .field-label {
    font-size: ${FONT_SIZES.label}px;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 2px;
  }
  .field-value {
    font-size: ${FONT_SIZES.value}px;
    color: #111827;
    background: white;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid #d1d5db;
    min-height: 24px;
    line-height: 1.3;
  }
  .text-area {
    min-height: 60px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .footer {
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid #e5e7eb;
    font-size: ${FONT_SIZES.small}px;
    color: #6b7280;
    text-align: center;
  }
`;

// Función auxiliar para crear campos de tamaño reducido
const createCompactField = (label: string, value: string, width: string = '48%') => `
  <div style="width: ${width}; margin-bottom: 8px;">
    <div class="field-label">${label}</div>
    <div class="field-value" style="font-size: ${FONT_SIZES.value}px; min-height: 22px;">${value || '-'}</div>
  </div>
`;

// Plantilla para Reporte de Queja
const generateRPCHTML = (formData: ReportFormData, sucursalName: string) => {
  const reportType = "REPORTE DE QUEJA DE CLIENTE";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${COMMON_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${reportType}</h1>
          <h2>${sucursalName}</h2>
          <div style="margin-top: 10px; font-size: ${FONT_SIZES.small}px; color: #6b7280;">
            Generado el: ${formData.fecha} a las ${formData.hora} hrs.
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Fecha del problema:</div>
            <div class="info-value">${formData.fechaProblema || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Área:</div>
            <div class="info-value">${formData.area || '-'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Información del Cliente</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${createCompactField('Nombre del Cliente', formData.nombreCliente, '48%')}
            ${createCompactField('Teléfono', formData.telefono, '48%')}
            ${createCompactField('Nombre de la Mascota', formData.nombreMascota, '48%')}
            ${createCompactField('Raza', formData.raza, '48%')}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Detalles del Personal</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${createCompactField('Personal Involucrado', formData.personal, '48%')}
            ${createCompactField('Responsable del Plan', formData.responsable, '48%')}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Descripción de la Queja</div>
          <div>
            <div class="field-label">Retroalimentación del Cliente:</div>
            <div class="field-value text-area">${formData.retroalimentacion || '-'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Plan de Acción</div>
          <div style="margin-bottom: 10px;">
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
              ${createCompactField('Fecha Plan de Acción', formData.planAccion, '48%')}
              ${createCompactField('Costo al Área', formData.costoArea ? `$${formData.costoArea}` : '-', '48%')}
            </div>
            <div style="margin-bottom: 10px;">
              <div class="field-label">Cómo se va a resolver el problema:</div>
              <div class="field-value text-area">${formData.comoResolver || '-'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div class="field-label">Pasos seguidos para resolver:</div>
              <div class="field-value text-area">${formData.pasosResolver || '-'}</div>
            </div>
            <div>
              <div class="field-label">Estado:</div>
              <div class="field-value" style="font-weight: 600; color: ${formData.quejaResuelta === 'SI' ? '#10B981' : formData.quejaResuelta === 'NO' ? '#EF4444' : '#F59E0B'}">
                ${formData.quejaResuelta || '-'}
              </div>
            </div>
          </div>
        </div>
        
        ${formData.observaciones ? `
          <div class="section">
            <div class="section-title">Observaciones Adicionales</div>
            <div class="field-value text-area">${formData.observaciones}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <div>Documento generado por el sistema de reportes - ${new Date().getFullYear()}</div>
          <div style="margin-top: 5px; font-size: ${FONT_SIZES.verySmall}px;">
            ID del reporte: ${Date.now()}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Plantilla para Reporte de Incidente
const generateIncidenteHTML = (formData: ReportFormData, sucursalName: string) => {
  const reportType = "REPORTE DE INCIDENTE";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${COMMON_STYLES}
        .severity-high { color: #EF4444; font-weight: 600; }
        .severity-medium { color: #F59E0B; font-weight: 600; }
        .severity-low { color: #10B981; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #D97706;">${reportType}</h1>
          <h2>${sucursalName}</h2>
          <div style="margin-top: 10px; font-size: ${FONT_SIZES.small}px; color: #6b7280;">
            Generado el: ${formData.fecha} a las ${formData.hora} hrs.
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Fecha del incidente:</div>
            <div class="info-value">${formData.fechaProblema || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Tipo de incidente:</div>
            <div class="info-value">${formData.raza || '-'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title" style="border-left-color: #D97706;">Información del Afectado</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${createCompactField('Nombre del Afectado', formData.nombreCliente, '48%')}
            ${createCompactField('Teléfono', formData.telefono, '48%')}
            ${createCompactField('Mascota involucrada', formData.nombreMascota, '48%')}
            ${createCompactField('Gravedad', formData.quejaResuelta, '48%')}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title" style="border-left-color: #D97706;">Ubicación y Personal</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${createCompactField('Área del incidente', formData.area, '48%')}
            ${createCompactField('Personal involucrado', formData.personal, '48%')}
            ${createCompactField('Responsable del reporte', formData.responsable, '48%')}
            ${createCompactField('Fecha de seguimiento', formData.planAccion, '48%')}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title" style="border-left-color: #D97706;">Descripción del Incidente</div>
          <div>
            <div class="field-label">Descripción detallada:</div>
            <div class="field-value text-area">${formData.retroalimentacion || '-'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title" style="border-left-color: #D97706;">Acciones Tomadas</div>
          <div style="margin-bottom: 10px;">
            <div style="margin-bottom: 10px;">
              <div class="field-label">Acciones inmediatas tomadas:</div>
              <div class="field-value text-area">${formData.comoResolver || '-'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div class="field-label">Primeros auxilios aplicados:</div>
              <div class="field-value text-area">${formData.pasosResolver || '-'}</div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
              ${createCompactField('Costo estimado', formData.costoArea ? `$${formData.costoArea}` : '-', '48%')}
            </div>
          </div>
        </div>
        
        ${formData.observaciones ? `
          <div class="section">
            <div class="section-title" style="border-left-color: #D97706;">Recomendaciones de Prevención</div>
            <div class="field-value text-area">${formData.observaciones}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <div>Documento generado por el sistema de reportes - ${new Date().getFullYear()}</div>
          <div style="margin-top: 5px; font-size: ${FONT_SIZES.verySmall}px;">
            ID del incidente: INC-${Date.now().toString().slice(-8)}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Plantilla para Reporte General
const generateGeneralHTML = (formData: ReportFormData, sucursalName: string) => {
  const reportType = "REPORTE GENERAL";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${COMMON_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #059669;">${reportType}</h1>
          <h2>${sucursalName}</h2>
          <div style="margin-top: 10px; font-size: ${FONT_SIZES.small}px; color: #6b7280;">
            Generado el: ${formData.fecha} a las ${formData.hora} hrs.
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Fecha de actividad:</div>
            <div class="info-value">${formData.fechaProblema || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Tipo de actividad:</div>
            <div class="info-value">${formData.raza || '-'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title" style="border-left-color: #059669;">Información de la Actividad</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${createCompactField('Cliente/Responsable', formData.nombreCliente, '48%')}
            ${createCompactField('Teléfono', formData.telefono, '48%')}
            ${createCompactField('Mascota(s)', formData.nombreMascota, '48%')}
            ${createCompactField('Estado', formData.quejaResuelta, '48%')}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title" style="border-left-color: #059669;">Equipo y Fechas</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${createCompactField('Área', formData.area, '48%')}
            ${createCompactField('Personal participante', formData.personal, '48%')}
            ${createCompactField('Responsable', formData.responsable, '48%')}
            ${createCompactField('Fecha de término', formData.planAccion, '48%')}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title" style="border-left-color: #059669;">Descripción de la Actividad</div>
          <div>
            <div class="field-label">Detalles de la actividad realizada:</div>
            <div class="field-value text-area">${formData.retroalimentacion || '-'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title" style="border-left-color: #059669;">Resultados y Proceso</div>
          <div style="margin-bottom: 10px;">
            <div style="margin-bottom: 10px;">
              <div class="field-label">Resultados obtenidos:</div>
              <div class="field-value text-area">${formData.comoResolver || '-'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div class="field-label">Metodología/proceso seguido:</div>
              <div class="field-value text-area">${formData.pasosResolver || '-'}</div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
              ${createCompactField('Costo/Inversión', formData.costoArea ? `$${formData.costoArea}` : '-', '48%')}
            </div>
          </div>
        </div>
        
        ${formData.observaciones ? `
          <div class="section">
            <div class="section-title" style="border-left-color: #059669;">Conclusiones y Observaciones</div>
            <div class="field-value text-area">${formData.observaciones}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <div>Documento generado por el sistema de reportes - ${new Date().getFullYear()}</div>
          <div style="margin-top: 5px; font-size: ${FONT_SIZES.verySmall}px;">
            ID de reporte: GEN-${Date.now().toString().slice(-8)}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Función principal para generar PDF según el tipo
export const generateReportPDF = async (
  formData: ReportFormData, 
  sucursalName: string,
  reportType: string = 'rpc'
): Promise<string> => {
  try {
    let html = '';
    
    switch (reportType) {
      case 'rpc':
        html = generateRPCHTML(formData, sucursalName);
        break;
      case 'incidente':
        html = generateIncidenteHTML(formData, sucursalName);
        break;
      case 'general':
        html = generateGeneralHTML(formData, sucursalName);
        break;
      default:
        html = generateRPCHTML(formData, sucursalName);
    }
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    
    return uri;
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};