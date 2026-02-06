import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const SUPABASE_URL = 'https://dntqgvxgoedjnkohzpan.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudHFndnhnb2Vkam5rb2h6cGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQxMTMsImV4cCI6MjA4NTkwMDExM30.urriGgvSj9ldjcKbZ5CY9aeFZ7f-VenLY2ceaNtuVX8';

// Verificar credenciales
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Faltan credenciales de Supabase');
    console.log('🔧 Configura tu archivo supabaseConfig.js con:');
    console.log('1. Ve a https://app.supabase.com');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a Settings → API');
    console.log('4. Copia:');
    console.log('   - Project URL → SUPABASE_URL');
    console.log('   - anon public → SUPABASE_ANON_KEY');
}

// Crear cliente Supabase
let supabase;

try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
    console.log('✅ Supabase configurado correctamente');
} catch (error) {
    console.error('❌ Error creando cliente Supabase:', error);
    supabase = null;
}

export default supabase;