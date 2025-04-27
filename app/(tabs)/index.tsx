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

  // Solicitar permisos de cámara y micrófono al iniciar la aplicación
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

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  // Mensaje inicio para poner cara en el ovalo
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGuideMessage(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Detener grabación por tiempo
  useEffect(() => {
    if (recordingTime >= MAX_RECORDING_TIME && isRecording) {
      stopRecording();
    }
  }, [recordingTime, isRecording]);

  // Crear directorio para almacenar videos localmente
  const ensureDirectoryExists = async () => {
    const videosDirectory = FileSystem.documentDirectory + "videos/";
    const dirInfo = await FileSystem.getInfoAsync(videosDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(videosDirectory, {
        intermediates: true,
      });
    }
  };

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    console.log("⏺️ Iniciando grabación...");

    try {
      setIsRecording(true);
      setRecordingTime(0);

      // Inicia temporizador
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);

      // Iniciar animación de la barra
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: MAX_RECORDING_TIME * 1000,
        useNativeDriver: false,
      }).start();

      let video = await cameraRef.current.recordAsync();
      if (!video?.uri) {
        throw new Error("No se pudo obtener la URI del video.");
        setIsLoading(false);
      }

      console.log("✅ Video grabado:", video.uri);
      setIsLoading(true); // Activa animacion de cargando
      // Guardar video en local
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

      // Rutas de entrada y salida
      let inputPath = video.uri;
      if (Platform.OS === "ios" && inputPath.startsWith("file://")) {
        inputPath = inputPath.replace("file://", "");
      }
      const outputPath =
        FileSystem.documentDirectory + "videos/" + filename + ".mp4";

      // Ejecutar recorte con FFmpegKit
      const ffmpegCmd = `-i "${inputPath}" -vf "crop=460:300:330:820,scale=96:96" -c:v mpeg4 -an "${outputPath}"`;
      const session = await FFmpegKit.execute(ffmpegCmd);
      const returnCode = await session.getReturnCode();

      if (returnCode.isValueSuccess()) {
        console.log("✅ Vídeo recortado guardado en", outputPath);

        // Borrar video original
        await FileSystem.deleteAsync(video.uri, { idempotent: true });

        console.log("🗑️ Vídeo original eliminado.");

        setIsLoading(false);
        setTextoVisible(true);

        // Ahora outputPath sería el que debes usar si quieres hacer algo más con el video
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

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      console.log("⏹️ Deteniendo grabación...");

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
            {/* Cámara */}
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              mode="video"
            />
            {/* Mostrar la transcripción*/}
            <Texto
              visible={textoVisible}
              onClose={() => setTextoVisible(false)}
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
            {/* Posicion Ovalo */}
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
              {/* <Text style={styles.guideText}>Coloca tu rostro dentro del óvalo</Text> */}
            </View>

            {/* Barra de progreso */}
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

            {/* Indicador de grabación */}
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
          // Muestra mensaje de advertencia si no hay permisos para la cámara
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

      {/* Controles de la cámara */}
      <View style={styles.controlsContainer}>
        {/* Botón para cambiar de cámara */}
        <TouchableOpacity style={styles.flipButton} onPress={toggleCamera}>
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.emptySpace} />

        {/* Botón de grabación */}
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
    backgroundColor: "rgba(0, 0, 0, 0.75)", // <-- ESTA ES LA ZONA GRIS SEMITRANSPARENTE
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
