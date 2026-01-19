import { Cliente, ContactoWhatsApp, Mascota, Mensaje, Recordatorio } from 'src/types/reminders';

// Función para preparar los clientes desde Excel
export const prepareClients = (rows: any[][]): Cliente[] => {
    return rows.reduce((acc: Cliente[], cell: any[]) => {
        const nombreCliente = formatString(cell[0]?.toString() || '');
        const telefono = formatNumbers(cell[1]?.toString() || '');
        const nombreMascota = formatString(cell[2]?.toString() || '');
        const nombreRecordatorio = formatString(cell[3]?.toString() || '');
        const tipoRecordatorio = formatString(cell[4]?.toString() || '');
        const fecha = cell[5]?.toString() || '';

        // Validar datos mínimos
        if (!nombreCliente || !telefono) {
        return acc;
        }

        // Buscar o crear el cliente
        let cliente = acc.find(c => c.nombre === nombreCliente && c.telefono === telefono);
        if (!cliente) {
            cliente = {
                nombre: nombreCliente,
                telefono,
                mascotas: [],
                mensajes: [],
                status: false
            };
            acc.push(cliente);
        }

        // Buscar o crear la mascota
        let mascota = cliente.mascotas.find(m => m.nombre === nombreMascota);
        if (!mascota) {
            mascota = {
                nombre: nombreMascota,
                recordatorios: []
            };
            cliente.mascotas.push(mascota);
        }

        // Buscar o crear el recordatorio
        let recordatorio = mascota.recordatorios.find(r => r.nombre === nombreRecordatorio);
        if (!recordatorio) {
            recordatorio = {
                nombre: nombreRecordatorio,
                tipos: []
            };
            mascota.recordatorios.push(recordatorio);
        }

        // Agregar el tipo de recordatorio si no existe
        const existeTipo = recordatorio.tipos.some(t => 
            t.nombre === tipoRecordatorio && t.fecha === fecha
        );
        
        if (!existeTipo && tipoRecordatorio && fecha) {
            recordatorio.tipos.push({
                nombre: tipoRecordatorio,
                fecha
            });
        }

        return acc;
    }, []);
};

// Función para preparar contactos de WhatsApp
export const prepareContacts = (contacts: ContactoWhatsApp[]): Cliente[] => {
    const result = contacts.reduce(
        (acc: Cliente[], contact: ContactoWhatsApp) => {
            if (contact.isMyContact && contact.id.server === 'c.us' && contact.name) {
                const phone = contact.number.replace(/\D/g, '').slice(-10);
                acc.push({
                    nombre: contact.name,
                    telefono: phone,
                    mascotas: [],
                    mensajes: [],
                    status: false
                });
            }
            return acc;
        },
        []
    );
    
    // Ordenar alfabéticamente por nombre
    result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return result;
};

// Función para formatear texto a formato Oración
export const formatString = (cadena: string): string => {
    if (!cadena || cadena.trim() === '') {
        return '';
    }
    
    let oracion = cadena.replace(/[-_]/g, " ");
    let palabras = oracion.toLowerCase().split(" ")
        .map((palabra) => {
            return palabra.charAt(0).toUpperCase() + palabra.slice(1);
        });
        
    return palabras.join(" ");
};

// Función para extraer solo números
export const formatNumbers = (cadena: string): string => {
    if (!cadena) return '';
    const numbers = "0123456789";
    let numeros = "";
    
    for(let i = 0; i < cadena.length; i++) {
        for(let x = 0; x < numbers.length; x++) {
            if(cadena.charAt(i) === numbers.charAt(x)){
                numeros += cadena.charAt(i);
                break;
            }
        }
    }
    return numeros;
};

