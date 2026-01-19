import * as XLSX from 'xlsx';
import { prepareClients, generateMessagesForClient } from './helpers';
import Toast from 'react-native-toast-message';
import { Cliente } from 'src/types/reminders';

export const getClientsFromExcel = async (fileUri: string): Promise<Cliente[]> => {
    try {
        // Leer el archivo Excel
        const workbook = XLSX.readFile(fileUri);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a array de arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Verificar encabezados
        const titles = ["CLIENTE", "TELÉFONO 1", "MASCOTA", "TIPO DE RECORDATORIO", "VACUNA", "PRÓXIMA FECHA"];
        
        if (data.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'El archivo Excel está vacío',
            });
            throw new Error("El archivo Excel está vacío.");
        }
        
        const headers = data[0].map((cell: any) => cell?.toString().trim());
        
        // Verificar que los encabezados coincidan
        const headersMatch = titles.every((title, index) => 
            headers[index]?.toUpperCase() === title.toUpperCase()
        );
        
        if (!headersMatch) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: `La hoja de Excel debe contener las columnas: ${titles.join(', ')}`,
            });
            throw new Error("Formato de Excel incorrecto.");
        }
        
        if (data.length <= 1) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'La hoja de Excel no contiene información',
            });
            throw new Error("No hay datos en el Excel.");
        }
        
        // Preparar clientes (excluyendo encabezados)
        const clientes = prepareClients(data.slice(1));
        
        // Generar mensajes para cada cliente
        clientes.forEach(cliente => {
            cliente.mensajes = generateMessagesForClient(cliente);
        });
        
        Toast.show({
            type: 'success',
            text1: 'Éxito',
            text2: `${clientes.length} clientes procesados correctamente`,
        });
        
        return clientes;
    } catch (error: any) {
        console.error('Error processing Excel file:', error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message || 'Error al procesar el archivo Excel',
        });
        throw error;
    }
};

// Función para simular obtención de contactos de WhatsApp (para desarrollo)
export const getWhatsAppContactsSimulated = (): Cliente[] => {
    const simulatedContacts = [
        { name: 'Marcos Chable', number: '9811713636' },
    ];
  
    const clientes: Cliente[] = simulatedContacts.map((contact, index) => ({
        nombre: contact.name,
        telefono: contact.number,
        mascotas: [
            {
                nombre: `Mascota Rocko`,
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
    }));
  
    // Generar mensajes para cada cliente
    clientes.forEach(cliente => {
        cliente.mensajes = generateMessagesForClient(cliente);
    });
    
    return clientes;
};