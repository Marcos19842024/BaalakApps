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

    // Mapeo de códigos y términos a texto legible
    private readonly serviciosMap: { [key: string]: string } = {
        // Transporte
        'transporte de clínica': 'transporte',
        'transporte': 'transporte',
        
        // Consultas
        'consulta': 'consulta',
        'consulta nocturna': 'consulta nocturna',
        'consulta festivos': 'consulta en festivos',
        'urgencias': 'urgencias',
        
        // Seguimiento y control
        'seguimiento': 'seguimiento',
        'control sin costo': 'control sin costo',
        'control sc': 'control sin costo',
        'seguimiento sct': 'seguimiento',
        
        // Medicina preventiva
        'medicina preventiva': 'medicina preventiva',
        'vacunación': 'vacunación',
        'desparasitación': 'desparasitación',
        
        // Hospitalización y cirugía
        'hospitalización': 'hospitalización',
        'cirugía': 'cirugía',
        'procedimiento': 'procedimiento',
        
        // Diagnóstico
        'análisis clínicos': 'análisis clínicos',
        'rx-us': 'radiografía y ultrasonido',
        'rx': 'radiografía',
        'us': 'ultrasonido',
        'radiografía - us': 'radiografía y ultrasonido',
        'radiografía': 'radiografía',
        'ultrasonido': 'ultrasonido',
        
        // Tratamientos
        'tratamiento': 'tratamiento',
        'láser': 'láser terapia',
        'láser terapia': 'láser terapia',
        'fisioterapia': 'fisioterapia',
        
        // Documentos
        'certificado médico': 'certificado médico',
        
        // Servicio FCM
        'servicio fcm': 'servicio FCM',
        'fcm': 'servicio FCM',
        
        // Términos quirúrgicos comunes en asunto
        'castración': 'castración',
        'ovh': 'OVH (esterilización)',
        'esterilización': 'esterilización',
        'eutanasia': 'eutanasia'
    };

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
            let mensaje: string;
            
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
                const asunto = cell[6]?.toString() || '';
                const agenda = this.formatString(cell[7]?.toString() || '');
                const estado = cell[8]?.toString() || '';

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
            
            let mensajeCita: string;
            
            if (mascotasConCitas.length === 1) {
                const mascotaNombre = mascotasConCitas[0];
                const citasMascota = citasPorMascota[mascotaNombre];
                mensajeCita = `la cita de su mascota '${mascotaNombre}' `;
                mensajeCita += this.listarCitasParaMascota(citasMascota, !mismoDia);
            } else {
                mensajeCita = "las citas de sus mascotas: ";
        
                for (let i = 0; i < mascotasConCitas.length; i++) {
                    const mascotaNombre = mascotasConCitas[i];
                    const citasMascota = citasPorMascota[mascotaNombre];
                    
                    if (i === 0) {
                        mensajeCita += `'${mascotaNombre}' `;
                        mensajeCita += this.listarCitasParaMascota(citasMascota, !mismoDia);
                    } else {
                        if (i === (mascotasConCitas.length - 1)) {
                            mensajeCita += ` y '${mascotaNombre}' `;
                            mensajeCita += this.listarCitasParaMascota(citasMascota, !mismoDia);
                        } else {
                            mensajeCita += `, '${mascotaNombre}' `;
                            mensajeCita += this.listarCitasParaMascota(citasMascota, !mismoDia);
                        }
                    }
                }
            }
            
            // Construir mensaje completo
            let mensajeCompleto = `${nombreClinicaLimpio} le recuerda ${mensajeCita}`;
            
            // CORREGIDO: Usar formatFechaParaMensaje correctamente
            if (mismoDia && primeraFecha) {
                const fechaFormateada = this.formatFechaParaMensaje(primeraFecha);
                mensajeCompleto += ` ${fechaFormateada}`;
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
            
            mensajeCompleto += `\nPor favor confirme su asistencia y el servicio con anticipación.\n\n¡Gracias! 🐾`;
            
            console.log(`Mensaje final: "${mensajeCompleto}"`);
            
            cliente.mensajes.push(this.createNewMsg(mensajeCompleto));
            
            // Eliminar el campo temporal
            delete (cliente as any).todasLasCitas;
        });
    }

    //****************************************************
    //*************   Procesador de Servicios   **********
    //****************************************************

    // Procesar los campos de servicio para generar texto legible
    private procesarServicio(tipoVisita: string, asunto: string, estado: string): string {
        const servicios: string[] = [];
        
        // 1. Primero, verificar si el asunto contiene términos quirúrgicos específicos
        const asuntoLower = asunto.toLowerCase();
        const terminosQuirurgicos = ['castración', 'ovh', 'esterilización', 'eutanasia'];
        const terminoQuirurgico = terminosQuirurgicos.find(term => asuntoLower.includes(term));
        
        if (terminoQuirurgico) {
            return this.serviciosMap[terminoQuirurgico] || terminoQuirurgico;
        }
        
        // 2. Procesar según el tipo de visita
        const tipoLower = tipoVisita.toLowerCase().trim();
        
        // Casos especiales que necesitan combinación de campos
        if (tipoLower.includes('peluquer') || tipoLower.includes('estética')) {
            return this.procesarServicioEstetica(asunto, estado);
        }
        
        // 3. Para otros tipos, combinar información de todos los campos
        const camposParaAnalizar = [
            tipoVisita,
            estado,
            asunto
        ];
        
        // Buscar servicios en todos los campos
        camposParaAnalizar.forEach(campo => {
            if (!campo || campo.trim() === '') return;
            
            const campoLower = campo.toLowerCase();
            
            // Buscar coincidencias en el mapa de servicios
            Object.keys(this.serviciosMap).forEach(key => {
                // Buscar la key completa o palabras clave
                if (campoLower.includes(key.toLowerCase())) {
                    const servicio = this.serviciosMap[key];
                    if (!servicios.includes(servicio)) {
                        servicios.push(servicio);
                    }
                }
            });
            
            // También buscar términos compuestos (ej: "rx y us")
            if (campoLower.includes('rx') && campoLower.includes('us')) {
                if (!servicios.includes('radiografía y ultrasonido')) {
                    servicios.push('radiografía y ultrasonido');
                }
            }
        });
        
        // 4. Si no se encontraron servicios, devolver el tipo de visita formateado
        if (servicios.length === 0) {
            return this.formatString(tipoVisita);
        }
        
        // 5. Construir el texto final
        return this.combinarServicios(servicios);
    }

    // Procesar servicios de estética (peluquería)
    private procesarServicioEstetica(asunto: string, estado: string): string {
        // Combinar asunto y estado para análisis
        const textoCompleto = `${asunto} ${estado}`.toLowerCase();
        const servicios: string[] = [];
        
        // Detectar servicios de estética
        const tieneB = textoCompleto.includes('b') && !textoCompleto.includes('bm') && !textoCompleto.includes('baño');
        const tieneBaño = textoCompleto.includes('baño') && !textoCompleto.includes('medicado');
        const tieneBM = textoCompleto.includes('bm') || textoCompleto.includes('baño medicado');
        const tieneCP = textoCompleto.includes('cp') || textoCompleto.includes('corte');
        const tieneTransporte = textoCompleto.includes('transporte');
        
        // Construir la lista de servicios
        if (tieneCP) servicios.push('corte');
        if (tieneB || tieneBaño) servicios.push('baño');
        if (tieneBM) servicios.push('baño medicado');
        if (tieneTransporte) servicios.push('transporte');
        
        // Si no se detectaron servicios específicos pero hay texto, procesar normalmente
        if (servicios.length === 0) {
            return this.procesarTextoGenerico(textoCompleto);
        }
        
        return this.combinarServicios(servicios);
    }

    // Procesar texto genérico (cuando no hay servicios detectados)
    private procesarTextoGenerico(texto: string): string {
        if (!texto || texto.trim() === '') return '';
        
        // Dividir por comas, guiones o espacios y limpiar
        const partes = texto.split(/[, \-_]+/)
            .map(p => p.trim())
            .filter(p => p.length > 0 && p !== 'cp' && p !== 'bm' && p !== 'b');
        
        if (partes.length === 0) return '';
        
        // Mapear partes a servicios conocidos
        const servicios = partes.map(parte => {
            const parteLower = parte.toLowerCase();
            // Buscar en el mapa de servicios
            for (const [key, value] of Object.entries(this.serviciosMap)) {
                if (parteLower.includes(key.toLowerCase())) {
                    return value;
                }
            }
            // Si no se encuentra, capitalizar la parte
            return this.formatString(parte);
        });
        
        // Filtrar duplicados
        const serviciosUnicos = [...new Set(servicios)];
        
        return this.combinarServicios(serviciosUnicos);
    }

    // Combinar lista de servicios en texto legible
    private combinarServicios(servicios: string[]): string {
        if (servicios.length === 0) return '';
        
        // Eliminar duplicados y ordenar
        const unicos = [...new Set(servicios)];
        
        if (unicos.length === 1) {
            return unicos[0];
        } else if (unicos.length === 2) {
            return `${unicos[0]} y ${unicos[1]}`;
        } else {
            const ultimo = unicos.pop();
            return `${unicos.join(', ')} y ${ultimo}`;
        }
    }

    // Listar todas las citas para una mascota
    private listarCitasParaMascota(citas: any[], incluirFecha: boolean = true): string {
        if (citas.length === 0) return '';
        
        if (citas.length === 1) {
            return this.describirCita(citas[0], incluirFecha);
        } else {
            let descripcion = ` tiene ${citas.length} citas programadas: `;
            
            for (let i = 0; i < citas.length; i++) {
                const servicio = this.procesarServicio(
                    citas[i].tipo_visita, 
                    citas[i].asunto, 
                    citas[i].estado
                );
                
                if (i === 0) {
                    descripcion += this.construirDescripcionCita(citas[i], servicio, incluirFecha, false);
                } else {
                    if (i === (citas.length - 1)) {
                        descripcion += ` y ${this.construirDescripcionCita(citas[i], servicio, incluirFecha, true)}`;
                    } else {
                        descripcion += `, ${this.construirDescripcionCita(citas[i], servicio, incluirFecha, true)}`;
                    }
                }
            }
            
            return descripcion;
        }
    }

    // Describir una cita individual
    private describirCita(cita: any, incluirFecha: boolean = true): string {
        const servicio = this.procesarServicio(
            cita.tipo_visita, 
            cita.asunto, 
            cita.estado
        );
        
        return this.construirDescripcionCita(cita, servicio, incluirFecha, false);
    }

    // Construir la descripción de la cita
    private construirDescripcionCita(
        cita: any, 
        servicio: string, 
        incluirFecha: boolean,
        esSegundaOMas: boolean
    ): string {
        let descripcion = '';
        
        const tipoVisitaBase = cita.tipo_visita.toLowerCase();
        const esEstetica = tipoVisitaBase.includes('peluquer') || tipoVisitaBase.includes('estética');
    
        if (esEstetica) {
            // Para estética, mostramos el servicio procesado
            if (esSegundaOMas) {
                descripcion += servicio;
            } else {
                descripcion += `para ${servicio}`;
            }
        } else {
            // Para otros tipos, determinamos si necesitamos mostrar el tipo de visita
            const tipoFormateado = this.formatString(cita.tipo_visita);
            
            // Verificar si el servicio ya incluye el tipo de visita
            if (servicio.toLowerCase().includes(tipoVisitaBase)) {
                // El servicio ya contiene el tipo, no lo repetimos
                if (esSegundaOMas) {
                    descripcion += servicio;
                } else {
                    descripcion += `para ${servicio}`;
                }
            } else {
                // El servicio es diferente al tipo, mostramos ambos
                if (servicio) {
                    if (esSegundaOMas) {
                        descripcion += `${tipoFormateado} (${servicio})`;
                    } else {
                        descripcion += `para ${tipoFormateado} (${servicio})`;
                    }
                } else {
                    if (esSegundaOMas) {
                        descripcion += tipoFormateado;
                    } else {
                        descripcion += `para ${tipoFormateado}`;
                    }
                }
            }
        }
        
        // CORREGIDO: Usar formatFechaParaMensaje correctamente
        if (incluirFecha && cita.fecha) {
            descripcion += ` ${this.formatFechaParaMensaje(cita.fecha)}`;
        }
        
        if (cita.hora_inicio) {
            if (!esSegundaOMas || descripcion.includes('el día') || descripcion.includes('mañana')) {
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
    
        let dateObject: Date;
    
        // Si la fecha ya está en formato texto español, intentar parsearla
        if (date.includes(' de ')) {
            const meses: { [key: string]: number } = {
                'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
                'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
                'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
            };
            
            const partes = date.split(' de ');
            if (partes.length === 3) {
                const day = parseInt(partes[0]);
                const monthName = partes[1].toLowerCase();
                const year = parseInt(partes[2]);
                const month = meses[monthName];
                
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    dateObject = new Date(year, month, day);
                    // Devolver en formato largo español
                    return date;
                }
            }
        }
        
        // Si la fecha está en formato ISO (YYYY-MM-DD)
        if (date.includes('-')) {
            const [year, month, day] = date.split('-').map(Number);
            dateObject = new Date(year, month - 1, day);
        } 
        // Si la fecha está en formato DD/MM/YYYY
        else if (date.includes('/')) {
            const [day, month, year] = date.split('/').map(Number);
            dateObject = new Date(year, month - 1, day);
        }
        // Otros formatos
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

    private esManana(fechaStr: string): boolean {
        if (!fechaStr) return false;
    
        try {
            
            // Parsear la fecha - manejar diferentes formatos
            let fechaCita: Date;
            
            if (fechaStr.includes('-')) {
                // Formato ISO: YYYY-MM-DD
                const [year, month, day] = fechaStr.split('-').map(Number);
                fechaCita = new Date(year, month - 1, day);
            } else if (fechaStr.includes('/')) {
                // Formato DD/MM/YYYY
                const [day, month, year] = fechaStr.split('/').map(Number);
                fechaCita = new Date(year, month - 1, day);
            } else if (fechaStr.includes(' de ')) {
                // Formato: "21 de marzo de 2026"
                const meses: { [key: string]: number } = {
                    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
                    'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
                    'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
                };
                
                const partes = fechaStr.split(' de ');
                if (partes.length === 3) {
                    const day = parseInt(partes[0]);
                    const monthName = partes[1].toLowerCase();
                    const year = parseInt(partes[2]);
                    const month = meses[monthName];
                    
                    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                        fechaCita = new Date(year, month, day);
                    }
                }
            } else {
                fechaCita = new Date(fechaStr);
                if (!isNaN(fechaCita.getTime())) {
                    fechaCita.setMinutes(fechaCita.getMinutes() + fechaCita.getTimezoneOffset());
                }
            }
            
            if (!fechaCita || isNaN(fechaCita.getTime())) {
                return false;
            }
            
            // Obtener fecha actual (sin hora)
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            
            // Resetear la hora de la fecha de cita para comparar solo días
            fechaCita.setHours(0, 0, 0, 0);
            
            // Calcular la diferencia en días
            const diffTime = fechaCita.getTime() - hoy.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays === 1;
        } catch (error) {
            return false;
        }
    }

    // Formatear fecha para mostrar (usa "mañana" si corresponde)
    private formatFechaParaMensaje(fechaStr: string): string {
        if (this.esManana(fechaStr)) {
            return "mañana";
        }
        return `el día ${this.formatDateLong(fechaStr)}`;
    }
}

export default new remindersData();