import * as Print from 'expo-print';
import { ChecklistData } from '../types/checklist';
import { calculateAreaStats } from './checklistData';
import { ReportFormData, PacienteInfo } from 'src/types/report';

// Función para generar HTML base sin fotos
const generateBaseHTML = (data: ChecklistData, sucursal: string): string => {
  const itemsByArea = data.items.reduce((acc, item) => {
    if (!acc[item.area]) acc[item.area] = [];
    acc[item.area].push(item);
    return acc;
  }, {} as Record<string, typeof data.items>);

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
          
          /* 🔥 NUEVO ESTILO PARA ENLACES DE FOTOS */
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
            padding: 15px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .photo-link {
            display: inline-block;
            background-color: #0ea5e9;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 8px;
          }
          .photo-link:hover {
            background-color: #0369a1;
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
          .qr-code {
            width: 100px;
            height: 100px;
            margin: 10px auto;
            display: block;
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
                    ${areaPhotos.map((photo, idx) => `
                      <div class="photo-card">
                        <div class="photo-info">
                          <div class="photo-description">
                            ${photo.description || 'Sin descripción'}
                          </div>
                          <div class="photo-timestamp">
                            📅 ${photo.timestamp || ''}
                          </div>
                          <!-- 🔥 ENLACE EN LUGAR DE LA IMAGEN -->
                          <a href="${photo.photoUri}" target="_blank" class="photo-link">
                            Ver Foto ${idx + 1} 🔗
                          </a>
                          <div style="font-size: 9px; color: #666; margin-top: 5px;">
                            Haz clic para ver la imagen en tu navegador
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
          Las fotos están disponibles mediante enlaces externos<br/>
          Válido únicamente para uso interno
        </div>
      </body>
    </html>
  `;
};

// Función principal optimizada para generar PDF del checklist
export const generateChecklistPDF = async (
  data: ChecklistData, 
  sucursal: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log('📄 Generando PDF ligero con enlaces a fotos...');
    console.log('Total de fotos:', data.photos?.length || 0);
    
    if (onProgress) onProgress(10);
    
    // 🔥 Generar HTML directamente sin procesar imágenes
    const html = generateBaseHTML(data, sucursal);
    
    if (onProgress) onProgress(50);
    
    console.log('📄 Generando PDF final...');
    const { uri } = await Print.printToFileAsync({ 
      html,
      base64: false
    });
    
    if (onProgress) onProgress(100);
    console.log('✅ PDF generado exitosamente en:', uri);
    
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
    padding: 20px;
    color: #333;
    line-height: 1.4;
  }
  .container {
    max-width: 100%;
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
    gap: 15px;
    margin-bottom: 20px;
    background: #f8fafc;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  .info-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
  }
  .info-label {
    font-size: ${FONT_SIZES.label}px;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 4px;
  }
  .info-value {
    font-size: ${FONT_SIZES.value}px;
    color: #111827;
    background: white;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid #d1d5db;
  }
  .section {
    margin-bottom: 25px;
    page-break-inside: avoid;
  }
  .section-title {
    font-size: ${FONT_SIZES.subtitle}px;
    font-weight: 600;
    color: #374151;
    background: #f3f4f6;
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 15px;
    border-left: 4px solid;
  }
  .field-row {
    display: flex;
    gap: 15px;
    margin-bottom: 12px;
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
    margin-bottom: 4px;
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
  .severity-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 11px;
  }
  .severity-alta { background: #FEE2E2; color: #991B1B; }
  .severity-media { background: #FEF3C7; color: #92400E; }
  .severity-baja { background: #D1FAE5; color: #065F46; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }
  th {
    background: #f8fafc;
    padding: 8px;
    text-align: left;
    border: 1px solid #ddd;
    font-size: 11px;
    font-weight: 600;
  }
  td {
    padding: 8px;
    border: 1px solid #ddd;
    font-size: 10px;
  }
  .treatment-badge {
    background: #FEE2E2;
    color: #991B1B;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 9px;
    font-weight: 600;
  }
  .summary-card {
    background: #059669;
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    text-align: center;
  }
  .summary-number {
    font-size: 36px;
    font-weight: bold;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 20px 0;
  }
  .stat-box {
    background: #f8fafc;
    padding: 10px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #e5e7eb;
  }
  .stat-number {
    font-size: 20px;
    font-weight: bold;
    color: #059669;
  }
  .incident-details {
    background: #F9FAFB;
    border-left: 4px solid #D97706;
    padding: 15px;
    margin: 15px 0;
  }
  .personal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin: 15px 0;
  }
  .personal-card {
    background: #f8fafc;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }
  .personal-role {
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .personal-name {
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
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

// Función auxiliar para crear campos
const createField = (label: string, value: string, fullWidth: boolean = false) => `
  <div style="${fullWidth ? 'width: 100%;' : 'flex: 1;'} margin-bottom: 10px;">
    <div class="field-label">${label}</div>
    <div class="field-value">${value || '-'}</div>
  </div>
`;

// Plantilla para Reporte de Queja (RPC) - CORREGIDA
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
          <h1 style="color: #EF4444;">${reportType}</h1>
          <h2>${sucursalName}</h2>
          <div style="margin-top: 10px; font-size: ${FONT_SIZES.small}px; color: #6b7280;">
            Generado el: ${formData.fecha} a las ${formData.hora} hrs.
          </div>
        </div>
        
        <div class="section">
          <div class="section-title" style="border-left-color: #EF4444;">Información del Problema</div>
          <div class="field-row">
            ${createField('Fecha del problema', formData.fechaProblema)}
            ${createField('Fecha plan de acción', formData.planAccion)}
          </div>
          <div class="field-row">
            ${createField('Área', formData.area)}
            ${createField('Estado', formData.quejaResuelta)}
          </div>
          <div class="field-row">
            ${createField('Personal involucrado', formData.personal)}
            ${createField('Responsable del plan', formData.responsable)}
          </div>
        </div>

        <div class="section">
          <div class="section-title" style="border-left-color: #EF4444;">Información del Cliente</div>
          <div class="field-row">
            ${createField('Nombre del Cliente', formData.nombreCliente)}
            ${createField('Teléfono', formData.telefono)}
          </div>
          <div class="field-row">
            ${createField('Nombre de la Mascota', formData.nombreMascota)}
            ${createField('Raza', formData.raza)}
          </div>
        </div>

        <div class="section">
          <div class="section-title" style="border-left-color: #EF4444;">Descripción de la Queja</div>
          <div class="field-full">
            <div class="field-label">Retroalimentación del cliente:</div>
            <div class="field-value text-area">${formData.retroalimentacion || '-'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title" style="border-left-color: #EF4444;">Plan de Acción</div>
          <div class="field-full">
            <div class="field-label">¿Cómo se va a resolver?</div>
            <div class="field-value text-area">${formData.comoResolver || '-'}</div>
          </div>
          <div style="margin-top: 10px;">
            <div class="field-label">Pasos a seguir:</div>
            <div class="field-value text-area">${formData.pasosResolver || '-'}</div>
          </div>
          <div style="margin-top: 10px;">
            ${createField('Costo al área', formData.costoArea ? `$${formData.costoArea}` : '-', true)}
          </div>
        </div>

        ${formData.observaciones ? `
          <div class="section">
            <div class="section-title" style="border-left-color: #EF4444;">Observaciones Adicionales</div>
            <div class="field-value text-area">${formData.observaciones}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div>Documento generado por el sistema de reportes - ${new Date().getFullYear()}</div>
          <div style="margin-top: 5px; font-size: ${FONT_SIZES.verySmall}px;">
            ID del reporte: RPC-${Date.now().toString().slice(-8)}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Plantilla para Reporte de Incidente mejorado
const generateIncidenteHTML = (formData: ReportFormData, sucursalName: string) => {
  const reportType = "REPORTE DE INCIDENTE";
  
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
          <h1 style="color: #D97706;">${reportType}</h1>
          <h2>${sucursalName}</h2>
          <div style="margin-top: 10px; font-size: ${FONT_SIZES.small}px; color: #6b7280;">
            Reporte generado: ${formData.fecha} ${formData.hora} hrs.
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Fecha del incidente:</span>
            <span class="info-value">${formData.fechaProblema || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Hora aproximada:</span>
            <span class="info-value">${formData.hora || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Lugar:</span>
            <span class="info-value">${formData.lugarIncidente || formData.area || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Tipo de incidente:</span>
            <span class="info-value">${formData.raza || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Gravedad:</span>
            <span class="info-value">
              <span class="severity-badge ${
                formData.quejaResuelta?.toLowerCase().includes('grave') ? 'severity-alta' :
                formData.quejaResuelta?.toLowerCase().includes('moderado') ? 'severity-media' : 'severity-baja'
              }">${formData.quejaResuelta || '-'}</span>
            </span>
          </div>
        </div>

        <div class="section">
          <div class="section-title" style="border-left-color: #D97706;">Personas Involucradas</div>
          <div class="field-row">
            ${createField('Afectado(s)', formData.nombreCliente)}
            ${createField('Personal involucrado', formData.personal)}
          </div>
          <div class="field-row">
            ${createField('Responsable del reporte', formData.responsable)}
            ${createField('Testigos', formData.testigos || 'Ninguno')}
          </div>
        </div>

        <div class="incident-details">
          <div class="section-title" style="border-left-color: #D97706; margin-top: 0;">Descripción del Incidente</div>
          <div class="field-label">¿Qué sucedió?</div>
          <div class="field-value text-area">${formData.retroalimentacion || '-'}</div>
          
          ${formData.pasosResolver ? `
            <div style="margin-top: 15px;">
              <div class="field-label">¿Por qué sucedió?</div>
              <div class="field-value text-area">${formData.pasosResolver}</div>
            </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title" style="border-left-color: #D97706;">Acciones Tomadas</div>
          <div class="field-label">Acciones inmediatas:</div>
          <div class="field-value text-area">${formData.comoResolver || '-'}</div>
          
          ${formData.accionesCorrectivas ? `
            <div style="margin-top: 10px;">
              <div class="field-label">Acciones correctivas:</div>
              <div class="field-value text-area">${formData.accionesCorrectivas}</div>
            </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title" style="border-left-color: #D97706;">Seguimiento</div>
          <div class="field-row">
            ${createField('Notificaciones', formData.notificaciones || 'Ninguna')}
            ${createField('Fecha de seguimiento', formData.planAccion || '-')}
          </div>
          <div class="field-row">
            ${createField('Costo estimado', formData.costoArea ? `$${formData.costoArea}` : '-')}
          </div>
        </div>

        ${formData.observaciones ? `
          <div class="section">
            <div class="section-title" style="border-left-color: #D97706;">Observaciones y Medidas Preventivas</div>
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

// Función para renderizar tabla de pacientes
const renderPacientesTable = (pacientes: PacienteInfo[] | undefined, titulo: string, color: string, tipo: string) => {
  if (!pacientes || pacientes.length === 0) return '';
  
  const nombreHeader = tipo === 'pension' ? 'Huésped' : 'Paciente';
  
  return `
    <div class="section">
      <div class="section-title" style="border-left-color: ${color}; background: ${color}10;">
        ${titulo} (${pacientes.length})
      </div>
      <table>
        <thead>
          <tr>
            <th>${nombreHeader}</th>
            <th>Propietario</th>
            <th>Ubicación/Jaula</th>
            ${tipo !== 'transitorios' ? '<th>Tratamiento</th>' : '<th>Tipo de Servicio</th>'}
          </tr>
        </thead>
        <tbody>
          ${pacientes.map(p => `
            <tr>
              <td>${p.nombrePaciente || '-'}</td>
              <td>${p.nombrePropietario || '-'}</td>
              <td>${p.ubicacion || '-'}</td>
              <td>
                ${tipo === 'transitorios' 
                  ? (p.tipoServicio || '-')
                  : (p.requiereTratamiento 
                      ? `<span class="treatment-badge">Sí: ${p.tratamiento || ''}</span>` 
                      : 'No')
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// Plantilla para Reporte General con pacientes
const generateGeneralHTML = (formData: ReportFormData, sucursalName: string) => {
  const reportType = "REPORTE GENERAL DIARIO";
  const totalPacientes = (formData.pacientesTransitorios?.length || 0) + 
  (formData.pacientesHospitalizados?.length || 0) + 
  (formData.pacientesPension?.length || 0);
  
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
            Fecha del reporte: ${formData.fechaProblema || formData.fecha}
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-number">${totalPacientes}</div>
          <div style="font-size: 14px; opacity: 0.9;">Total de Pacientes/Huéspedes</div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-number">${formData.pacientesTransitorios?.length || 0}</div>
            <div style="font-size: 11px; color: #4b5563;">Transitorios</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${formData.pacientesHospitalizados?.length || 0}</div>
            <div style="font-size: 11px; color: #4b5563;">Hospitalizados</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${formData.pacientesPension?.length || 0}</div>
            <div style="font-size: 11px; color: #4b5563;">Pensión</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title" style="border-left-color: #059669;">Personal en Turno</div>
          <div class="personal-grid">
            <div class="personal-card">
              <div class="personal-role">👨‍⚕️ Médico(s) en turno</div>
              <div class="personal-name">${formData.personal || 'No especificado'}</div>
            </div>
            <div class="personal-card">
              <div class="personal-role">👩‍💼 Recepcionista en turno</div>
              <div class="personal-name">${formData.area || 'No especificado'}</div>
            </div>
            <div class="personal-card">
              <div class="personal-role">🐾 Encargado de pensión</div>
              <div class="personal-name">${formData.responsable || 'No especificado'}</div>
            </div>
          </div>
        </div>

        ${renderPacientesTable(formData.pacientesTransitorios, 'Pacientes Transitorios (Consulta/Procedimientos)', '#3B82F6', 'transitorios')}
        ${renderPacientesTable(formData.pacientesHospitalizados, 'Pacientes Hospitalizados', '#EF4444', 'hospitalizados')}
        ${renderPacientesTable(formData.pacientesPension, 'Huéspedes en Pensión', '#F59E0B', 'pension')}

        <div class="section">
          <div class="section-title" style="border-left-color: #059669;">Actividades Realizadas</div>
          <div class="field-label">Descripción de actividades:</div>
          <div class="field-value text-area">${formData.retroalimentacion || '-'}</div>
          
          <div style="margin-top: 15px;">
            <div class="field-label">Resultados obtenidos:</div>
            <div class="field-value text-area">${formData.comoResolver || '-'}</div>
          </div>
        </div>

        ${formData.observaciones ? `
          <div class="section">
            <div class="section-title" style="border-left-color: #059669;">Observaciones</div>
            <div class="field-value text-area">${formData.observaciones}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div>Documento generado por el sistema de reportes - ${new Date().getFullYear()}</div>
          <div style="margin-top: 5px; font-size: ${FONT_SIZES.verySmall}px;">
            ID del reporte: GEN-${Date.now().toString().slice(-8)}
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