// Función para formatear fecha larga
export const formatDateLong = (date: string): string => {
    if (!date) return '';
    
    let dateObject;
    
    // Si la fecha está en formato ISO (YYYY-MM-DD)
    if (date.includes('-')) {
        const [year, month, day] = date.split('-').map(Number);
        dateObject = new Date(year, month - 1, day);
    } 
    // Si ya es un string de fecha válido
    else {
        dateObject = new Date(date);
        // Ajustar por diferencia de zona horaria
        if (!isNaN(dateObject.getTime())) {
            dateObject.setMinutes(dateObject.getMinutes() + dateObject.getTimezoneOffset());
        } else {
            return date; // Retornar la fecha original si no es válida
        }
    }
    
    if (isNaN(dateObject.getTime())) {
        return date;
    }
    
    return dateObject.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Generar mensajes automáticos para cada cliente
export const generateMessagesForClient = (cliente: Cliente): Mensaje[] => {
    const messages: Mensaje[] = [];
    const timestamp = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Mensaje de saludo
    messages.push({
        id: `msg_${Date.now()}_1`,
        contenido: `Hola ${cliente.nombre}.`,
        timestamp,
        esPropio: true
    });

    // Generar mensaje principal
    let mensajePrincipal = '';

    if (cliente.mascotas.length === 1) {
        const mascota = cliente.mascotas[0];
        mensajePrincipal = `su mascota '${mascota.nombre}',${listReminders(mascota)}`;
    } else {
        mensajePrincipal = 'sus mascotas: ';
        
        for (let i = 0; i < cliente.mascotas.length; i++) {
            if (i === 0) {
                mensajePrincipal += `'${cliente.mascotas[i].nombre}',${listReminders(cliente.mascotas[i])}`;
            } else {
                if (i === (cliente.mascotas.length - 1)) {
                    mensajePrincipal += ` y '${cliente.mascotas[i].nombre}',${listReminders(cliente.mascotas[i])}`;
                } else {
                    mensajePrincipal += `, '${cliente.mascotas[i].nombre}',${listReminders(cliente.mascotas[i])}`;
                }
            }
        }
    }

    // Agregar fecha si existe
    if (cliente.mascotas.length > 0 && 
        cliente.mascotas[0].recordatorios.length > 0 && 
        cliente.mascotas[0].recordatorios[0].tipos.length > 0) {
        
        const fecha = cliente.mascotas[0].recordatorios[0].tipos[0].fecha;
        mensajePrincipal += ` el día ${formatDateLong(fecha)}.`;
    } else {
        mensajePrincipal += '.';
    }

    messages.push({
        id: `msg_${Date.now()}_2`,
        contenido: `La clínica veterinaria Baalak le informa que ${mensajePrincipal}`,
        timestamp,
        esPropio: true
    });

    return messages;
};

// Helper: Listar recordatorios de una mascota
const listReminders = (mascota: Mascota): string => {
    let recordatorio = " tiene pendiente la aplicación de ";
    const recordatorios = mascota.recordatorios;

    if (recordatorios.length === 1) {
        recordatorio += recordatorios[0].nombre + listTypes(recordatorios[0]);
    } else {
        for (let i = 0; i < recordatorios.length; i++) {
            if (i === 0) {
                recordatorio += recordatorios[i].nombre + listTypes(recordatorios[i]);
            } else {
                if (i === (recordatorios.length - 1)) {
                    recordatorio += " y " + recordatorios[i].nombre + listTypes(recordatorios[i]);
                } else {
                    recordatorio += ", " + recordatorios[i].nombre + listTypes(recordatorios[i]);
                }
            }
        }
    }
    return recordatorio;
};

// Helper: Listar tipos de recordatorio
const listTypes = (recordatorio: Recordatorio): string => {
    let tipo = '';
    const tipos = recordatorio.tipos;

    if (tipos.length === 1) {
        tipo += " (" + tipos[0].nombre + ")";
    } else {
        for (let i = 0; i < tipos.length; i++) {
            if (i === 0) {
                tipo += " (" + tipos[i].nombre;
            } else {
                if (i === (tipos.length - 1)) {
                    tipo += " y " + tipos[i].nombre + ")";
                } else {
                    tipo += ", " + tipos[i].nombre;
                }
            }
        }
    }
    return tipo;
};