import { Alert } from 'react-native';
import { ExcelTemplate, Cliente, Mascota, Recordatorio, Mensaje } from '../types/reminders';

class remindersData {
    // Plantillas fijas (no editables)
    private templatesFijos: ExcelTemplate[] = [
        {
            id: 'vacunas_template',
            nombre: 'Recordatorios de Vacunas',
            tipo: 'vacunas',
            descripcion: 'Para seguimiento de vacunación de mascotas',
            activo: true,
            encabezados: [
                {
                    nombre: 'CLIENTE',
                    alias: 'Nombre del cliente',
                    variable: 'cliente',
                    requerido: true,
                    tipo: 'texto',
                    ejemplo: 'Juan Pérez'
                },
                {
                    nombre: 'TELÉFONO 1',
                    alias: 'Teléfono',
                    variable: 'telefono',
                    requerido: true,
                    tipo: 'telefono',
                    ejemplo: '5551234567'
                },
                {
                    nombre: 'MASCOTA',
                    alias: 'Nombre de la mascota',
                    variable: 'mascota',
                    requerido: true,
                    tipo: 'texto',
                    ejemplo: 'Firulais'
                },
                {
                    nombre: 'TIPO DE RECORDATORIO',
                    alias: 'Tipo de recordatorio',
                    variable: 'tipo_recordatorio',
                    requerido: true,
                    tipo: 'texto',
                    ejemplo: 'Vacuna'
                },
                {
                    nombre: 'VACUNA',
                    alias: 'Nombre de la vacuna',
                    variable: 'vacuna',
                    requerido: true,
                    tipo: 'texto',
                    ejemplo: 'Rabia'
                },
                {
                    nombre: 'PRÓXIMA FECHA',
                    alias: 'Fecha próxima',
                    variable: 'fecha_proxima',
                    requerido: true,
                    tipo: 'fecha',
                    formatoFecha: 'YYYY-MM-DD',
                    ejemplo: '2024-12-15'
                }
            ],
            mensajeTemplate: ''
        },
        {
            id: 'citas_template',
            nombre: 'Recordatorios de Citas',
            tipo: 'citas',
            descripcion: 'Para seguimiento de citas médicas',
            activo: true,
            encabezados: [
                {
                    nombre: 'FECHA',
                    alias: 'Fecha de la cita',
                    variable: 'fecha',
                    requerido: true,
                    tipo: 'fecha',
                    formatoFecha: 'YYYY-MM-DD',
                    ejemplo: '2024-12-15'
                },
                {
                    nombre: 'INICIO',
                    alias: 'Hora de inicio',
                    variable: 'hora_inicio',
                    requerido: true,
                    tipo: 'texto',
                    ejemplo: '10:00 AM'
                },
                {
                    nombre: 'TIPO VISITA',
                    alias: 'Tipo de visita',
                    variable: 'tipo_visita',
                    requerido: true,
                    tipo: 'texto',
                    ejemplo: 'Peluquería'
                },
                {
                    nombre: 'PROPIETARIO',
                    alias: 'Nombre del propietario',
                    variable: 'propietario',
                    requerido: true,
                    tipo: 'texto',
                    ejemplo: 'Juan Pérez'
                },
                {
                    nombre: 'MASCOTA',
                    alias: 'Nombre de la mascota',
                    variable: 'mascota',
                    requerido: true,
                    tipo: 'texto',
                    ejemplo: 'Firulais'
                },
                {
                    nombre: 'TELÉFONO',
                    alias: 'Teléfono',
                    variable: 'telefono',
                    requerido: true,
                    tipo: 'telefono',
                    ejemplo: '5551234567'
                },
                {
                    nombre: 'ASUNTO',
                    alias: 'Asunto de la cita',
                    variable: 'asunto',
                    requerido: false,
                    tipo: 'texto',
                    ejemplo: 'Baño y corte'
                },
                {
                    nombre: 'AGENDA',
                    alias: 'Agenda',
                    variable: 'agenda',
                    requerido: false,
                    tipo: 'texto',
                    ejemplo: 'Estética'
                },
                {
                    nombre: 'ESTADO',
                    alias: 'Estado',
                    variable: 'estado',
                    requerido: false,
                    tipo: 'texto',
                    ejemplo: 'Corte de pelo'
                }
            ],
            mensajeTemplate: ''
        }
    ];

    // Obtener todas las plantillas
    obtenerTemplates(): ExcelTemplate[] {
        return this.templatesFijos.filter(t => t.activo);
    }

