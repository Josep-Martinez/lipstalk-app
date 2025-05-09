import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  Alert,
  ImageBackground,
  StatusBar,
  Platform,
  Animated,
  Modal,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import * as FileSystem from "expo-file-system";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import Texto from "../../components/texto";
import { DeviceEventEmitter } from "react-native";
import { Picker } from "@react-native-picker/picker";

export default function VideoPlayerScreen() {
  const [videos, setVideos] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [textoVisible, setTextoVisible] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");
  const TRANSCRIPTIONS_FILE = FileSystem.documentDirectory + "transcriptions.json";
  
  // Estados para filtros
  const [filteredVideos, setFilteredVideos] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'year', 'month' o 'day'
  const [tempPickerValue, setTempPickerValue] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Arrays para pickers
  const years = ["Todos", "2023", "2024", "2025"];
  const months = ["Todos", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const days = ["Todos", ...Array.from({ length: 31 }, (_, i) => `${i + 1}`)];

  useFocusEffect(
    useCallback(() => {
      loadVideos();
    }, [])
  );

  // Guardar la transcripción en local
  const handleSaveText = async (text) => {
    setTranscriptionText(text);
    try {
      const fileInfo = await FileSystem.getInfoAsync(TRANSCRIPTIONS_FILE);
      let existingTranscriptions = [];
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(TRANSCRIPTIONS_FILE);
        existingTranscriptions = JSON.parse(content);
      }

      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, "0")}-${(
        now.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${now.getFullYear()}_${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;

      const newTranscription = { date: formattedDate, text };
      const updatedTranscriptions = [
        newTranscription,
        ...existingTranscriptions,
      ];

      await FileSystem.writeAsStringAsync(
        TRANSCRIPTIONS_FILE,
        JSON.stringify(updatedTranscriptions)
      );

      DeviceEventEmitter.emit("transcriptionSaved");

      console.log("✅ Transcripción guardada:", newTranscription);
    } catch (error) {
      console.error("Error guardando transcripción:", error);
      setIsLoading(false);
    }
  };

  // Enviar video para transcripción
  const sendVideoForTranscription = async (videoPath) => {
    try {
      setIsLoading(true);
      let uriToSend = videoPath;
      if (Platform.OS === "ios" && uriToSend.startsWith("file://")) {
        uriToSend = uriToSend;  // en iOS lo dejamos con file:// para fetch
      }
  
      const formData = new FormData();
      formData.append("file", {
        uri: uriToSend,
        name: "video.mp4",
        type: "video/mp4",
      } as any);
  
      console.log("🚀 Enviando vídeo a servidor:", uriToSend);
  
      const response = await fetch("http://192.168.0.33:8000/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
  
      const data = await response.json();
      console.log("✅ Transcripción recibida:", data.transcription);
  
      // Actualiza el estado con la transcripción real
      setTranscriptionText(data.transcription);
      setTextoVisible(true);
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Error enviando vídeo:", error);
      setIsLoading(false);
      Alert.alert("Error", "No se pudo enviar el vídeo para transcribir.");
    }
  };

  // Solicitar permisos y guardar el video
  const saveVideoToFiles = async (videoUri: string) => {
    try {
      // Crear una ruta
      const fileName = videoUri.split("/").pop();
      const destinationUri = FileSystem.documentDirectory + fileName;

      // Copiar el video
      await FileSystem.copyAsync({
        from: videoUri,
        to: destinationUri,
      });

      // Guardar archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destinationUri);
      } else {
        Alert.alert(
          "⚠️ No disponible",
          "No se puede acceder a la app Archivos en este dispositivo."
        );
      }
    } catch (error) {
      console.error("❌ Error al guardar el video:", error);
      Alert.alert("Error", "No se pudo guardar el video.");
    }
  };

  // Carga los videos desde el directorio local
  const loadVideos = async () => {
    try {
      setLoading(true);
      const directory = FileSystem.documentDirectory + "videos/";

      // Verificar si el directorio existe
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      const files = await FileSystem.readDirectoryAsync(directory);
      const videoFiles = files.map((file) => directory + file);
      setVideos(videoFiles);
      setFilteredVideos(videoFiles);
      setLoading(false);
      
      // Animar la aparición de la lista
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error loading videos:", error);
      setLoading(false);
    }
  };

  // Elimina video seleccionado
  const deleteVideo = async (videoPath: string) => {
    Alert.alert(
      "Eliminar Video",
      "¿Estás seguro de que quieres eliminar este video?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(videoPath);
              setVideos(videos.filter((v) => v !== videoPath));
              setFilteredVideos(filteredVideos.filter((v) => v !== videoPath));
              if (selectedVideo === videoPath) {
                setSelectedVideo(null);
              }
            } catch (error) {
              console.error("Error deleting video:", error);
              Alert.alert("Error", "No se pudo eliminar el video");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Extraer partes de fecha del nombre del archivo
  const extractDateParts = (filePath) => {
    const fileName = filePath.split("/").pop() || "";
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    // Formato esperado: DD-YYYY-MM_HH-MM-SS
    try {
      const parts = nameWithoutExt.split("_");
      if (parts.length === 2) {
        const datePart = parts[0].split("-");
        if (datePart.length === 3) {
          return {
            day: datePart[0],
            year: datePart[1],
            month: datePart[2],
            rawName: nameWithoutExt
          };
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };
  
  // Mostrar selector modal
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

  // Confirmar selección en picker
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

  // Aplicar filtros seleccionados
  const applyFilter = () => {
    let filtered = [...videos];

    if (selectedYear || selectedMonth || selectedDay) {
      filtered = filtered.filter(videoPath => {
        const dateParts = extractDateParts(videoPath);
        if (!dateParts) return false;

        let matches = true;
        
        if (selectedYear) {
          matches = matches && dateParts.year === selectedYear;
        }
        
        if (selectedMonth && matches) {
          const monthIndex = months.indexOf(selectedMonth);
          const monthFormatted = (monthIndex - 1).toString().padStart(2, "0");
          matches = matches && dateParts.month === monthFormatted;
        }
        
        if (selectedDay && matches) {
          matches = matches && dateParts.day === selectedDay.padStart(2, "0");
        }
        
        return matches;
      });
    }

    setFilteredVideos(filtered);
    setShowFilters(false);

    // Animar transición
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Limpiar todos los filtros
  const clearFilter = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    setFilteredVideos(videos);
    setShowFilters(false);
    
    // Animar transición
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Nombre archivo con formato de fecha
  const formatFileName = (path: string) => {
    const fileName = path.split("/").pop() || "";
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    // Intenta parsear el formato: DD-YYYY-MM_HH-MM-SS
    try {
      const parts = nameWithoutExt.split("_");
      if (parts.length === 2) {
        const datePart = parts[0].split("-");
        const timePart = parts[1].split("-");
        
        if (datePart.length === 3 && timePart.length === 3) {
          const day = datePart[0];
          const year = datePart[1];
          const month = parseInt(datePart[2]);
          
          const hour = timePart[0];
          const minute = timePart[1];
          const second = timePart[2];
          
          // Nombres de los meses
          const months = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
          ];
          
          return `${day} de ${months[month-1]}, ${year} - ${hour}:${minute}:${second}`;
        }
      }
      
      // Si no se puede parsear, devuelve el nombre original
      return nameWithoutExt;
    } catch (error) {
      return nameWithoutExt;
    }
  };

  // Reproducción de videos
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useVideoPlayer(selectedVideo || "", (player) => {
    player.loop = true;
  });

  useEffect(() => {
    if (!player) return;

    const updatePlayState = (payload: any) => {
      console.log("Evento playingChange:", payload); 
      setIsPlaying(payload.isPlaying);
    };

    player.addListener("playingChange", updatePlayState);

    return () => {
      player.removeListener("playingChange", updatePlayState);
    };
  }, [player]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const videoCard = ({ item }: { item: string }) => (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [
        {
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
      ],
    }}>
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => setSelectedVideo(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.videoIconContainer}>
            <MaterialIcons name="videocam" size={28} color="#FF4081" />
          </View>
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle} numberOfLines={1}>
              {formatFileName(item)}
            </Text>
            <Text style={styles.videoDetails}>
              {formatFileName(item)}
            </Text>
          </View>
          {/* Botón para transcribir video */}
          <TouchableOpacity
            style={styles.transcribeButton}
            onPress={() => item && sendVideoForTranscription(item)}
          >
            <MaterialIcons name="closed-caption" size={22} color="#4CAF50" />
          </TouchableOpacity>
          {/* Botón para eliminar video */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteVideo(item)}
          >
            <MaterialIcons name="delete" size={22} color="#FF5252" />
          </TouchableOpacity>
          {/* Botón para guardar en "Archivos" */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => saveVideoToFiles(item)}
          >
            <MaterialIcons name="folder" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Videos Grabados</Text>
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
        data={filteredVideos}
        keyExtractor={(item) => item}
        renderItem={videoCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#6200EE" />
              <Text style={styles.loadingText}>Cargando videos...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="videocam-off" size={64} color="#9E9E9E" />
              <Text style={styles.emptyText}>No hay videos disponibles</Text>
              <Text style={styles.emptySubtext}>
                Graba un nuevo video para comenzar
              </Text>
            </View>
          )
        }
      />

      {/* Reproductor */}
      {selectedVideo && (
        <View
          style={[
            styles.playerContainer,
            isFullscreen && styles.fullscreenContainer,
          ]}
        >
          <VideoView
            player={player}
            allowsFullscreen
            allowsPictureInPicture
            style={isFullscreen ? styles.fullscreenVideo : styles.video}
          />

          {/* Controles reporductor */}
          <View style={styles.controlsOverlay}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => {
                if (isPlaying) {
                  player.pause();
                } else {
                  player.play();
                }
              }}
            >
              <MaterialIcons
                name={isPlaying ? "pause" : "play-arrow"}
                size={36}
                color="white"
              />
            </TouchableOpacity>

            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setSelectedVideo(null)}
              >
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>

              <View style={styles.rightControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleFullscreen}
                >
                  <MaterialIcons
                    name={isFullscreen ? "fullscreen-exit" : "fullscreen"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => deleteVideo(selectedVideo)}
                >
                  <MaterialIcons name="delete" size={24} color="white" />
                </TouchableOpacity>

                {/* Botón para transcribir video */}
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => selectedVideo && sendVideoForTranscription(selectedVideo)}
                >
                  <MaterialIcons name="closed-caption" size={24} color="white" />
                </TouchableOpacity>

                {/* Botón para guardar en "Archivos" */}
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() =>
                    selectedVideo && saveVideoToFiles(selectedVideo)
                  }
                >
                  <MaterialIcons name="folder" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* File name overlay */}
          <View style={styles.filenameOverlay}>
            <Text style={styles.filename}>{formatFileName(selectedVideo)}</Text>
          </View>
        </View>
      )}

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

      {/* Mostrar la transcripción */}
      <Texto
        visible={textoVisible}
        onClose={() => setTextoVisible(false)}
        generatedText={transcriptionText}
        onSaveText={handleSaveText}
      />

      {/* Animación de cargando */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>
              Cargando y detectando texto...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
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
    padding: 16,
    paddingBottom: 100,
  },
  videoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  videoIconContainer: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: "#F0E6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  videoDetails: {
    fontSize: 14,
    color: "#757575",
  },
  deleteButton: {
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  transcribeButton: {
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#757575",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
  },
  playerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: "#000",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fullscreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: height,
    borderRadius: 0,
    zIndex: 1000,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  fullscreenVideo: {
    width: "100%",
    height: "100%",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playButton: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlsRow: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  rightControls: {
    flexDirection: "row",
  },
  controlButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  filenameOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 4,
  },
  filename: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  loadingBox: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
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