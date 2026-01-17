import React, { useState, useEffect } from 'react';
import { ChecklistArea, ChecklistAspect, SUCURSALES, SucursalType } from 'src/types/checklist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  getSucursalTemplateAsync,
  addAreaToSucursal,
  removeAreaFromSucursal,
  addAspectoToArea,
  removeAspectoFromArea,
  editAspecto,
  resetSucursalTemplate,
  updateAreaIcon,
  getAreaOrderAsync,
  getAreaIconsAsync,
  initializeCache
} from '../utils/checklistData';
import { stylestemplateManagement } from 'src/styles/templateManagement';

type RouteParams = {
  sucursalKey: SucursalType;
};

export default function TemplateManagementScreen() {
  const route = useRoute();
  const params = route.params as RouteParams;

  const [template, setTemplate] = useState<ChecklistArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showAddAspectoModal, setShowAddAspectoModal] = useState(false);
  const [showEditAspectoModal, setShowEditAspectoModal] = useState(false);
  const [showEditAreaModal, setShowEditAreaModal] = useState(false);
  
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [selectedAspecto, setSelectedAspecto] = useState<ChecklistAspect | null>(null);
  const [selectedSucursal, setSelectedSucursal] = useState<SucursalType>(
    params?.sucursalKey || 'BAALAK_CENTRAL'
  );

  const [newAreaName, setNewAreaName] = useState('');
  const [newAspectoText, setNewAspectoText] = useState('');
  const [newAreaIcon, setNewAreaIcon] = useState('');

  const [editAspectoText, setEditAspectoText] = useState('');
  const [editAreaName, setEditAreaName] = useState('');
  const [editAreaIcon, setEditAreaIcon] = useState('');
  
  const [areaOrder, setAreaOrder] = useState<Record<string, number>>({});
  const [areaIcons, setAreaIcons] = useState<Record<string, string>>({});
  
  const availableIcons = [
    '🚗', '🏬', '💁', '🏥', '🔬', '🩻', '😷', '🐩', '🥣', '📥', 
    '🚶🏼', '🐾', '🚑', '🅿️', '📋', '📝', '🔧', '⚙️', '🧹', '🧼',
    '📊', '✅', '⚠️', '❌', '💡', '🔌', '💧', '🔥', '❄️', '🌡️'
  ];

  // Inicializar cache al cargar la pantalla
  useEffect(() => {
    initializeCache().then(() => {
      loadData();
    });

    // Si recibimos una sucursal por parámetro, seleccionarla
    if (params?.sucursalKey) {
      setSelectedSucursal(params.sucursalKey);
    }
  }, []);

  // Recargar datos cuando cambia la sucursal
  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [selectedSucursal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templateData, orderData, iconsData] = await Promise.all([
        getSucursalTemplateAsync(selectedSucursal),
        getAreaOrderAsync(),
        getAreaIconsAsync()
      ]);
      
      setTemplate(templateData);
      setAreaOrder(orderData);
      setAreaIcons(iconsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los datos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddArea = async () => {
    if (!newAreaName.trim() || !newAreaIcon.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ingrese un nombre para el área y seleccione un ícono',
      });
      return;
    }

    setLoading(true);
    const success = await addAreaToSucursal(selectedSucursal, newAreaName.trim(), [], newAreaIcon.trim());
    
    if (success) {
      await updateAreaIcon(newAreaName.trim(), newAreaIcon);
      Toast.show({
        type: 'success',
        text1: '✅ Área agregada',
        text2: `"${newAreaIcon} ${newAreaName}" agregada a ${SUCURSALES[selectedSucursal]}`,
      });
      setNewAreaName('');
      setNewAreaIcon('');
      setShowAddAreaModal(false);
      await loadData();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El área ya existe o hubo un error',
      });
      setLoading(false);
    }
  };

  const handleRemoveArea = async (areaName: string) => {
    Alert.alert(
      'Eliminar Área',
      `¿Estás seguro de eliminar el área "${areaName}"?\n\nLos aspectos dentro del área también se eliminarán.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const success = await removeAreaFromSucursal(selectedSucursal, areaName);
            
            if (success) {
              Toast.show({
                type: 'success',
                text1: '✅ Área eliminada',
                text2: `"${areaName}" ha sido eliminada`,
              });
              await loadData();
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo eliminar el área',
              });
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddAspecto = async () => {
    if (!newAspectoText.trim() || !selectedArea) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ingrese un aspecto y seleccione un área',
      });
      return;
    }

    setLoading(true);
    const success = await addAspectoToArea(selectedSucursal, selectedArea, newAspectoText.trim());
    
    if (success) {
      Toast.show({
        type: 'success',
        text1: '✅ Aspecto agregado',
        text2: `Aspecto agregado a "${selectedArea}"`,
      });
      setNewAspectoText('');
      setShowAddAspectoModal(false);
      await loadData();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo agregar el aspecto',
      });
      setLoading(false);
    }
  };

  const handleRemoveAspecto = async (areaName: string, aspectoId: string) => {
    Alert.alert(
      'Eliminar Aspecto',
      '¿Estás seguro de eliminar este aspecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            const success = await removeAspectoFromArea(selectedSucursal, areaName, aspectoId);
            
            if (success) {
              Toast.show({
                type: 'success',
                text1: '✅ Aspecto eliminado',
              });
              await loadData();
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo eliminar el aspecto',
              });
            }
          }
        }
      ]
    );
  };

  const handleEditAspecto = async () => {
    if (!selectedAspecto || !editAspectoText.trim()) {
      return;
    }

    const success = await editAspecto(
      selectedSucursal,
      selectedArea,
      selectedAspecto.id,
      editAspectoText.trim()
    );

    if (success) {
      Toast.show({
        type: 'success',
        text1: '✅ Aspecto editado',
        text2: 'El aspecto ha sido actualizado',
      });
      setEditAspectoText('');
      setSelectedAspecto(null);
      setShowEditAspectoModal(false);
      await loadData();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo editar el aspecto',
      });
    }
  };

  const handleResetTemplate = async () => {
    Alert.alert(
      'Restablecer Plantilla',
      `¿Estás seguro de restablecer la plantilla de ${SUCURSALES[selectedSucursal]} a los valores por defecto?\n\nSe perderán todas las modificaciones personalizadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Restablecer', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const success = await resetSucursalTemplate(selectedSucursal);
            
            if (success) {
              Toast.show({
                type: 'success',
                text1: '✅ Plantilla restablecida',
                text2: 'Valores por defecto restaurados',
              });
              await loadData();
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo restablecer la plantilla',
              });
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditArea = () => {
    if (!selectedArea) {
      return;
    }

    Alert.alert(
      'Editar Área',
      `Para editar el nombre del área "${selectedArea}", necesitas:\n\n1. Crear nueva área con nombre "${editAreaName}"\n2. Copiar los aspectos\n3. Eliminar área antigua\n\n¿Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Continuar', 
          onPress: async () => {
            const currentArea = template.find(a => a.area === selectedArea);
            if (!currentArea) return;

            // Crear nueva área
            const success = await addAreaToSucursal(
              selectedSucursal,
              editAreaName.trim(),
              currentArea.aspectos,
              editAreaIcon.trim()
            );

            if (success) {
              
              await updateAreaIcon(editAreaName.trim(), editAreaIcon.trim());
              
              // Eliminar área antigua
              await removeAreaFromSucursal(selectedSucursal, selectedArea);
              
              Toast.show({
                type: 'success',
                text1: '✅ Área editada',
                text2: `"${areaIcons[selectedIcon.trim()] || '📋'} ${selectedArea}" renombrada a "${areaIcons[editAreaIcon.trim()] || '📋'} ${editAreaName}"`,
              });
              
              setEditAreaName('');
              setEditAreaIcon('');
              setSelectedArea('');
              setSelectedIcon('');
              setShowEditAreaModal(false);
              await loadData();
            }
          }
        }
      ]
    );
  };

  const renderAreaItem = ({ item: area }: { item: ChecklistArea, index: number }) => (
    <View style={stylestemplateManagement.areaCard}>
      <View style={stylestemplateManagement.areaHeader}>
        <View style={stylestemplateManagement.areaTitleContainer}>
          <Text style={stylestemplateManagement.areaIcon}>
            {areaIcons[area.area] || '📋'}
          </Text>
          <View>
            <Text style={stylestemplateManagement.areaName}>{area.area}</Text>
            <Text style={stylestemplateManagement.areaInfo}>
              {area.aspectos.length} {area.aspectos.length === 1 ? 'aspecto' : 'aspectos'} • 
              Orden: {areaOrder[area.area] || 99}
            </Text>
          </View>
        </View>

        <View style={stylestemplateManagement.areaActions}>
          <TouchableOpacity
            style={stylestemplateManagement.actionButtonSmall}
            onPress={() => {
              setSelectedArea(area.area);
              setEditAreaName(area.area);
              setEditAreaIcon(areaIcons[area.area] || '');
              setSelectedIcon(areaIcons[area.area] || '');
              setShowEditAreaModal(true);
            }}
          >
            <Icon name="edit" size={18} color="#3B82F6" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={stylestemplateManagement.actionButtonSmall}
            onPress={() => {
              setSelectedArea(area.area);
              setShowAddAspectoModal(true);
            }}
          >
            <Icon name="add" size={18} color="#10B981" />
          </TouchableOpacity>
          
          {area.editable && (
            <TouchableOpacity
              style={stylestemplateManagement.actionButtonSmall}
              onPress={() => handleRemoveArea(area.area)}
            >
              <Icon name="delete" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={stylestemplateManagement.aspectosList}>
        {area.aspectos.map((aspecto, aspectoIndex) => (
          <View key={aspecto.id} style={stylestemplateManagement.aspectoItem}>
            <Text style={stylestemplateManagement.aspectoText}>
              {aspectoIndex + 1}. {aspecto.aspecto}
            </Text>
            {aspecto.editable && (
              <View style={stylestemplateManagement.aspectoActions}>
                <TouchableOpacity
                  style={stylestemplateManagement.aspectoActionButton}
                  onPress={() => {
                    setSelectedArea(area.area);
                    setSelectedAspecto(aspecto);
                    setEditAspectoText(aspecto.aspecto);
                    setShowEditAspectoModal(true);
                  }}
                >
                  <Icon name="edit" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={stylestemplateManagement.aspectoActionButton}
                  onPress={() => handleRemoveAspecto(area.area, aspecto.id)}
                >
                  <Icon name="delete" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>

      {area.aspectos.length === 0 && (
        <Text style={stylestemplateManagement.noAspectosText}>
          No hay aspectos en esta área. Agrega algunos.
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={stylestemplateManagement.container}>
        <View style={stylestemplateManagement.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={stylestemplateManagement.loadingText}>Cargando plantillas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={stylestemplateManagement.container}>
      {/* Información de la sucursal */}
      <View style={stylestemplateManagement.infoCard}>
        <View style={stylestemplateManagement.infoRow}>
          <View style={stylestemplateManagement.infoItem}>
            <Text style={stylestemplateManagement.infoLabel}>Áreas totales:</Text>
            <Text style={stylestemplateManagement.infoValue}>{template.length}</Text>
          </View>
          <View style={stylestemplateManagement.infoItem}>
            <Text style={stylestemplateManagement.infoLabel}>Aspectos totales:</Text>
            <Text style={stylestemplateManagement.infoValue}>
              {template.reduce((sum, area) => sum + area.aspectos.length, 0)}
            </Text>
          </View>
        </View>
        <Text style={stylestemplateManagement.currentSucursal}>
          {SUCURSALES[selectedSucursal]}
        </Text>
        <Text style={stylestemplateManagement.storageInfo}>
          {template.some(area => area.editable) ? 'Con personalizaciones guardadas' : 'Usando valores por defecto'}
        </Text>
      </View>

      {/* Botones de acción principales */}
      <View style={stylestemplateManagement.mainActions}>
        <TouchableOpacity
          style={[stylestemplateManagement.actionButton, stylestemplateManagement.addAreaButton]}
          onPress={() => setShowAddAreaModal(true)}
        >
          <Icon name="add-circle-outline" size={20} color="white" />
          <Text style={stylestemplateManagement.actionButtonText}>Agregar Área</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[stylestemplateManagement.actionButton, stylestemplateManagement.resetButton]}
          onPress={handleResetTemplate}
        >
          <Icon name="restore" size={20} color="white" />
          <Text style={stylestemplateManagement.actionButtonText}>Restablecer</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de áreas */}
      <FlatList
        data={template}
        renderItem={renderAreaItem}
        keyExtractor={(item) => item.area}
        contentContainerStyle={stylestemplateManagement.listContainer}
        showsVerticalScrollIndicator={true}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={
          <View style={stylestemplateManagement.emptyState}>
            <MaterialCommunityIcons name="folder-alert" size={64} color="#9CA3AF" />
            <Text style={stylestemplateManagement.emptyStateTitle}>No hay áreas configuradas</Text>
            <Text style={stylestemplateManagement.emptyStateText}>
              Comienza agregando tu primera área usando el botón "Agregar Área"
            </Text>
          </View>
        }
        ListFooterComponent={
          template.length > 0 ? (
            <View style={stylestemplateManagement.footerInfo}>
              <Text style={stylestemplateManagement.footerText}>
                Total: {template.length} áreas • {
                  template.reduce((sum, area) => sum + area.aspectos.length, 0)
                } aspectos
              </Text>
              <Text style={stylestemplateManagement.footerNote}>
                Las personalizaciones se guardan automáticamente en tu dispositivo
              </Text>
            </View>
          ) : null
        }
      />

      {/* Modal: Agregar Área */}
      <Modal
        visible={showAddAreaModal}
        transparent={true}
        animationType="slide"
      >
        <View style={stylestemplateManagement.modalOverlay}>
          <View style={stylestemplateManagement.modalContent}>
            <Text style={stylestemplateManagement.modalTitle}>Agregar Nueva Área</Text>
            
            <TextInput
              style={stylestemplateManagement.modalInput}
              placeholder="Nombre del área (ej: RECEPCIÓN)"
              value={newAreaName}
              onChangeText={setNewAreaName}
              autoCapitalize="characters"
            />

            <Text style={stylestemplateManagement.modalSubtitle}>Seleccionar ícono:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableIcons.slice(0, 15).map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    stylestemplateManagement.iconOption,
                    newAreaIcon === icon && stylestemplateManagement.iconOptionSelected
                  ]}
                  onPress={() => setNewAreaIcon(icon)}
                >
                  <Text style={stylestemplateManagement.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={stylestemplateManagement.modalButtons}>
              <TouchableOpacity
                style={[stylestemplateManagement.modalButton, stylestemplateManagement.cancelButton]}
                onPress={() => {
                  setNewAreaName('');
                  setNewAreaIcon('');
                  setShowAddAreaModal(false);
                }}
              >
                <Text style={stylestemplateManagement.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[stylestemplateManagement.modalButton, stylestemplateManagement.saveButton]}
                onPress={handleAddArea}
                disabled={!newAreaName.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={stylestemplateManagement.saveButtonText}>Agregar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Agregar Aspecto */}
      <Modal
        visible={showAddAspectoModal}
        transparent={true}
        animationType="slide"
      >
        <View style={stylestemplateManagement.modalOverlay}>
          <View style={stylestemplateManagement.modalContent}>
            <Text style={stylestemplateManagement.modalTitle}>Agregar Aspecto</Text>
            <Text style={stylestemplateManagement.modalSubtitle}>Selecciona el área:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {template.map((area) => (
                <TouchableOpacity
                  key={area.area}
                  style={[
                    stylestemplateManagement.areaOption,
                    selectedArea === area.area && stylestemplateManagement.areaOptionSelected
                  ]}
                  onPress={() => setSelectedArea(area.area)}
                >
                  <Text style={stylestemplateManagement.areaOptionText}>{area.area}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={stylestemplateManagement.modalSubtitle}>Área seleccionada: {selectedArea || 'Ninguna'}</Text>
            
            <TextInput
              style={[stylestemplateManagement.modalInput, stylestemplateManagement.textArea]}
              placeholder="Descripción del aspecto (ej: Limpieza general)"
              value={newAspectoText}
              onChangeText={setNewAspectoText}
              multiline
              numberOfLines={3}
            />

            <View style={stylestemplateManagement.modalButtons}>
              <TouchableOpacity
                style={[stylestemplateManagement.modalButton, stylestemplateManagement.cancelButton]}
                onPress={() => {
                  setNewAspectoText('');
                  setSelectedArea('');
                  setShowAddAspectoModal(false);
                }}
              >
                <Text style={stylestemplateManagement.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[stylestemplateManagement.modalButton, stylestemplateManagement.saveButton]}
                onPress={handleAddAspecto}
                disabled={!selectedArea || !newAspectoText.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={stylestemplateManagement.saveButtonText}>Agregar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Editar Aspecto */}
      <Modal
        visible={showEditAspectoModal}
        transparent={true}
        animationType="slide"
      >
        <View style={stylestemplateManagement.modalOverlay}>
          <View style={stylestemplateManagement.modalContent}>
            <Text style={stylestemplateManagement.modalTitle}>Editar Aspecto</Text>
            <Text style={stylestemplateManagement.modalSubtitle}>Área: {selectedArea}</Text>
            
            <TextInput
              style={[stylestemplateManagement.modalInput, stylestemplateManagement.textArea]}
              value={editAspectoText}
              onChangeText={setEditAspectoText}
              multiline
              numberOfLines={3}
            />

            <View style={stylestemplateManagement.modalButtons}>
              <TouchableOpacity
                style={[stylestemplateManagement.modalButton, stylestemplateManagement.cancelButton]}
                onPress={() => {
                  setEditAspectoText('');
                  setSelectedAspecto(null);
                  setShowEditAspectoModal(false);
                }}
              >
                <Text style={stylestemplateManagement.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[stylestemplateManagement.modalButton, stylestemplateManagement.saveButton]}
                onPress={handleEditAspecto}
                disabled={!editAspectoText.trim()}
              >
                <Text style={stylestemplateManagement.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Editar Área */}
      <Modal
        visible={showEditAreaModal}
        transparent={true}
        animationType="slide"
      >
        <View style={stylestemplateManagement.modalOverlay}>
          <View style={stylestemplateManagement.modalContent}>
            <Text style={stylestemplateManagement.modalTitle}>Editar Área</Text>
            <Text style={stylestemplateManagement.modalSubtitle}>Área actual: {selectedArea}</Text>
            
            <TextInput
              style={stylestemplateManagement.modalInput}
              placeholder="Nuevo nombre del área"
              value={editAreaName}
              onChangeText={setEditAreaName}
              autoCapitalize="characters"
            />

            <Text style={stylestemplateManagement.modalSubtitle}>Seleccionar nuevo ícono:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableIcons.slice(0, 15).map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    stylestemplateManagement.iconOption,
                    editAreaIcon === icon && stylestemplateManagement.iconOptionSelected
                  ]}
                  onPress={() => setEditAreaIcon(icon)}
                >
                  <Text style={stylestemplateManagement.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={stylestemplateManagement.modalButtons}>
              <TouchableOpacity
                style={[stylestemplateManagement.modalButton, stylestemplateManagement.cancelButton]}
                onPress={() => {
                  setEditAreaName('');
                  setEditAreaIcon('')
                  setSelectedArea('');
                  setShowEditAreaModal(false);
                }}
              >
                <Text style={stylestemplateManagement.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[stylestemplateManagement.modalButton, stylestemplateManagement.saveButton]}
                onPress={handleEditArea}
              >
                <Text style={stylestemplateManagement.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}