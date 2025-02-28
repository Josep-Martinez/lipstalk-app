import { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Dimensions, 
  StatusBar, 
  Platform, 
  Text,
  Animated 
} from 'react-native';
import { Camera, CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Ellipse } from 'react-native-svg';

const MAX_RECORDING_TIME = 20; // Tiempo máximo de grabación en segundos

export default function HomeScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const navigation = useNavigation();
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
      
      if (status !== 'granted' || audioStatus !== 'granted') {
        Alert.alert("Permiso denegado", "Se requieren permisos de cámara y micrófono para grabar videos.");
      } else {
        console.log("✅ Permisos concedidos para cámara y micrófono.");
      }
    })();
  
    ensureDirectoryExists();
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    // Cuando el tiempo de grabación llega al máximo, detener la grabación
    if (recordingTime >= MAX_RECORDING_TIME && isRecording) {
      stopRecording();
    }
  }, [recordingTime, isRecording]);

  const ensureDirectoryExists = async () => {
    const videosDirectory = FileSystem.documentDirectory + "videos/";
    const dirInfo = await FileSystem.getInfoAsync(videosDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(videosDirectory, { intermediates: true });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;
  
    console.log("⏺️ Iniciando grabación...");
  
    try {
      setIsRecording(true);
      setRecordingTime(0);
  
      // Iniciar temporizador
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      
      // Iniciar animación de la barra de progreso
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: MAX_RECORDING_TIME * 1000,
        useNativeDriver: false
      }).start();
  
      let video = await cameraRef.current.recordAsync();
      if (!video || !video.uri) {
        throw new Error("No se pudo obtener la URI del video.");
      }
  
      console.log("✅ Video grabado:", video.uri);
  
      const videosDirectory = FileSystem.documentDirectory + "videos/";
  
      // 🔥 Nuevo formato de nombre: video_AAAA-MM-DD_HH-MM-SS.mp4
      const now = new Date();
      const filename = `${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}_${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.mp4`;
  
      const newPath = videosDirectory + filename;
  
      await FileSystem.moveAsync({ from: video.uri, to: newPath });
  
      Alert.alert(
        "Video guardado",
        `El video se ha guardado correctamente.\n\nNombre: ${filename}`,
        [
          { text: "OK" },
          { text: "Ver videos", onPress: () => navigation.navigate('videos' as never) }
        ]
      );
    } catch (error) {
      console.error("❌ Error al grabar video:", error);
      Alert.alert("Error", "No se pudo grabar el video.");
    } finally {
      if (timerInterval) clearInterval(timerInterval);
      setTimerInterval(null);
      setIsRecording(false);
      console.log("🛑 Grabación detenida.");
      // Resetear la animación
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
          console.error("❌ Error al detener la grabación:", error);
        }
      }, 500);
  
      if (timerInterval) clearInterval(timerInterval);
      setTimerInterval(null);
      setIsRecording(false);
      console.log("🛑 Grabación detenida.");
      
      // Detener la animación
      progressAnimation.stopAnimation();
    }
  };

  const toggleCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Calcular altura de la cámara para que no quede oculta
  const windowHeight = Dimensions.get('window').height;
  const windowWidth = Dimensions.get('window').width;
  const tabBarHeight = 50; 
  const headerHeight = 60; 
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const cameraHeight = windowHeight - tabBarHeight - headerHeight - statusBarHeight;

  return (
    <View style={styles.container}>
      <View style={[styles.cameraContainer, { height: cameraHeight }]}>
        {permission?.granted ? (
          <>
            <CameraView 
              ref={cameraRef} 
              style={styles.camera} 
              facing={facing} 
              mode="video"
            />
            
            {/* Guía oval para posicionar el rostro - ahora más arriba */}
            <View style={styles.faceGuideContainer} pointerEvents="none">
              <Svg height="100%" width="100%" viewBox={`0 0 ${windowWidth} ${cameraHeight}`}>
                <Ellipse
                  cx={windowWidth / 2}
                  cy={cameraHeight * 0.4} // Movido más arriba (antes era 0.5)
                  rx={windowWidth * 0.35}
                  ry={cameraHeight * 0.25}
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="transparent"
                />
              </Svg>
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
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]}
                />
              </View>
            )}
            
            {/* Botón para cambiar de cámara */}
            <TouchableOpacity style={styles.flipButton} onPress={toggleCamera}>
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
            
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
          <View style={styles.permissionWarning}>
            <Text style={{ color: 'white', textAlign: 'center', padding: 20 }}>
              Se requiere permiso de cámara para usar esta función.
              Por favor, permite el acceso a la cámara en la configuración.
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
        <View style={styles.emptySpace} />
        
        {/* Botón de grabación mejorado */}
        <TouchableOpacity
          style={[
            styles.recordButton, 
            isRecording ? styles.recordingButton : styles.notRecordingButton
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
    backgroundColor: '#000',
  },
  cameraContainer: {
    width: "100%",
    overflow: "hidden",
    position: 'relative',
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  permissionWarning: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordButton: {
    width: 80,  
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  notRecordingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 4,
    borderColor: '#FF3B30',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
    borderWidth: 4,
    borderColor: 'white',
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  flipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  emptySpace: {
    width: 50,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingTime: {
    color: 'white',
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // <-- ESTA ES LA ZONA GRIS SEMITRANSPARENTE
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'white',
    zIndex: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#e0cfbe',
  },
  faceGuideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideText: {
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'absolute',
    bottom: 100,
    textAlign: 'center',
    fontWeight: 'bold',
  }
});