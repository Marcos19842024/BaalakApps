import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ChecklistData } from '../types/checklist';

export const generateChecklistPDF = async (data: ChecklistData) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0195a8; text-align: center; }
            .header { margin-bottom: 20px; }
            .info { margin-bottom: 15px; }
            .section { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .bueno { color: green; }
            .regular { color: orange; }
            .malo { color: red; }
          </style>
        </head>
        <body>
          <h1>📋 Checklist de Supervisión</h1>
          
          <div class="header">
            <div class="info"><strong>Fecha:</strong> ${data.fecha}</div>
            <div class="info"><strong>Responsable:</strong> ${data.responsable}</div>
            <div class="info"><strong>Hora Inicio:</strong> ${data.horaInicio}</div>
            <div class="info"><strong>Hora Fin:</strong> ${data.horaFin}</div>
          </div>
          
          ${data.items.reduce((html, item) => {
            if (!html.includes(`<h2>${item.area}</h2>`)) {
              html += `<div class="section"><h2>${item.area}</h2><table>`;
              html += '<tr><th>Aspecto</th><th>Calificación</th><th>Observaciones</th></tr>';
            }
            
            html += `
              <tr>
                <td>${item.aspecto}</td>
                <td class="${item.cumplimiento}">${item.cumplimiento.toUpperCase() || 'PENDIENTE'}</td>
                <td>${item.observaciones || '-'}</td>
              </tr>
            `;
            
            return html;
          }, '')}
          
          ${data.comentariosAdicionales ? `
            <div class="section">
              <h2>Comentarios Adicionales</h2>
              <p>${data.comentariosAdicionales}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Checklist PDF',
        UTI: 'com.adobe.pdf'
      });
    }
    
    return uri;
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};