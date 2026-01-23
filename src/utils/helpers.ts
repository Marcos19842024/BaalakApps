import { Cliente } from 'src/types/reminders';

// En la función prepareClients, agrega más validación:
export const prepareClients = (rows: any[][]): Cliente[] => {
    console.log('Preparando clientes con', rows.length, 'filas');
  
    const clientes = rows.reduce((acc: Cliente[], cell: any[], index) => {
        try {
            // Obtener datos de la fila
            const nombreCliente = formatString(cell[0]?.toString() || '');
            const telefono = formatNumbers(cell[1]?.toString() || '');
            const nombreMascota = formatString(cell[2]?.toString() || '');
            const nombreRecordatorio = formatString(cell[3]?.toString() || '');
            const tipoRecordatorio = formatString(cell[4]?.toString() || '');
            const fecha = cell[5]?.toString() || '';

            console.log(`Fila ${index + 1}:`, {
                nombreCliente,
                telefono,
                nombreMascota,
                nombreRecordatorio,
                tipoRecordatorio,
                fecha
            });

            // Validar datos mínimos
            if (!nombreCliente || nombreCliente.trim() === '' || !telefono || telefono.trim() === '') {
                console.log(`Fila ${index + 1} ignorada: datos insuficientes`);
                return acc;
            }

            // Buscar o crear el cliente
            let cliente = acc.find(c => 
                c.nombre === nombreCliente && c.telefono === telefono
            );
        
            if (!cliente) {
                cliente = {
                    nombre: nombreCliente,
                    telefono,
                    mascotas: [],
                    mensajes: [],
                    status: false
                };
                acc.push(cliente);
                console.log(`Nuevo cliente creado: ${nombreCliente}`);
            }

            // Solo agregar mascota si tiene nombre
            if (nombreMascota && nombreMascota.trim() !== '') {
                let mascota = cliente.mascotas.find(m => m.nombre === nombreMascota);
                if (!mascota) {
                    mascota = {
                        nombre: nombreMascota,
                        recordatorios: []
                    };
                    cliente.mascotas.push(mascota);
                }

                // Solo agregar recordatorio si tiene nombre
                if (nombreRecordatorio && nombreRecordatorio.trim() !== '') {
                    let recordatorio = mascota.recordatorios.find(r => r.nombre === nombreRecordatorio);
                    if (!recordatorio) {
                        recordatorio = {
                            nombre: nombreRecordatorio,
                            tipos: []
                        };
                        mascota.recordatorios.push(recordatorio);
                    }

                    // Solo agregar tipo si tiene nombre y fecha
                    if (tipoRecordatorio && tipoRecordatorio.trim() !== '' && fecha && fecha.trim() !== '') {
                        const existeTipo = recordatorio.tipos.some(t => 
                            t.nombre === tipoRecordatorio && t.fecha === fecha
                        );
                        
                        if (!existeTipo) {
                            recordatorio.tipos.push({
                                nombre: tipoRecordatorio,
                                fecha
                            });
                            console.log(`Agregado: ${tipoRecordatorio} para ${fecha}`);
                        }
                    }
                }
            }

        } catch (error) {
            console.error(`Error procesando fila ${index + 1}:`, error);
        }

        return acc;
    }, []);

    console.log('Total de clientes preparados:', clientes.length);
    return clientes;
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