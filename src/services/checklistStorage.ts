import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChecklistData } from '../types/checklist';
import { SucursalType } from 'src/types/sucursal';

const STORAGE_KEYS = {
    DRAFT_PREFIX: 'checklist_draft_',
    LAST_SUCURSAL: 'last_sucursal',
    DRAFT_TIMESTAMP: 'draft_timestamp',
};

// Guardar borrador automáticamente
export const saveDraft = async (
    sucursalKey: SucursalType, 
    data: ChecklistData
): Promise<void> => {
    try {
        const key = `${STORAGE_KEYS.DRAFT_PREFIX}${sucursalKey}`;
        const draftData = {
            ...data,
            _lastSaved: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(key, JSON.stringify(draftData));
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SUCURSAL, sucursalKey);
        await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_TIMESTAMP, Date.now().toString());
        
        console.log(`✅ Borrador guardado para ${sucursalKey}`);
    } catch (error) {
        console.error('Error guardando borrador:', error);
    }
};

// Cargar borrador
export const loadDraft = async (
    sucursalKey: SucursalType
): Promise<ChecklistData | null> => {
    try {
        const key = `${STORAGE_KEYS.DRAFT_PREFIX}${sucursalKey}`;
        const saved = await AsyncStorage.getItem(key);
        
        if (saved) {
            const draft = JSON.parse(saved);
            console.log(`✅ Borrador cargado para ${sucursalKey}`);
            return draft;
        }
    } catch (error) {
        console.error('Error cargando borrador:', error);
    }
    
    return null;
};

// Verificar si existe borrador
export const hasDraft = async (sucursalKey: SucursalType): Promise<boolean> => {
    try {
        const key = `${STORAGE_KEYS.DRAFT_PREFIX}${sucursalKey}`;
        const saved = await AsyncStorage.getItem(key);
        return saved !== null;
    } catch (error) {
        return false;
    }
};

// Eliminar borrador después de guardar exitosamente
export const clearDraft = async (sucursalKey: SucursalType): Promise<void> => {
    try {
        const key = `${STORAGE_KEYS.DRAFT_PREFIX}${sucursalKey}`;
        await AsyncStorage.removeItem(key);
        console.log(`🗑️ Borrador eliminado para ${sucursalKey}`);
    } catch (error) {
        console.error('Error eliminando borrador:', error);
    }
};

// Obtener tiempo desde último guardado
export const getDraftAge = async (sucursalKey: SucursalType): Promise<number | null> => {
    try {
        const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_TIMESTAMP);
        return timestamp ? Date.now() - parseInt(timestamp) : null;
    } catch (error) {
        return null;
    }
};

// Limpiar borradores antiguos (útil para mantenimiento)
export const cleanupOldDrafts = async (maxAgeDays: number = 7): Promise<void> => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const draftKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.DRAFT_PREFIX));
        
        const now = Date.now();
        const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
        
        for (const key of draftKeys) {
            const data = await AsyncStorage.getItem(key);
            if (data) {
                const draft = JSON.parse(data);
                const savedTime = new Date(draft._lastSaved || 0).getTime();
                
                if (now - savedTime > maxAge) {
                    await AsyncStorage.removeItem(key);
                    console.log(`🗑️ Borrador antiguo eliminado: ${key}`);
                }
            }
        }
    } catch (error) {
        console.error('Error limpiando borradores:', error);
    }
};