import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { X } from "lucide-react-native";

const Texto = ({
  visible,
  onClose,
  generatedText,
  onSaveText,  // Variable para guardar el texto
}) => {
  // Este efecto guarda automáticamente el texto cuando se muestra el componente
  useEffect(() => {
    if (visible && onSaveText) {
      onSaveText(generatedText);  // Llama a la función para guardar el texto
    }
  }, [visible, generatedText]);

  // Si no es visible, no mostramos nada
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text>
            <X size={24} color="#fff" />
          </Text>
        </TouchableOpacity>
        <Text style={styles.title}>Texto Detectado</Text>
        <Text style={styles.text}>{generatedText || "Texto no disponible"}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
    backgroundColor: "#ff4d4d",
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
});

export default Texto;