    // Obtener template por ID
    obtenerTemplate(id: string): ExcelTemplate | null {
        return this.templatesFijos.find(t => t.id === id) || null;
    }

    // Procesar datos de Excel según el tipo de plantilla
    procesarDatosConTemplate(
        datos: any[][],
        template: ExcelTemplate,
        nombreClinica: string
    ): Cliente[] {
        if (!datos || datos.length === 0) {
            return [];
        }

        // Validar encabezados según el tipo de template
        const encabezadosExcel = datos[0];
        
        if (template.tipo === 'vacunas') {
            return this.procesarVacunas(datos, nombreClinica);
        } else if (template.tipo === 'citas') {
            return this.procesarCitas(datos, nombreClinica);
        }
        
        return [];
    }

    //****************************************************
    //*******************   Vacunas   ********************
    //****************************************************

    // Procesar template de vacunas
    private procesarVacunas(datos: any[][], nombreClinica: string): Cliente[] {
        const encabezadosExcel = datos[0];
        const titles = ["CLIENTE", "TELÉFONO 1", "MASCOTA", "TIPO DE RECORDATORIO", "VACUNA", "PRÓXIMA FECHA"];
        
        // Verificar que los encabezados coincidan (case insensitive)
        const headersMatch = titles.every((title, index) => {
            const excelHeader = encabezadosExcel[index]?.toString().trim().toUpperCase() || '';
            return excelHeader === title.toUpperCase();
        });
        
        if (!headersMatch) {
            Alert.alert("Error",`Formato incorrecto para vacunas. Se requieren:\n${titles.join(' | ')}`)
            throw new Error(`Formato incorrecto para vacunas. Se requieren:\n${titles.join(' | ')}`);
        }

        const filasDatos = datos.slice(1);
        
        if (filasDatos.length === 0) {
            throw new Error('El Excel no contiene datos');
        }

        const clientes = this.prepareClientsVacunas(filasDatos);
        this.ListPetsVacunas(clientes, nombreClinica);
        
        return clientes;
    }

    // PrepareClients para vacunas (igual que la versión web)
    private prepareClientsVacunas(rows: any[][]): Cliente[] {
        return rows.reduce((acc: Cliente[], cell: any[], index) => {
            try {
                const nombreCliente = this.formatString(cell[0]?.toString() || '');
                const telefono = this.formatNumbers(cell[1]?.toString() || '');
                const nombreMascota = this.formatString(cell[2]?.toString() || '');
                const nombreRecordatorio = this.formatString(cell[3]?.toString() || '');
                const tipoRecordatorio = this.formatString(cell[4]?.toString() || '');
                const fecha = cell[5]?.toString() || '';

                // Validar datos mínimos
                if (!nombreCliente || nombreCliente.trim() === '' || !telefono || telefono.trim() === '') {
                    console.log(`Fila ${index + 1} ignorada: datos insuficientes`);
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
                            }
                        }
                    }
                }

            } catch (error) {
                console.error(`Error procesando fila ${index + 1}:`, error);
            }

