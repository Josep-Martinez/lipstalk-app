import { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
  Text,
  Animated,
  ActivityIndicator,
  DeviceEventEmitter,
} from "react-native";
import {
  Camera,
  CameraView,
  CameraType,
  useCameraPermissions,
} from "expo-camera";
import * as FileSystem from "expo-file-system";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Ellipse } from "react-native-svg";
import Texto from "../../components/texto";
import { FFmpegKit } from "ffmpeg-kit-react-native";

export default function HomeScreen() {
  const MAX_RECORDING_TIME = 20; // Tiempo máximo de grabación en segundos
  const [facing, setFacing] = useState<CameraType>("back"); // Cámara frontal o trasera
  const [permission, requestPermission] = useCameraPermissions(); // Permisos para la cámara y el micrófono
  const [isRecording, setIsRecording] = useState(false); // Estado para saber si se está grabando
  const [recordingTime, setRecordingTime] = useState(0); // Tiempo de grabación
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  ); // Intervalo del temporizador
  const cameraRef = useRef<CameraView | null>(null);
  const navigation = useNavigation();
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [textoVisible, setTextoVisible] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");
  const TRANSCRIPTIONS_FILE =
    FileSystem.documentDirectory + "transcriptions.json";
  const [showGuideMessage, setShowGuideMessage] = useState(true);

  // Solicitar permisos de cámara y micrófono al cargar la app
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } =
        await Camera.requestMicrophonePermissionsAsync();

      if (status !== "granted" || audioStatus !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Se requieren permisos de cámara y micrófono para grabar videos."
        );
      } else {
        console.log("✅ Permisos concedidos para cámara y micrófono.");
      }
    })();

    ensureDirectoryExists();

    // Limpieza del timer al desmontar el componente
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  // Mostrar mensaje guía para colocar la cara en el óvalo (solo por 5 segundos)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGuideMessage(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Detener grabación automáticamente cuando se alcance el tiempo máximo
  useEffect(() => {
    if (recordingTime >= MAX_RECORDING_TIME && isRecording) {
      stopRecording();
    }
  }, [recordingTime, isRecording]);

  // Asegurar que existe el directorio para guardar los videos
  const ensureDirectoryExists = async () => {
    const videosDirectory = FileSystem.documentDirectory + "videos/";
    const dirInfo = await FileSystem.getInfoAsync(videosDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(videosDirectory, {
        intermediates: true,
      });
    }
  };

  // Guardar la transcripción generada en local
  const handleSaveText = async (text) => {
    setTranscriptionText(text);
    try {
      const fileInfo = await FileSystem.getInfoAsync(TRANSCRIPTIONS_FILE);
      let existingTranscriptions = [];
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(TRANSCRIPTIONS_FILE);
        existingTranscriptions = JSON.parse(content);
      }

      // Crear formato de fecha para el nombre del archivo
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

      // Notificar a otras pantallas que hay una nueva transcripción
      DeviceEventEmitter.emit("transcriptionSaved");

      console.log("✅ Transcripción guardada:", newTranscription);
    } catch (error) {
      console.error("Error guardando transcripción:", error);
      setIsLoading(false);
    }
  };

  // Enviar video al servidor para transcribir
  const sendVideoForTranscription = async (videoPath) => {
    try {
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
  
      // Enviar al servidor local donde tengo corriendo el modelo
      const response = await fetch("http://192.168.0.33:8000/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
  
      const data = await response.json();
      console.log("✅ Transcripción recibida:", data.transcription);
  
      // Actualiza el estado con la transcripción obtenida
      setTranscriptionText(data.transcription);
      setTextoVisible(true);
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Error enviando vídeo:", error);
      setIsLoading(false);
      Alert.alert("Error", "No se pudo enviar el vídeo para transcribir.");
    }
  };

  // Dar formato al tiempo de grabación (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Iniciar grabación de video
  const startRecording = async () => {
    if (!cameraRef.current) return;

    console.log("⏺️ Iniciando grabación...");

    try {
      setIsRecording(true);
      setRecordingTime(0);

      // Inicia temporizador para mostrar tiempo transcurrido
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);

      // Animar la barra de progreso durante la grabación
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: MAX_RECORDING_TIME * 1000,
        useNativeDriver: false,
      }).start();

      // Iniciar grabación en la cámara
      let video = await cameraRef.current.recordAsync();
      if (!video?.uri) {
        throw new Error("No se pudo obtener la URI del video.");
        setIsLoading(false);
      }

      console.log("✅ Video grabado:", video.uri);
      setIsLoading(true); // Activar indicador de carga
      
      // Crear nombre de archivo con formato de fecha y hora
      const now = new Date();
      const filename = `${now
        .getDate()
        .toString()
        .padStart(2, "0")}-${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}-${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}-${now.getSeconds().toString().padStart(2, "0")}`;

      // Preparar rutas para el procesamiento del video
      let inputPath = video.uri;
      if (Platform.OS === "ios" && inputPath.startsWith("file://")) {
        inputPath = inputPath.replace("file://", "");
      }
      const outputPath =
        FileSystem.documentDirectory + "videos/" + filename + ".mp4";

      // Recortar y redimensionar el video para que funcione con el modelo
      // El modelo espera videos de 96x96 centrados en la boca
      const ffmpegCmd = `-i "${inputPath}" -vf "crop=460:300:330:820,scale=96:96" -c:v mpeg4 -an "${outputPath}"`;
      const session = await FFmpegKit.execute(ffmpegCmd);
      const returnCode = await session.getReturnCode();

      if (returnCode.isValueSuccess()) {
        console.log("✅ Vídeo recortado guardado en", outputPath);
    
        // Borrar video original (sin recortar) para ahorrar espacio
        await FileSystem.deleteAsync(video.uri, { idempotent: true });
    
        console.log("🗑️ Vídeo original eliminado.");
    
        // Enviar el video recortado al servidor para transcripción
        await sendVideoForTranscription(outputPath);
      } else {
        console.error("❌ Error recortando el video.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      setIsLoading(false);
      Alert.alert("Error", "No se pudo grabar o subir el video.");
    } finally {
      if (timerInterval) clearInterval(timerInterval);
      setTimerInterval(null);
      setIsRecording(false);
      console.log("🛑 Grabación detenida.");
      progressAnimation.setValue(0);
    }
  };

  // Detener la grabación de video
  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      console.log("⏹️ Deteniendo grabación...");

      // Pequeño retraso para asegurar que la grabación se completó
      setTimeout(() => {
        try {
          cameraRef.current?.stopRecording();
          console.log("📌 stopRecording() ejecutado.");
        } catch (error) {
          setIsLoading(false);
          console.error("❌ Error al detener la grabación:", error);
        }
      }, 500);

      if (timerInterval) clearInterval(timerInterval);
      setTimerInterval(null);
      setIsRecording(false);
      console.log("🛑 Grabación detenida.");

      progressAnimation.stopAnimation();
    }
  };

  // Cambiar entre cámara frontal y trasera
  const toggleCamera = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // Calcular dimensiones para la cámara
  const windowHeight = Dimensions.get("window").height;
  const windowWidth = Dimensions.get("window").width;
  const tabBarHeight = 50;
  const headerHeight = 60;
  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const cameraHeight =
    windowHeight - tabBarHeight - headerHeight - statusBarHeight;

  return (
    // Contenedor principal de la pantalla
    <View style={styles.container}>
      {/* Contenedor para la cámara */}
      <View style={[styles.cameraContainer, { height: cameraHeight }]}>
        {permission?.granted ? (
          <>
            {/* Componente de cámara */}
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              mode="video"
            />
            {/* Componente para mostrar el texto transcrito */}
            <Texto
              visible={textoVisible}
              onClose={() => setTextoVisible(false)}
              generatedText={transcriptionText}
              onSaveText={handleSaveText}
            />
            {/* Indicador de carga durante la transcripción */}
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
            {/* Guía visual para posicionar la cara (óvalo) */}
            <View style={styles.faceGuideContainer} pointerEvents="none">
              <Svg
                height="100%"
                width="100%"
                viewBox={`0 0 ${windowWidth} ${cameraHeight}`}
              >
                <Ellipse
                  cx={windowWidth / 2}
                  cy={cameraHeight * 0.4}
                  rx={windowWidth * 0.35}
                  ry={cameraHeight * 0.25}
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="transparent"
                />
              </Svg>
              {showGuideMessage && (
                <Text style={styles.guideText}>
                  Coloca el rostro dentro de la figura para el correcto
                  funcionamiento
                </Text>
              )}
            </View>

            {/* Barra de progreso para mostrar tiempo restante */}
            {isRecording && (
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
            )}

            {/* Indicador de grabación y tiempo */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTime}>
                  {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
                </Text>
              </View>
            )}
          </>
        ) : (
          // Mensaje si no hay permisos de cámara
          <View style={styles.permissionWarning}>
            <Text style={{ color: "white", textAlign: "center", padding: 20 }}>
              Se requiere permiso de cámara para usar esta función. Por favor,
              permite el acceso a la cámara en la configuración.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Solicitar Permiso</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controles de cámara en la parte inferior */}
      <View style={styles.controlsContainer}>
        {/* Botón para cambiar de cámara */}
        <TouchableOpacity style={styles.flipButton} onPress={toggleCamera}>
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.emptySpace} />

        {/* Botón de grabación/detener */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordingButton : styles.notRecordingButton,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <View style={styles.stopIcon} />
          ) : (
            <View style={styles.recordIcon} />
          )}
        </TouchableOpacity>

        <View style={styles.emptySpace} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraContainer: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  permissionWarning: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  permissionButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  notRecordingButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 4,
    borderColor: "#FF3B30",
  },
  recordingButton: {
    backgroundColor: "#FF3B30",
    borderWidth: 4,
    borderColor: "white",
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF3B30",
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: "white",
    borderRadius: 3,
  },
  flipButton: {
    position: "absolute",
    bottom: 30, // Lo mueve abajo
    right: 40, // Ajusta para que esté al lado del botón de grabación
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  flashButton: {
    position: "absolute",
    bottom: 30, // Misma altura que el botón de cambiar cámara
    left: 40, // Opuesto a `right: 40` del botón de cambiar cámara
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  emptySpace: {
    width: 50,
  },
  recordingIndicator: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF3B30",
    marginRight: 8,
  },
  recordingTime: {
    color: "white",
    fontWeight: "bold",
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
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: "rgba(0, 0, 0, 0.75)", // Fondo semitransparente para los controles
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  progressBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "white",
    zIndex: 20,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#e0cfbe",
  },
  faceGuideContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  guideText: {
    color: "white",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 15,
    paddingVertical: 50,
    borderRadius: 20,
    position: "absolute",
    bottom: 150,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 14,
  },
});