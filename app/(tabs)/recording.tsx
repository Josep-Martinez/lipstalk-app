import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Animated,
  Modal,
  Clipboard,
  Share,
  Platform,
  ToastAndroid,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { DeviceEventEmitter } from "react-native";

const TRANSCRIPTIONS_FILE = FileSystem.documentDirectory + "transcriptions.json";

export default function RecordingScreen() {
  const [transcriptions, setTranscriptions] = useState([]);
  const [filteredTranscriptions, setFilteredTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTranscription, setExpandedTranscription] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Estados para filtros
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Modal para el selector de rueda
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'year', 'month' o 'day'
  const [tempPickerValue, setTempPickerValue] = useState(null);

  // Modal para confirmación de eliminación
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [transcriptionToDelete, setTranscriptionToDelete] = useState(null);

  const years = ["Todos", "2023", "2024", "2025"];
  const months = ["Todos", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const days = ["Todos", ...Array.from({ length: 31 }, (_, i) => `${i + 1}`)];

  useEffect(() => {
    loadTranscriptions();

    const subscription = DeviceEventEmitter.addListener("transcriptionSaved", () => {
      console.log("🔄 Recargando transcripciones...");
      loadTranscriptions();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [loading]);

  const loadTranscriptions = async () => {
    try {
      setLoading(true);
      const fileInfo = await FileSystem.getInfoAsync(TRANSCRIPTIONS_FILE);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(TRANSCRIPTIONS_FILE);
        const parsedTranscriptions = JSON.parse(content);
        setTranscriptions(parsedTranscriptions);
        setFilteredTranscriptions(parsedTranscriptions);
      }
    } catch (error) {
      console.error("Error cargando transcripciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTranscriptions = async (updatedTranscriptions) => {
    try {
      await FileSystem.writeAsStringAsync(
        TRANSCRIPTIONS_FILE,
        JSON.stringify(updatedTranscriptions)
      );
      return true;
    } catch (error) {
      console.error("Error guardando transcripciones:", error);
      return false;
    }
  };

  const deleteTranscription = async (dateToDelete) => {
    try {
      // Filtrar la transcripción a eliminar de ambos arrays
      const updatedTranscriptions = transcriptions.filter(
        item => item.date !== dateToDelete
      );
      
      // Guardar en el archivo
      const saveSuccess = await saveTranscriptions(updatedTranscriptions);
      
      if (saveSuccess) {
        // Actualizar el estado
        setTranscriptions(updatedTranscriptions);
        setFilteredTranscriptions(
          filteredTranscriptions.filter(item => item.date !== dateToDelete)
        );
        
        // Cerrar expansión si estaba abierta
        if (expandedTranscription === dateToDelete) {
          setExpandedTranscription(null);
        }
        
        // Mostrar confirmación
        if (Platform.OS === 'android') {
          ToastAndroid.show('Transcripción eliminada', ToastAndroid.SHORT);
        } else {
          //Alert.alert('Eliminada', 'La transcripción ha sido eliminada');
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error eliminando transcripción:", error);
      Alert.alert('Error', 'No se pudo eliminar la transcripción');
      return false;
    }
  };

  const confirmDelete = (dateToDelete) => {
    setTranscriptionToDelete(dateToDelete);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (transcriptionToDelete) {
      const success = await deleteTranscription(transcriptionToDelete);
      if (success) {
        setDeleteConfirmVisible(false);
        setTranscriptionToDelete(null);
      }
    }
  };

  const formatDate = (dateString) => {
    // Formato esperado: "DD-MM-YYYY_HH-MM"
    const parts = dateString.split("_");
    const datePart = parts[0].split("-");
    const timePart = parts[1] ? parts[1].replace("-", ":") : "";
    
    const day = datePart[0];
    const month = months[parseInt(datePart[1])]; // Ajuste para el índice 0 de 'Todos'
    const year = datePart[2];
    
    return `${day} de ${month}, ${year} - ${timePart}`;
  };

  const showPickerModal = (type) => {
    setPickerType(type);
    switch (type) {
      case 'year':
        setTempPickerValue(selectedYear || "Todos");
        break;
      case 'month':
        setTempPickerValue(selectedMonth || "Todos");
        break;
      case 'day':
        setTempPickerValue(selectedDay || "Todos");
        break;
    }
    setPickerVisible(true);
  };

  const confirmPicker = () => {
    switch (pickerType) {
      case 'year':
        setSelectedYear(tempPickerValue === "Todos" ? null : tempPickerValue);
        break;
      case 'month':
        setSelectedMonth(tempPickerValue === "Todos" ? null : tempPickerValue);
        break;
      case 'day':
        setSelectedDay(tempPickerValue === "Todos" ? null : tempPickerValue);
        break;
    }
    setPickerVisible(false);
  };

  const applyFilter = () => {
    let filtered = transcriptions;

    if (selectedYear) {
      filtered = filtered.filter((item) => item.date.includes(`-${selectedYear}_`));
    }
    if (selectedMonth) {
      const monthIndex = months.indexOf(selectedMonth);
      const monthFormatted = (monthIndex).toString().padStart(2, "0");
      filtered = filtered.filter((item) => item.date.includes(`-${monthFormatted}-`));
    }
    if (selectedDay) {
      const dayFormatted = selectedDay.padStart(2, "0");
      filtered = filtered.filter((item) => item.date.startsWith(`${dayFormatted}-`));
    }

    setFilteredTranscriptions(filtered);
    setShowFilters(false);  // 🆕 Cerrar filtro después de aplicar

    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const clearFilter = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    setFilteredTranscriptions(transcriptions);
    setShowFilters(false);  // 🆕 Cerrar filtro después de limpiar
  };

  const toggleExpansion = (date) => {
    setExpandedTranscription(expandedTranscription === date ? null : date);
  };

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setString(text);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Texto copiado al portapapeles', ToastAndroid.SHORT);
      } else {
        Alert.alert('Copiado', 'Texto copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      Alert.alert('Error', 'No se pudo copiar el texto');
    }
  };

  // Función modificada para incluir la fecha formateada en el texto compartido
  const shareText = async (text, dateString) => {
    try {
      // Formato esperado del dateString: "DD-MM-YYYY_HH-MM"
      const parts = dateString.split("_");
      const datePart = parts[0].split("-");
      
      const day = datePart[0];
      const monthIndex = parseInt(datePart[1]);
      const month = months[monthIndex]; // Usar el array de meses ya definido
      const year = datePart[2];
      
      const formattedDate = `Texto transcrito el día ${day} del mes ${month} del año ${year}`;
      const messageToShare = `${formattedDate}\n\n${text}`;
      
      await Share.share({
        message: messageToShare,
        title: 'Transcripción compartida',
      });
    } catch (error) {
      console.error('Error al compartir texto:', error);
      Alert.alert('Error', 'No se pudo compartir el texto');
    }
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyText}>No hay transcripciones disponibles</Text>
      <Text style={styles.emptySubtext}>
        Las transcripciones aparecerán aquí después de grabar
      </Text>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.transcriptionItem,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.transcriptionHeader}
        onPress={() => toggleExpansion(item.date)}
        activeOpacity={0.7}
      >
        <View style={styles.dateContainer}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color="#6200EE"
            style={styles.icon}
          />
          <Text style={styles.transcriptionDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => confirmDelete(item.date)}
            style={styles.deleteButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#f44336" />
          </TouchableOpacity>
          <Ionicons
            name={expandedTranscription === item.date ? "chevron-up" : "chevron-down"}
            size={20}
            color="#6200EE"
          />
        </View>
      </TouchableOpacity>
      
      {expandedTranscription === item.date && (
        <View style={styles.transcriptionContent}>
          <Text style={styles.transcriptionText}>{item.text}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => copyToClipboard(item.text)}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => shareText(item.text, item.date)}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteActionButton]}
              onPress={() => confirmDelete(item.date)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Cargando transcripciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6200EE" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Transcripciones</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterToggleButton}
          activeOpacity={0.7}
        >
          <Ionicons name={showFilters ? "options" : "options-outline"} size={20} color="#fff" />
          <Text style={styles.filterToggleText}>
            {showFilters ? "Filtros" : "Filtros"}
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filtrar por fecha</Text>
          
          <View style={styles.pickerRow}>
            <TouchableOpacity 
              style={styles.pickerSelector}
              onPress={() => showPickerModal('year')}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerLabel}>Año</Text>
              <View style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>
                  {selectedYear || "Todos"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6200EE" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.pickerSelector}
              onPress={() => showPickerModal('month')}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerLabel}>Mes</Text>
              <View style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>
                  {selectedMonth || "Todos"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6200EE" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.pickerSelector}
              onPress={() => showPickerModal('day')}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerLabel}>Día</Text>
              <View style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>
                  {selectedDay || "Todos"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6200EE" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.filterButtons}>
            <TouchableOpacity 
              onPress={applyFilter} 
              style={styles.filterButton}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={16} color="#fff" />
              <Text style={styles.filterText}>Aplicar Filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={clearFilter} 
              style={styles.clearFilterButton}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={16} color="#fff" />
              <Text style={styles.clearFilterText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={filteredTranscriptions}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyListComponent}
      />

      {/* Modal de confirmación de eliminación */}
      <Modal
        visible={deleteConfirmVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIconContainer}>
              <Ionicons name="warning-outline" size={40} color="#f44336" />
            </View>
            <Text style={styles.deleteModalTitle}>Eliminar transcripción</Text>
            <Text style={styles.deleteModalText}>
              ¿Estás seguro de que deseas eliminar esta transcripción? Esta acción no se puede deshacer.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => setDeleteConfirmVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={handleConfirmDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteModalConfirmText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Wheel Picker Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Seleccionar {pickerType === 'year' ? 'Año' : pickerType === 'month' ? 'Mes' : 'Día'}
              </Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#424242" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempPickerValue}
                onValueChange={(itemValue) => setTempPickerValue(itemValue)}
                style={styles.wheelPicker}
                itemStyle={styles.wheelPickerItem}
              >
                {pickerType === 'year' && 
                  years.map(year => <Picker.Item key={year} label={year} value={year} />)}
                
                {pickerType === 'month' && 
                  months.map(month => <Picker.Item key={month} label={month} value={month} />)}
                
                {pickerType === 'day' && 
                  days.map(day => <Picker.Item key={day} label={day} value={day} />)}
              </Picker>
            </View>

            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={confirmPicker}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#6200EE",
    padding: 16,
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  filterToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterToggleText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  filterContainer: {
    backgroundColor: "#fff",
    padding: 16,
    margin: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pickerSelector: {
    width: "30%",
  },
  pickerLabel: {
    fontSize: 12,
    color: "#6200EE",
    marginBottom: 4,
    fontWeight: "500",
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  pickerButtonText: {
    fontSize: 14,
    color: "#424242",
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterButton: {
    backgroundColor: "#6200EE",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  clearFilterButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 8,
    flex: 0.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  clearFilterText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  listContainer: {
    padding: 12,
    paddingTop: 4,
  },
  transcriptionItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    overflow: "hidden",
  },
  transcriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    marginRight: 12,
    padding: 4,
  },
  icon: {
    marginRight: 8,
  },
  transcriptionDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#424242",
  },
  transcriptionContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  transcriptionText: {
    fontSize: 14,
    color: "#616161",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: "#6200EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  shareButton: {
    backgroundColor: "#2979ff",
  },
  deleteActionButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6200EE",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#757575",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9e9e9e",
    marginTop: 8,
    textAlign: "center",
  },
  // Estilos para el Modal de confirmación de eliminación
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  deleteIconContainer: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#424242",
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 14,
    color: "#616161",
    textAlign: "center",
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  deleteModalCancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  deleteModalConfirmButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f44336",
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  deleteModalCancelText: {
    color: "#424242",
    fontWeight: "500",
    fontSize: 14,
  },
  deleteModalConfirmText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  // Estilos para el Modal (Wheel Picker)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
  },
  pickerContainer: {
    marginVertical: 16,
  },
  wheelPicker: {
    height: 180,
    width: '100%',
  },
  wheelPickerItem: {
    fontSize: 18,
    color: '#424242',
  },
  confirmButton: {
    backgroundColor: '#6200EE',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});