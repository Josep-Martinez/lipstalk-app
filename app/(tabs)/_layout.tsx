import { Tabs } from "expo-router";
import { Home, MessageSquare, Video } from "lucide-react-native";
import { View, StyleSheet, Image } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#e0cfbe", // Fondo del header en color personalizado.
        },
        headerTintColor: "#fff", // Color del texto en el header.
        tabBarStyle: {
          backgroundColor: "#fff", // Fondo de la barra de pestañas.
          borderTopWidth: 1, // Borde superior de la barra.
          borderTopColor: "#e2e8f0", // Color del borde superior.
        },
        tabBarActiveTintColor: "#e0cfbe", // Color del icono activo.
        tabBarInactiveTintColor: "#64748b", // Color del icono inactivo.
      }}
    >
      {/* Pestaña de grabaciones */}
      <Tabs.Screen
        name="recording"
        options={{
          title: "Grabaciones", // Título en la barra de pestañas.
          headerTitle: "Grabaciones", // Título en el header.
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} /> // Icono de la pestaña.
          ),
        }}
      />

      {/* Pestaña de inicio (Casa) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Casa",
          headerTitle: "Casa",
          headerRight: () => (
            <View style={styles.headerRight}>
              {/* Logo en el header derecho */}
              <Image
                source={require("../../assets/images/lipstalk-logo.png")}
                style={styles.headerIcon}
              />
            </View>
          ),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      {/* Pestaña de videos */}
      <Tabs.Screen
        name="videos"
        options={{
          title: "Video",
          headerTitle: "Video",
          tabBarIcon: ({ color, size }) => <Video size={size} color={color} />, // Icono personalizado para videos.
        }}
      />

      {/* Pestaña de información (About) */}
      <Tabs.Screen
        name="about"
        options={{
          title: "LipsTalk",
          headerTitle: "LipsTalk",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/images/lipstalk-logo.png")}
              style={{
                width: size,
                height: size,
                tintColor: color, // Permite que el logo cambie de color según el estado activo/inactivo.
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 15, // Espaciado derecho del logo en el header.
  },
  headerIcon: {
    width: 24, // Ancho del logo en el header.
    height: 24, // Alto del logo en el header.
    tintColor: "#fff", // Color del logo en el header.
  },
});
