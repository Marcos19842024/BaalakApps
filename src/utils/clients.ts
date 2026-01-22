import * as XLSX from 'xlsx';
import { prepareClients, generateMessagesForClient } from './helpers';
import Toast from 'react-native-toast-message';
import { Cliente } from 'src/types/reminders';

export const getClientsFromExcel = async (fileUri: string): Promise<Cliente[]> => {
    try {
        console.log('📁 Procesando archivo Excel...');
        
        // Usar fetch para leer el archivo (compatible con todas las versiones)
        const response = await fetch(fileUri);
        
        if (!response.ok) {
            const errorMsg = `Error ${response.status} al leer el archivo`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        // Obtener como ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();
        
        console.log('📊 Archivo leído, tamaño:', arrayBuffer.byteLength, 'bytes');
        
        // Leer Excel directamente del ArrayBuffer
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a array de arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        console.log('✅ Datos leídos del Excel:', data.length, 'filas');
        
        // Validar que haya datos
        if (data.length === 0) {
            const errorMsg = 'El archivo Excel está vacío';
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMsg,
            });
            throw new Error(errorMsg);
        }
        
        // Verificar encabezados
        const titles = ["CLIENTE", "TELÉFONO 1", "MASCOTA", "TIPO DE RECORDATORIO", "VACUNA", "PRÓXIMA FECHA"];
        const headers = data[0].map((cell: any) => 
            cell?.toString().trim().toUpperCase()
        );
        
        console.log('📋 Encabezados encontrados:', headers);
        console.log('📋 Encabezados esperados:', titles.map(t => t.toUpperCase()));
        
        // Verificar que los encabezados coincidan (case insensitive)
        const headersMatch = titles.every((title, index) => 
            headers[index] === title.toUpperCase()
        );
        
        if (!headersMatch) {
            const errorMsg = `Formato incorrecto.\n\nSe requieren estas columnas exactas:\n${titles.join(' | ')}`;
            Toast.show({
                type: 'error',
                text1: 'Error de formato',
                text2: errorMsg,
            });
            throw new Error(errorMsg);
        }
        
        // Verificar que haya datos más allá de los encabezados
        if (data.length <= 1) {
            const errorMsg = 'El Excel solo contiene encabezados, no hay datos';
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMsg,
            });
            throw new Error(errorMsg);
        }
        
        console.log(`📝 Procesando ${data.length - 1} filas de datos...`);
        
        // Preparar clientes (excluyendo encabezados)
        const clientes = prepareClients(data.slice(1));
        
        console.log('👥 Clientes procesados:', clientes.length);
        
        if (clientes.length === 0) {
            const errorMsg = 'No se encontraron clientes válidos en el Excel';
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMsg,
            });
            throw new Error(errorMsg);
        }
        
        // Generar mensajes automáticos para cada cliente
        clientes.forEach(cliente => {
            cliente.mensajes = generateMessagesForClient(cliente);
        });
        
        console.log('✅ Proceso completado exitosamente');
        
        Toast.show({
            type: 'success',
            text1: '✅ Éxito',
            text2: `${clientes.length} clientes procesados correctamente`,
        });
        
        return clientes;
        
    } catch (error: any) {
        console.error('❌ Error procesando Excel:', error);
        
        // Mostrar error específico
        let errorMessage = 'Error al procesar el archivo Excel';
        
        if (error.message.includes('Formato incorrecto')) {
            errorMessage = error.message;
        } else if (error.message.includes('vacío')) {
            errorMessage = 'El archivo Excel está vacío';
        } else if (error.message.includes('Error 4') || error.message.includes('Error 5')) {
            errorMessage = 'No se pudo acceder al archivo. Intenta nuevamente.';
        } else if (error.message.includes('arrayBuffer')) {
            errorMessage = 'El archivo no es un Excel válido';
        }
        
        Toast.show({
            type: 'error',
            text1: '❌ Error',
            text2: errorMessage,
            visibilityTime: 4000,
        });
        
        throw error;
    }
};

// Función para simular obtención de contactos (para desarrollo)
export const getWhatsAppContactsSimulated = (): Cliente[] => {
    console.log('📱 Generando contactos simulados...');
  
    const simulatedContacts = [
        { name: 'Juan Pérez (Demo)', number: '9811713636' },
        { name: 'María García (Demo)', number: '9811713636' },
        { name: 'Carlos López (Demo)', number: '9811713636' },
    ];
  
    const clientes: Cliente[] = simulatedContacts.map((contact, index) => {
        const cliente: Cliente = {
            nombre: contact.name,
            telefono: contact.number,
            mascotas: [
                {
                    nombre: `Mascota ${index + 1}`,
                    recordatorios: [
                        {
                            nombre: 'Vacuna',
                            tipos: [
                                {
                                    nombre: 'Rabia',
                                    fecha: '2024-12-15'
                                }
                            ]
                        }
                    ]
                }
            ],
            mensajes: [],
            status: false
        };
        
        // Generar mensajes automáticos
        cliente.mensajes = [
        {
            id: `msg_${Date.now()}_${index}_1`,
            contenido: `Hola ${cliente.nombre}.`,
            timestamp: new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            esPropio: true
        },
        {
            id: `msg_${Date.now()}_${index}_2`,
            contenido: `La clínica veterinaria Baalak le informa que su mascota '${cliente.mascotas[0].nombre}' tiene pendiente la aplicación de Vacuna (Rabia) el día 15 de diciembre de 2024.`,
            timestamp: new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            esPropio: true
        }
        ];
        
        return cliente;
    });
  
    console.log(`✅ ${clientes.length} contactos simulados generados`);
    
    Toast.show({
        type: 'success',
        text1: '✅ Contactos demo',
        text2: `${clientes.length} contactos de ejemplo cargados`,
    });
    
    return clientes;
};