import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExcelTemplate, TemplateHeader } from '../types/reminders';

const TEMPLATES_KEY = 'excel_templates';
const TEMPLATE_SELECCIONADO_KEY = 'template_seleccionado';

class remindersData {
    // Plantillas predefinidas
    private templatesPredefinidos: ExcelTemplate[] = [
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
            mensajeTemplate: `Hola {cliente}.

                La clínica veterinaria Baalak le informa sobre el cuidado de {mascota}.

                Tiene pendiente la aplicación de {tipo_recordatorio} ({vacuna}) para el {fecha_proxima_formatted}.

                Por favor confirme su asistencia.

                ¡Gracias por confiar en nosotros! 🐾`,
            variablesDisponibles: [
                'cliente', 'telefono', 'mascota', 'tipo_recordatorio', 
                'vacuna', 'fecha_proxima', 'fecha_proxima_formatted'
            ],
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString()
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
                    nombre: 'TIPOVISITA',
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
                    nombre: 'TELEFONO',
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
            mensajeTemplate: `Hola {propietario}.

                Recordatorio de cita para {mascota}.

                📅 Fecha: {fecha_formatted}
                ⏰ Hora: {hora_inicio}
                👨‍⚕️ Tipo: {tipo_visita}
                📝 Asunto: {asunto}
                👤 Agenda: {agenda}

                Estado: {estado}

                Por favor confirme su asistencia con anticipación.

                ¡Gracias! 🐾`,
            variablesDisponibles: [
                'fecha', 'fecha_formatted', 'hora_inicio', 'tipo_visita',
                'propietario', 'mascota', 'telefono', 'asunto', 'agenda', 'estado'
            ],
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString()
        }
    ];

    // Obtener todas las plantillas
    async obtenerTemplates(): Promise<ExcelTemplate[]> {
        try {
            const templatesGuardados = await AsyncStorage.getItem(TEMPLATES_KEY);
        
            if (templatesGuardados) {
                const parsed = JSON.parse(templatesGuardados);
                // Combinar con predefinidos, dando prioridad a los guardados
                const todosTemplates = [...this.templatesPredefinidos];
                
                parsed.forEach((template: ExcelTemplate) => {
                    const index = todosTemplates.findIndex(t => t.id === template.id);
                    if (index !== -1) {
                        todosTemplates[index] = template;
                    } else {
                        todosTemplates.push(template);
                    }
                });
                
                return todosTemplates;
            }
        
            return this.templatesPredefinidos;
        } catch (error) {
            console.error('Error obteniendo templates:', error);
            return this.templatesPredefinidos;
        }
    }

    // Obtener template por ID
    async obtenerTemplate(id: string): Promise<ExcelTemplate | null> {
        const templates = await this.obtenerTemplates();
        return templates.find(t => t.id === id) || null;
    }

    // Guardar template
    async guardarTemplate(template: ExcelTemplate): Promise<boolean> {
        try {
            const templates = await this.obtenerTemplates();
            const index = templates.findIndex(t => t.id === template.id);
        
            if (index !== -1) {
                templates[index] = {
                    ...template,
                    fechaActualizacion: new Date().toISOString()
                };
            } else {
                templates.push({
                    ...template,
                    id: template.id || `template_${Date.now()}`,
                    fechaCreacion: new Date().toISOString(),
                    fechaActualizacion: new Date().toISOString()
                });
            }
        
            await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
            return true;
        } catch (error) {
            console.error('Error guardando template:', error);
            return false;
        }
    }

    // Eliminar template
    async eliminarTemplate(id: string): Promise<boolean> {
        try {
            const templates = await this.obtenerTemplates();
            const filtrados = templates.filter(t => t.id !== id);
            
            // No permitir eliminar templates predefinidos
            const template = templates.find(t => t.id === id);
            if (template?.tipo === 'vacunas' || template?.tipo === 'citas') {
                return false;
            }
        
            await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtrados));
            return true;
        } catch (error) {
            console.error('Error eliminando template:', error);
            return false;
        }
    }

    // Obtener template seleccionado
    async obtenerTemplateSeleccionado(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(TEMPLATE_SELECCIONADO_KEY);
        } catch (error) {
            console.error('Error obteniendo template seleccionado:', error);
            return null;
        }
    }

    // Guardar template seleccionado
    async guardarTemplateSeleccionado(templateId: string): Promise<boolean> {
        try {
            await AsyncStorage.setItem(TEMPLATE_SELECCIONADO_KEY, templateId);
            return true;
        } catch (error) {
            console.error('Error guardando template seleccionado:', error);
            return false;
        }
    }

    // Crear template personalizado
    async crearTemplatePersonalizado(
        nombre: string,
        descripcion: string,
        encabezados: TemplateHeader[],
        mensajeTemplate: string
    ): Promise<ExcelTemplate> {
        const nuevoTemplate: ExcelTemplate = {
            id: `personalizado_${Date.now()}`,
            nombre,
            tipo: 'personalizado',
            descripcion,
            activo: true,
            encabezados,
            mensajeTemplate,
            variablesDisponibles: encabezados.map(h => h.variable),
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString()
        };
        
        await this.guardarTemplate(nuevoTemplate);
        return nuevoTemplate;
    }

    // Procesar datos de Excel según template
    procesarDatosConTemplate(
        datos: any[][],
        template: ExcelTemplate
    ): { cliente: any; variables: Record<string, string> }[] {
            if (!datos || datos.length === 0) {
            return [];
        }

        const encabezadosExcel = datos[0];
        const filasDatos = datos.slice(1);
        
        // Validar encabezados
        const encabezadosRequeridos = template.encabezados.filter(h => h.requerido);
        
        for (const encabezadoRequerido of encabezadosRequeridos) {
            const existe = encabezadosExcel.some((enc: string) => 
                enc?.toString().trim().toUpperCase() === encabezadoRequerido.nombre.toUpperCase()
            );
        
            if (!existe) {
                throw new Error(`Falta encabezado requerido: ${encabezadoRequerido.nombre}`);
            }
        }

        // Procesar cada fila
        return filasDatos.map((fila, index) => {
            const variables: Record<string, string> = {};
        
            // Mapear cada columna a su variable
            template.encabezados.forEach(encabezado => {
                const colIndex = encabezadosExcel.findIndex((enc: string) => 
                    enc?.toString().trim().toUpperCase() === encabezado.nombre.toUpperCase()
                );
                
                if (colIndex !== -1 && fila[colIndex] !== undefined) {
                    let valor = fila[colIndex]?.toString().trim() || '';
                
                    // Aplicar formato según tipo
                    if (encabezado.tipo === 'fecha' && valor) {
                        variables[`${encabezado.variable}_formatted`] = this.formatearFecha(
                            valor, 
                            encabezado.formatoFecha
                        );
                    }
                    
                    variables[encabezado.variable] = valor;
                }
            });

            // Obtener datos principales para el cliente
            const nombreCliente = variables['cliente'] || variables['propietario'] || `Cliente ${index + 1}`;
            const telefono = variables['telefono'] || '';
        
            return {
                cliente: {
                    id: `cliente_${Date.now()}_${index}`,
                    nombre: nombreCliente,
                    telefono: this.limpiarTelefono(telefono),
                    mascotas: variables['mascota'] ? [
                        {
                            nombre: variables['mascota'],
                            recordatorios: []
                        }
                    ] : [],
                    mensajes: [],
                    status: false
                },
                variables
            };
        });
    }

    // Generar mensaje con template y variables
    generarMensajeConTemplate(
        template: ExcelTemplate,
        variables: Record<string, string>
    ): string {
        let mensaje = template.mensajeTemplate;
        
        // Reemplazar variables en el mensaje
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            mensaje = mensaje.replace(regex, value);
        });
        
        // Limpiar variables no utilizadas
        mensaje = mensaje.replace(/\{[^}]+\}/g, '');
        
        return mensaje;
    }

    // Helper: Formatear fecha
    private formatearFecha(fechaStr: string, formato?: string): string {
        try {
            const fecha = new Date(fechaStr);
            if (isNaN(fecha.getTime())) {
                return fechaStr;
            }
        
            if (formato === 'DD/MM/YYYY') {
                return fecha.toLocaleDateString('es-ES');
            }
        
            // Formato por defecto: texto completo
            return fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return fechaStr;
        }
    }

    // Helper: Limpiar teléfono
    private limpiarTelefono(telefono: string): string {
        const clean = telefono.replace(/\D/g, '');
        
        if (clean.startsWith('521')) {
            return clean;
        } else if (clean.length === 10) {
            return '521' + clean;
        } else if (clean.length === 12 && clean.startsWith('52')) {
            return clean;
        }
        
        return clean;
    }

    validarTemplateCompleto(template: ExcelTemplate): { valido: boolean; errores: string[] } {
        const errores: string[] = [];

        // Validar nombre
        if (!template.nombre || template.nombre.trim().length < 3) {
            errores.push('El nombre debe tener al menos 3 caracteres');
        }

        // Validar encabezados
        if (template.encabezados.length === 0) {
            errores.push('Debe tener al menos un encabezado');
        }

        // Validar que haya encabezados requeridos
        const tieneRequeridos = template.encabezados.some(h => h.requerido);
        if (!tieneRequeridos) {
            errores.push('Debe tener al menos un campo requerido');
        }

        // Validar encabezados duplicados
        const nombresEncabezados = template.encabezados.map(h => h.nombre.toUpperCase());
        const duplicadosEncabezados = nombresEncabezados.filter((item, index) => 
            nombresEncabezados.indexOf(item) !== index
        );
        if (duplicadosEncabezados.length > 0) {
            errores.push(`Encabezados duplicados: ${duplicadosEncabezados.join(', ')}`);
        }

        // Validar variables duplicadas
        const variables = template.encabezados.map(h => h.variable.toLowerCase());
        const variablesDuplicadas = variables.filter((item, index) => 
            variables.indexOf(item) !== index
        );

        if (variablesDuplicadas.length > 0) {
            errores.push(`Variables duplicadas: ${variablesDuplicadas.join(', ')}`);
        }

        // Validar formato de variables
        const variablesInvalidas = template.encabezados.filter(h => 
            !/^[a-z][a-z0-9_]*$/.test(h.variable)
        );
    
        if (variablesInvalidas.length > 0) {
            errores.push(`Variables inválidas (solo minúsculas, números y _): ${
                variablesInvalidas.map(h => h.variable).join(', ')
            }`);
        }

        // Validar mensaje template
        if (!template.mensajeTemplate || template.mensajeTemplate.trim().length < 10) {
            errores.push('El mensaje debe tener al menos 10 caracteres');
        }

        // Validar variables usadas en mensaje
        const regex = /\{([^}]+)\}/g;
        const variablesUsadas = new Set<string>();
        let match;
        
        while ((match = regex.exec(template.mensajeTemplate)) !== null) {
            variablesUsadas.add(match[1]);
        }

        const variablesDisponibles = new Set(template.variablesDisponibles);
        const variablesNoDefinidas = Array.from(variablesUsadas).filter(v => 
            !variablesDisponibles.has(v)
        );
    
        if (variablesNoDefinidas.length > 0) {
            errores.push(`Variables no definidas en el mensaje: ${variablesNoDefinidas.join(', ')}`);
        }

        // Validar que todas las variables requeridas estén definidas
        const variablesRequeridas = template.encabezados
        .filter(h => h.requerido)
        .map(h => h.variable);
        
        const variablesFaltantes = variablesRequeridas.filter(v => 
            !variablesUsadas.has(v)
        );
    
        if (variablesFaltantes.length > 0) {
            errores.push(`Variables requeridas no usadas en el mensaje: ${variablesFaltantes.join(', ')}`);
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    // Generar datos de ejemplo para previsualización
    generarDatosEjemplo(template: ExcelTemplate): Record<string, string> {
        const datos: Record<string, string> = {};
    
        template.encabezados.forEach(encabezado => {
            let valorEjemplo = '';
      
            switch (encabezado.tipo) {
                case 'texto':
                valorEjemplo = encabezado.ejemplo || 'Ejemplo';
                break;
          
                case 'numero':
                valorEjemplo = encabezado.ejemplo || '123';
                break;
          
                case 'telefono':
                valorEjemplo = encabezado.ejemplo || '5551234567';
                break;
          
                case 'fecha':
                if (encabezado.formatoFecha === 'YYYY-MM-DD') {
                    valorEjemplo = '2024-12-15';
                } else if (encabezado.formatoFecha === 'DD/MM/YYYY') {
                    valorEjemplo = '15/12/2024';
                } else {
                    valorEjemplo = '15-12-2024';
                }
                break;
            }
      
            datos[encabezado.variable] = valorEjemplo;
      
            // Agregar versión formateada para fechas
            if (encabezado.tipo === 'fecha') {
                datos[`${encabezado.variable}_formatted`] = this.formatearFecha(
                    valorEjemplo,
                    encabezado.formatoFecha
                );
            }
        });
    
        return datos;
    }

    // Previsualizar mensaje con datos de ejemplo
    previsualizarMensaje(template: ExcelTemplate): string {
        const datosEjemplo = this.generarDatosEjemplo(template);
        return this.generarMensajeConTemplate(template, datosEjemplo);
    }

    // Validar datos de Excel contra template
    validarDatosExcel(datos: any[][], template: ExcelTemplate): { 
        valido: boolean; 
        errores: string[];
        detalles: Record<string, any>;
    } {
        const errores: string[] = [];
        const detalles: Record<string, any> = {
            totalFilas: datos.length - 1, // Excluyendo encabezados
            encabezadosEncontrados: [],
            encabezadosFaltantes: [],
            filasValidas: 0,
            filasInvalidas: 0
        };

        if (datos.length === 0) {
            errores.push('El archivo Excel está vacío');
            return { valido: false, errores, detalles };
        }

        // Obtener encabezados del Excel
            const encabezadosExcel = datos[0].map((enc: any) => 
            enc?.toString().trim().toUpperCase()
        );
    
        detalles.encabezadosEncontrados = encabezadosExcel;

        // Validar encabezados requeridos
        const encabezadosRequeridos = template.encabezados
        .filter(h => h.requerido)
        .map(h => h.nombre.toUpperCase());

        const encabezadosFaltantes = encabezadosRequeridos.filter(requerido => 
            !encabezadosExcel.includes(requerido)
        );
    
        detalles.encabezadosFaltantes = encabezadosFaltantes;

        if (encabezadosFaltantes.length > 0) {
            errores.push(`Encabezados faltantes: ${encabezadosFaltantes.join(', ')}`);
        }

        // Validar tipos de datos en cada fila
        const filasDatos = datos.slice(1);
    
        filasDatos.forEach((fila, index) => {
            let filaValida = true;
            const erroresFila: string[] = [];

            template.encabezados.forEach(encabezado => {
                const colIndex = encabezadosExcel.findIndex(enc => 
                    enc === encabezado.nombre.toUpperCase()
                );
            
                if (colIndex !== -1) {
                    const valor = fila[colIndex]?.toString().trim() || '';
            
                    // Validar según tipo
                    switch (encabezado.tipo) {
                        case 'telefono':
                        const soloNumeros = valor.replace(/\D/g, '');
                        if (valor && soloNumeros.length < 10) {
                            filaValida = false;
                            erroresFila.push(`${encabezado.alias}: teléfono inválido`);
                        }
                        break;
                            
                        case 'numero':
                        if (valor && isNaN(Number(valor))) {
                            filaValida = false;
                            erroresFila.push(`${encabezado.alias}: no es un número válido`);
                        }
                        break;
                            
                        case 'fecha':
                        if (valor) {
                            const fecha = new Date(valor);
                            if (isNaN(fecha.getTime())) {
                            filaValida = false;
                            erroresFila.push(`${encabezado.alias}: fecha inválida`);
                            }
                        }
                        break;
                    }
                }
            });

            if (filaValida) {
                detalles.filasValidas++;
            } else {
                detalles.filasInvalidas++;
                if (erroresFila.length > 0) {
                    errores.push(`Fila ${index + 2}: ${erroresFila.join(', ')}`);
                }
            }
        });

        return {
            valido: errores.length === 0,
            errores: errores.slice(0, 10), // Limitar a 10 errores
            detalles
        };
    }

    // Validar encabezado individual
    validarEncabezado(encabezado: TemplateHeader, todosEncabezados: TemplateHeader[]): {
        valido: boolean;
        errores: string[];
        sugerencias: string[];
    } {
        const errores: string[] = [];
        const sugerencias: string[] = [];

        // Validar nombre
        if (!encabezado.nombre || encabezado.nombre.trim().length === 0) {
            errores.push('El nombre del encabezado es requerido');
        } else if (!/^[A-ZÁÉÍÓÚÑ0-9_ ]+$/.test(encabezado.nombre)) {
            errores.push('El nombre debe estar en mayúsculas y sin caracteres especiales');
            sugerencias.push('Usar solo letras mayúsculas, números, espacios y guiones bajos');
        }

        // Validar alias
        if (!encabezado.alias || encabezado.alias.trim().length === 0) {
            errores.push('El nombre para mostrar es requerido');
        }

        // Validar variable
        if (!encabezado.variable || encabezado.variable.trim().length === 0) {
            errores.push('La variable es requerida');
        } else if (!/^[a-z][a-z0-9_]*$/.test(encabezado.variable)) {
            errores.push('La variable debe empezar con minúscula y solo contener letras, números y _');
            sugerencias.push('Ejemplos válidos: cliente, telefono_1, fecha_nacimiento');
        }

        // Verificar duplicados
        const mismoNombre = todosEncabezados.filter(h => 
            h.nombre.toUpperCase() === encabezado.nombre.toUpperCase()
        );
    
        if (mismoNombre.length > 1) {
            errores.push(`El nombre "${encabezado.nombre}" ya está usado`);
        }

        const mismaVariable = todosEncabezados.filter(h => 
            h.variable.toLowerCase() === encabezado.variable.toLowerCase()
        );
        
        if (mismaVariable.length > 1) {
            errores.push(`La variable "${encabezado.variable}" ya está usada`);
        }

        // Sugerencias según tipo
        switch (encabezado.tipo) {
            case 'fecha':
                if (!encabezado.formatoFecha) {
                    sugerencias.push('Para fechas, especificar formato: YYYY-MM-DD, DD/MM/YYYY o DD-MM-YYYY');
                }
                break;
                
            case 'telefono':
                sugerencias.push('Los teléfonos se limpiarán automáticamente (quitar espacios, guiones)');
            break;
        }

        return {
            valido: errores.length === 0,
            errores,
            sugerencias
        };
    }

    // Sugerir variable basada en nombre
    sugerirVariable(nombre: string): string {
        // Convertir a minúsculas y reemplazar espacios/acentos
        let variable = nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9 ]/g, '') // Quitar caracteres especiales
        .replace(/\s+/g, '_'); // Reemplazar espacios con _
        
        // Asegurar que empiece con letra
        if (!/^[a-z]/.test(variable)) {
            variable = 'campo_' + variable;
        }
        
        return variable;
    }
}

export default new remindersData();