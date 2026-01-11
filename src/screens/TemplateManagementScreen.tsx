import React, { useState, useEffect } from 'react';
import { styles } from '../styles/templateManagementStyles';
import { ChecklistArea, ChecklistAspect, SUCURSALES, SucursalType } from 'src/types/checklist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
  updateAreaOrder,
  updateAreaIcon,
  getAreaOrderAsync,
  getAreaIconsAsync,
  initializeCache
} from '../utils/checklistData';

export default function TemplateManagementScreen() {
  const navigation = useNavigation<any>();
  const [selectedSucursal, setSelectedSucursal] = useState<SucursalType>('BAALAK_CENTRAL');
  const [template, setTemplate] = useState<ChecklistArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showAddAspectoModal, setShowAddAspectoModal] = useState(false);
  const [showEditAreaModal, setShowEditAreaModal] = useState(false);
  const [showEditAspectoModal, setShowEditAspectoModal] = useState(false);
  
  const [newAreaName, setNewAreaName] = useState('');
  const [newAspectoText, setNewAspectoText] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedAspecto, setSelectedAspecto] = useState<ChecklistAspect | null>(null);
  const [editAspectoText, setEditAspectoText] = useState('');
  const [editAreaName, setEditAreaName] = useState('');
  const [editAreaIcon, setEditAreaIcon] = useState('');
  
  const [areaOrder, setAreaOrder] = useState<Record<string, number>>({});
  const [areaIcons, setAreaIcons] = useState<Record<string, string>>({});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
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
    if (!newAreaName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ingrese un nombre para el área',
      });
      return;
    }

    setLoading(true);
    const success = await addAreaToSucursal(selectedSucursal, newAreaName.trim());
    
    if (success) {
      Toast.show({
        type: 'success',
        text1: '✅ Área agregada',
        text2: `"${newAreaName}" agregada a ${SUCURSALES[selectedSucursal]}`,
      });
      setNewAreaName('');
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

  const handleUpdateIcon = async (areaName: string, icon: string) => {
    try {
      await updateAreaIcon(areaName, icon);
      const icons = await getAreaIconsAsync();
      setAreaIcons(icons);
      
      Toast.show({
        type: 'success',
        text1: '✅ Ícono actualizado',
        text2: `Ícono de ${areaName} cambiado`,
      });
    } catch (error) {
      console.error('Error actualizando ícono:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo actualizar el ícono',
      });
    }
  };

  const handleUpdateOrder = async (areaName: string, order: string) => {
    const orderNum = parseInt(order) || 99;
    
    try {
      await updateAreaOrder(areaName, orderNum);
      const order = await getAreaOrderAsync();
      setAreaOrder(order);
      
      Toast.show({
        type: 'success',
        text1: '✅ Orden actualizado',
        text2: `Orden de ${areaName} cambiado a ${orderNum}`,
      });
    } catch (error) {
      console.error('Error actualizando orden:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo actualizar el orden',
      });
    }
  };

  const handleEditArea = () => {
    if (!editAreaName.trim() || !selectedArea) {
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
              currentArea.aspectos
            );

            if (success) {
              // Actualizar ícono si se cambió
              if (editAreaIcon && editAreaIcon !== areaIcons[selectedArea]) {
                await updateAreaIcon(editAreaName.trim(), editAreaIcon);
              }
              
              // Eliminar área antigua
              await removeAreaFromSucursal(selectedSucursal, selectedArea);
              
              Toast.show({
                type: 'success',
                text1: '✅ Área editada',
                text2: `"${selectedArea}" renombrada a "${editAreaName}"`,
              });
              
              setEditAreaName('');
              setEditAreaIcon('');
              setSelectedArea('');
              setShowEditAreaModal(false);
              await loadData();
            }
          }
        }
      ]
    );
  };

  const handleExportTemplates = async () => {
    try {
      const templates = await getSucursalTemplateAsync(selectedSucursal);
      const order = await getAreaOrderAsync();
      const icons = await getAreaIconsAsync();
      
      const exportData = {
        sucursal: selectedSucursal,
        template: templates,
        areaOrder: order,
        areaIcons: icons,
        exportDate: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      Alert.alert(
        'Plantilla Exportada',
        `La plantilla de ${SUCURSALES[selectedSucursal]} ha sido preparada para exportar.\n\nTotal: ${templates.length} áreas, ${templates.reduce((sum, area) => sum + area.aspectos.length, 0)} aspectos`,
        [
          { text: 'OK' },
          {
            text: 'Ver JSON',
            onPress: () => {
              Alert.alert('JSON de Plantilla', jsonString.substring(0, 2000) + '...');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error exportando plantillas:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron exportar las plantillas',
      });
    }
  };

  const renderAreaItem = ({ item: area, index }: { item: ChecklistArea, index: number }) => (
    <View style={styles.areaCard}>
      <View style={styles.areaHeader}>
        <View style={styles.areaTitleContainer}>
          <Text style={styles.areaIcon}>
            {areaIcons[area.area] || '📋'}
          </Text>
          <View>
            <Text style={styles.areaName}>{area.area}</Text>
            <Text style={styles.areaInfo}>
              {area.aspectos.length} {area.aspectos.length === 1 ? 'aspecto' : 'aspectos'} • 
              Orden: {areaOrder[area.area] || 99}
            </Text>
          </View>
        </View>
        
        <View style={styles.areaActions}>
          <TouchableOpacity
            style={styles.actionButtonSmall}
            onPress={() => {
              setSelectedArea(area.area);
              setEditAreaName(area.area);
              setEditAreaIcon(areaIcons[area.area] || '');
              setShowEditAreaModal(true);
            }}
          >
            <Icon name="edit" size={18} color="#3B82F6" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButtonSmall}
            onPress={() => {
              setSelectedArea(area.area);
              setShowAddAspectoModal(true);
            }}
          >
            <Icon name="add" size={18} color="#10B981" />
          </TouchableOpacity>
          
          {area.editable && (
            <TouchableOpacity
              style={styles.actionButtonSmall}
              onPress={() => handleRemoveArea(area.area)}
            >
              <Icon name="delete" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.aspectosList}>
        {area.aspectos.map((aspecto, aspectoIndex) => (
          <View key={aspecto.id} style={styles.aspectoItem}>
            <Text style={styles.aspectoText}>
              {aspectoIndex + 1}. {aspecto.aspecto}
            </Text>
            {aspecto.editable && (
              <View style={styles.aspectoActions}>
                <TouchableOpacity
                  style={styles.aspectoActionButton}
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
                  style={styles.aspectoActionButton}
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
        <Text style={styles.noAspectosText}>
          No hay aspectos en esta área. Agrega algunos.
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando plantillas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Gestión de Plantillas</Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportTemplates}
        >
          <Icon name="file-download" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Selector de sucursal */}
      <View style={styles.sucursalSelector}>
        <Text style={styles.sectionTitle}>Sucursal:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.keys(SUCURSALES).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.sucursalButton,
                selectedSucursal === key && styles.sucursalButtonActive
              ]}
              onPress={() => setSelectedSucursal(key as SucursalType)}
            >
              <Text style={[
                styles.sucursalButtonText,
                selectedSucursal === key && styles.sucursalButtonTextActive
              ]}>
                {SUCURSALES[key as SucursalType]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Información de la sucursal */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Áreas totales:</Text>
            <Text style={styles.infoValue}>{template.length}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Aspectos totales:</Text>
            <Text style={styles.infoValue}>
              {template.reduce((sum, area) => sum + area.aspectos.length, 0)}
            </Text>
          </View>
        </View>
        <Text style={styles.currentSucursal}>
          {SUCURSALES[selectedSucursal]}
        </Text>
        <Text style={styles.storageInfo}>
          {template.some(area => area.editable) ? 'Con personalizaciones guardadas' : 'Usando valores por defecto'}
        </Text>
      </View>

      {/* Botones de acción principales */}
      <View style={styles.mainActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addAreaButton]}
          onPress={() => setShowAddAreaModal(true)}
        >
          <Icon name="add-circle-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Agregar Área</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.orderButton]}
          onPress={() => setShowOrderModal(true)}
        >
          <Icon name="sort" size={20} color="white" />
          <Text style={styles.actionButtonText}>Ordenar Áreas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.iconButton]}
          onPress={() => setShowIconPicker(true)}
        >
          <Icon name="emoji-emotions" size={20} color="white" />
          <Text style={styles.actionButtonText}>Iconos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={handleResetTemplate}
        >
          <Icon name="restore" size={20} color="white" />
          <Text style={styles.actionButtonText}>Restablecer</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de áreas */}
      <FlatList
        data={template}
        renderItem={renderAreaItem}
        keyExtractor={(item) => item.area}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="folder-alert" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No hay áreas configuradas</Text>
            <Text style={styles.emptyStateText}>
              Comienza agregando tu primera área usando el botón "Agregar Área"
            </Text>
          </View>
        }
        ListFooterComponent={
          template.length > 0 ? (
            <View style={styles.footerInfo}>
              <Text style={styles.footerText}>
                Total: {template.length} áreas • {
                  template.reduce((sum, area) => sum + area.aspectos.length, 0)
                } aspectos
              </Text>
              <Text style={styles.footerNote}>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Nueva Área</Text>
            <Text style={styles.modalSubtitle}>Sucursal: {SUCURSALES[selectedSucursal]}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del área (ej: RECEPCIÓN)"
              value={newAreaName}
              onChangeText={setNewAreaName}
              autoCapitalize="characters"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewAreaName('');
                  setShowAddAreaModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddArea}
                disabled={!newAreaName.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Agregar</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Aspecto</Text>
            <Text style={styles.modalSubtitle}>Selecciona el área:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {template.map((area) => (
                <TouchableOpacity
                  key={area.area}
                  style={[
                    styles.areaOption,
                    selectedArea === area.area && styles.areaOptionSelected
                  ]}
                  onPress={() => setSelectedArea(area.area)}
                >
                  <Text style={styles.areaOptionText}>{area.area}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.modalSubtitle}>Área seleccionada: {selectedArea || 'Ninguna'}</Text>
            
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Descripción del aspecto (ej: Limpieza general)"
              value={newAspectoText}
              onChangeText={setNewAspectoText}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewAspectoText('');
                  setSelectedArea('');
                  setShowAddAspectoModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddAspecto}
                disabled={!selectedArea || !newAspectoText.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Agregar</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Aspecto</Text>
            <Text style={styles.modalSubtitle}>Área: {selectedArea}</Text>
            
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={editAspectoText}
              onChangeText={setEditAspectoText}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditAspectoText('');
                  setSelectedAspecto(null);
                  setShowEditAspectoModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditAspecto}
                disabled={!editAspectoText.trim()}
              >
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Área</Text>
            <Text style={styles.modalSubtitle}>Área actual: {selectedArea}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Nuevo nombre del área"
              value={editAreaName}
              onChangeText={setEditAreaName}
              autoCapitalize="characters"
            />
            
            <Text style={styles.modalSubtitle}>Seleccionar nuevo ícono:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableIcons.slice(0, 15).map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    editAreaIcon === icon && styles.iconOptionSelected
                  ]}
                  onPress={() => setEditAreaIcon(icon)}
                >
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditAreaName('');
                  setEditAreaIcon('');
                  setSelectedArea('');
                  setShowEditAreaModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditArea}
                disabled={!editAreaName.trim() || editAreaName === selectedArea}
              >
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Seleccionar Ícono */}
      <Modal
        visible={showIconPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <Text style={styles.modalTitle}>Seleccionar Ícono para Área</Text>
            <Text style={styles.modalSubtitle}>Selecciona un área para cambiar su ícono:</Text>
            
            <ScrollView style={styles.iconSelectionList}>
              {template.map(area => (
                <TouchableOpacity
                  key={area.area}
                  style={styles.iconSelectionItem}
                  onPress={() => {
                    Alert.alert(
                      'Cambiar Ícono',
                      `Selecciona un nuevo ícono para ${area.area}`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        ...availableIcons.slice(0, 10).map(icon => ({
                          text: icon,
                          onPress: () => handleUpdateIcon(area.area, icon)
                        }))
                      ]
                    );
                    setShowIconPicker(false);
                  }}
                >
                  <View style={styles.iconSelectionContent}>
                    <Text style={styles.iconSelectionIcon}>
                      {areaIcons[area.area] || '📋'}
                    </Text>
                    <View style={styles.iconSelectionText}>
                      <Text style={styles.iconSelectionArea}>{area.area}</Text>
                      <Text style={styles.iconSelectionHint}>
                        Tocar para cambiar ícono
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowIconPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Ordenar Áreas */}
      <Modal
        visible={showOrderModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <Text style={styles.modalTitle}>Orden de Áreas</Text>
            <Text style={styles.modalSubtitle}>
              Número más bajo = aparece primero (1, 2, 3...)
            </Text>
            
            <ScrollView style={styles.orderList}>
              {template.map((area) => {
                const currentOrder = areaOrder[area.area] || 99;
                return (
                  <View key={area.area} style={styles.orderItem}>
                    <Text style={styles.orderAreaName}>
                      {areaIcons[area.area] || '📋'} {area.area}
                    </Text>
                    <TextInput
                      style={styles.orderInput}
                      value={currentOrder.toString()}
                      onChangeText={(text) => handleUpdateOrder(area.area, text)}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowOrderModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}