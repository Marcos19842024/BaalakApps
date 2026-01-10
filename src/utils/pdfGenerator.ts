import * as Print from 'expo-print';
import { ChecklistData } from '../types/checklist';
import { calculateAreaStats } from './checklistData';

export const generateChecklistPDF = async (
  data: ChecklistData, 
  sucursal: string = 'Clínica Veterinaria Baalak (Central)'
): Promise<string> => {
  try {
    // Agrupar items por área
    const itemsByArea = data.items.reduce((acc, item) => {
      if (!acc[item.area]) acc[item.area] = [];
      acc[item.area].push(item);
      return acc;
    }, {} as Record<string, typeof data.items>);

    // Estadísticas generales
    const stats = calculateAreaStats(data.items);
    const totalFotos = data.photos?.length || 0;

    // Generar HTML para el PDF
    const html = `
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
            .photos-section {
              margin-top: 20px;
              padding: 15px;
              background-color: #f0f9ff;
              border: 1px solid #0ea5e9;
              border-radius: 5px;
            }
            .photos-title {
              font-size: 12px;
              font-weight: bold;
              color: #0369a1;
              margin-bottom: 10px;
            }
            .signature-section {
              margin-top: 40px;
              border-top: 1px solid #ccc;
              padding-top: 20px;
            }
            .signature-line {
              width: 200px;
              border-top: 1px solid #000;
              margin: 30px auto 5px;
            }
            .signature-text {
              text-align: center;
              font-size: 11px;
              color: #555;
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
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">CHECKLIST DE SUPERVISIÓN</h1>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
              Sistema de Control de Calidad
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
                <span>${data.horaFin} hrs.</span>
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
                ${data.photos?.filter(photo => photo.area).length || 0} por área
              </div>
            </div>
          </div>

          ${Object.entries(itemsByArea).map(([area, items]) => {
            const areaStats = calculateAreaStats(items);
            const areaPhotos = data.photos?.filter(photo => photo.area === area) || [];
            
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
                
                ${areaPhotos.length > 0 ? `
                  <div class="photos-section">
                    <div class="photos-title">📸 Fotos de ${area} (${areaPhotos.length})</div>
                    <div style="font-size: 11px; color: #475569;">
                      ${areaPhotos.map((photo, index) => `
                        <div style="margin-bottom: 8px; padding: 5px; background-color: #f8fafc; border-radius: 3px;">
                          <strong>Foto ${index + 1}:</strong> ${photo.description || 'Sin descripción'} 
                          <span style="color: #64748b; font-style: italic; font-size: 10px;">
                            (${photo.timestamp})
                          </span>
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

          <div class="signature-section">
            <div style="text-align: center; margin-bottom: 10px;">
              <strong>Documento firmado electrónicamente</strong>
            </div>
            <div class="signature-line"></div>
            <div class="signature-text">Firma del Responsable</div>
            <div class="signature-text"><strong>${data.responsable}</strong></div>
          </div>

          <div class="footer">
            <strong>Checklist de Supervisión - ${sucursal}</strong><br/>
            Documento generado automáticamente por ChecklistApp | 
            Válido únicamente para uso interno
          </div>
        </body>
      </html>
    `;

    // Generar PDF
    const { uri } = await Print.printToFileAsync({ 
      html,
      base64: false 
    });

    return uri;
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};