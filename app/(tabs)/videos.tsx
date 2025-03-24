import { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import * as FileSystem from "expo-file-system";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";

export default function VideoPlayerScreen() {
  const [videos, setVideos] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadVideos();
    }, [])
  );

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
      setVideos(files.map((file) => directory + file));
      setLoading(false);
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

  // Nombre archivo
  const formatFileName = (path: string) => {
    const fileName = path.split("/").pop() || "";
    return fileName.replace(/\.[^/.]+$/, "");
  };

  const videoCard = ({ item }: { item: string }) => (
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
            {new Date().toLocaleDateString()}
          </Text>
        </View>
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
          onPress={() => selectedVideo && saveVideoToFiles(selectedVideo)}
        >
          <MaterialIcons name="folder" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={videos}
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
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingTop: 50,
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
});