            return acc;
        }, []);
    }

    // ListPets para vacunas
    private ListPetsVacunas(clientes: Cliente[], nombreClinica: string) {
        clientes.forEach(cliente => {
            const mascotas = cliente.mascotas;
            let mensaje;
            
            // Mensaje de saludo
            cliente.mensajes.push(this.createNewMsg(`Hola ${cliente.nombre}.`));

            if (mascotas.length === 1) {
                mensaje = "su mascota '" + mascotas[0].nombre + "'," + this.ListReminders(mascotas[0]);
            } else {
                mensaje = "sus mascotas: ";
        
                for (let i = 0; i < mascotas.length; i++) {
                    if (i === 0) {
                        mensaje += "'" + mascotas[i].nombre + "'," + this.ListReminders(mascotas[i]);
                    } else {
                        if (i === (mascotas.length - 1)) {
                            mensaje += " y '" + mascotas[i].nombre + "'," + this.ListReminders(mascotas[i]);
                        } else {
                            mensaje += ", '" + mascotas[i].nombre + "'," + this.ListReminders(mascotas[i]);
                        }
                    }
                }
            }
        
            // Agregar fecha si existe
            if (mascotas.length > 0 && 
                mascotas[0].recordatorios.length > 0 && 
                mascotas[0].recordatorios[0].tipos.length > 0) {
            
                const fecha = mascotas[0].recordatorios[0].tipos[0].fecha;
                mensaje += " el día " + this.formatDateLong(fecha) + ".";
            } else {
                mensaje += ".";
            }
        
            // CORREGIDO: Usar nombre limpio de la clínica
            const nombreClinicaLimpio = this.extraerNombreClinica(nombreClinica);
            cliente.mensajes.push(this.createNewMsg(`${nombreClinicaLimpio} le informa que ${mensaje}`));
            
            let mensajeCita = `\n🐾 Quiere agendar su cita?`;
        
            cliente.mensajes.push(this.createNewMsg(mensajeCita));
        });
    }

    // ListReminders (igual que la versión web)
    private ListReminders(mascota: Mascota): string {
        let recordatorio = " tiene pendiente la aplicación de ";
        const recordatorios = mascota.recordatorios;

        if (recordatorios.length === 1) {
            recordatorio += recordatorios[0].nombre + this.ListTypes(recordatorios[0]);
        } else {
            for (let i = 0; i < recordatorios.length; i++) {
                if (i === 0) {
                    recordatorio += recordatorios[i].nombre + this.ListTypes(recordatorios[i]);
                } else {
                    if (i === (recordatorios.length - 1)) {
                        recordatorio += " y " + recordatorios[i].nombre + this.ListTypes(recordatorios[i]);
                    } else {
                        recordatorio += ", " + recordatorios[i].nombre + this.ListTypes(recordatorios[i]);
                    }
                }
            }
        }
        return recordatorio;
    }

    // ListTypes (igual que la versión web)
    private ListTypes(recordatorio: Recordatorio): string {
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
    }

    //****************************************************
    //*******************    Citas    ********************
    //****************************************************

    // Procesar template de citas
    private procesarCitas(datos: any[][], nombreClinica: string): Cliente[] {
        const encabezadosExcel = datos[0];
        const titles = ["FECHA", "INICIO", "TIPO VISITA", "PROPIETARIO", "MASCOTA", "TELÉFONO", "ASUNTO", "AGENDA", "ESTADO"];
        
        // Verificar que los encabezados coincidan (case insensitive)
        const headersMatch = titles.every((title, index) => {
            const excelHeader = encabezadosExcel[index]?.toString().trim().toUpperCase() || '';
            return excelHeader === title.toUpperCase();
        });
        
        if (!headersMatch) {
            Alert.alert("Error",`Formato incorrecto para citas. Se requieren:\n${titles.join(' | ')}`)
            throw new Error(`Formato incorrecto para citas. Se requieren:\n${titles.join(' | ')}`);
        }

        const filasDatos = datos.slice(1);
        
        if (filasDatos.length === 0) {
            throw new Error('El Excel no contiene datos');
        }

        const clientes = this.prepareClientsCitas(filasDatos);
        this.ListCitas(clientes, nombreClinica);
        
        return clientes;
    }

    // PrepareClients para citas - VERSIÓN OPTIMIZADA PARA MISMA FECHA
    private prepareClientsCitas(rows: any[][]): Cliente[] {
        // Primero procesamos todas las filas y agrupamos por cliente
        const citasPorCliente: { [claveCliente: string]: any[] } = {};
        
        rows.forEach((cell, index) => {
            try {
                const fecha = this.formatDateLong(cell[0]?.toString() || '');
                const hora_inicio = cell[1]?.toString() || '';
                const tipo_visita = this.formatString(cell[2]?.toString() || '');
                const propietario = this.formatString(cell[3]?.toString() || '');
                const nombreMascota = this.formatString(cell[4]?.toString() || '');
                const telefono = this.formatNumbers(cell[5]?.toString() || '');
                const asunto = this.formatString(cell[6]?.toString() || '');
                const agenda = this.formatString(cell[7]?.toString() || '');
                const estado = this.formatString(cell[8]?.toString() || '');

                // Validar datos mínimos
                if (!propietario || propietario.trim() === '' || !telefono || telefono.trim() === '') {
                    console.log(`Fila ${index + 1} ignorada: datos insuficientes`);
                    return;
                }

                const claveCliente = `${propietario}_${telefono}`;
                
                if (!citasPorCliente[claveCliente]) {
                    citasPorCliente[claveCliente] = [];
                }
                
                // Guardar la cita completa
                citasPorCliente[claveCliente].push({
                    fecha,
                    hora_inicio,
                    tipo_visita,
                    nombreMascota,
                    asunto,
                    agenda,
                    estado,
                    propietario,
                    telefono
                });

            } catch (error) {
                console.error(`Error procesando fila ${index + 1}:`, error);
            }
        });

        // Ahora creamos los clientes con todas sus citas
        const clientes: Cliente[] = [];
        
        Object.keys(citasPorCliente).forEach(claveCliente => {
            const citas = citasPorCliente[claveCliente];
            if (citas.length === 0) return;
            
            const primeraCita = citas[0];
            const cliente: Cliente = {
                nombre: primeraCita.propietario,
                telefono: primeraCita.telefono,
                mascotas: [],
                mensajes: [],
                status: false,
                // Guardamos la primera cita en los campos existentes (para compatibilidad)
                fechaCita: primeraCita.fecha,
                horaCita: primeraCita.hora_inicio,
                tipoVisita: primeraCita.tipo_visita,
                asunto: primeraCita.asunto,
                agenda: primeraCita.agenda,
                estado: primeraCita.estado,
                // Campo temporal para procesamiento
                todasLasCitas: citas
            };
            
            // Agregar mascotas únicas
            const mascotasUnicas = new Set<string>();
            citas.forEach(cita => {
                if (cita.nombreMascota && cita.nombreMascota.trim() !== '') {
                    mascotasUnicas.add(cita.nombreMascota);
                }
            });
            
            mascotasUnicas.forEach(nombreMascota => {
                cliente.mascotas.push({
                    nombre: nombreMascota,
                    recordatorios: []
                });
            });
            
            clientes.push(cliente);
        });
        
        return clientes;
    }

    // ListCitas para citas - VERSIÓN OPTIMIZADA (FECHA UNA VEZ)
    private ListCitas(clientes: Cliente[], nombreClinica: string) {
        clientes.forEach(cliente => {
            // Verificar si tenemos las citas temporales
            const todasLasCitas = (cliente as any).todasLasCitas;
            if (!todasLasCitas || todasLasCitas.length === 0) {
                return;
            }

            // Verificar si todas las citas son del mismo día
            const primeraFecha = todasLasCitas[0].fecha;
            const mismoDia = todasLasCitas.every((cita: any) => cita.fecha === primeraFecha);
            
            // Agrupar citas por mascota
            const citasPorMascota: { [mascotaNombre: string]: any[] } = {};
            
            todasLasCitas.forEach((cita: any) => {
                if (cita.nombreMascota) {
                    if (!citasPorMascota[cita.nombreMascota]) {
                        citasPorMascota[cita.nombreMascota] = [];
                    }
                    citasPorMascota[cita.nombreMascota].push(cita);
                }
            });

            const mascotasConCitas = Object.keys(citasPorMascota);
            
            if (mascotasConCitas.length === 0) {
                return;
            }

            // Mensaje de saludo
            cliente.mensajes.push(this.createNewMsg(`Hola ${cliente.nombre}.`));

            // Nombre de la clínica
            const nombreClinicaLimpio = this.extraerNombreClinica(nombreClinica);
            
            let mensajeCita;
            
            if (mascotasConCitas.length === 1) {
                const mascotaNombre = mascotasConCitas[0];
                const citasMascota = citasPorMascota[mascotaNombre];
                mensajeCita = `la cita de su mascota '${mascotaNombre}'`;
                mensajeCita += this.listarCitasParaMascota(citasMascota, !mismoDia);
            } else {
                mensajeCita = "las citas de sus mascotas: ";
        
                for (let i = 0; i < mascotasConCitas.length; i++) {
                    const mascotaNombre = mascotasConCitas[i];
                    const citasMascota = citasPorMascota[mascotaNombre];
                    
                    if (i === 0) {
                        mensajeCita += `'${mascotaNombre}'`;
                        mensajeCita += this.listarCitasParaMascota(citasMascota, !mismoDia);
                    } else {
                        if (i === (mascotasConCitas.length - 1)) {
                            mensajeCita += ` y '${mascotaNombre}'`;
                            mensajeCita += this.listarCitasParaMascota(citasMascota, !mismoDia);
                        } else {
                            mensajeCita += `, '${mascotaNombre}'`;
                            mensajeCita += this.listarCitasParaMascota(citasMascota, !mismoDia);
                        }
                    }
                }
            }
            
            // Construir mensaje completo
            let mensajeCompleto = `${nombreClinicaLimpio} le recuerda ${mensajeCita}`;
            
            // Agregar la fecha al final si todas son del mismo día
            if (mismoDia && primeraFecha) {
                mensajeCompleto += ` el día ${primeraFecha}`;
            }
            
            mensajeCompleto += `.\n\n`;
            
            // Si hay múltiples horas, listarlas
            if (todasLasCitas.length > 1) {
                const horasUnicas = new Set<string>();
                todasLasCitas.forEach((cita: any) => {
                    if (cita.hora_inicio) {
                        horasUnicas.add(cita.hora_inicio);
                    }
                });
                
                if (horasUnicas.size > 0) {
                    const horasArray = Array.from(horasUnicas);
                    if (horasArray.length === 1) {
                        mensajeCompleto += `⏰ Hora: ${horasArray[0]}\n`;
                    } else {
                        mensajeCompleto += `⏰ Horas: ${horasArray.join(', ')}\n`;
                    }
                }
            } else if (todasLasCitas[0].hora_inicio) {
                mensajeCompleto += `⏰ Hora: ${todasLasCitas[0].hora_inicio}\n`;
            }
            
            mensajeCompleto += `\nPor favor confirme su asistencia y el serviciocon anticipación.\n\n¡Gracias! 🐾`;
            
            cliente.mensajes.push(this.createNewMsg(mensajeCompleto));
            
            // Eliminar el campo temporal
            delete (cliente as any).todasLasCitas;
        });
    }

    // Listar todas las citas para una mascota
    private listarCitasParaMascota(citas: any[], incluirFecha: boolean = true): string {
        if (citas.length === 0) return '';
        
        if (citas.length === 1) {
            return this.describirCita(citas[0], incluirFecha);
        } else {
            let descripcion = ` tiene ${citas.length} citas: `;
            
            for (let i = 0; i < citas.length; i++) {
                if (i === 0) {
                    descripcion += this.describirCita(citas[i], incluirFecha);
                } else {
                    if (i === (citas.length - 1)) {
                        descripcion += ` y ${this.describirCita(citas[i], incluirFecha, true)}`;
                    } else {
                        descripcion += `, ${this.describirCita(citas[i], incluirFecha, true)}`;
                    }
                }
            }
            
            return descripcion;
        }
    }

    // Describir una cita individual
    private describirCita(cita: any, incluirFecha: boolean = true, esSegundaOMas: boolean = false): string {
        let descripcion = '';
        
        // Ajustar la gramática según si es la primera cita o no
        if (esSegundaOMas) {
            // Para citas después de la primera
            if (cita.tipo_visita.toLowerCase().startsWith('para ')) {
                descripcion += cita.tipo_visita;
            } else {
                descripcion += `para ${cita.tipo_visita}`;
            }
        } else {
            // Para la primera cita
            descripcion += ` para ${cita.tipo_visita}`;
        }
        
        if (cita.asunto) {
            descripcion += ` (${cita.asunto})`;
        }
        
        if (incluirFecha && cita.fecha) {
            descripcion += ` el ${cita.fecha}`;
        }
        
        if (cita.hora_inicio) {
            // Solo agregar "a las" si no es una cita después de la primera
            if (!esSegundaOMas || descripcion.includes(' el ')) {
                descripcion += ` a las ${cita.hora_inicio}`;
            } else {
                descripcion += ` ${cita.hora_inicio}`;
            }
        }
        
        return descripcion;
    }

    //****************************************************
    //******************    Helper    ********************
    //****************************************************

    // Extraer solo el nombre de la clínica sin "Clínica Veterinaria"
    private extraerNombreClinica(nombreCompleto: string): string {
        if (!nombreCompleto) return '';
        
        let nombre = nombreCompleto.trim();
        
        // Quitar "Clínica Veterinaria" si está al inicio
        const prefijos = [
            'Clínica Veterinaria ',
            'La clínica veterinaria ',
            'la clínica veterinaria '
        ];
        
        for (const prefijo of prefijos) {
            if (nombre.toLowerCase().startsWith(prefijo.toLowerCase())) {
                nombre = nombre.substring(prefijo.length);
                break;
            }
        }
        
        return nombre;
    }

    // Crear nuevo mensaje
    private createNewMsg(contenido: string): Mensaje {
        return {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contenido: contenido,
            timestamp: new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            esPropio: true
        };
    }

    // Formatear texto a formato Oración
    private formatString(cadena: string): string {
        if (!cadena || cadena.trim() === '') {
            return '';
        }
        
        let oracion = cadena.replace(/[-_]/g, " ");
        let palabras = oracion.toLowerCase().split(" ")
            .map((palabra) => {
                return palabra.charAt(0).toUpperCase() + palabra.slice(1);
            });
            
        return palabras.join(" ");
    }

    // Extraer solo números
    private formatNumbers(cadena: string): string {
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
    }

    // Formatear fecha larga
    private formatDateLong(date: string): string {
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
    }
}

export default new remindersData();